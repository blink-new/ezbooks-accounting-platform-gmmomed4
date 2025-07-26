import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { User, Bell, CreditCard, Shield, LogOut } from 'lucide-react'
import blink from '@/blink/client'
import AutomatedReports from '@/components/AutomatedReports'

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    weeklyReports: false
  })
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        setProfileData({
          displayName: state.user.displayName || '',
          email: state.user.email || ''
        })
      }
    })
    return unsubscribe
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await blink.auth.updateMe({
        displayName: profileData.displayName
      })
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
    // In a real app, you'd save this to the backend
    toast({
      title: 'Settings Updated',
      description: 'Notification preferences saved'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update your email.
                </p>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Automated Report Notifications */}
        <Card>
          <CardContent className="p-6">
            <AutomatedReports />
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan: Free</p>
                <p className="text-sm text-muted-foreground">
                  Unlimited transactions • Basic reporting • Email support
                </p>
              </div>
              <Button variant="outline">Upgrade Plan</Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Usage This Month</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transactions</p>
                  <p className="font-medium">Unlimited</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Invoices</p>
                  <p className="font-medium">Unlimited</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customers</p>
                  <p className="font-medium">Unlimited</p>
                </div>
                <div>
                  <p className="text-muted-foreground">AI Tasks</p>
                  <p className="font-medium">0 / 10</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Account Security</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Your account is secured with Blink's authentication system. 
                  Password management is handled automatically.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Data Export</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your data at any time. All transactions, invoices, and customer data can be downloaded as CSV files.
                </p>
                <Button variant="outline">
                  Export All Data
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
                        alert('Account deletion requested. Please contact support at Helioixayan1210@gmail.com to complete the process.')
                      }
                    }}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Buck AI</CardTitle>
            <CardDescription>Application information and support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">January 2025</p>
              </div>
              <div>
                <p className="text-muted-foreground">Support</p>
                <p className="font-medium">Helioixayan1210@gmail.com</p>
              </div>
              <div>
                <p className="text-muted-foreground">Documentation</p>
                <p className="font-medium">
                  <a href="#" className="text-primary hover:underline">
                    View Help Center
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}