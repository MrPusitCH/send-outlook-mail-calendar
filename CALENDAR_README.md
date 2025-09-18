# Calendar Invite Functionality

This document describes the calendar invite functionality added to the email sending system.

## Features

### Core Calendar Support
- **iCalendar (.ics) file generation** following RFC 5545 specification
- **Email attachment support** with proper MIME types
- **Timezone handling** with support for common timezones
- **Multiple calendar methods**: REQUEST, CANCEL
- **Event status tracking**: CONFIRMED, TENTATIVE, CANCELLED

### Event Fields
- **UID**: Unique identifier for the event
- **DTSTART/DTEND**: Event start and end times
- **SUMMARY**: Event title
- **DESCRIPTION**: Event description
- **LOCATION**: Event location
- **ORGANIZER**: Event organizer with name and email
- **ATTENDEE**: Event attendees with roles and status
- **SEQUENCE**: For tracking updates
- **METHOD**: REQUEST for new events, CANCEL for cancellations

### Update and Cancellation Support
- **Event updates** with automatic SEQUENCE increment
- **Event cancellations** with METHOD:CANCEL
- **Visual indicators** for cancelled events in the UI

## Usage

### Frontend UI
1. **Add Calendar Invite**: Click "Add Calendar Invite" button
2. **Fill Event Details**: 
   - Event title (required)
   - Description (optional)
   - Location (optional)
   - Start/End times (required)
   - Timezone selection
   - Attendees (auto-populated from email recipients)
3. **Edit/Cancel**: Use Edit or Cancel buttons on existing events
4. **Send Email**: Calendar invite is automatically attached

### API Usage
```javascript
const emailData = {
  to: ['user@dit.daikin.co.jp'],
  subject: 'Meeting Invitation',
  body: 'Please join our meeting',
  calendarEvent: {
    summary: 'Team Meeting',
    description: 'Weekly team sync',
    location: 'Conference Room A',
    start: '2024-01-15T10:00:00',
    end: '2024-01-15T11:00:00',
    timezone: 'Asia/Bangkok',
    organizer: {
      name: 'DEDE_SYSTEM',
      email: 'DEDE_SYSTEM@dit.daikin.co.jp'
    },
    attendees: [
      {
        email: 'user@dit.daikin.co.jp',
        role: 'REQ-PARTICIPANT',
        status: 'NEEDS-ACTION'
      }
    ],
    method: 'REQUEST',
    status: 'CONFIRMED',
    sequence: 0
  }
}
```

## Technical Implementation

### Files Modified
- `lib/calendar.ts` - Calendar utilities and iCal generation
- `lib/validators.ts` - Added calendar event validation schemas
- `lib/email.ts` - Enhanced email service with calendar support
- `app/(dashboard)/send/page.tsx` - Added calendar UI components

### Key Functions
- `generateICalContent()` - Creates RFC 5545 compliant iCal content
- `createCalendarEvent()` - Creates calendar event objects
- `createUpdatedCalendarEvent()` - Handles event updates
- `createCancelledCalendarEvent()` - Handles event cancellations
- `generateCalendarInvite()` - Creates email attachment

### Timezone Support
Supported timezones include:
- UTC
- Asia/Bangkok
- Asia/Tokyo
- America/New_York
- America/Los_Angeles
- Europe/London
- Europe/Paris
- Australia/Sydney

## Email Client Compatibility

The generated calendar invites are compatible with:
- **Microsoft Outlook** (desktop and web)
- **Google Calendar** (Gmail)
- **Apple Calendar** (Mail app)
- **Thunderbird** with Lightning extension
- **Other RFC 5545 compliant clients**

## Testing

Run the test file to verify calendar functionality:
```bash
node test-calendar.js
```

This will generate a sample calendar invite and display the iCal content.

## Security Notes

- All email addresses are validated against the allowed domain
- Calendar events are only sent to internal recipients
- UIDs are generated with timestamps and random strings for uniqueness
- No external calendar services are used - everything is self-contained
