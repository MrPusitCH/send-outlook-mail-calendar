export interface EmailTemplate {
  id: string
  name: string
  category: string
  subject: string
  body: string
  isSystem: boolean
}

export const SYSTEM_TEMPLATES: EmailTemplate[] = [
  {
    id: 'device-dr-meeting',
    name: 'Device DR Meeting Invitation',
    category: 'meeting',
    subject: 'Device DR Meeting - {topic}',
    body: `To: All concern member,

I would like to invite you to join Device DR meeting as below.
************************************************
Date : {date}
************************************************
① . {topic}
Device Group : {deviceGroup}
Applicable Model : {applicableModel}
DR (Stage) : {drStage}  
Time : {time}
Place : {place}
Chairman : {chairman}
Participant : {participant}

Thank you & Best regards
--------------------------------------------------------
{organizerName}
{organizerDivision}
Tel : {organizerPhone}
--------------------------------------------------------`,
    isSystem: true
  },
  {
    id: 'general-meeting',
    name: 'General Meeting Invitation',
    category: 'meeting',
    subject: 'Meeting Invitation - {topic}',
    body: `Dear All,

I would like to invite you to join the following meeting:

Topic: {topic}
Date: {date}
Time: {time}
Location: {location}
Organizer: {organizer}

Please let me know if you have any questions.

Best regards,
{organizerName}`,
    isSystem: true
  },
  {
    id: 'announcement',
    name: 'General Announcement',
    category: 'announcement',
    subject: 'Announcement - {topic}',
    body: `Dear All,

{message}

Please let me know if you have any questions.

Best regards,
{organizerName}`,
    isSystem: true
  },
  {
    id: 'reminder',
    name: 'Meeting Reminder',
    category: 'reminder',
    subject: 'Reminder: {topic}',
    body: `Dear All,

This is a reminder about the upcoming meeting:

Topic: {topic}
Date: {date}
Time: {time}
Location: {location}

Please confirm your attendance.

Best regards,
{organizerName}`,
    isSystem: true
  }
]

export function getTemplateById(id: string): EmailTemplate | undefined {
  return SYSTEM_TEMPLATES.find(template => template.id === id)
}

export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return SYSTEM_TEMPLATES.filter(template => template.category === category)
}

export function getAllTemplates(): EmailTemplate[] {
  return SYSTEM_TEMPLATES
}

export function formatTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
  let subject = template.subject
  let body = template.body

  // Replace variables in subject and body
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    subject = subject.replace(new RegExp(placeholder, 'g'), value)
    body = body.replace(new RegExp(placeholder, 'g'), value)
  })

  return { subject, body }
}

export function getDeviceDRTemplateVariables(): Record<string, string> {
  return {
    topic: 'DC-K/I Altair comply WAF&RDS policies',
    date: '23/Sep/\'25 (Tue)',
    deviceGroup: 'IoT',
    applicableModel: '-',
    drStage: 'DC-K/I',
    time: '15:00-16:00',
    place: 'R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting',
    chairman: 'Mr. Nomura Yoshihide',
    participant: 'R&D/DEDE, MKQ, DIT/IT and DIL/ITS',
    organizerName: 'DEDE_SYSTEM',
    organizerDivision: 'R&D DIVISION / DEVICE GROUP',
    organizerPhone: '0-3846-9700 #7650'
  }
}
