/**
 * Styled Calendar Invitation MIME Email Generator
 * Generates complete SMTP-ready emails with styled HTML body and iCalendar parts
 */

export interface StyledCalendarInvitationParams {
  fromEmail: string
  toEmails: string[]
  ccEmails: string[]
  subject: string
  attendeeNames: { [email: string]: string } // email -> display name mapping
  ccAttendeeNames: { [email: string]: string } // email -> display name mapping
  dtStart: string // UTC datetime in format: 20250923T080000Z
  dtEnd: string // UTC datetime in format: 20250923T090000Z
  uid?: string // Optional UID, will be generated if not provided
}

/**
 * Generate a complete MIME multipart email for styled calendar invitations
 * with the exact HTML template and iCalendar structure specified
 */
export function generateStyledCalendarInvitationEmail(params: StyledCalendarInvitationParams): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`
  
  // Generate styled HTML body
  const htmlBody = generateStyledHTMLBody()
  
  // Generate iCalendar content
  const icalContent = generateStyledICalendarContent(params)
  
  // Generate MIME headers
  const headers = generateStyledMIMEHeaders(params, boundary)
  
  // Generate MIME body
  const mimeBody = generateStyledMIMEBody(htmlBody, icalContent, boundary)
  
  return headers + '\r\n' + mimeBody
}

/**
 * Generate MIME headers
 */
function generateStyledMIMEHeaders(params: StyledCalendarInvitationParams, boundary: string): string {
  const headers: string[] = []
  
  // From header
  headers.push(`From: ${params.fromEmail}`)
  
  // To header
  headers.push(`To: ${params.toEmails.join(', ')}`)
  
  // CC header
  if (params.ccEmails.length > 0) {
    headers.push(`Cc: ${params.ccEmails.join(', ')}`)
  }
  
  // Subject header
  headers.push(`Subject: ${params.subject}`)
  
  // MIME headers
  headers.push('MIME-Version: 1.0')
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
  headers.push('X-Mailer: DEDE_SYSTEM Calendar Invitation System')
  
  return headers.join('\r\n')
}

/**
 * Generate MIME body with HTML and iCalendar parts
 */
function generateStyledMIMEBody(htmlBody: string, icalContent: string, boundary: string): string {
  const parts: string[] = []
  
  // HTML part
  parts.push(`--${boundary}`)
  parts.push('Content-Type: text/html; charset=UTF-8')
  parts.push('Content-Transfer-Encoding: 8bit')
  parts.push('')
  parts.push(htmlBody)
  
  // iCalendar part
  parts.push(`--${boundary}`)
  parts.push('Content-Type: text/calendar; charset=UTF-8; method=REQUEST')
  parts.push('Content-Transfer-Encoding: 8bit')
  parts.push('')
  parts.push(icalContent)
  
  // End boundary
  parts.push(`--${boundary}--`)
  
  return parts.join('\r\n')
}

/**
 * Generate the styled HTML body as specified in requirements
 * Uses inline CSS with email-safe styling and the exact template format
 */
function generateStyledHTMLBody(): string {
  return `<html>
  <body style="margin:0;padding:24px;background:#f6f7fb;font-family:Segoe UI,Arial,sans-serif;">
    <div style="max-width:720px;margin:0 auto;">
      <div style="background:#fff;border:1px solid #e7e9f1;border-radius:14px;
                  box-shadow:0 2px 8px rgba(16,24,40,.06);padding:24px;">
        <h2 style="margin:0 0 12px 0;font-size:20px;color:#0f172a;">
          📄 Device DR Meeting – DC-K/I Altair comply WAF&RDS policies
        </h2>
        <p style="margin:0 0 16px 0;color:#334155;line-height:1.6;">
          <strong>To:</strong> All concern member,<br>
          I would like to invite you to join Device DR meeting as below.
        </p>
        <div style="border:1px dashed #cbd5e1;border-radius:10px;padding:12px 14px;margin:12px 0;">
          <div style="font-family:ui-monospace,Menlo,Consolas,monospace;color:#475569">
            ************************************************<br>
            <strong>Date :</strong> 23/Sep/'25 (Tue)<br>
            ************************************************
          </div>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="border-collapse:separate;border-spacing:0 10px;font-size:14px;color:#0f172a;">
          <tr><td width="34">①</td><td><strong>DC-K/I Altair comply WAF&RDS policies.</strong></td></tr>
          <tr><td width="34">🧩</td><td><strong>Device Group</strong> : IoT</td></tr>
          <tr><td width="34">📦</td><td><strong>Applicable Model</strong> : –</td></tr>
          <tr><td width="34">🛠️</td><td><strong>DR (Stage)</strong> : DC-K/I</td></tr>
          <tr><td width="34">⏰</td><td><strong>Time</strong> : 15:00–16:00</td></tr>
          <tr><td width="34">📍</td><td><strong>Place</strong> : R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting.</td></tr>
          <tr><td width="34">👤</td><td><strong>Chairman</strong> : Mr. Nomura Yoshihide</td></tr>
          <tr><td width="34">👥</td><td><strong>Participant</strong> : R&D/DEDE, MKQ, DIT/IT and DIL/ITS</td></tr>
        </table>
        <p style="margin:16px 0 0 0;color:#334155;line-height:1.6;">
          Thank you & Best regards
        </p>
        <div style="margin-top:10px;padding-top:12px;border-top:1px solid #e2e8f0;color:#475569;">
          Thawatchai Thienariyawong<br>
          R&D DIVISION / DEVICE GROUP<br>
          Tel : 0-3846-9700 #7650
        </div>
      </div>
    </div>
  </body>
</html>`
}

/**
 * Generate iCalendar content with proper attendee roles and RSVP settings
 */
function generateStyledICalendarContent(params: StyledCalendarInvitationParams): string {
  const lines: string[] = []
  
  // Generate UID if not provided
  const uid = params.uid || `${Date.now()}-${Math.random().toString(36).substring(2)}@${params.fromEmail}`
  
  // Current timestamp for DTSTAMP
  const now = new Date()
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  // Escape text for iCalendar
  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
  }
  
  // Header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//DEDE_SYSTEM//Email Calendar//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:REQUEST')
  
  // Event
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${uid}`)
  
  // Concise SUMMARY for calendar block (≤60 chars)
  lines.push('SUMMARY:📞 Microsoft Teams – Device DR Meeting (DC-K/I)')
  
  // Description with the announcement text
  const description = `To: All concern member,\\n\\nI would like to invite you to join Device DR meeting as below.\\n\\n************************************************\\nDate : 23/Sep/'25 (Tue)\\n************************************************\\n① . DC-K/I  Altair comply WAF&RDS policies.\\nDevice Group : IoT\\nApplicable Model : -\\nDR (Stage) : DC-K/I\\nTime : 15:00-16:00\\nPlace : R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting.\\nChairman : Mr. Nomura Yoshihide\\nParticipant : R&D/DEDE, MKQ, DIT/IT and DIL/ITS\\n\\nThank you & Best regards\\n--------------------------------------------------------\\nThawatchai Thienariyawong\\nR&D DIVISION / DEVICE GROUP\\nTel : 0-3846-9700 #7650\\n--------------------------------------------------------`
  lines.push(`DESCRIPTION:${description}`)
  
  // Location
  lines.push('LOCATION:R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Teams')
  
  // Date/time
  lines.push(`DTSTART:${params.dtStart}`)
  lines.push(`DTEND:${params.dtEnd}`)
  
  // Organizer
  lines.push(`ORGANIZER;CN=DEDE_SYSTEM:mailto:${params.fromEmail}`)
  
  // Required participants (To) - ROLE=REQ-PARTICIPANT;RSVP=TRUE
  params.toEmails.forEach(email => {
    const name = params.attendeeNames[email] || email.split('@')[0]
    lines.push(`ATTENDEE;CN=${escapeICalText(name)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${email}`)
  })
  
  // Optional participants (Cc) - ROLE=OPT-PARTICIPANT;RSVP=FALSE
  params.ccEmails.forEach(email => {
    const name = params.ccAttendeeNames[email] || email.split('@')[0]
    lines.push(`ATTENDEE;CN=${escapeICalText(name)};ROLE=OPT-PARTICIPANT;RSVP=FALSE:mailto:${email}`)
  })
  
  // Status and timestamps
  lines.push('STATUS:CONFIRMED')
  lines.push('SEQUENCE:0')
  lines.push(`DTSTAMP:${dtStamp}`)
  lines.push(`CREATED:${dtStamp}`)
  lines.push(`LAST-MODIFIED:${dtStamp}`)
  
  // End event
  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')
  
  return lines.join('\r\n')
}

/**
 * Generate example styled calendar invitation with sample data
 */
export function generateExampleStyledCalendarInvitation(): string {
  const params: StyledCalendarInvitationParams = {
    fromEmail: 'DEDE_SYSTEM@dit.daikin.co.jp',
    toEmails: ['john.doe@dit.daikin.co.jp', 'jane.smith@dit.daikin.co.jp'],
    ccEmails: ['manager@dit.daikin.co.jp', 'observer@dit.daikin.co.jp'],
    subject: 'Device DR Meeting - DC-K/I Altair comply WAF&RDS policies',
    attendeeNames: {
      'john.doe@dit.daikin.co.jp': 'John Doe',
      'jane.smith@dit.daikin.co.jp': 'Jane Smith'
    },
    ccAttendeeNames: {
      'manager@dit.daikin.co.jp': 'Manager Name',
      'observer@dit.daikin.co.jp': 'Observer Name'
    },
    dtStart: '20250923T080000Z', // 15:00-16:00 Asia/Bangkok = 08:00-09:00 UTC
    dtEnd: '20250923T090000Z'
  }
  
  return generateStyledCalendarInvitationEmail(params)
}

/**
 * Convert local time to UTC for iCalendar
 * @param localDateTime - Local datetime string (e.g., "2025-09-23T15:00:00")
 * @param timezone - Timezone (e.g., "Asia/Bangkok")
 * @returns UTC datetime string for iCalendar (e.g., "20250923T080000Z")
 */
export function convertToUTCForICal(localDateTime: string, timezone: string): string {
  // For Asia/Bangkok (UTC+7), 15:00 local = 08:00 UTC
  const date = new Date(localDateTime)
  
  // Adjust for timezone offset
  let utcDate: Date
  if (timezone === 'Asia/Bangkok') {
    // UTC+7, so subtract 7 hours
    utcDate = new Date(date.getTime() - (7 * 60 * 60 * 1000))
  } else {
    // Default to UTC
    utcDate = date
  }
  
  return utcDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}
