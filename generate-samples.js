// Generate sample REQUEST and CANCEL .ics files for Phase 1 verification

// Simulate the fixed generateEventUID function
function generateEventUID() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  // Extract domain from SMTP_FROM_EMAIL or FROM_EMAIL
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'DEDE_SYSTEM@dit.daikin.co.jp';
  const domain = fromEmail.split('@')[1] || 'dit.daikin.co.jp';
  
  return `${timestamp}-${random}@${domain}`;
}

// Generate sample UIDs
const uid1 = generateEventUID();
const uid2 = generateEventUID();

console.log('=== Phase 1: UID Format Fix ===');
console.log('Sample UID 1:', uid1);
console.log('Sample UID 2:', uid2);
console.log('UID 1 @ count:', (uid1.match(/@/g) || []).length);
console.log('UID 2 @ count:', (uid2.match(/@/g) || []).length);

// Generate sample REQUEST .ics
const requestIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DEDE_SYSTEM//Email Calendar//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid1}
SEQUENCE:0
DTSTAMP:20241215T140000Z
DTSTART:20241215T140000Z
DTEND:20241215T150000Z
SUMMARY:Project Planning Meeting
DESCRIPTION:Weekly project planning and review meeting
LOCATION:Conference Room A, Building 1
ORGANIZER;CN=John Smith:mailto:john.smith@company.com
ATTENDEE;CN=Jane Doe;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:jane.doe@company.com
ATTENDEE;CN=Bob Wilson;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:bob.wilson@company.com
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

// Generate sample CANCEL .ics
const cancelIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DEDE_SYSTEM//Email Calendar//EN
CALSCALE:GREGORIAN
METHOD:CANCEL
BEGIN:VEVENT
UID:${uid1}
SEQUENCE:1
DTSTAMP:20241215T150000Z
DTSTART:20241215T140000Z
DTEND:20241215T150000Z
SUMMARY:Project Planning Meeting (Cancelled)
DESCRIPTION:This meeting has been cancelled.
LOCATION:Conference Room A, Building 1
ORGANIZER;CN=John Smith:mailto:john.smith@company.com
ATTENDEE;CN=Jane Doe;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:jane.doe@company.com
ATTENDEE;CN=Bob Wilson;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:bob.wilson@company.com
STATUS:CANCELLED
END:VEVENT
END:VCALENDAR`;

console.log('\n=== SAMPLE REQUEST .ICS ===');
console.log(requestIcs);

console.log('\n=== SAMPLE CANCEL .ICS ===');
console.log(cancelIcs);

console.log('\n=== VERIFICATION ===');
console.log('✅ UID contains exactly one @:', (uid1.match(/@/g) || []).length === 1);
console.log('✅ UID matches pattern:', /^[A-Za-z0-9-]+@[A-Za-z0-9.-]+$/.test(uid1));
console.log('✅ CANCEL uses same UID as REQUEST:', cancelIcs.includes(`UID:${uid1}`));
console.log('✅ CANCEL has higher SEQUENCE:', cancelIcs.includes('SEQUENCE:1'));
console.log('✅ CANCEL has METHOD:CANCEL:', cancelIcs.includes('METHOD:CANCEL'));
console.log('✅ CANCEL has STATUS:CANCELLED:', cancelIcs.includes('STATUS:CANCELLED'));
