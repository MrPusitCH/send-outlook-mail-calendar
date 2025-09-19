import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { sendEmailInputSchema, validateEmailDomain, getAllowedEmailDomainSuffix, cleanEmailListNoValidation } from '@/lib/validators'
import { createCalendarEvent, generateCalendarInvite } from '@/lib/calendar'
// import { generateCalendarInvitationEmail, CalendarInvitationParams } from '@/lib/calendar-invitation-generator'
// DISABLED - Now using beautiful HTML templates instead

type NormalizedSendEmailInput = {
  to: string[]
  cc: string[]
  subject: string
  body: string
  isHtml: boolean
  calendarEvent?: any
}

/**
 * Create Nodemailer transporter for Daikin internal mail server
 */
function createTransporter() {
  // Use Gmail SMTP for testing when not on internal network
  const isInternalNetwork = process.env.SMTP_HOST === '192.168.212.220'
  
  if (isInternalNetwork) {
    // Internal Daikin SMTP server
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || '192.168.212.220',
      port: parseInt(process.env.SMTP_PORT || '25'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_AUTH_METHOD === 'none' ? undefined : {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_REQUIRE_TLS === 'true'
      }
    })
  } else {
    // Gmail SMTP for external testing
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
      }
    })
  }
}

/**
 * Log email attempt to console
 */
function logEmail(to: string | string[], subject: string, status: 'SUCCESS' | 'FAILED', error?: string) {
  const timestamp = new Date().toISOString()
  const recipients = Array.isArray(to) ? to.join(', ') : to
  console.log(`[${timestamp}] Email ${status}:`, {
    to: recipients,
    subject,
    error: error || null,
  })
}


function normalizeEmails(value: unknown): string[] {
  if (!value) {
    return []
  }

  const values = Array.isArray(value) ? value : [value]

  return values
    .flatMap(item => {
      if (typeof item !== 'string') {
        return []
      }
      return item
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)
    })
}

function normalizePayload(payload: any): NormalizedSendEmailInput {
  const bodyContent = typeof payload?.body === 'string'
    ? payload.body
    : typeof payload?.html === 'string'
      ? payload.html
      : typeof payload?.text === 'string'
        ? payload.text
        : ''

  return {
    to: normalizeEmails(payload?.to ?? payload?.recipient ?? payload?.email),
    cc: normalizeEmails(payload?.cc),
    subject: typeof payload?.subject === 'string' ? payload.subject.trim() : '',
    body: bodyContent,
    isHtml: typeof payload?.isHtml === 'boolean' ? payload.isHtml : true,
    calendarEvent: payload?.calendarEvent || undefined,
  }
}

/**
 * POST /api/send-email
 * Send email through Daikin internal mail server
 */
export async function POST(request: NextRequest) {
  let transporter: nodemailer.Transporter | null = null
  let normalizedInput: NormalizedSendEmailInput | null = null
  
  try {
    const rawBody = await request.json()
    normalizedInput = normalizePayload(rawBody)

    const validationResult = sendEmailInputSchema.safeParse(normalizedInput)

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(err => err.message).join(', ')
      logEmail(normalizedInput.to.length ? normalizedInput.to : 'unknown', normalizedInput.subject || 'unknown', 'FAILED', errorMessage)
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      )
    }

    const { to, cc, subject, body: emailBody, isHtml, calendarEvent } = validationResult.data

    // Only validate TO recipients for domain restriction, CC can be any domain
    const invalidDomain = to.find(email => !validateEmailDomain(email))

    if (invalidDomain) {
      const allowedDomain = getAllowedEmailDomainSuffix()
      const errorMessage = `Required recipients must end with ${allowedDomain}`
      logEmail(to, subject, 'FAILED', `${errorMessage}. Invalid: ${invalidDomain}`)
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      )
    }

    // Clean CC emails without domain validation
    const cleanCC = cleanEmailListNoValidation(cc)

    // Create transporter
    transporter = createTransporter()
    
    // Verify connection with better error handling
    try {
      await transporter.verify()
    } catch (verifyError) {
      const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown verification error'
      console.error('SMTP verification failed:', verifyError)
      logEmail(to, subject, 'FAILED', `SMTP connection failed: ${errorMessage}`)
      return NextResponse.json(
        { 
          success: false, 
          error: `SMTP server connection failed. Please check if the mail server is running and accessible. Error: ${errorMessage}` 
        },
        { status: 500 }
      )
    }
    
    // Prepare email options
    const mailOptions: nodemailer.SendMailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'DEDE_SYSTEM'} <${process.env.SMTP_FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp'}>`,
      to,
      cc: cleanCC.length ? cleanCC : undefined,
      subject,
      ...(isHtml ? { html: emailBody } : { text: emailBody }),
    }

    // Add calendar invite if provided
    if (calendarEvent) {
      // Create proper calendar event using the calendar library
      const event = createCalendarEvent({
        uid: calendarEvent.uid || `${Date.now()}-${Math.random().toString(36).substring(2)}@${process.env.SMTP_FROM_EMAIL || 'dit.daikin.co.jp'}`,
        summary: calendarEvent.summary || subject,
        description: calendarEvent.description || emailBody.replace(/<[^>]*>/g, ''),
        location: calendarEvent.location || '',
        start: calendarEvent.start || new Date().toISOString(),
        end: calendarEvent.end || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        organizerName: process.env.SMTP_FROM_NAME || 'DEDE_SYSTEM',
        organizerEmail: process.env.SMTP_FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp',
        attendeeEmails: to,
        attendeeNames: to.map(email => email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
        ccAttendeeEmails: cleanCC,
        ccAttendeeNames: cleanCC.map(email => email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
        method: calendarEvent.method || 'REQUEST',
        status: calendarEvent.status || 'CONFIRMED',
        sequence: calendarEvent.sequence || 0
      })

      // Generate calendar invite using the proper library
      const calendarInvite = generateCalendarInvite(event)

      // Add calendar headers for proper Outlook recognition
      mailOptions.headers = {
        'X-MS-OLK-FORCEINSPECTOROPEN': 'TRUE',
        'Content-Class': 'urn:content-classes:calendarmessage',
        'X-MICROSOFT-CDO-BUSYSTATUS': calendarEvent.method === 'CANCEL' ? 'FREE' : 'BUSY',
        'X-MICROSOFT-CDO-IMPORTANCE': '1',
        'X-MICROSOFT-DISALLOW-COUNTER': 'FALSE'
      }

      // Use proper MIME structure with multipart/alternative
      if (calendarEvent.method === 'CANCEL') {
        // For cancellations, use multipart/alternative with text and calendar
        mailOptions.alternatives = [
          {
            contentType: 'text/plain; charset=UTF-8',
            content: emailBody.replace(/<[^>]*>/g, '') // Strip HTML for text part
          },
          {
            contentType: 'text/calendar; method=CANCEL; charset=UTF-8',
            content: calendarInvite.content
          }
        ]
        
        // Remove individual text/html properties when using alternatives
        delete mailOptions.text
        delete mailOptions.html
      } else {
        // For regular invitations, use multipart/alternative with HTML and calendar
        mailOptions.alternatives = [
          {
            contentType: 'text/html; charset=UTF-8',
            content: emailBody
          },
          {
            contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
            content: calendarInvite.content
          }
        ]
        
        // Remove individual text/html properties when using alternatives
        delete mailOptions.text
        delete mailOptions.html
      }

      // Add .ics file as attachment for better compatibility
      mailOptions.attachments = [
        {
          filename: calendarEvent.method === 'CANCEL' ? 'cancel.ics' : 'invite.ics',
          content: calendarInvite.content,
          contentType: calendarInvite.contentType,
          contentDisposition: 'attachment' as const
        }
      ]
    }

    const info = await transporter.sendMail(mailOptions)

    // Log success
    logEmail(to, subject, 'SUCCESS')
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
    
  } catch (error) {
    console.error('Send email error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const fallbackRecipients = normalizedInput && normalizedInput.to.length ? normalizedInput.to : 'unknown'
    const fallbackSubject = normalizedInput?.subject || 'unknown'

    // Log failure
    logEmail(fallbackRecipients, fallbackSubject, 'FAILED', errorMessage)
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  } finally {
    if (transporter) {
      transporter.close()
    }
  }
}

/**
 * GET /api/send-email
 * Get email configuration status
 */
export async function GET() {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    
    return NextResponse.json({
      success: true,
      message: 'SMTP connection verified successfully',
      config: {
        host: process.env.SMTP_HOST || '192.168.212.220',
        port: process.env.SMTP_PORT || '25',
        secure: process.env.SMTP_SECURE || 'false',
        auth: process.env.SMTP_AUTH_METHOD || 'none',
        from: process.env.SMTP_FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp',
      },
    })
  } catch (error) {
    console.error('SMTP verification error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'SMTP verification failed' 
      },
      { status: 500 }
    )
  }
}
