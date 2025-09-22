/**
 * Test script to validate the fixed .ics generation
 * Tests RFC5545 basic format dates and safe line folding
 */

import { createCalendarEvent, generateICalContent, createCancelledCalendarEvent } from './lib/calendar';

// Create a test REQUEST event
const requestEvent = createCalendarEvent({
  uid: '1737567600000-test123456@dit.daikin.co.jp',
  summary: 'Device DR Meeting - DC-K/I Altair comply WAF&RDS policies implementation',
  description: 'To: All concern member,\n\nI would like to invite you to join Device DR meeting as below.\n\n************************************************\nDate : 23/Sep/\'25 (Tue)\n************************************************\n① . DC-K/I  Altair comply WAF&RDS policies.\nDevice Group : IoT\nApplicable Model : -\nDR (Stage) : DC-K/I\nTime : 15:00-16:00\nPlace : R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting.\nChairman : Mr. Nomura Yoshihide\nParticipant : R&D/DEDE, MKQ, DIT/IT and DIL/ITS\n\nThank you & Best regards\n--------------------------------------------------------\nThawatchai Thienariyawong\nR&D DIVISION / DEVICE GROUP\nTel : 0-3846-9700 #7650\n--------------------------------------------------------',
  location: 'R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting',
  start: '2025-09-23T08:00:00.000Z', // 15:00 Bangkok = 08:00 UTC
  end: '2025-09-23T09:00:00.000Z',   // 16:00 Bangkok = 09:00 UTC
  organizerName: 'Thawatchai Thienariyawong',
  organizerEmail: 'DEDE_SYSTEM@dit.daikin.co.jp',
  attendeeEmails: ['john.doe@dit.daikin.co.jp', 'jane.smith@dit.daikin.co.jp'],
  attendeeNames: ['John Doe', 'Jane Smith'],
  ccAttendeeEmails: ['manager@dit.daikin.co.jp'],
  ccAttendeeNames: ['Manager Name'],
  method: 'REQUEST',
  sequence: 0
});

console.log('=== FIXED REQUEST.ics ===');
const requestICS = generateICalContent(requestEvent);
console.log(requestICS);

console.log('\n=== VALIDATION CHECKS ===');
console.log('1. Date format check:');
console.log('   - Contains basic format (no dashes/colons):', !requestICS.includes('2025-09-23T'));
console.log('   - Contains Z suffix for UTC:', requestICS.includes('Z'));
console.log('   - No milliseconds:', !requestICS.includes('.000Z'));

console.log('\n2. CRLF check:');
console.log('   - Uses CRLF line endings:', requestICS.includes('\r\n'));
console.log('   - Does not use LF only:', !requestICS.includes('\n') || requestICS.includes('\r\n'));

console.log('\n3. Line folding check:');
const lines = requestICS.split('\r\n');
const longLines = lines.filter(line => line.length > 75);
console.log('   - Has lines longer than 75 chars:', longLines.length > 0);
if (longLines.length > 0) {
  console.log('   - Long lines (should be folded):', longLines);
}

// Test CANCEL event
console.log('\n=== FIXED CANCEL.ics ===');
const cancelEvent = createCancelledCalendarEvent(requestEvent);
const cancelICS = generateICalContent(cancelEvent);
console.log(cancelICS);

console.log('\n=== CANCEL VALIDATION ===');
console.log('1. Same UID:', cancelEvent.uid === requestEvent.uid);
console.log('2. Same start time:', cancelEvent.start === requestEvent.start);
console.log('3. Same end time:', cancelEvent.end === requestEvent.end);
console.log('4. Same organizer:', cancelEvent.organizer?.email === requestEvent.organizer?.email);
console.log('5. Incremented sequence:', cancelEvent.sequence === (requestEvent.sequence || 0) + 1);
console.log('6. Method is CANCEL:', cancelEvent.method === 'CANCEL');
console.log('7. Status is CANCELLED:', cancelEvent.status === 'CANCELLED');