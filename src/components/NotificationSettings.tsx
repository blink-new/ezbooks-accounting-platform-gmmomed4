import React, { useState, useEffect, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Bell, Mail, Clock, BarChart3, DollarSign, AlertTriangle, TrendingUp, Building } from 'lucide-react'
import { NotificationScheduler, NotificationSettings as NotificationSettingsType } from '@/lib/notificationScheduler'
import { useToast } from '@/hooks/use-toast'

const reportTypeIcons = {
  financial_summary: BarChart3,
  cash_flow: DollarSign,
  overdue_invoices: AlertTriangle,
  expense_alerts: TrendingUp,
  revenue_updates: TrendingUp,
  vendor_payments: Building
}

const reportTypeLabels = {
  financial_summary: 'Financial Summary',
  cash_flow: 'Cash Flow Report',
  overdue_invoices: 'Overdue Invoices Alert',
  expense_alerts: 'Expense Alerts',
  revenue_updates: 'Revenue Updates',
  vendor_payments: 'Vendor Payments Report'
}

const frequencyLabels = {
  hourly: 'Every Hour',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annually'
}

const NotificationSettings: React.FC = () => {
  const [schedules, setSchedules] = useState<NotificationSettingsType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()

  // Form state for new notification
  const [newNotification, setNewNotification] = useState({
    reportType: 'financial_summary' as NotificationSettingsType['reportType'],
    frequency: 'daily' as NotificationSettingsType['frequency'],
    enabled: true,
    emailAddress: '',
    customSettings: {
      includeCharts: true,
      includeDetails: true,
      currency: 'USD'
    }
  })

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const userSchedules = await NotificationScheduler.getUserSchedules()
      setSchedules(userSchedules)
    } catch (error) {
      console.error('Error loading notification schedules:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  const handleCreateSchedule = async () => {
    try {
      if (!newNotification.emailAddress) {
        toast({
          title: 'Error',
          description: 'Email address is required',
          variant: 'destructive'
        })
        return
      }

      await NotificationScheduler.createSchedule({
        reportType: newNotification.reportType,
        frequency: newNotification.frequency,
        enabled: newNotification.enabled,
        emailAddress: newNotification.emailAddress,
        customSettings: newNotification.customSettings
      })

      toast({
        title: 'Success',
        description: 'Notification schedule created successfully',
      })

      setShowAddForm(false)
      setNewNotification({
        reportType: 'financial_summary',
        frequency: 'daily',
        enabled: true,
        emailAddress: '',
        customSettings: {
          includeCharts: true,
          includeDetails: true,
          currency: 'USD'
        }
      })
      
      await loadSchedules()
    } catch (error) {
      console.error('Error creating notification schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to create notification schedule',
        variant: 'destructive'
      })
    }
  }

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      await NotificationScheduler.updateSchedule(scheduleId, { enabled })
      
      setSchedules(schedules.map(schedule => 
        schedule.id === scheduleId ? { ...schedule, enabled } : schedule
      ))

      toast({
        title: 'Success',
        description: `Notification ${enabled ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      console.error('Error updating notification schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to update notification schedule',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await NotificationScheduler.deleteSchedule(scheduleId)
      
      setSchedules(schedules.filter(schedule => schedule.id !== scheduleId))

      toast({
        title: 'Success',
        description: 'Notification schedule deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting notification schedule:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete notification schedule',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Automated Report Notifications
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Set up automated email reports to stay informed about your business finances
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Notification
        </Button>
      </div>

      {/* Add New Notification Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Notification Schedule</CardTitle>
            <CardDescription>
              Configure automated email reports for your business insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={newNotification.reportType}
                  onValueChange={(value) => setNewNotification({ ...newNotification, reportType: value as NotificationSettingsType['reportType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(reportTypeLabels).map(([key, label]) => {
                      const Icon = reportTypeIcons[key as keyof typeof reportTypeIcons]
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newNotification.frequency}
                  onValueChange={(value) => setNewNotification({ ...newNotification, frequency: value as NotificationSettingsType['frequency'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input
                id="emailAddress"
                type="email"
                placeholder="your@email.com"
                value={newNotification.emailAddress}
                onChange={(e) => setNewNotification({ ...newNotification, emailAddress: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={newNotification.customSettings.currency}
                  onValueChange={(value) => setNewNotification({ 
                    ...newNotification, 
                    customSettings: { ...newNotification.customSettings, currency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeCharts"
                  checked={newNotification.customSettings.includeCharts}
                  onCheckedChange={(checked) => setNewNotification({ 
                    ...newNotification, 
                    customSettings: { ...newNotification.customSettings, includeCharts: checked }
                  })}
                />
                <Label htmlFor="includeCharts">Include Charts</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeDetails"
                  checked={newNotification.customSettings.includeDetails}
                  onCheckedChange={(checked) => setNewNotification({ 
                    ...newNotification, 
                    customSettings: { ...newNotification.customSettings, includeDetails: checked }
                  })}
                />
                <Label htmlFor="includeDetails">Include Details</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule}>
                Create Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Notification Schedules */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notification schedules</h3>
              <p className="text-gray-500 mb-4">Create your first automated report notification to stay informed about your business</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Notification
              </Button>
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule) => {
            const Icon = reportTypeIcons[schedule.reportType]
            return (
              <Card key={schedule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        schedule.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {reportTypeLabels[schedule.reportType]}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {frequencyLabels[schedule.frequency]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {schedule.emailAddress}
                          </span>
                          {schedule.lastSent && (
                            <span className="text-xs text-gray-500">
                              Last sent: {new Date(schedule.lastSent).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => handleToggleSchedule(schedule.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default NotificationSettings