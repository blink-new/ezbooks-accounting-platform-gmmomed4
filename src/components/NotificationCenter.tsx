import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import blink from '@/blink/client'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'achievement' | 'reminder'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  const loadNotifications = async (userId: string) => {
    try {
      const notifs = await blink.db.notifications.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 20
      })
      
      const formattedNotifications = notifs.map(notif => ({
        id: notif.id,
        type: notif.type as 'success' | 'warning' | 'info' | 'achievement' | 'reminder',
        title: notif.title,
        message: notif.message,
        timestamp: new Date(notif.created_at),
        read: Number(notif.read) > 0,
        actionUrl: notif.action_url,
        actionText: notif.action_text
      }))
      
      setNotifications(formattedNotifications)
      setUnreadCount(formattedNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const generateDailyReport = async (userId: string, userName: string) => {
    try {
      // Check if we already sent today's report (more robust check)
      const today = new Date().toISOString().split('T')[0]
      
      // Check database directly for today's reports
      const existingReports = await blink.db.notifications.list({
        where: { 
          userId,
          title: '🌅 Buck AI Daily Report'
        },
        orderBy: { createdAt: 'desc' },
        limit: 5
      })
      
      // Check if any report was created today
      const todayReport = existingReports.find(report => {
        const reportDate = new Date(report.created_at).toISOString().split('T')[0]
        return reportDate === today
      })
      
      if (todayReport) {
        return // Already sent today's report
      }
      
      // Clean up old duplicate reports (keep only the most recent one)
      if (existingReports.length > 1) {
        for (let i = 1; i < existingReports.length; i++) {
          await blink.db.notifications.delete(existingReports[i].id)
        }
      }

      // Get today's sales data
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const todayTransactions = await blink.db.transactions.list({
        where: { 
          userId,
          type: 'income',
          createdAt: { gte: todayStart.toISOString(), lte: todayEnd.toISOString() }
        }
      })

      const todaySales = todayTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
      const salesCount = todayTransactions.length

      // Get this week's data for comparison
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      
      const weekTransactions = await blink.db.transactions.list({
        where: { 
          userId,
          type: 'income',
          createdAt: { gte: weekStart.toISOString() }
        }
      })

      const weekSales = weekTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

      // Create personalized daily report message
      let reportMessage = `Good morning ${userName}! Here is your daily report:\n\n`
      
      if (todaySales > 0) {
        reportMessage += `💰 Today's Sales: ${todaySales.toFixed(2)} from ${salesCount} transaction${salesCount !== 1 ? 's' : ''}\n`
      } else {
        reportMessage += `📊 No sales recorded today yet - great opportunity to focus on customer outreach!\n`
      }
      
      if (weekSales > 0) {
        reportMessage += `📈 This Week: ${weekSales.toFixed(2)} total revenue\n`
      }
      
      reportMessage += `\nHave a productive day! I'm here if you need any financial insights. 🚀`

      // Create the daily report notification
      await blink.db.notifications.create({
        id: `daily_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'info',
        title: '🌅 Buck AI Daily Report',
        message: reportMessage,
        actionUrl: '/dashboard',
        actionText: 'View Dashboard',
        read: 0,
        createdAt: new Date().toISOString()
      })

      // Reload notifications after generating the daily report
      setTimeout(() => loadNotifications(userId), 1000)
    } catch (error) {
      console.error('Error generating daily report:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadNotifications(state.user.id)
        // Daily reports temporarily disabled due to duplicate issues
        // const userName = state.user.displayName || state.user.email?.split('@')[0] || 'there'
        // generateDailyReport(state.user.id, userName)
      }
    })
    return unsubscribe
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      await blink.db.notifications.update(notificationId, { read: 1 })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read)
      for (const notif of unreadNotifications) {
        await blink.db.notifications.update(notif.id, { read: 1 })
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await blink.db.notifications.delete(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const deletedNotif = notifications.find(n => n.id === notificationId)
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'achievement':
        return <Zap className="h-4 w-4 text-purple-600" />
      case 'reminder':
        return <Calendar className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'achievement':
        return 'bg-purple-50 border-purple-200'
      case 'reminder':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (!isOpen) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Stay updated with your business insights
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary">
                {unreadCount} unread
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-0 min-h-0">
          <ScrollArea className="h-full px-6 pb-6">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll notify you about important business insights
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div 
                      className={`p-3 rounded-lg border transition-all ${
                        notification.read 
                          ? 'bg-background border-border' 
                          : getNotificationColor(notification.type)
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm leading-tight">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleDateString()} at{' '}
                              {notification.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              {notification.actionUrl && notification.actionText && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    window.location.href = notification.actionUrl!
                                    markAsRead(notification.id)
                                  }}
                                >
                                  {notification.actionText}
                                </Button>
                              )}
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < notifications.length - 1 && (
                      <Separator className="my-3" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}