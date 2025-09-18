/**
 * Calendar Invitation MIME Email Generator
 * Generates complete SMTP-ready emails with specific HTML body and iCalendar parts
 */

export interface CalendarInvitationParams {
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
 * Generate a complete MIME multipart email for calendar invitations
 * with the exact HTML body format specified in requirements
 */
export function generateCalendarInvitationEmail(params: CalendarInvitationParams): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`
  
  // Generate HTML body with exact format
  const htmlBody = generateExactHTMLBody()
  
  // Generate iCalendar content
  const icalContent = generateICalendarContent(params)
  
  // Generate MIME headers
  const headers = generateMIMEHeaders(params, boundary)
  
  // Generate MIME body
  const mimeBody = generateMIMEBody(htmlBody, icalContent, boundary)
  
  return headers + '\r\n' + mimeBody
}

/**
 * Generate MIME headers
 */
function generateMIMEHeaders(params: CalendarInvitationParams, boundary: string): string {
  const headers: string[] = []
  
  // From header with proper format
  headers.push(`From: DEDE_SYSTEM <${params.fromEmail}>`)
  
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
function generateMIMEBody(htmlBody: string, icalContent: string, boundary: string): string {
  const parts: string[] = []
  
  // HTML part
  parts.push(`--${boundary}`)
  parts.push('Content-Type: text/html; charset=UTF-8')
  parts.push('Content-Transfer-Encoding: 8bit')
  parts.push('')
  parts.push(htmlBody)
  
  // iCalendar part - exact format as specified
  parts.push(`--${boundary}`)
  parts.push('Content-Type: text/calendar; method=REQUEST; charset=UTF-8')
  parts.push('Content-Transfer-Encoding: 8bit')
  parts.push('')
  parts.push(icalContent)
  
  // End boundary
  parts.push(`--${boundary}--`)
  
  return parts.join('\r\n')
}

/**
 * Generate the exact HTML body as specified in requirements
 * Contains ONLY the announcement text block with simple <p> and <br> formatting
 */
function generateExactHTMLBody(): string {
  return `<p>To: All concern member,<br>
I would like to invite you to join Device DR meeting as below.<br>
************************************************<br>
Date : 23/Sep/'25 (Tue)<br>
************************************************<br>
① . DC-K/I  Altair comply WAF&RDS policies.<br>
Device Group : IoT<br>
Applicable Model : -<br>
DR (Stage) : DC-K/I  <br>
Time : 15:00-16:00<br>
Place : R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting.<br>
Chairman : Mr. Nomura Yoshihide<br>
Participant : R&D/DEDE, MKQ, DIT/IT and DIL/ITS<br>
<br>
Thank you & Best regards<br>
--------------------------------------------------------<br>
Thawatchai Thienariyawong<br>
R&D DIVISION / DEVICE GROUP<br>
Tel : 0-3846-9700 #7650<br>
--------------------------------------------------------</p>`
}

/**
 * Generate iCalendar content with proper attendee roles and RSVP settings
 * Following exact RFC5545 format requirements
 */
function generateICalendarContent(params: CalendarInvitationParams): string {
  const lines: string[] = []
  
  // Generate UID if not provided
  const uid = params.uid || `${Date.now()}-${Math.random().toString(36).substring(2)}@${params.fromEmail}`
  
  // Current timestamp for DTSTAMP (UTC format)
  const now = new Date()
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  // Escape text for iCalendar (RFC5545)
  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
  }
  
  // Apply line folding for lines > 75 octets (RFC5545)
  const foldLine = (line: string): string => {
    if (line.length <= 75) return line
    const folded: string[] = []
    let remaining = line
    while (remaining.length > 75) {
      folded.push(remaining.substring(0, 75))
      remaining = ' ' + remaining.substring(75) // Space + continuation
    }
    if (remaining.length > 0) {
      folded.push(remaining)
    }
    return folded.join('\r\n')
  }
  
  // Header - exact format as specified
  lines.push('BEGIN:VCALENDAR')
  lines.push('PRODID:-//Custom SMTP Invite//EN')
  lines.push('VERSION:2.0')
  lines.push('METHOD:REQUEST')
  
  // Event
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${uid}`)
  lines.push(`DTSTAMP:${dtStamp}`)
  lines.push(`DTSTART:${params.dtStart}`)
  lines.push(`DTEND:${params.dtEnd}`)
  
  // Summary (calendar title) - keep concise
  const summary = params.subject.length > 60 ? params.subject.substring(0, 57) + '...' : params.subject
  lines.push(`SUMMARY:${escapeICalText(summary)}`)
  
  // Location
  lines.push('LOCATION:R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting')
  
  // Description (plain text)
  const description = `To: All concern member,\\n\\nI would like to invite you to join Device DR meeting as below.\\n\\n************************************************\\nDate : 23/Sep/'25 (Tue)\\n************************************************\\n① . DC-K/I  Altair comply WAF&RDS policies.\\nDevice Group : IoT\\nApplicable Model : -\\nDR (Stage) : DC-K/I\\nTime : 15:00-16:00\\nPlace : R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting.\\nChairman : Mr. Nomura Yoshihide\\nParticipant : R&D/DEDE, MKQ, DIT/IT and DIL/ITS\\n\\nThank you & Best regards\\n--------------------------------------------------------\\nThawatchai Thienariyawong\\nR&D DIVISION / DEVICE GROUP\\nTel : 0-3846-9700 #7650\\n--------------------------------------------------------`
  lines.push(`DESCRIPTION:${escapeICalText(description)}`)
  
  // Organizer
  lines.push(`ORGANIZER;CN=DEDE_SYSTEM:mailto:${params.fromEmail}`)
  
  // Required participants (To) - ROLE=REQ-PARTICIPANT;RSVP=TRUE
  params.toEmails.forEach(email => {
    const name = params.attendeeNames[email] || email.split('@')[0]
    const attendeeLine = `ATTENDEE;CN=${escapeICalText(name)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${email}`
    lines.push(foldLine(attendeeLine))
  })
  
  // Optional participants (Cc) - ROLE=OPT-PARTICIPANT;RSVP=FALSE
  params.ccEmails.forEach(email => {
    const name = params.ccAttendeeNames[email] || email.split('@')[0]
    const attendeeLine = `ATTENDEE;CN=${escapeICalText(name)};ROLE=OPT-PARTICIPANT;RSVP=FALSE:mailto:${email}`
    lines.push(foldLine(attendeeLine))
  })
  
  // End event
  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')
  
  return lines.join('\r\n')
}

/**
 * Generate example calendar invitation with sample data
 */
export function generateExampleCalendarInvitation(): string {
  const params: CalendarInvitationParams = {
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
  
  return generateCalendarInvitationEmail(params)
}

/**
 * Generate the final MIME message string for SMTP transmission
 * This function returns the complete MIME message ready for SMTP
 */
export function generateFinalMIMEMessage(): string {
  const fromEmail = 'DEDE_SYSTEM@dit.daikin.co.jp'
  const toEmails = ['john.doe@dit.daikin.co.jp', 'jane.smith@dit.daikin.co.jp']
  const ccEmails = ['manager@dit.daikin.co.jp', 'observer@dit.daikin.co.jp']
  const subject = 'Device DR Meeting - DC-K/I Altair comply WAF&RDS policies'
  const attendeeNames = {
    'john.doe@dit.daikin.co.jp': 'John Doe',
    'jane.smith@dit.daikin.co.jp': 'Jane Smith'
  }
  const ccAttendeeNames = {
    'manager@dit.daikin.co.jp': 'Manager Name',
    'observer@dit.daikin.co.jp': 'Observer Name'
  }
  const dtStart = '20250923T080000Z' // 15:00-16:00 Asia/Bangkok = 08:00-09:00 UTC
  const dtEnd = '20250923T090000Z'
  
  return generateSMTPCalendarInvite(
    fromEmail,
    toEmails,
    ccEmails,
    subject,
    attendeeNames,
    ccAttendeeNames,
    dtStart,
    dtEnd
  )
}

/**
 * Generate the final MIME message string for SMTP calendar invite
 * Returns the complete MIME message ready for SMTP transmission
 */
export function generateSMTPCalendarInvite(
  fromEmail: string,
  toEmails: string[],
  ccEmails: string[],
  subject: string,
  attendeeNames: { [email: string]: string },
  ccAttendeeNames: { [email: string]: string },
  dtStart: string, // UTC format: 20250923T080000Z
  dtEnd: string,   // UTC format: 20250923T090000Z
  uid?: string
): string {
  const params: CalendarInvitationParams = {
    fromEmail,
    toEmails,
    ccEmails,
    subject,
    attendeeNames,
    ccAttendeeNames,
    dtStart,
    dtEnd,
    uid
  }
  
  return generateCalendarInvitationEmail(params)
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
