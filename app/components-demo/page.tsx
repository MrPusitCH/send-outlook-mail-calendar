'use client'

import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Mail, Users, FileText, Settings, Send, Plus, Search } from 'lucide-react'
import { useState } from 'react'

export default function ComponentsDemoPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState('')

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">shadcn/ui Components Demo</h1>
        <p className="text-xl text-muted-foreground">
          Showcase of all shadcn/ui components used in the Internal Email Sender App
        </p>
      </div>

      <div className="grid gap-8">
        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Buttons
            </CardTitle>
            <CardDescription>
              Various button styles and sizes available in the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled>Disabled</Button>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                With Icon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Elements
            </CardTitle>
            <CardDescription>
              Input fields and form components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Input Field</label>
                <Input placeholder="Enter text here..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Dropdown</label>
                <Select value={selectedValue} onValueChange={setSelectedValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Textarea</label>
              <Textarea placeholder="Enter your message here..." className="min-h-[100px]" />
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Badges
            </CardTitle>
            <CardDescription>
              Status indicators and tags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
              <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cards
            </CardTitle>
            <CardDescription>
              Content containers and layouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This is the card content area where you can place any content.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Another Card</CardTitle>
                  <CardDescription>With different content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge>Feature</Badge>
                    <p className="text-sm">More content here...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Dialog
            </CardTitle>
            <CardDescription>
              Modal dialogs and popups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>This is a dialog content area. You can place any content here.</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsOpen(false)}>
                      Confirm
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>
              Tabbed interface components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                <TabsTrigger value="tab3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tab 1 Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>This is the content for the first tab.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tab2" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tab 2 Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>This is the content for the second tab.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tab3" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tab 3 Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>This is the content for the third tab.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Color Palette Section */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>
              Available color variables and themes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Primary</h4>
                <div className="h-12 bg-primary rounded-md"></div>
                <div className="h-8 bg-primary/20 rounded-md"></div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Secondary</h4>
                <div className="h-12 bg-secondary rounded-md"></div>
                <div className="h-8 bg-secondary/20 rounded-md"></div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Muted</h4>
                <div className="h-12 bg-muted rounded-md"></div>
                <div className="h-8 bg-muted/20 rounded-md"></div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Accent</h4>
                <div className="h-12 bg-accent rounded-md"></div>
                <div className="h-8 bg-accent/20 rounded-md"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button asChild>
          <a href="/send">Go to Email Sender</a>
        </Button>
      </div>
    </div>
  )
}

