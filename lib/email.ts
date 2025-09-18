import nodemailer from 'nodemailer'
import { SendEmailInput, cleanEmailList, cleanEmailListNoValidation, CalendarEvent } from './validators'
import { createCalendarEvent, generateCalendarInvite } from './calendar'

/**
 * Email service configuration interface
 */
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth?: {
    user: string
    pass: string
  }
}

/**
 * Email sending result interface
 */
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Get email configuration from environment variables
 */
function getEmailConfig(): EmailConfig {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '25'),
    secure: process.env.SMTP_SECURE === 'true',
  }

  // Add authentication if required
  if (process.env.SMTP_REQUIRE_AUTH === 'true') {
    config.auth = {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    }
  }

  return config
}

/**
 * Create nodemailer transporter
 */
function createTransporter() {
  const config = getEmailConfig()
  return nodemailer.createTransport(config)
}

/**
 * Send email using internal SMTP server
 * @param input - Email input data
 * @returns Promise<EmailResult>
 */
export async function sendEmail(input: SendEmailInput): Promise<EmailResult> {
  try {
    // Clean and validate recipient lists
    const toList = cleanEmailList(input.to)
    const ccList = cleanEmailListNoValidation(input.cc || [])

    if (toList.length === 0) {
      return {
        success: false,
        error: 'No valid recipients found. All emails must be from the allowed domain.',
      }
    }

    // Create transporter
    const transporter = createTransporter()

    // Verify connection
    await transporter.verify()

    // Prepare email options
    const mailOptions: any = {
      from: {
        name: process.env.FROM_NAME || 'DEDE_SYSTEM',
        address: process.env.FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp',
      },
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      subject: input.subject,
      text: input.isHtml ? undefined : input.body,
      html: input.isHtml ? input.body : undefined,
    }

    // Add calendar invite if provided
    if (input.calendarEvent) {
      const calendarEvent = createCalendarEvent({
        uid: input.calendarEvent.uid,
        summary: input.calendarEvent.summary,
        description: input.calendarEvent.description,
        location: input.calendarEvent.location,
        start: input.calendarEvent.start,
        end: input.calendarEvent.end,
        timezone: input.calendarEvent.timezone,
        organizerName: input.calendarEvent.organizer.name,
        organizerEmail: input.calendarEvent.organizer.email,
        attendeeEmails: toList,
        attendeeNames: [],
        ccAttendeeEmails: ccList,
        ccAttendeeNames: [],
        method: input.calendarEvent.method,
        status: input.calendarEvent.status,
        sequence: input.calendarEvent.sequence,
      })

      const calendarInvite = generateCalendarInvite(calendarEvent)

      // Set up proper multipart/alternative structure
      mailOptions.alternatives = [
        {
          content: calendarInvite.content,
          contentType: calendarInvite.contentType,
          encoding: 'utf8'
        }
      ]

      // Also add as attachment for better compatibility
      mailOptions.attachments = [{
        filename: calendarInvite.filename,
        content: calendarInvite.content,
        contentType: calendarInvite.contentType,
        encoding: 'utf8',
        disposition: 'attachment'
      }]
    }

    // Send email
    const result = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Send test email to a specific address
 * @param testEmail - Test email address
 * @param subject - Email subject
 * @param body - Email body
 * @returns Promise<EmailResult>
 */
export async function sendTestEmail(
  testEmail: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  return sendEmail({
    to: [testEmail],
    cc: [],
    subject: `[TEST] ${subject}`,
    body,
    isHtml: true,
  })
}

/**
 * Validate SMTP connection
 * @returns Promise<boolean>
 */
export async function validateSMTPConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    return true
  } catch (error) {
    console.error('SMTP connection validation failed:', error)
    return false
  }
}

/**
 * Get email configuration status
 * @returns Object with configuration status
 */
export function getEmailConfigStatus() {
  const config = getEmailConfig()
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    hasAuth: !!config.auth,
    fromName: process.env.FROM_NAME || 'DEDE_SYSTEM',
    fromEmail: process.env.FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp',
    allowedDomain: process.env.ALLOWED_EMAIL_DOMAIN || '@dit.daikin.co.jp',
  }
}
