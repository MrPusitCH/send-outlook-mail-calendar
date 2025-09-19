import Link from 'next/link'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Users, FileText, Settings, Calendar, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container px-4 py-16 mx-auto">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Internal Email Sender
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Send emails to internal recipients through our secure on-premises SMTP server.
            Built for DEDE_SYSTEM with modern technology stack.
          </p>
        </div>

        <div className="grid gap-6 mb-12 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Device DR Meeting</CardTitle>
              <CardDescription>
                Quick template for Device DR meeting invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/send?template=device-dr-meeting">
                <Button className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Start
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Pre-built templates for common communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/send">
                <Button variant="outline" className="w-full">
                  View Templates
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Settings className="w-12 h-12 mx-auto mb-4 text-orange-600" />
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

        <div className="p-8 bg-white rounded-lg shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-900">
            Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Email Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Send emails to internal recipients only</li>
                <li>• Add recipients individually or by groups</li>
                <li>• CC support with validation</li>
                <li>• HTML email support with preview</li>
                <li>• Draft saving and auto-recovery</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Security & Compliance</h3>
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

        <div className="mt-12 space-y-4 text-center">
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/send?template=device-dr-meeting">
              <Button size="lg" className="px-8 py-3 text-lg">
                Get Started - Create Device DR Meeting
              </Button>
            </Link>
            <Link href="/components-demo">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                View UI Components Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
