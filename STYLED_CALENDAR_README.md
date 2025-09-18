# Styled Calendar Invitation MIME Email Generator

This module generates complete SMTP-ready emails with **styled HTML body** and calendar invitations that display properly in Outlook and Google Calendar with attendee pills and calendar previews.

## Features

- **Styled HTML Body**: Beautiful email-safe card design with inline CSS
- **Standards-Compliant iCalendar**: Proper VCALENDAR structure with METHOD=REQUEST
- **Attendee Roles**: Required participants (To) and Optional participants (Cc) with proper RSVP settings
- **Organizer Display**: Shows "DEDE_SYSTEM" as the organizer
- **Concise Calendar Summary**: ≤60 character SUMMARY for calendar blocks
- **Timezone Support**: Converts local times to UTC for iCalendar compatibility

## Usage

### Basic Example

```typescript
import { generateStyledCalendarInvitationEmail, StyledCalendarInvitationParams } from './lib/styled-calendar-invitation-generator';

const params: StyledCalendarInvitationParams = {
  fromEmail: 'DEDE_SYSTEM@dit.daikin.co.jp',
  toEmails: ['john.doe@dit.daikin.co.jp', 'jane.smith@dit.daikin.co.jp'],
  ccEmails: ['manager@dit.daikin.co.jp'],
  subject: 'Device DR Meeting - DC-K/I Altair comply WAF&RDS policies',
  attendeeNames: {
    'john.doe@dit.daikin.co.jp': 'John Doe',
    'jane.smith@dit.daikin.co.jp': 'Jane Smith'
  },
  ccAttendeeNames: {
    'manager@dit.daikin.co.jp': 'Manager Name'
  },
  dtStart: '20250923T080000Z', // UTC time
  dtEnd: '20250923T090000Z'    // UTC time
};

const mimeEmail = generateStyledCalendarInvitationEmail(params);
// Send via SMTP...
```

### Timezone Conversion

```typescript
// Convert local time to UTC format for iCalendar
const formatICalTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Convert Asia/Bangkok 15:00-16:00 to UTC 08:00-09:00
const localTime = '2025-09-23T15:00:00';
const utcTime = formatICalTime(localTime);
// Result: '20250923T080000Z'
```

## Email Structure

### Headers
- `From: {{FROM_EMAIL}}`
- `To: {{TO_EMAILS}}` (required participants)
- `Cc: {{CC_EMAILS}}` (optional participants)
- `Subject: {{SUBJECT}}`

### MIME Parts

#### Part A: Styled HTML Body
Beautiful email-safe card design with:
- **Centered card** (max-width ~720px) with border, shadow, padding
- **Inline CSS** (email-safe), no external assets
- **Icons and separators** for visual appeal
- **Responsive design** that works across email clients

#### Part B: iCalendar
Standards-compliant iCalendar with:
- `METHOD:REQUEST`
- `ORGANIZER;CN=DEDE_SYSTEM:mailto:{{FROM_EMAIL}}`
- Required attendees: `ROLE=REQ-PARTICIPANT;RSVP=TRUE`
- Optional attendees: `ROLE=OPT-PARTICIPANT;RSVP=FALSE`
- **Concise SUMMARY**: ≤60 characters for calendar blocks

## Expected Results

### Inbox View
- Shows normal To/Cc headers
- Displays **styled HTML card** with professional design
- **Visual hierarchy** with icons, colors, and typography

### Calendar View
- Shows calendar block with **concise summary text**
- Displays "Required" and "Optional" attendee pills with names
- Shows "DEDE_SYSTEM" as organizer
- Enables RSVP responses for required attendees

## HTML Design Features

- **Card Layout**: Centered, bordered card with subtle shadow
- **Color Scheme**: Professional grays and blues
- **Typography**: Segoe UI font stack for cross-platform compatibility
- **Icons**: Unicode emojis for visual appeal (📄, 🧩, 📦, 🛠️, ⏰, 📍, 👤, 👥)
- **Responsive**: Works on desktop and mobile email clients
- **Email-Safe**: Inline CSS only, no external dependencies

## Files

- `lib/styled-calendar-invitation-generator.ts` - Main generator module
- `styled-calendar-invitation-example.txt` - Complete example output
- `STYLED_CALENDAR_README.md` - This documentation

## Comparison with Basic Generator

| Feature | Basic Generator | Styled Generator |
|---------|----------------|------------------|
| HTML Body | Simple `<p>` tags | Styled card design |
| Visual Design | Plain text | Icons, colors, typography |
| Email Client | Basic support | Enhanced display |
| Calendar Summary | Full subject | Concise (≤60 chars) |
| Professional Look | ❌ | ✅ |

## Testing

You can test the generator by importing it in your application:

```typescript
import { generateStyledCalendarInvitationEmail, generateExampleStyledCalendarInvitation } from './lib/styled-calendar-invitation-generator';

// Generate example
const exampleEmail = generateExampleStyledCalendarInvitation();
console.log(exampleEmail);

// Or use with your own parameters
const mimeEmail = generateStyledCalendarInvitationEmail(params);
```
