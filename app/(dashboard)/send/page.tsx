'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Send, Users, Mail, FileText, Save, Copy, TestTube, Plus, X, Search, Calendar, Clock, MapPin, User, Zap } from 'lucide-react'
import { SendEmailInput, CalendarEvent, CalendarAttendee } from '../../../lib/validators'
import { COMMON_TIMEZONES, createUpdatedCalendarEvent, createCancelledCalendarEvent } from '../../../lib/calendar'
import { SYSTEM_TEMPLATES, getTemplateById, formatTemplate, getDeviceDRTemplateVariables } from '../../../lib/templates'

interface Employee {
  id: string
  email: string
  name: string
  divDeptSect?: string
}

interface Group {
  id: string
  groupName: string
  divDeptSect?: string
  members: Array<{
    employee: Employee
  }>
}

interface Template {
  id: string
  name: string
  category: string
  subject: string
  body: string
  isSystem: boolean
}

export default function SendEmailPage() {
  const [formData, setFormData] = useState<SendEmailInput>({
    to: [],
    cc: [],
    subject: '',
    body: '',
    isHtml: true,
    calendarEvent: undefined,
  })
  const [showCC, setShowCC] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [ccInput, setCcInput] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [showCalendarDialog, setShowCalendarDialog] = useState(false)
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent | null>(null)

  // Load data on component mount
  useEffect(() => {
    loadEmployees()
    loadGroups()
    loadTemplates()
    loadDraft()
    loadTemplateFromURL()
  }, [])

  // Load template from URL parameter
  const loadTemplateFromURL = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const templateId = urlParams.get('template')
      
      if (templateId) {
        const template = getTemplateById(templateId)
        if (template) {
          if (templateId === 'device-dr-meeting') {
            const variables = getDeviceDRTemplateVariables()
            const { subject, body } = formatTemplate(template, variables)
            setFormData(prev => ({
              ...prev,
              subject,
              body
            }))
          } else {
            setFormData(prev => ({
              ...prev,
              subject: template.subject,
              body: template.body
            }))
          }
        }
      }
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      if (data.success) {
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()
      if (data.success) {
        setGroups(data.groups)
      }
    } catch (error) {
      console.error('Failed to load groups:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      // Use system templates for now
      setTemplates(SYSTEM_TEMPLATES)
      
      // Also try to load from API if available
      const response = await fetch('/api/templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(prev => [...prev, ...data.templates])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      // Fallback to system templates
      setTemplates(SYSTEM_TEMPLATES)
    }
  }

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem('emailDraft')
      if (draft) {
        const parsedDraft = JSON.parse(draft)
        setFormData(parsedDraft)
        setShowCC(parsedDraft.cc && parsedDraft.cc.length > 0)
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  const saveDraft = () => {
    try {
      localStorage.setItem('emailDraft', JSON.stringify(formData))
      setStatus({ type: 'success', message: 'Draft saved successfully' })
      setTimeout(() => setStatus({ type: null, message: '' }), 3000)
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save draft' })
    }
  }

  const addEmail = (email: string, type: 'to' | 'cc' = 'to') => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes('@')) return

    const allowedDomain = '@dit.daikin.co.jp'
    if (!trimmedEmail.endsWith(allowedDomain)) {
      setStatus({ type: 'error', message: `Email must be from ${allowedDomain}` })
      return
    }

    const currentList = formData[type] || []
    if (!currentList.includes(trimmedEmail)) {
      setFormData(prev => ({
        ...prev,
        [type]: [...currentList, trimmedEmail]
      }))
    }

    if (type === 'to') setEmailInput('')
    if (type === 'cc') setCcInput('')
  }

  const removeEmail = (email: string, type: 'to' | 'cc' = 'to') => {
    setFormData(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter(e => e !== email)
    }))
  }

  const addGroupMembers = (group: Group) => {
    const memberEmails = group.members.map(m => m.employee.email)
    const allEmails = [...formData.to, ...memberEmails]
    const uniqueEmails = Array.from(new Set(allEmails))
    setFormData(prev => ({ ...prev, to: uniqueEmails }))
    setShowGroupDialog(false)
  }

  const applyTemplate = (template: Template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.body
    }))
    setShowTemplateDialog(false)
  }

  const copyAllEmails = () => {
    const allEmails = [...formData.to, ...(formData.cc || [])]
    navigator.clipboard.writeText(allEmails.join(', '))
    setStatus({ type: 'success', message: 'All emails copied to clipboard' })
    setTimeout(() => setStatus({ type: null, message: '' }), 3000)
  }

  const generateDeviceDRMeetingHTML = (calendarEvent: CalendarEvent) => {
    const meetingDate = new Date(calendarEvent.start).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(/(\d+)\/(\w+)\/(\d+)/, '$1/$2/\'$3')
    const meetingDay = new Date(calendarEvent.start).toLocaleDateString('en-US', {
      weekday: 'short'
    })
    const meetingTime = `${new Date(calendarEvent.start).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}–${new Date(calendarEvent.end).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Device DR Meeting Invitation</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #F5F8FC; line-height: 1.6;">
    <div style="max-width: 720px; margin: 0 auto; background: white; border-radius: 14px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00A0E9 0%, #0078C7 100%); padding: 30px 25px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600; line-height: 1.3;">
                Device DR Meeting – DC-K/I Altair comply WAF&RDS policies
            </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 25px;">
            
            <!-- Greeting Block -->
            <div style="margin-bottom: 25px;">
                <p style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px;">
                    <strong>To:</strong> All concern member,
                </p>
                <p style="margin: 0; color: #0f172a; font-size: 16px;">
                    I would like to invite you to join Device DR meeting as below.
                </p>
            </div>

            <!-- Date Bar -->
            <div style="margin-bottom: 25px; text-align: center;">
                <span style="background: #00A0E9; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 16px; display: inline-block;">
                    📅 ${meetingDate} (${meetingDay})
                </span>
            </div>

            <!-- Agenda Line -->
            <div style="margin-bottom: 25px; padding: 15px; background: #F8FAFC; border-left: 4px solid #00A0E9; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 500;">
                    📋 ① . DC-K/I Altair comply WAF&RDS policies.
                </p>
            </div>

            <!-- Meeting Details -->
            <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 20px 0; color: #0f172a; font-size: 18px; font-weight: 600; border-bottom: 2px solid #00A0E9; padding-bottom: 8px;">
                    📝 Meeting Details
                </h3>
                
                <div style="background: #FAFBFC; border-radius: 8px; padding: 20px; border: 1px solid #E5E7EB;">
                    <div style="display: table; width: 100%;">
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 8px 0; width: 140px; font-weight: 600; color: #0f172a; vertical-align: top;">
                                🏷️ Device Group:
                            </div>
                            <div style="display: table-cell; padding: 8px 0; color: #374151;">
                                IoT
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 8px 0; width: 140px; font-weight: 600; color: #0f172a; vertical-align: top;">
                                📱 Applicable Model:
                            </div>
                            <div style="display: table-cell; padding: 8px 0; color: #374151;">
                                –
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 8px 0; width: 140px; font-weight: 600; color: #0f172a; vertical-align: top;">
                                🎯 DR (Stage):
                            </div>
                            <div style="display: table-cell; padding: 8px 0; color: #374151;">
                                DC-K/I
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 8px 0; width: 140px; font-weight: 600; color: #0f172a; vertical-align: top;">
                                ⏰ Time:
                            </div>
                            <div style="display: table-cell; padding: 8px 0; color: #374151;">
                                ${meetingTime}
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 8px 0; width: 140px; font-weight: 600; color: #0f172a; vertical-align: top;">
                                📍 Place:
                            </div>
                            <div style="display: table-cell; padding: 8px 0; color: #374151;">
                                R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting.
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 8px 0; width: 140px; font-weight: 600; color: #0f172a; vertical-align: top;">
                                👨‍💼 Chairman:
                            </div>
                            <div style="display: table-cell; padding: 8px 0; color: #374151;">
                                Mr. Nomura Yoshihide
                            </div>
                        </div>
                        <div style="display: table-row;">
                            <div style="display: table-cell; padding: 8px 0; width: 140px; font-weight: 600; color: #0f172a; vertical-align: top;">
                                👥 Participant:
                            </div>
                            <div style="display: table-cell; padding: 8px 0; color: #374151;">
                                R&D/DEDE, MKQ, DIT/IT and DIL/ITS
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Signature -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
                <p style="margin: 0 0 15px 0; color: #0f172a; font-size: 16px;">
                    Thank you & Best regards
                </p>
                <div style="color: #0f172a;">
                    <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">
                        DEDE_SYSTEM
                    </p>
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #374151;">
                        R&D DIVISION / DEVICE GROUP
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #374151;">
                        Tel : 0-3846-9700 #7650
                    </p>
                </div>
            </div>

        </div>

        <!-- Footer -->
        <div style="background: #F8FAFC; padding: 15px 25px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #6B7280; font-size: 12px;">
                This is an automated meeting invitation from Daikin R&D Division
            </p>
        </div>

    </div>
</body>
</html>`
  }

  const sendEmail = async () => {
    if (formData.to.length === 0) {
      setStatus({ type: 'error', message: 'At least one recipient is required' })
      return
    }
    if (!formData.subject.trim()) {
      setStatus({ type: 'error', message: 'Subject is required' })
      return
    }
    if (!formData.body.trim()) {
      setStatus({ type: 'error', message: 'Body is required' })
      return
    }

    setSending(true)
    try {
      // Use the beautiful HTML template for Device DR meetings
      let emailBody = formData.body
      if (formData.calendarEvent && formData.calendarEvent.summary.includes('Device DR Meeting')) {
        emailBody = generateDeviceDRMeetingHTML(formData.calendarEvent)
      } else if (formData.calendarEvent) {
        // Fallback for other calendar events
        const timeTable = `
<br><br>
<div style="margin-top: 16px; padding: 12px; background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px;">
  <div style="font-size: 14px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">📅 Calendar Event</div>
  <div style="background-color: white; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1;">
        <div style="font-size: 14px; font-weight: 500; color: #111827;">
          ${formData.calendarEvent.summary || 'Untitled Event'}
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          DEDE_SYSTEM
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: #6b7280;">
          ${new Date(formData.calendarEvent.start).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })} - ${new Date(formData.calendarEvent.end).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
        <div style="font-size: 12px; color: #9ca3af;">
          ${new Date(formData.calendarEvent.start).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  </div>
</div>`
        emailBody += timeTable
      }

      const emailData = {
        ...formData,
        body: emailBody
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })

      const result = await response.json()
      
      if (result.success) {
        setStatus({ type: 'success', message: 'Email sent successfully!' })
        // Clear form
        setFormData({ to: [], cc: [], subject: '', body: '', isHtml: true })
        setShowCC(false)
        localStorage.removeItem('emailDraft')
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to send email' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error occurred' })
    } finally {
      setSending(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      setStatus({ type: 'error', message: 'Test email address is required' })
      return
    }

    setSending(true)
    try {
      // Use the beautiful HTML template for Device DR meetings
      let emailBody = formData.body
      if (formData.calendarEvent && formData.calendarEvent.summary.includes('Device DR Meeting')) {
        emailBody = generateDeviceDRMeetingHTML(formData.calendarEvent)
      } else if (formData.calendarEvent) {
        // Fallback for other calendar events
        const timeTable = `
<br><br>
<div style="margin-top: 16px; padding: 12px; background-color: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px;">
  <div style="font-size: 14px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">📅 Calendar Event</div>
  <div style="background-color: white; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div style="flex: 1;">
        <div style="font-size: 14px; font-weight: 500; color: #111827;">
          ${formData.calendarEvent.summary || 'Untitled Event'}
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          DEDE_SYSTEM
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: #6b7280;">
          ${new Date(formData.calendarEvent.start).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })} - ${new Date(formData.calendarEvent.end).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
        <div style="font-size: 12px; color: #9ca3af;">
          ${new Date(formData.calendarEvent.start).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>
    </div>
  </div>
</div>`
        emailBody += timeTable
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          to: [testEmail],
          subject: `[TEST] ${formData.subject}`,
          body: emailBody
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setStatus({ type: 'success', message: 'Test email sent successfully!' })
        setShowTestDialog(false)
        setTestEmail('')
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to send test email' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error occurred' })
    } finally {
      setSending(false)
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calendar event functions
  const initializeCalendarEvent = () => {
    // Set default time to 15:00-16:00 (3:00 PM - 4:00 PM) as per template
    const today = new Date()
    const startTime = new Date(today)
    startTime.setHours(15, 0, 0, 0) // 3:00 PM
    
    const endTime = new Date(today)
    endTime.setHours(16, 0, 0, 0) // 4:00 PM
    
    setCalendarEvent({
      summary: 'Device DR Meeting - DC-K/I Altair comply WAF&RDS policies',
      description: `To: All concern member,

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
      location: 'R&D/ Meeting Room 4&5 (Floor 4) or Microsoft Team meeting',
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      timezone: 'Asia/Bangkok',
      organizer: {
        name: 'DEDE_SYSTEM',
        email: 'DEDE_SYSTEM@dit.daikin.co.jp'
      },
      attendees: [
        // Only include TO recipients as required participants
        ...formData.to.map(email => ({
          email,
          role: 'REQ-PARTICIPANT' as const,
          status: 'NEEDS-ACTION' as const
        }))
        // CC recipients will be handled separately in the email headers
      ],
      method: 'REQUEST' as const,
      status: 'CONFIRMED' as const,
      sequence: 0
    })
  }

  const addCalendarEvent = () => {
    if (!calendarEvent) return
    
    setFormData(prev => ({
      ...prev,
      calendarEvent
    }))
    setShowCalendarDialog(false)
  }

  const removeCalendarEvent = () => {
    setFormData(prev => ({
      ...prev,
      calendarEvent: undefined
    }))
  }

  const updateCalendarEvent = (field: keyof CalendarEvent, value: any) => {
    setCalendarEvent(prev => prev ? { ...prev, [field]: value } : null)
  }

  const addCalendarAttendee = (email: string) => {
    if (!calendarEvent || !email.trim()) return
    
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail.includes('@')) return

    const allowedDomain = '@dit.daikin.co.jp'
    if (!trimmedEmail.endsWith(allowedDomain)) {
      setStatus({ type: 'error', message: `Email must be from ${allowedDomain}` })
      return
    }

    const exists = calendarEvent.attendees.some(a => a.email === trimmedEmail)
    if (!exists) {
      updateCalendarEvent('attendees', [
        ...calendarEvent.attendees,
        {
          email: trimmedEmail,
          role: 'REQ-PARTICIPANT' as const,
          status: 'NEEDS-ACTION' as const
        }
      ])
    }
  }

  const removeCalendarAttendee = (email: string) => {
    if (!calendarEvent) return
    
    updateCalendarEvent('attendees', 
      calendarEvent.attendees.filter(a => a.email !== email)
    )
  }

  const updateExistingCalendarEvent = () => {
    if (!formData.calendarEvent || !calendarEvent) return
    
    const updatedEvent = createUpdatedCalendarEvent(formData.calendarEvent, calendarEvent)
    setFormData(prev => ({
      ...prev,
      calendarEvent: updatedEvent
    }))
    setShowCalendarDialog(false)
  }

  const cancelCalendarEvent = () => {
    if (!formData.calendarEvent) return
    
    const cancelledEvent = createCancelledCalendarEvent(formData.calendarEvent)
    setFormData(prev => ({
      ...prev,
      calendarEvent: cancelledEvent
    }))
    setStatus({ type: 'success', message: 'Calendar event marked for cancellation' })
  }

  return (
    <div className="container max-w-4xl p-6 mx-auto">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">Internal Email Sender</h1>
        <p className="text-muted-foreground">Send emails to internal recipients only</p>
      </div>

      {status.type && (
        <div className={`mb-4 p-4 rounded-md ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {status.message}
        </div>
      )}

      <div className="grid gap-6">
        {/* Sender Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Sender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              From: <span className="font-medium">DEDE_SYSTEM &lt;DEDE_SYSTEM@dit.daikin.co.jp&gt;</span>
            </div>
          </CardContent>
        </Card>

        {/* Recipients Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recipients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Participants */}
            <div>
              <label className="block mb-2 text-sm font-medium">Required</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1 text-sm">
                  {formData.to.map((email, index) => (
                    <span key={email} className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span className="text-gray-700">{email}</span>
                      {index < formData.to.length - 1 && <span className="text-gray-400">;</span>}
                      <button
                        onClick={() => removeEmail(email, 'to')}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.to.length === 0 && (
                    <span className="italic text-gray-500">No participants added yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail(emailInput, 'to')}
                  />
                  <Button onClick={() => addEmail(emailInput, 'to')} size="sm">
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* CC Recipients */}
            {showCC && (
              <div>
                <label className="block mb-2 text-sm font-medium">CC</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(formData.cc || []).map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button
                        onClick={() => removeEmail(email, 'cc')}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter CC email address"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail(ccInput, 'cc')}
                  />
                  <Button onClick={() => addEmail(ccInput, 'cc')} size="sm">
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Recipient Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCC(!showCC)}
              >
                {showCC ? 'Hide CC' : 'Add CC'}
              </Button>
              
              <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-1" />
                    Add Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Group Members</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search groups..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="space-y-2 overflow-y-auto max-h-60">
                      {filteredGroups.map((group) => (
                        <div
                          key={group.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                          onClick={() => addGroupMembers(group)}
                        >
                          <div className="font-medium">{group.groupName}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.members.length} members
                            {group.divDeptSect && ` • ${group.divDeptSect}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={copyAllEmails}>
                <Copy className="w-4 h-4 mr-1" />
                Copy All
              </Button>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Required participants: {formData.to.length} • Total recipients: {formData.to.length + (formData.cc?.length || 0)}
              </div>
              {formData.to.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <div className="flex items-center justify-center w-4 h-4 bg-blue-100 rounded-full">
                    <span className="text-xs text-blue-600">i</span>
                  </div>
                  <span>Please respond</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Templates Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Device DR Meeting Quick Template */}
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Device DR Meeting Template</h3>
                    <p className="text-sm text-blue-700">Pre-filled template for Device DR meetings</p>
                  </div>
                  <Button 
                    onClick={() => {
                      const template = getTemplateById('device-dr-meeting')
                      if (template) {
                        const variables = getDeviceDRTemplateVariables()
                        const { subject, body } = formatTemplate(template, variables)
                        setFormData(prev => ({
                          ...prev,
                          subject,
                          body
                        }))
                      }
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-1" />
                      All Templates
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Select Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="space-y-2 overflow-y-auto max-h-60">
                        {filteredTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                            onClick={() => applyTemplate(template)}
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.subject}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {template.category} {template.isSystem && '• System'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Manage Templates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Event Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendar Invite
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formData.calendarEvent ? (
              <div className="space-y-4">
                {/* Calendar Event Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${formData.calendarEvent.method === 'CANCEL' ? 'text-red-600' : 'text-blue-600'}`} />
                    <span className="font-medium">{formData.calendarEvent.summary || 'Untitled Event'}</span>
                    {formData.calendarEvent.method === 'CANCEL' && (
                      <Badge variant="destructive" className="text-xs">CANCELLED</Badge>
                    )}
                    {formData.calendarEvent.sequence && formData.calendarEvent.sequence > 0 && (
                      <Badge variant="outline" className="text-xs">Update #{formData.calendarEvent.sequence}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {formData.calendarEvent.method !== 'CANCEL' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setCalendarEvent(formData.calendarEvent)
                            setShowCalendarDialog(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={cancelCalendarEvent}
                        >
                          Cancel Event
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={removeCalendarEvent}>
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Calendar Event Details */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        {new Date(formData.calendarEvent.start).toLocaleString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })} - {new Date(formData.calendarEvent.end).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    
                    {formData.calendarEvent.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">{formData.calendarEvent.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-600">
                        Didn't respond {formData.calendarEvent.attendees.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email Preview Section */}
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="space-y-3">
                    {/* Sender Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 text-sm font-medium text-white bg-blue-600 rounded-full">
                        DS
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">DEDE_SYSTEM</div>
                        <div className="text-sm text-gray-500">DEDE_SYSTEM@dit.daikin.co.jp</div>
                      </div>
                    </div>

                    {/* Recipients */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">To:</span>
                        <div className="flex flex-wrap gap-1">
                          {formData.to.map((email, index) => (
                            <span key={email} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                              {email}
                              <button
                                onClick={() => removeEmail(email, 'to')}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {formData.cc && formData.cc.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Cc:</span>
                          <div className="flex flex-wrap gap-1">
                            {formData.cc.map((email, index) => (
                              <span key={email} className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded">
                                <span className="text-green-600">✓</span>
                                {email}
                                <button
                                  onClick={() => removeEmail(email, 'cc')}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Email Content Preview */}
                    <div className="p-3 mt-4 border-l-4 border-blue-500 rounded bg-gray-50">
                      <div className="text-sm text-gray-700">
                        <div className="mb-2 font-medium">{formData.subject || 'No subject'}</div>
                        <div className="text-gray-600 whitespace-pre-wrap">
                          {formData.body || 'No content'}
                        </div>
                      </div>
                    </div>

                    {/* Calendar Time Table */}
                    {formData.calendarEvent && (
                      <div className="p-3 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="mb-2 text-sm font-medium text-blue-900">Calendar Event</div>
                        <div className="p-3 bg-white border border-gray-300 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {formData.calendarEvent.summary || 'Untitled Event'}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                DEDE_SYSTEM
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">
                                {new Date(formData.calendarEvent.start).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })} - {new Date(formData.calendarEvent.end).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(formData.calendarEvent.start).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={initializeCalendarEvent}>
                      <Calendar className="w-4 h-4 mr-1" />
                      Add Calendar Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Calendar Invite</DialogTitle>
                    </DialogHeader>
                    {calendarEvent && (
                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium">Event Title *</label>
                          <Input
                            placeholder="Enter event title"
                            value={calendarEvent.summary}
                            onChange={(e) => updateCalendarEvent('summary', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">Description</label>
                          <Textarea
                            placeholder="Enter event description"
                            value={calendarEvent.description || ''}
                            onChange={(e) => updateCalendarEvent('description', e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">Location</label>
                          <Input
                            placeholder="Enter event location"
                            value={calendarEvent.location || ''}
                            onChange={(e) => updateCalendarEvent('location', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">Date *</label>
                          <Input
                            type="date"
                            value={calendarEvent.start ? new Date(calendarEvent.start).toISOString().slice(0, 10) : ''}
                            onChange={(e) => {
                              const selectedDate = new Date(e.target.value)
                              const startTime = new Date(calendarEvent.start)
                              const endTime = new Date(calendarEvent.end)
                              
                              // Keep the same time, just change the date
                              startTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
                              endTime.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
                              
                              updateCalendarEvent('start', startTime.toISOString())
                              updateCalendarEvent('end', endTime.toISOString())
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium">Start Time *</label>
                            <Input
                              type="time"
                              value={calendarEvent.start ? new Date(calendarEvent.start).toTimeString().slice(0, 5) : ''}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':')
                                const startDate = new Date(calendarEvent.start)
                                startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                                updateCalendarEvent('start', startDate.toISOString())
                              }}
                            />
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium">End Time *</label>
                            <Input
                              type="time"
                              value={calendarEvent.end ? new Date(calendarEvent.end).toTimeString().slice(0, 5) : ''}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':')
                                const endDate = new Date(calendarEvent.end)
                                endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                                updateCalendarEvent('end', endDate.toISOString())
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">Timezone</label>
                          <Select
                            value={calendarEvent.timezone || 'Asia/Bangkok'}
                            onValueChange={(value) => updateCalendarEvent('timezone', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(COMMON_TIMEZONES).map(([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {key} ({value})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">Attendees</label>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {calendarEvent.attendees.map((attendee) => (
                                <Badge key={attendee.email} variant="secondary" className="flex items-center gap-1">
                                  {attendee.email}
                                  <button
                                    onClick={() => removeCalendarAttendee(attendee.email)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add attendee email"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    addCalendarAttendee((e.target as HTMLInputElement).value)
                                    ;(e.target as HTMLInputElement).value = ''
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement
                                  if (input) {
                                    addCalendarAttendee(input.value)
                                    input.value = ''
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowCalendarDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={formData.calendarEvent ? updateExistingCalendarEvent : addCalendarEvent} 
                            disabled={!calendarEvent.summary.trim()}
                          >
                            {formData.calendarEvent ? 'Update Calendar Invite' : 'Add Calendar Invite'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Section */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Subject</label>
              <Input
                placeholder="Enter email subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Body</label>
                <Tabs value={previewMode ? 'preview' : 'edit'} onValueChange={(value) => setPreviewMode(value === 'preview')}>
                  <TabsList>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {previewMode ? (
                <div className="min-h-[200px] p-3 border rounded-md bg-muted/50">
                  <div dangerouslySetInnerHTML={{ __html: formData.body }} />
                  {/* Calendar Time Table in Email Preview */}
                  {formData.calendarEvent && (
                    <div className="p-3 mt-4 border border-blue-200 rounded bg-blue-50">
                      <div className="mb-2 text-sm font-medium text-blue-900">📅 Calendar Event</div>
                      <div className="p-2 bg-white border border-gray-300 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {formData.calendarEvent.summary || 'Untitled Event'}
                            </div>
                            <div className="text-xs text-gray-600">
                              DEDE_SYSTEM
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-600">
                              {new Date(formData.calendarEvent.start).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })} - {new Date(formData.calendarEvent.end).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(formData.calendarEvent.start).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  placeholder="Enter email body (HTML supported)"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  className="min-h-[200px]"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button onClick={sendEmail} disabled={sending || formData.to.length === 0}>
                <Send className="w-4 h-4 mr-1" />
                {sending ? 'Sending...' : 'Send Email'}
              </Button>

              <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={sending}>
                    <TestTube className="w-4 h-4 mr-1" />
                    Send Test
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Test Email</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter test email address"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTestDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={sendTestEmail} disabled={sending}>
                        {sending ? 'Sending...' : 'Send Test'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={saveDraft}>
                <Save className="w-4 h-4 mr-1" />
                Save Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
