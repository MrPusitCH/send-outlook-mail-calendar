import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateCalendarInvite, createCancelledCalendarEvent } from '@/lib/calendar'
import { generateCancellationEmailHTML } from '@/lib/templates'

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'DEDE_SYSTEM@dit.daikin.co.jp',
      pass: process.env.SMTP_PASS || 'DEDE_SYSTEM_PASSWORD'
    }
  })
}

export async function POST(request: NextRequest) {
  let transporter: nodemailer.Transporter | null = null
  
  try {
    const body = await request.json()
    const { meetingId, uid, summary, start, end, attendees, reason } = body

    // Validate required fields
    if (!uid || !summary || !start || !end || !attendees || !Array.isArray(attendees)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: uid, summary, start, end, attendees'
      }, { status: 400 })
    }

    // Create cancelled calendar event
    const cancelledEvent = createCancelledCalendarEvent({
      uid,
      summary,
      start,
      end,
      method: 'CANCEL',
      status: 'CANCELLED',
      sequence: 1,
      organizer: {
        name: 'DEDE_SYSTEM',
        email: 'DEDE_SYSTEM@dit.daikin.co.jp'
      },
      attendees: attendees.map((email: string) => ({
        email,
        role: 'REQ-PARTICIPANT' as const,
        status: 'NEEDS-ACTION' as const
      }))
    })

    // Generate cancellation email HTML
    const emailBody = generateCancellationEmailHTML(cancelledEvent, reason)

    // Generate iCalendar attachment
    const calendarInvite = generateCalendarInvite(cancelledEvent)

    // Create transporter and send email
    transporter = createTransporter()
    await transporter.verify()

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'DEDE_SYSTEM'} <${process.env.SMTP_FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp'}>`,
      to: attendees.join(', '),
      subject: `CANCELLED: ${summary}`,
      html: emailBody,
      attachments: [
        {
          filename: calendarInvite.filename,
          content: calendarInvite.content,
          contentType: calendarInvite.contentType
        }
      ]
    }

    // Send emails
    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: 'Cancellation email sent successfully',
      messageId: info.messageId,
      data: {
        meetingId,
        uid,
        summary,
        attendees: attendees.length,
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
