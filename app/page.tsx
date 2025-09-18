import Link from 'next/link'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Mail, Users, FileText, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Internal Email Sender
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Send emails to internal recipients through our secure on-premises SMTP server.
            Built for DEDE_SYSTEM with modern technology stack.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Mail className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Send Emails</CardTitle>
              <CardDescription>
                Compose and send emails to internal recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/send">
                <Button className="w-full">
                  Start Sending
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Manage Recipients</CardTitle>
              <CardDescription>
                Add recipients by individual email or department groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Create and manage email templates for common communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Settings className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure email settings and system preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Send emails to internal recipients only</li>
                <li>• Add recipients individually or by groups</li>
                <li>• CC support with validation</li>
                <li>• HTML email support with preview</li>
                <li>• Draft saving and auto-recovery</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Security & Compliance</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Domain validation for recipients</li>
                <li>• On-premises SMTP server integration</li>
                <li>• Email logging and audit trail</li>
                <li>• Rate limiting to prevent spam</li>
                <li>• Secure authentication support</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/send">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started - Send Your First Email
              </Button>
            </Link>
            <Link href="/components-demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                View UI Components Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
