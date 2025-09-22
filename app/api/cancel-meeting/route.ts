import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateCalendarInvite, createCancelledCalendarEvent } from '@/lib/calendar'
import { generateCancellationEmailHTML } from '@/lib/templates'
import { getInviteMeta, extractMetaFromICS, saveInviteMeta } from '@/lib/calendar-store'
import { saveEml } from '@/lib/email-debug'

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
    const { meetingId, originalUid, uid, summary, start, end, attendees, reason, sequence, organizer, location, description, fallbackEmlPath } = body

    // Helper: RFC5545 basic format checker (YYYYMMDDTHHMMSSZ)
    const isBasicDateTime = (value: string): boolean => /^(\d{8}T\d{6}Z)$/.test(value)

    // Helper: Convert any date-like string to RFC5545 basic UTC format
    const toRFC5545BasicUTC = (value: string): string => {
      const d = new Date(value)
      if (isNaN(d.getTime())) {
        throw new Error(`Invalid date for cancellation: ${value}`)
      }
      const year = d.getUTCFullYear()
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const day = String(d.getUTCDate()).padStart(2, '0')
      const hours = String(d.getUTCHours()).padStart(2, '0')
      const minutes = String(d.getUTCMinutes()).padStart(2, '0')
      const seconds = String(d.getUTCSeconds()).padStart(2, '0')
      return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
    }

    // Require originalUid
    const effectiveUid = originalUid || uid
    if (!effectiveUid) {
      return NextResponse.json({ success: false, error: 'originalUid is required for cancellation' }, { status: 400 })
    }

    // Lookup stored REQUEST meta
    let stored = getInviteMeta(effectiveUid)

    // Optional fallback: parse provided EML to extract ICS
    if (!stored && typeof fallbackEmlPath === 'string') {
      try {
        const fs = await import('fs')
        const raw = fs.readFileSync(fallbackEmlPath, 'utf8')
        // Extract text/calendar payload (very basic parser)
        const match = raw.match(/Content-Type: text\/calendar[\s\S]*?\r\n\r\n([\s\S]*?)\r\n--/i)
        if (match) {
          const icsText = match[1]
          const meta = extractMetaFromICS(icsText)
          if (meta) {
            saveInviteMeta(meta)
            stored = meta
          }
        }
      } catch (e) {
        console.warn('[CANCEL_FALLBACK] Failed to parse EML', e)
      }
    }

    // Fallback 2: if caller provides exact RFC5545 basic DTSTART/DTEND and organizer, accept and persist
    if (!stored) {
      const hasBasicDates = typeof start === 'string' && typeof end === 'string' && isBasicDateTime(start) && isBasicDateTime(end)
      const orgEmail = (organizer && typeof organizer.email === 'string' && organizer.email) || (process.env.SMTP_FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp')
      const orgName = (organizer && typeof organizer.name === 'string' && organizer.name) || (process.env.SMTP_FROM_NAME || 'DEDE_SYSTEM')
      if (hasBasicDates && orgEmail) {
        const organizerLine = `ORGANIZER;CN=${orgName}:mailto:${orgEmail}`
        const seqNum = typeof sequence === 'number' ? sequence : 0
        const meta = { uid: effectiveUid, dtstart: start, dtend: end, sequence: seqNum, organizerLine }
        saveInviteMeta(meta)
        stored = meta
      }
    }

    if (!stored) {
      return NextResponse.json({ success: false, error: `Original invite not found for UID: ${effectiveUid}` }, { status: 404 })
    }

    // Validate required fields for cancellation
    if (!summary || !attendees || !Array.isArray(attendees)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: summary, attendees'
      }, { status: 400 })
    }

    // Ensure organizer identity matches SMTP From and authenticated account
    const organizerEmail = process.env.SMTP_FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp'
    const organizerName = process.env.SMTP_FROM_NAME || 'DEDE_SYSTEM'

    // Create original event object from stored meta (preserve EXACT values)
    const originalEvent = {
      uid: stored.uid,
      summary,
      description: description || '',
      location: location || '',
      start: stored.dtstart,
      end: stored.dtend,
      organizer: {
        name: organizerName,
        email: organizerEmail
      },
      attendees: attendees.map((email: string) => ({
        email,
        role: 'REQ-PARTICIPANT' as const,
        status: 'NEEDS-ACTION' as const
      })),
      sequence: stored.sequence || 0,
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

    // CRITICAL: Use proper MIME structure for Outlook compatibility
    // Structure: multipart/mixed -> multipart/alternative (text/plain + text/html) + text/calendar attachment
    const textBody = emailBody.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    
    const mailOptions = {
      from: `${organizerName} <${organizerEmail}>`,
      to: attendees.join(', '),
      subject: `CANCELLED: ${summary}`,
      alternatives: [
        {
          contentType: 'text/plain; charset=UTF-8',
          content: textBody
        },
        {
          contentType: 'text/html; charset=UTF-8',
          content: emailBody
        },
        {
          contentType: 'text/calendar; method=CANCEL; charset=UTF-8',
          content: calendarInvite.content
        }
      ],
      headers: {
        'X-MS-OLK-FORCEINSPECTOROPEN': 'TRUE',
        'X-MICROSOFT-CDO-BUSYSTATUS': 'FREE',
        'X-MICROSOFT-CDO-IMPORTANCE': '1',
        'X-MICROSOFT-DISALLOW-COUNTER': 'FALSE',
        'Content-Class': 'urn:content-classes:calendarmessage',
        'X-MS-HAS-ATTACH': 'TRUE',
        'X-MS-OLK-CONFTYPE': '0',
        'X-MS-OLK-SENDER': organizerEmail,
        'X-MS-OLK-AUTOFORWARD': 'FALSE',
        'X-MS-OLK-AUTOREPLY': 'FALSE',
        'MIME-Version': '1.0'
      },
      attachments: [
        {
          filename: 'cancel.ics',
          content: calendarInvite.content,
          contentType: 'text/calendar; method=CANCEL; charset=UTF-8',
          contentDisposition: 'attachment' as const,
          encoding: 'utf8'
        }
      ]
    }

    // Send emails
    const info = await transporter.sendMail(mailOptions)

    // Log cancellation details for traceability
    console.log(`[CANCELLATION] UID: ${uid}, SEQUENCE: ${cancelledEvent.sequence}, Recipients: ${attendees.join(', ')}, Status: SENT, MessageID: ${info.messageId || 'unknown'}, Organizer: ${organizerEmail}, Method: CANCEL`)

    return NextResponse.json({
      success: true,
      message: 'Cancellation email sent successfully',
      messageId: info.messageId || 'unknown',
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
