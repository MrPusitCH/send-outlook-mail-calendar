/**
 * MIME multipart email generator for calendar invitations
 * Generates complete SMTP-ready emails with HTML and iCalendar parts
 */

export interface MIMEEmailParams {
  fromEmail: string
  toEmails: string[]
  ccEmails: string[]
  subject: string
  eventTitle: string
  eventDescription: string
  eventLocation: string
  eventDate: string // ISO date string
  eventStartTime: string // ISO date string
  eventEndTime: string // ISO date string
  timezone: string
  organizerName: string
  organizerEmail: string
  attendeeNames: { [email: string]: string } // email -> display name mapping
  ccAttendeeNames: { [email: string]: string } // email -> display name mapping
  notes?: string
}

/**
 * Generate a complete MIME multipart email for calendar invitations
 */
export function generateMIMECalendarEmail(params: MIMEEmailParams): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`
  
  // Generate HTML body
  const htmlBody = generateHTMLInvitation(params)
  
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
function generateMIMEHeaders(params: MIMEEmailParams, boundary: string): string {
  const headers: string[] = []
  
  // From header
  headers.push(`From: ${params.organizerName} <${params.fromEmail}>`)
  
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
 * Generate professional HTML invitation body
 */
function generateHTMLInvitation(params: MIMEEmailParams): string {
  const eventDate = new Date(params.eventStartTime)
  const startTime = new Date(params.eventStartTime)
  const endTime = new Date(params.eventEndTime)
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar Invitation</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; margin-bottom: 25px; color: #1f2937; }
        .event-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .event-details h2 { margin: 0 0 20px 0; color: #1e40af; font-size: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .detail-row { display: flex; margin-bottom: 15px; align-items: flex-start; }
        .detail-label { font-weight: 600; color: #374151; min-width: 100px; margin-right: 15px; }
        .detail-value { color: #1f2937; flex: 1; }
        .participants { margin-top: 20px; }
        .participants h3 { margin: 0 0 15px 0; color: #1e40af; font-size: 16px; }
        .participant-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .participant { background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
        .cc-participant { background: #dcfce7; color: #166534; }
        .notes { margin-top: 25px; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; }
        .notes h3 { margin: 0 0 10px 0; color: #92400e; font-size: 16px; }
        .notes p { margin: 0; color: #78350f; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px; }
        .calendar-icon { display: inline-block; margin-right: 8px; }
        .time-icon { display: inline-block; margin-right: 8px; }
        .location-icon { display: inline-block; margin-right: 8px; }
        .user-icon { display: inline-block; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Calendar Invitation</h1>
            <p>You're invited to a meeting</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello,
            </div>
            
            <p>You are cordially invited to attend the following meeting:</p>
            
            <div class="event-details">
                <h2>Event Details</h2>
                
                <div class="detail-row">
                    <div class="detail-label">📅 Date:</div>
                    <div class="detail-value">${formatDate(eventDate)}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">🕐 Time:</div>
                    <div class="detail-value">${formatTime(startTime)} - ${formatTime(endTime)} (${params.timezone})</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">📍 Location:</div>
                    <div class="detail-value">${params.eventLocation || 'TBD'}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">📋 Topic/Agenda:</div>
                    <div class="detail-value">${params.eventTitle}</div>
                </div>
                
                ${params.eventDescription ? `
                <div class="detail-row">
                    <div class="detail-label">📝 Description:</div>
                    <div class="detail-value">${params.eventDescription.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="participants">
                <h3>👥 Participants</h3>
                <div class="participant-list">
                    ${params.toEmails.map(email => 
                        `<span class="participant">${params.attendeeNames[email] || email}</span>`
                    ).join('')}
                    ${params.ccEmails.map(email => 
                        `<span class="participant cc-participant">${params.ccAttendeeNames[email] || email} (FYI)</span>`
                    ).join('')}
                </div>
            </div>
            
            ${params.notes ? `
            <div class="notes">
                <h3>📌 Additional Notes</h3>
                <p>${params.notes}</p>
            </div>
            ` : ''}
            
            <p style="margin-top: 30px;">
                Please respond to this invitation at your earliest convenience. 
                The calendar event has been attached to this email for easy addition to your calendar.
            </p>
            
            <p>
                Best regards,<br>
                <strong>${params.organizerName}</strong><br>
                <em>DEDE_SYSTEM</em>
            </p>
        </div>
        
        <div class="footer">
            <p>This is an automated calendar invitation from DEDE_SYSTEM</p>
        </div>
    </div>
</body>
</html>`
}

/**
 * Generate iCalendar content
 */
function generateICalendarContent(params: MIMEEmailParams): string {
  const lines: string[] = []
  
  // Generate UID
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2)}@${params.organizerEmail}`
  
  // Format dates for iCalendar
  const formatICalDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
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
  lines.push(`SUMMARY:${escapeICalText(params.eventTitle)}`)
  
  if (params.eventDescription) {
    lines.push(`DESCRIPTION:${escapeICalText(params.eventDescription)}`)
  }
  
  if (params.eventLocation) {
    lines.push(`LOCATION:${escapeICalText(params.eventLocation)}`)
  }
  
  // Date/time
  lines.push(`DTSTART:${formatICalDate(params.eventStartTime)}`)
  lines.push(`DTEND:${formatICalDate(params.eventEndTime)}`)
  
  // Organizer
  lines.push(`ORGANIZER;CN=${escapeICalText(params.organizerName)}:mailto:${params.organizerEmail}`)
  
  // Required participants (To)
  params.toEmails.forEach(email => {
    const name = params.attendeeNames[email] || email.split('@')[0]
    lines.push(`ATTENDEE;CN=${escapeICalText(name)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${email}`)
  })
  
  // Optional participants (Cc)
  params.ccEmails.forEach(email => {
    const name = params.ccAttendeeNames[email] || email.split('@')[0]
    lines.push(`ATTENDEE;CN=${escapeICalText(name)};ROLE=OPT-PARTICIPANT;RSVP=FALSE:mailto:${email}`)
  })
  
  // Status and timestamps
  lines.push('STATUS:CONFIRMED')
  lines.push('SEQUENCE:0')
  lines.push(`DTSTAMP:${formatICalDate(new Date().toISOString())}`)
  lines.push(`CREATED:${formatICalDate(new Date().toISOString())}`)
  lines.push(`LAST-MODIFIED:${formatICalDate(new Date().toISOString())}`)
  
  // End event
  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')
  
  return lines.join('\r\n')
}

/**
 * Example usage function
 */
export function generateExampleMIMEEmail(): string {
  const params: MIMEEmailParams = {
    fromEmail: 'DEDE_SYSTEM@dit.daikin.co.jp',
    toEmails: ['john.doe@dit.daikin.co.jp', 'jane.smith@dit.daikin.co.jp'],
    ccEmails: ['manager@dit.daikin.co.jp'],
    subject: 'Device DR Meeting - DC-K/I Altair comply WAF&RDS policies',
    eventTitle: 'Device DR Meeting - DC-K/I Altair comply WAF&RDS policies',
    eventDescription: `To: All concern member,

I would like to invite you to join Device DR meeting as below.

========================================
Date: 23/Sep/'25 (Tue)
========================================

1. DC-K/I Altair comply WAF&RDS policies
Device Group: IoT
Applicable Model: -
DR (Stage): DC-K/I
Time: 15:00-16:00
Place: R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting
Chairman: Mr. Nomura Yoshihide
Participant: R&D/DEDE, MKQ, DIT/IT and DIL/ITS

Thank you & Best regards

DEDE_SYSTEM
R&D DIVISION / DEVICE GROUP
Tel: 0-3846-9700 #7650`,
    eventLocation: 'R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting',
    eventDate: '2025-09-23',
    eventStartTime: '2025-09-23T15:00:00+07:00',
    eventEndTime: '2025-09-23T16:00:00+07:00',
    timezone: 'Asia/Bangkok',
    organizerName: 'DEDE_SYSTEM',
    organizerEmail: 'DEDE_SYSTEM@dit.daikin.co.jp',
    attendeeNames: {
      'john.doe@dit.daikin.co.jp': 'John Doe',
      'jane.smith@dit.daikin.co.jp': 'Jane Smith'
    },
    ccAttendeeNames: {
      'manager@dit.daikin.co.jp': 'Manager Name'
    },
    notes: 'Please prepare your presentation materials in advance.'
  }
  
  return generateMIMECalendarEmail(params)
}
