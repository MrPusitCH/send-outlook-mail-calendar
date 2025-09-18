import nodemailer from 'nodemailer'
import { SendEmailInput, cleanEmailList, cleanEmailListNoValidation, CalendarEvent } from './validators'
import { createCalendarEvent, generateCalendarInvite } from './calendar'
import { generateCalendarInvitationEmail, CalendarInvitationParams } from './calendar-invitation-generator'

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
      // Convert times to UTC format for iCalendar
      const startTime = input.calendarEvent.start || new Date().toISOString()
      const endTime = input.calendarEvent.end || new Date(Date.now() + 60 * 60 * 1000).toISOString()
      
      // Format times for iCalendar (UTC format)
      const formatICalTime = (dateString: string): string => {
        const date = new Date(dateString)
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }
      
      // Generate MIME multipart email with calendar invite
      const calendarParams: CalendarInvitationParams = {
        fromEmail: process.env.FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp',
        toEmails: toList,
        ccEmails: ccList,
        subject: input.subject,
        attendeeNames: {},
        ccAttendeeNames: {},
        dtStart: formatICalTime(startTime),
        dtEnd: formatICalTime(endTime)
      }

      // Map attendee names from calendar event
      if (input.calendarEvent.attendees) {
        input.calendarEvent.attendees.forEach((attendee: any) => {
          if (attendee.email && attendee.name) {
            if (attendee.role === 'REQ-PARTICIPANT') {
              calendarParams.attendeeNames[attendee.email] = attendee.name
            } else if (attendee.role === 'OPT-PARTICIPANT') {
              calendarParams.ccAttendeeNames[attendee.email] = attendee.name
            }
          }
        })
      }

      // Generate complete MIME email
      const mimeEmail = generateCalendarInvitationEmail(calendarParams)
      
      // Use raw MIME email with nodemailer
      mailOptions.raw = mimeEmail
      // Clear other content types when using raw
      delete mailOptions.html
      delete mailOptions.text
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
