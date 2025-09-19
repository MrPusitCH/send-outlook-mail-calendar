/**
 * Test script to validate calendar invite structure meets requirements
 */

const { createCalendarEvent, generateICalContent } = require('./lib/calendar.ts')

function testCalendarInviteStructure() {
  console.log('='.repeat(60))
  console.log('TESTING CALENDAR INVITE STRUCTURE')
  console.log('='.repeat(60))

  // Create a test calendar event
  const testEvent = createCalendarEvent({
    summary: 'Device DR Meeting - Test',
    description: 'Test meeting invitation with proper RFC 5545 structure',
    location: 'R&D Meeting Room 4&5',
    start: new Date('2025-09-23T15:00:00.000Z'),
    end: new Date('2025-09-23T16:00:00.000Z'),
    organizerName: 'DEDE_SYSTEM',
    organizerEmail: 'DEDE_SYSTEM@dit.daikin.co.jp',
    attendeeEmails: ['john.doe@dit.daikin.co.jp', 'jane.smith@dit.daikin.co.jp'],
    attendeeNames: ['John Doe', 'Jane Smith'],
    ccAttendeeEmails: ['manager@dit.daikin.co.jp'],
    ccAttendeeNames: ['Manager Name'],
    method: 'REQUEST',
    status: 'CONFIRMED'
  })

  console.log('✓ Test event created:', {
    uid: testEvent.uid,
    method: testEvent.method,
    status: testEvent.status,
    sequence: testEvent.sequence
  })

  // Generate ICS content
  const icsContent = generateICalContent(testEvent)

  console.log('\n' + '='.repeat(60))
  console.log('VALIDATING RFC 5545 REQUIREMENTS')
  console.log('='.repeat(60))

  // Check required fields
  const requirements = [
    { name: 'BEGIN:VCALENDAR', check: icsContent.includes('BEGIN:VCALENDAR') },
    { name: 'END:VCALENDAR', check: icsContent.includes('END:VCALENDAR') },
    { name: 'VERSION:2.0', check: icsContent.includes('VERSION:2.0') },
    { name: 'PRODID', check: icsContent.includes('PRODID:') },
    { name: 'METHOD:REQUEST', check: icsContent.includes('METHOD:REQUEST') },
    { name: 'BEGIN:VEVENT', check: icsContent.includes('BEGIN:VEVENT') },
    { name: 'END:VEVENT', check: icsContent.includes('END:VEVENT') },
    { name: 'UID', check: icsContent.includes('UID:') },
    { name: 'SEQUENCE', check: icsContent.includes('SEQUENCE:') },
    { name: 'DTSTAMP', check: icsContent.includes('DTSTAMP:') },
    { name: 'DTSTART', check: icsContent.includes('DTSTART:') },
    { name: 'DTEND', check: icsContent.includes('DTEND:') },
    { name: 'SUMMARY', check: icsContent.includes('SUMMARY:') },
    { name: 'ORGANIZER', check: icsContent.includes('ORGANIZER:') },
    { name: 'ATTENDEE', check: icsContent.includes('ATTENDEE:') },
    { name: 'STATUS', check: icsContent.includes('STATUS:') },
    { name: 'RSVP=TRUE', check: icsContent.includes('RSVP=TRUE') },
    { name: 'CRLF line endings', check: icsContent.includes('\r\n') }
  ]

  let allPassed = true
  requirements.forEach(req => {
    const status = req.check ? '✓ PASS' : '✗ FAIL'
    console.log(`${status} ${req.name}`)
    if (!req.check) allPassed = false
  })

  console.log('\n' + '='.repeat(60))
  console.log('GENERATED ICS CONTENT')
  console.log('='.repeat(60))
  console.log(icsContent)

  console.log('\n' + '='.repeat(60))
  console.log(`OVERALL RESULT: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`)
  console.log('='.repeat(60))

  // Test cancellation
  console.log('\nTesting cancellation structure...')
  const cancelEvent = {
    ...testEvent,
    method: 'CANCEL',
    status: 'CANCELLED',
    sequence: 1
  }

  const cancelIcs = generateICalContent(cancelEvent)
  const cancelChecks = [
    { name: 'METHOD:CANCEL', check: cancelIcs.includes('METHOD:CANCEL') },
    { name: 'STATUS:CANCELLED', check: cancelIcs.includes('STATUS:CANCELLED') },
    { name: 'SEQUENCE:1', check: cancelIcs.includes('SEQUENCE:1') },
    { name: '(Cancelled) in SUMMARY', check: cancelIcs.includes('(Cancelled)') }
  ]

  let cancelPassed = true
  cancelChecks.forEach(req => {
    const status = req.check ? '✓ PASS' : '✗ FAIL'
    console.log(`${status} ${req.name}`)
    if (!req.check) cancelPassed = false
  })

  console.log(`\nCancellation test: ${cancelPassed ? '✓ PASSED' : '✗ FAILED'}`)

  return { inviteTest: allPassed, cancelTest: cancelPassed }
}

// Run the test
if (require.main === module) {
  testCalendarInviteStructure()
}

module.exports = { testCalendarInviteStructure }