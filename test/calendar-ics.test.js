/**
 * Calendar ICS Format Tests
 * Phase 0: Safety setup with comprehensive test coverage
 */

const { 
  generateEventUID, 
  generateICalContent, 
  createCalendarEvent, 
  createCancelledCalendarEvent,
  generateCalendarInvite 
} = require('../lib/calendar.ts');

// Helper function to validate RFC5545 basic date-time format
function isBasicDateTime(str) {
  // RFC5545 basic format: YYYYMMDDTHHMMSSZ
  const basicDateTimeRegex = /^\d{8}T\d{6}Z$/;
  return basicDateTimeRegex.test(str);
}

// Helper function to build ICS lines with proper formatting
function buildICSLines(lines) {
  return lines.join('\r\n');
}

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

describe('Calendar ICS Format Tests - Phase 0', () => {
  let originalEvent;
  let cancelledEvent;
  let requestIcs;
  let cancelIcs;

  beforeEach(() => {
    // Create test event
    originalEvent = createCalendarEvent({
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

    cancelledEvent = createCancelledCalendarEvent(originalEvent);
    requestIcs = generateICalContent(originalEvent);
    cancelIcs = generateICalContent(cancelledEvent);
  });

  describe('UID Format Tests', () => {
    test('UID should contain exactly one @ character', () => {
      const uid = extractUID(requestIcs);
      const atCount = (uid.match(/@/g) || []).length;
      expect(atCount).toBe(1);
    });

    test('UID should match RFC format pattern', () => {
      const uid = extractUID(requestIcs);
      const uidPattern = /^[A-Za-z0-9-]+@[A-Za-z0-9.-]+$/;
      expect(uidPattern.test(uid)).toBe(true);
    });

    test('CANCEL should use same UID as REQUEST', () => {
      const requestUid = extractUID(requestIcs);
      const cancelUid = extractUID(cancelIcs);
      expect(requestUid).toBe(cancelUid);
    });
  });

  describe('Date/Time Format Tests', () => {
    test('DTSTAMP should use RFC5545 basic format', () => {
      const { dtstamp } = extractDateFields(requestIcs);
      expect(isBasicDateTime(dtstamp)).toBe(true);
    });

    test('DTSTART should use RFC5545 basic format', () => {
      const { dtstart } = extractDateFields(requestIcs);
      expect(isBasicDateTime(dtstart)).toBe(true);
    });

    test('DTEND should use RFC5545 basic format', () => {
      const { dtend } = extractDateFields(requestIcs);
      expect(isBasicDateTime(dtend)).toBe(true);
    });

    test('CANCEL should have identical DTSTART/DTEND as REQUEST', () => {
      const requestDates = extractDateFields(requestIcs);
      const cancelDates = extractDateFields(cancelIcs);
      
      expect(cancelDates.dtstart).toBe(requestDates.dtstart);
      expect(cancelDates.dtend).toBe(requestDates.dtend);
    });
  });

  describe('RECURRENCE-ID Tests', () => {
    test('REQUEST should not have RECURRENCE-ID for single events', () => {
      expect(hasRecurrenceId(requestIcs)).toBe(false);
    });

    test('CANCEL should not have RECURRENCE-ID for single events', () => {
      expect(hasRecurrenceId(cancelIcs)).toBe(false);
    });
  });

  describe('Line Ending Tests', () => {
    test('ICS content should use CRLF line endings', () => {
      expect(hasCRLFEndings(requestIcs)).toBe(true);
      expect(hasCRLFEndings(cancelIcs)).toBe(true);
    });
  });

  describe('Line Folding Tests', () => {
    test('ICS content should not have broken tokens in folded lines', () => {
      expect(hasBrokenTokens(requestIcs)).toBe(false);
      expect(hasBrokenTokens(cancelIcs)).toBe(false);
    });
  });

  describe('CANCEL Behavior Tests', () => {
    test('CANCEL should have incremented SEQUENCE', () => {
      const requestSequence = requestIcs.match(/^SEQUENCE:(\d+)$/m)?.[1];
      const cancelSequence = cancelIcs.match(/^SEQUENCE:(\d+)$/m)?.[1];
      
      expect(parseInt(cancelSequence)).toBe(parseInt(requestSequence) + 1);
    });

    test('CANCEL should have METHOD:CANCEL', () => {
      expect(cancelIcs.includes('METHOD:CANCEL')).toBe(true);
    });

    test('CANCEL should have STATUS:CANCELLED', () => {
      expect(cancelIcs.includes('STATUS:CANCELLED')).toBe(true);
    });

    test('REQUEST should have METHOD:REQUEST', () => {
      expect(requestIcs.includes('METHOD:REQUEST')).toBe(true);
    });
  });

  describe('Snapshot Tests', () => {
    test('REQUEST ICS snapshot', () => {
      expect(requestIcs).toMatchSnapshot();
    });

    test('CANCEL ICS snapshot', () => {
      expect(cancelIcs).toMatchSnapshot();
    });
  });
});

module.exports = {
  isBasicDateTime,
  buildICSLines,
  extractUID,
  extractDateFields,
  hasRecurrenceId,
  hasCRLFEndings,
  hasBrokenTokens
};
