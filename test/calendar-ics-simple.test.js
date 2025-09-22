/**
 * Simple Calendar ICS Format Tests
 * Phase 0: Safety setup with comprehensive test coverage
 */

const { 
  generateEventUID, 
  generateICalContent, 
  createCalendarEvent, 
  createCancelledCalendarEvent,
  generateCalendarInvite,
  isBasicDateTime,
  buildICSLines
} = require('../lib/calendar.ts');

// Helper function to extract UID from ICS content
function extractUID(icsContent) {
  const uidMatch = icsContent.match(/^UID:(.+)$/m);
  return uidMatch ? uidMatch[1] : null;
}

// Helper function to extract date fields from ICS content
function extractDateFields(icsContent) {
  const dtstampMatch = icsContent.match(/^DTSTAMP:(.+)$/m);
  const dtstartMatch = icsContent.match(/^DTSTART:(.+)$/m);
  const dtendMatch = icsContent.match(/^DTEND:(.+)$/m);
  
  return {
    dtstamp: dtstampMatch ? dtstampMatch[1] : null,
    dtstart: dtstartMatch ? dtstartMatch[1] : null,
    dtend: dtendMatch ? dtendMatch[1] : null
  };
}

// Helper function to check for RECURRENCE-ID
function hasRecurrenceId(icsContent) {
  return icsContent.includes('RECURRENCE-ID:');
}

// Helper function to check line endings
function hasCRLFEndings(icsContent) {
  return icsContent.includes('\r\n');
}

// Helper function to check for broken tokens in folded lines
function hasBrokenTokens(icsContent) {
  const brokenPatterns = [
    /mail to:/g,
    /Cancelle d/g,
    /;mailto:/g,
    /:mail to/g
  ];
  
  return brokenPatterns.some(pattern => pattern.test(icsContent));
}

// Simple test runner
function runTests() {
  console.log('🧪 Running Calendar ICS Format Tests - Phase 0\n');
  
  let passed = 0;
  let failed = 0;
  
  function test(name, fn) {
    try {
      const result = fn();
      if (result === true) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name} - Expected true, got ${result}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      failed++;
    }
  }
  
  // Create test event
  const originalEvent = createCalendarEvent({
    uid: 'test-meeting-12345@company.com',
    summary: 'Test Meeting for ICS Format Validation',
    description: 'This is a test meeting to validate ICS format compliance',
    location: 'Conference Room A, Building 1',
    start: new Date('2024-12-15T14:00:00.000Z'),
    end: new Date('2024-12-15T15:00:00.000Z'),
    organizerName: 'John Smith',
    organizerEmail: 'john.smith@company.com',
    attendeeEmails: ['jane.doe@company.com', 'bob.wilson@company.com'],
    attendeeNames: ['Jane Doe', 'Bob Wilson'],
    method: 'REQUEST',
    sequence: 0
  });

  const cancelledEvent = createCancelledCalendarEvent(originalEvent);
  const requestIcs = generateICalContent(originalEvent);
  const cancelIcs = generateICalContent(cancelledEvent);

  console.log('📋 UID Format Tests');
  test('UID should contain exactly one @ character', () => {
    const uid = extractUID(requestIcs);
    const atCount = (uid.match(/@/g) || []).length;
    return atCount === 1;
  });

  test('UID should match RFC format pattern', () => {
    const uid = extractUID(requestIcs);
    const uidPattern = /^[A-Za-z0-9-]+@[A-Za-z0-9.-]+$/;
    return uidPattern.test(uid);
  });

  test('CANCEL should use same UID as REQUEST', () => {
    const requestUid = extractUID(requestIcs);
    const cancelUid = extractUID(cancelIcs);
    return requestUid === cancelUid;
  });

  console.log('\n📅 Date/Time Format Tests');
  test('DTSTAMP should use RFC5545 basic format', () => {
    const { dtstamp } = extractDateFields(requestIcs);
    return isBasicDateTime(dtstamp);
  });

  test('DTSTART should use RFC5545 basic format', () => {
    const { dtstart } = extractDateFields(requestIcs);
    return isBasicDateTime(dtstart);
  });

  test('DTEND should use RFC5545 basic format', () => {
    const { dtend } = extractDateFields(requestIcs);
    return isBasicDateTime(dtend);
  });

  test('CANCEL should have identical DTSTART/DTEND as REQUEST', () => {
    const requestDates = extractDateFields(requestIcs);
    const cancelDates = extractDateFields(cancelIcs);
    
    return cancelDates.dtstart === requestDates.dtstart && 
           cancelDates.dtend === requestDates.dtend;
  });

  console.log('\n🔄 RECURRENCE-ID Tests');
  test('REQUEST should not have RECURRENCE-ID for single events', () => {
    return !hasRecurrenceId(requestIcs);
  });

  test('CANCEL should not have RECURRENCE-ID for single events', () => {
    return !hasRecurrenceId(cancelIcs);
  });

  console.log('\n📝 Line Ending Tests');
  test('ICS content should use CRLF line endings', () => {
    return hasCRLFEndings(requestIcs) && hasCRLFEndings(cancelIcs);
  });

  console.log('\n📄 Line Folding Tests');
  test('ICS content should not have broken tokens in folded lines', () => {
    return !hasBrokenTokens(requestIcs) && !hasBrokenTokens(cancelIcs);
  });

  console.log('\n❌ CANCEL Behavior Tests');
  test('CANCEL should have incremented SEQUENCE', () => {
    const requestSequence = requestIcs.match(/^SEQUENCE:(\d+)$/m)?.[1];
    const cancelSequence = cancelIcs.match(/^SEQUENCE:(\d+)$/m)?.[1];
    
    return parseInt(cancelSequence) === parseInt(requestSequence) + 1;
  });

  test('CANCEL should have METHOD:CANCEL', () => {
    return cancelIcs.includes('METHOD:CANCEL');
  });

  test('CANCEL should have STATUS:CANCELLED', () => {
    return cancelIcs.includes('STATUS:CANCELLED');
  });

  test('REQUEST should have METHOD:REQUEST', () => {
    return requestIcs.includes('METHOD:REQUEST');
  });

  console.log('\n📊 Test Results');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Phase 0 complete.');
  } else {
    console.log('\n⚠️  Some tests failed. Review before proceeding to Phase 1.');
  }

  return { passed, failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
