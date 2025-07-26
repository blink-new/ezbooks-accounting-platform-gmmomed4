import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Calendar } from 'lucide-react'
import blink from '@/blink/client'

interface ReportData {
  transactions: any[]
  invoices: any[]
  customers: any[]
}

export default function Reports() {
  const [user, setUser] = useState<any>(null)
  const [data, setData] = useState<ReportData>({ transactions: [], invoices: [], customers: [] })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days

  const loadReportData = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const [transactions, invoices, customers] = await Promise.all([
        blink.db.transactions.list({ where: { userId }, orderBy: { date: 'desc' } }),
        blink.db.invoices.list({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        blink.db.customers.list({ where: { userId } })
      ])

      setData({ transactions, invoices, customers })
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadReportData(state.user.id)
      }
    })
    return unsubscribe
  }, [loadReportData])

  useEffect(() => {
    if (user) {
      loadReportData(user.id)
    }
  }, [dateRange, user, loadReportData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Filter data by date range
  const filterByDateRange = (items: any[], dateField: string) => {
    const days = parseInt(dateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField])
      return itemDate >= cutoffDate
    })
  }

  const filteredTransactions = filterByDateRange(data.transactions, 'date')
  const filteredInvoices = filterByDateRange(data.invoices, 'createdAt')

  // Calculate metrics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netProfit = totalIncome - totalExpenses

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid')
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const pendingAmount = filteredInvoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + Number(inv.amount), 0)

  // Prepare chart data
  const monthlyData = () => {
    const months: any = {}
    const now = new Date()
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
      months[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        income: 0,
        expenses: 0,
        invoiced: 0
      }
    }

    // Add transaction data
    filteredTransactions.forEach(transaction => {
      const monthKey = transaction.date.slice(0, 7)
      if (months[monthKey]) {
        if (transaction.type === 'income') {
          months[monthKey].income += Number(transaction.amount)
        } else {
          months[monthKey].expenses += Number(transaction.amount)
        }
      }
    })

    // Add invoice data
    filteredInvoices.forEach(invoice => {
      const monthKey = invoice.createdAt.slice(0, 7)
      if (months[monthKey]) {
        months[monthKey].invoiced += Number(invoice.amount)
      }
    })

    return Object.values(months)
  }

  const expenseBreakdown = () => {
    const expenses: any = {}
    
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        if (!expenses[transaction.category]) {
          expenses[transaction.category] = 0
        }
        expenses[transaction.category] += Number(transaction.amount)
      })

    return Object.entries(expenses).map(([name, value]) => ({ name, value }))
  }

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  const exportReport = () => {
    const reportData = {
      summary: {
        dateRange: `${dateRange} days`,
        totalIncome: formatCurrency(totalIncome),
        totalExpenses: formatCurrency(totalExpenses),
        netProfit: formatCurrency(netProfit),
        totalInvoiced: formatCurrency(totalInvoiced),
        totalPaid: formatCurrency(totalPaid),
        pendingAmount: formatCurrency(pendingAmount)
      },
      transactions: filteredTransactions,
      invoices: filteredInvoices
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `buck-ai-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Financial insights and analytics</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.filter(t => t.type === 'income').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.filter(t => t.type === 'expense').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netProfit >= 0 ? 'Profit' : 'Loss'} this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvoiced)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length} invoices created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdown().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status Overview</CardTitle>
          <CardDescription>Current status of all invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredInvoices.filter(inv => inv.status === 'draft').length}</div>
              <div className="text-sm text-muted-foreground">Draft</div>
              <Badge variant="secondary" className="mt-1">
                {formatCurrency(filteredInvoices.filter(inv => inv.status === 'draft').reduce((sum, inv) => sum + Number(inv.amount), 0))}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredInvoices.filter(inv => inv.status === 'sent').length}</div>
              <div className="text-sm text-muted-foreground">Sent</div>
              <Badge variant="default" className="mt-1">
                {formatCurrency(pendingAmount)}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{paidInvoices.length}</div>
              <div className="text-sm text-muted-foreground">Paid</div>
              <Badge variant="default" className="mt-1 bg-green-600">
                {formatCurrency(totalPaid)}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredInvoices.filter(inv => inv.status === 'overdue').length}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
              <Badge variant="destructive" className="mt-1">
                {formatCurrency(filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.amount), 0))}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}