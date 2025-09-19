/**
 * Calendar invite utilities for generating .ics files
 * Supports RFC 5545 iCalendar specification
 */

export interface CalendarEvent {
  uid?: string
  summary?: string
  description?: string
  location?: string
  start?: string // ISO string format
  end?: string // ISO string format
  timezone?: string
  organizer?: {
    name?: string
    email?: string
  }
  attendees?: Array<{
    name?: string
    email?: string
    role?: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT' | 'NON-PARTICIPANT'
    status?: 'NEEDS-ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE'
  }>
  sequence?: number
  method?: 'REQUEST' | 'CANCEL'
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'
}

/**
 * Generate a unique UID for calendar events
 */
export function generateEventUID(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${random}@${process.env.FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp'}`
}

/**
 * Format date for iCalendar (UTC or with timezone)
 */
function formatICalDate(dateString: string, timezone?: string): string {
  const date = new Date(dateString)
  
  if (timezone) {
    // Use timezone identifier
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`
  } else {
    // Use UTC
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
}

/**
 * Escape text for iCalendar format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/**
 * Format attendee for iCalendar
 */
function formatAttendee(attendee: CalendarEvent['attendees'][0]): string {
  const parts: string[] = []

  if (attendee.name) {
    parts.push(`CN="${escapeICalText(attendee.name)}"`)
  }

  if (attendee.role) {
    parts.push(`ROLE=${attendee.role}`)
  }

  if (attendee.status) {
    parts.push(`PARTSTAT=${attendee.status}`)
  }

  // CC attendees (OPT-PARTICIPANT) should have RSVP=FALSE
  const rsvp = attendee.role === 'OPT-PARTICIPANT' ? 'FALSE' : 'TRUE'
  parts.push(`RSVP=${rsvp}`)
  parts.push(`mailto:${attendee.email}`)

  return `ATTENDEE;${parts.join(';')}`
}

/**
 * Apply line folding for lines > 75 octets (RFC5545)
 */
function foldLine(line: string): string {
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

/**
 * Generate iCalendar content for an event
 */
export function generateICalContent(event: CalendarEvent): string {
  const lines: string[] = []

  // Header
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//DEDE_SYSTEM//Email Calendar//EN')
  lines.push('CALSCALE:GREGORIAN')
  lines.push('METHOD:' + (event.method || 'REQUEST'))

  // Event
  lines.push('BEGIN:VEVENT')

  if (event.uid) {
    lines.push(`UID:${event.uid}`)
  }

  if (event.summary) {
    lines.push(foldLine(`SUMMARY:${escapeICalText(event.summary)}`))
  }

  if (event.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.description)}`))
  }

  if (event.location) {
    lines.push(foldLine(`LOCATION:${escapeICalText(event.location)}`))
  }

  // Date/time - MUST be consistent between original and cancellation
  if (event.start && event.end) {
    if (event.timezone) {
      lines.push(`DTSTART;TZID=${event.timezone}:${formatICalDate(event.start, event.timezone)}`)
      lines.push(`DTEND;TZID=${event.timezone}:${formatICalDate(event.end, event.timezone)}`)
    } else {
      lines.push(`DTSTART:${formatICalDate(event.start)}`)
      lines.push(`DTEND:${formatICalDate(event.end)}`)
    }
  }

  // Organizer - MUST match original event organizer for cancellations to work
  if (event.organizer?.name && event.organizer?.email) {
    lines.push(foldLine(`ORGANIZER;CN="${escapeICalText(event.organizer.name)}":mailto:${event.organizer.email}`))
  }

  // Attendees
  if (event.attendees) {
    event.attendees.forEach(attendee => {
      if (attendee.email) {
        lines.push(foldLine(formatAttendee(attendee)))
      }
    })
  }

  // Status and sequence - Critical for cancellations
  if (event.status) {
    lines.push(`STATUS:${event.status}`)
  }

  // SEQUENCE must be incremented for cancellations (original: 0, cancel: 1)
  if (event.sequence !== undefined) {
    lines.push(`SEQUENCE:${event.sequence}`)
  }

  // Timestamps
  const now = new Date().toISOString()
  lines.push(`DTSTAMP:${formatICalDate(now)}`)
  lines.push(`CREATED:${formatICalDate(now)}`)
  lines.push(`LAST-MODIFIED:${formatICalDate(now)}`)

  // End event
  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Generate calendar invite for email attachment
 */
export function generateCalendarInvite(event: CalendarEvent): {
  filename: string
  content: string
  contentType: string
} {
  const icalContent = generateICalContent(event)

  return {
    filename: `${(event.summary || 'event').replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
    content: icalContent,
    contentType: `text/calendar; method=${event.method || 'REQUEST'}; charset=UTF-8`
  }
}

/**
 * Create a calendar event from basic parameters
 */
export function createCalendarEvent(params: {
  uid?: string
  summary?: string
  description?: string
  location?: string
  start?: string | Date
  end?: string | Date
  timezone?: string
  organizerName?: string
  organizerEmail?: string
  attendeeEmails?: string[]
  attendeeNames?: string[]
  ccAttendeeEmails?: string[]
  ccAttendeeNames?: string[]
  method?: 'REQUEST' | 'CANCEL'
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'
  sequence?: number
}): CalendarEvent {
  const toAttendees = params.attendeeEmails?.map((email, index) => ({
    name: params.attendeeNames?.[index],
    email,
    role: 'REQ-PARTICIPANT' as const,
    status: 'NEEDS-ACTION' as const
  })) || []

  const ccAttendees = params.ccAttendeeEmails?.map((email, index) => ({
    name: params.ccAttendeeNames?.[index],
    email,
    role: 'OPT-PARTICIPANT' as const,
    status: 'NEEDS-ACTION' as const
  })) || []

  const attendees = [...toAttendees, ...ccAttendees]
  
  return {
    uid: params.uid || generateEventUID(),
    summary: params.summary,
    description: params.description,
    location: params.location,
    start: params.start instanceof Date ? params.start.toISOString() : params.start,
    end: params.end instanceof Date ? params.end.toISOString() : params.end,
    timezone: params.timezone,
    organizer: params.organizerName && params.organizerEmail ? {
      name: params.organizerName,
      email: params.organizerEmail
    } : undefined,
    attendees: attendees.length > 0 ? attendees : undefined,
    method: params.method || 'REQUEST',
    status: params.status || 'CONFIRMED',
    sequence: params.sequence || 0
  }
}

/**
 * Create an updated calendar event (for updates)
 */
export function createUpdatedCalendarEvent(
  originalEvent: CalendarEvent,
  updates: Partial<Omit<CalendarEvent, 'uid' | 'sequence' | 'method'>>
): CalendarEvent {
  return {
    ...originalEvent,
    ...updates,
    sequence: (originalEvent.sequence || 0) + 1,
    method: 'REQUEST'
  }
}

/**
 * Create a cancelled calendar event
 */
export function createCancelledCalendarEvent(originalEvent: CalendarEvent): CalendarEvent {
  return {
    ...originalEvent,
    method: 'CANCEL',
    status: 'CANCELLED',
    sequence: (originalEvent.sequence || 0) + 1
  }
}

/**
 * Common timezone identifiers
 */
export const COMMON_TIMEZONES = {
  'UTC': 'UTC',
  'Asia/Bangkok': 'Asia/Bangkok',
  'Asia/Tokyo': 'Asia/Tokyo',
  'America/New_York': 'America/New_York',
  'America/Los_Angeles': 'America/Los_Angeles',
  'Europe/London': 'Europe/London',
  'Europe/Paris': 'Europe/Paris',
  'Australia/Sydney': 'Australia/Sydney'
} as const

export type TimezoneKey = keyof typeof COMMON_TIMEZONES
