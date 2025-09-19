import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateCalendarInvite, createCancelledCalendarEvent } from '@/lib/calendar'
import { generateCancellationEmailHTML } from '@/lib/templates'

// Email configuration
const createTransporter = () => {
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

export async function POST(request: NextRequest) {
  let transporter: nodemailer.Transporter | null = null

  try {
    const body = await request.json()
    const { meetingId, uid, summary, start, end, attendees, reason, sequence, organizer, location, description } = body

    // Validate required fields for cancellation
    if (!uid || !summary || !start || !end || !attendees || !Array.isArray(attendees)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: uid, summary, start, end, attendees'
      }, { status: 400 })
    }

    // Ensure organizer identity matches SMTP From and authenticated account
    const organizerEmail = process.env.SMTP_FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp'
    const organizerName = process.env.SMTP_FROM_NAME || 'DEDE_SYSTEM'

    // Create original event object with all details from the original invite
    const originalEvent = {
      uid,
      summary,
      description: description || '',
      location: location || '',
      start,
      end,
      organizer: {
        name: organizerName,
        email: organizerEmail
      },
      attendees: attendees.map((email: string) => ({
        email,
        role: 'REQ-PARTICIPANT' as const,
        status: 'NEEDS-ACTION' as const
      })),
      // Use the original sequence or default to 0
      sequence: sequence || 0,
      method: 'REQUEST' as const,
      status: 'CONFIRMED' as const
    }

    // Create cancelled event with incremented sequence
    const cancelledEvent = createCancelledCalendarEvent(originalEvent)

    // Generate cancellation email HTML
    const emailBody = generateCancellationEmailHTML(cancelledEvent, reason)

    // Generate iCalendar attachment
    const calendarInvite = generateCalendarInvite(cancelledEvent)

    // Create transporter and send email
    transporter = createTransporter()
    await transporter.verify()

    // Ensure From header matches organizer for Outlook compatibility
    const mailOptions = {
      from: `${organizerName} <${organizerEmail}>`,
      to: attendees.join(', '),
      subject: `CANCELLED: ${summary}`,
      html: emailBody,
      headers: {
        'X-MS-OLK-FORCEINSPECTOROPEN': 'TRUE',
        'Content-Class': 'urn:content-classes:calendarmessage',
        'X-MICROSOFT-CDO-BUSYSTATUS': 'FREE',
        'X-MICROSOFT-CDO-IMPORTANCE': '1',
        'X-MICROSOFT-DISALLOW-COUNTER': 'FALSE'
      },
      attachments: [
        {
          filename: 'cancel.ics',
          content: calendarInvite.content,
          contentType: calendarInvite.contentType,
          contentDisposition: 'attachment' as const
        }
      ]
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    // Log cancellation details for traceability
    console.log(`[CANCELLATION] UID: ${uid}, SEQUENCE: ${cancelledEvent.sequence}, Recipients: ${attendees.join(', ')}, Status: SENT, MessageID: ${info?.messageId || 'unknown'}, Organizer: ${organizerEmail}, Method: CANCEL`)

    return NextResponse.json({
      success: true,
      message: 'Cancellation email sent successfully',
      messageId: info?.messageId || 'unknown',
      data: {
        meetingId,
        uid: cancelledEvent.uid,
        summary: cancelledEvent.summary,
        sequence: cancelledEvent.sequence,
        method: cancelledEvent.method,
        status: cancelledEvent.status,
        attendees: attendees.length,
        organizerEmail: cancelledEvent.organizer?.email,
        sentAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error sending cancellation email:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send cancellation email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    if (transporter) {
      transporter.close()
    }
  }
}
