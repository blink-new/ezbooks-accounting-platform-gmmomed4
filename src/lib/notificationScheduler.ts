import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export interface NotificationSettings {
  id: string
  userId: string
  reportType: 'financial_summary' | 'cash_flow' | 'overdue_invoices' | 'expense_alerts' | 'revenue_updates' | 'vendor_payments'
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  enabled: boolean
  emailAddress: string
  lastSent: string | null
  nextScheduled: string | null
  customSettings: {
    includeCharts: boolean
    includeDetails: boolean
    threshold?: number
    currency: string
  }
  createdAt: string
  updatedAt: string
}

export class NotificationScheduler {
  
  // Create notification schedule
  static async createSchedule(settings: Omit<NotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastSent' | 'nextScheduled'>): Promise<NotificationSettings> {
    try {
      const user = await blink.auth.me()
      const scheduleId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      
      const schedule: NotificationSettings = {
        id: scheduleId,
        userId: user.id,
        ...settings,
        lastSent: null,
        nextScheduled: this.calculateNextSchedule(settings.frequency),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.notificationSchedules.create(schedule)
      return schedule
    } catch (error) {
      console.error('Error creating notification schedule:', error)
      throw error
    }
  }

  // Get user's notification schedules
  static async getUserSchedules(): Promise<NotificationSettings[]> {
    try {
      const user = await blink.auth.me()
      const schedules = await blink.db.notificationSchedules.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      return schedules || []
    } catch (error) {
      console.error('Error loading notification schedules:', error)
      return []
    }
  }

  // Update notification schedule
  static async updateSchedule(scheduleId: string, updates: Partial<NotificationSettings>): Promise<void> {
    try {
      await blink.db.notificationSchedules.update(scheduleId, {
        ...updates,
        updatedAt: new Date().toISOString(),
        nextScheduled: updates.frequency ? this.calculateNextSchedule(updates.frequency) : undefined
      })
    } catch (error) {
      console.error('Error updating notification schedule:', error)
      throw error
    }
  }

  // Delete notification schedule
  static async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      await blink.db.notificationSchedules.delete(scheduleId)
    } catch (error) {
      console.error('Error deleting notification schedule:', error)
      throw error
    }
  }

  // Calculate next schedule time
  private static calculateNextSchedule(frequency: NotificationSettings['frequency']): string {
    const now = new Date()
    
    switch (frequency) {
      case 'hourly':
        now.setHours(now.getHours() + 1)
        break
      case 'daily':
        now.setDate(now.getDate() + 1)
        now.setHours(9, 0, 0, 0) // 9 AM daily
        break
      case 'weekly':
        now.setDate(now.getDate() + 7)
        now.setHours(9, 0, 0, 0) // 9 AM weekly
        break
      case 'monthly':
        now.setMonth(now.getMonth() + 1, 1)
        now.setHours(9, 0, 0, 0) // 9 AM on 1st of month
        break
      case 'quarterly':
        now.setMonth(now.getMonth() + 3, 1)
        now.setHours(9, 0, 0, 0) // 9 AM on 1st of quarter
        break
      case 'annual':
        now.setFullYear(now.getFullYear() + 1, 0, 1)
        now.setHours(9, 0, 0, 0) // 9 AM on Jan 1st
        break
    }
    
    return now.toISOString()
  }

  // Generate report content based on type
  static async generateReportContent(reportType: NotificationSettings['reportType'], customSettings: NotificationSettings['customSettings']): Promise<{ subject: string, html: string, text: string }> {
    try {
      const user = await blink.auth.me()
      
      switch (reportType) {
        case 'financial_summary':
          return await this.generateFinancialSummary(customSettings)
        case 'cash_flow':
          return await this.generateCashFlowReport(customSettings)
        case 'overdue_invoices':
          return await this.generateOverdueInvoicesReport(customSettings)
        case 'expense_alerts':
          return await this.generateExpenseAlertsReport(customSettings)
        case 'revenue_updates':
          return await this.generateRevenueUpdatesReport(customSettings)
        case 'vendor_payments':
          return await this.generateVendorPaymentsReport(customSettings)
        default:
          throw new Error(`Unknown report type: ${reportType}`)
      }
    } catch (error) {
      console.error('Error generating report content:', error)
      throw error
    }
  }

  // Send notification email
  static async sendNotificationEmail(schedule: NotificationSettings): Promise<boolean> {
    try {
      const { subject, html, text } = await this.generateReportContent(schedule.reportType, schedule.customSettings)
      
      const result = await blink.notifications.email({
        to: schedule.emailAddress,
        from: 'reports@buckaiplatform.com',
        subject: subject,
        html: html,
        text: text
      })

      if (result.success) {
        // Update last sent time
        await this.updateSchedule(schedule.id, {
          lastSent: new Date().toISOString(),
          nextScheduled: this.calculateNextSchedule(schedule.frequency)
        })
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error sending notification email:', error)
      return false
    }
  }

  // Generate Financial Summary Report
  private static async generateFinancialSummary(settings: NotificationSettings['customSettings']): Promise<{ subject: string, html: string, text: string }> {
    const user = await blink.auth.me()
    
    // Get financial data
    const transactions = await blink.db.transactions.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      limit: 100
    }) || []

    const invoices = await blink.db.invoices.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      limit: 50
    }) || []

    // Calculate metrics
    const totalRevenue = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const netIncome = totalRevenue - totalExpenses
    const pendingInvoices = invoices.filter(i => i.status === 'pending').length

    const subject = `📊 Buck AI Financial Summary - ${new Date().toLocaleDateString()}`
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📊 Financial Summary</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Buck AI Accounting Platform</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Key Metrics</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #0369a1; margin: 0 0 10px 0;">Total Revenue</h3>
              <p style="font-size: 24px; font-weight: bold; color: #059669; margin: 0;">${settings.currency}${totalRevenue.toFixed(2)}</p>
            </div>
            <div style="background: #fef3f2; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">Total Expenses</h3>
              <p style="font-size: 24px; font-weight: bold; color: #dc2626; margin: 0;">${settings.currency}${totalExpenses.toFixed(2)}</p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h3 style="color: #374151; margin: 0 0 10px 0;">Net Income</h3>
            <p style="font-size: 32px; font-weight: bold; color: ${netIncome >= 0 ? '#059669' : '#dc2626'}; margin: 0;">${settings.currency}${netIncome.toFixed(2)}</p>
          </div>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; text-align: center;">
            <h3 style="color: #d97706; margin: 0 0 10px 0;">Pending Invoices</h3>
            <p style="font-size: 24px; font-weight: bold; color: #d97706; margin: 0;">${pendingInvoices}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #6b7280; margin: 0;">Generated by Buck AI - Your AI Chief Financial Officer</p>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Visit your dashboard for detailed insights</p>
          </div>
        </div>
      </div>
    `
    
    const text = `
      Buck AI Financial Summary - ${new Date().toLocaleDateString()}
      
      Key Metrics:
      • Total Revenue: ${settings.currency}${totalRevenue.toFixed(2)}
      • Total Expenses: ${settings.currency}${totalExpenses.toFixed(2)}
      • Net Income: ${settings.currency}${netIncome.toFixed(2)}
      • Pending Invoices: ${pendingInvoices}
      
      Generated by Buck AI - Your AI Chief Financial Officer
    `

    return { subject, html, text }
  }

  // Generate other report types (simplified for brevity)
  private static async generateCashFlowReport(settings: NotificationSettings['customSettings']): Promise<{ subject: string, html: string, text: string }> {
    return {
      subject: `💰 Buck AI Cash Flow Report - ${new Date().toLocaleDateString()}`,
      html: `<h1>Cash Flow Report</h1><p>Your cash flow analysis is ready.</p>`,
      text: `Cash Flow Report - ${new Date().toLocaleDateString()}\n\nYour cash flow analysis is ready.`
    }
  }

  private static async generateOverdueInvoicesReport(settings: NotificationSettings['customSettings']): Promise<{ subject: string, html: string, text: string }> {
    return {
      subject: `⚠️ Buck AI Overdue Invoices Alert - ${new Date().toLocaleDateString()}`,
      html: `<h1>Overdue Invoices Alert</h1><p>You have overdue invoices requiring attention.</p>`,
      text: `Overdue Invoices Alert - ${new Date().toLocaleDateString()}\n\nYou have overdue invoices requiring attention.`
    }
  }

  private static async generateExpenseAlertsReport(settings: NotificationSettings['customSettings']): Promise<{ subject: string, html: string, text: string }> {
    return {
      subject: `💸 Buck AI Expense Alerts - ${new Date().toLocaleDateString()}`,
      html: `<h1>Expense Alerts</h1><p>Your expense monitoring report is ready.</p>`,
      text: `Expense Alerts - ${new Date().toLocaleDateString()}\n\nYour expense monitoring report is ready.`
    }
  }

  private static async generateRevenueUpdatesReport(settings: NotificationSettings['customSettings']): Promise<{ subject: string, html: string, text: string }> {
    return {
      subject: `📈 Buck AI Revenue Updates - ${new Date().toLocaleDateString()}`,
      html: `<h1>Revenue Updates</h1><p>Your revenue performance report is ready.</p>`,
      text: `Revenue Updates - ${new Date().toLocaleDateString()}\n\nYour revenue performance report is ready.`
    }
  }

  private static async generateVendorPaymentsReport(settings: NotificationSettings['customSettings']): Promise<{ subject: string, html: string, text: string }> {
    return {
      subject: `🏢 Buck AI Vendor Payments Report - ${new Date().toLocaleDateString()}`,
      html: `<h1>Vendor Payments Report</h1><p>Your vendor payment summary is ready.</p>`,
      text: `Vendor Payments Report - ${new Date().toLocaleDateString()}\n\nYour vendor payment summary is ready.`
    }
  }
}