import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { useInvoices } from '@/hooks/useInvoices'
import { useCustomers } from '@/hooks/useCustomers'
import { useSubscription } from '@/hooks/useSubscription'
import { useGamification } from '@/hooks/useGamification'
import { GamificationWidget } from '@/components/GamificationWidget'
import blink from '@/blink/client'

const mockChartData = [
  { month: 'Jan', income: 4000, expenses: 2400 },
  { month: 'Feb', income: 3000, expenses: 1398 },
  { month: 'Mar', income: 2000, expenses: 9800 },
  { month: 'Apr', income: 2780, expenses: 3908 },
  { month: 'May', income: 1890, expenses: 4800 },
  { month: 'Jun', income: 2390, expenses: 3800 },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalCustomers: 0,
    pendingInvoices: 0
  })
  const gamification = useGamification()
  const trackActivity = gamification?.trackActivity

  const loadDashboardData = async (userId: string) => {
    try {
      // Load transactions for income/expense calculation
      const transactions = await blink.db.transactions.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      // Load customers count
      const customers = await blink.db.customers.list({
        where: { userId }
      })

      // Load pending invoices
      const invoices = await blink.db.invoices.list({
        where: { 
          userId,
          status: 'sent'
        }
      })

      // Calculate stats
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        netProfit: income - expenses,
        totalCustomers: customers.length,
        pendingInvoices: invoices.length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadDashboardData(state.user.id)
        // Track daily login and dashboard view with error handling
        setTimeout(() => {
          try {
            if (trackActivity && typeof trackActivity === 'function') {
              trackActivity('daily_login')
              trackActivity('view_dashboard')
            }
          } catch (error) {
            console.error('Error tracking activity:', error)
          }
        }, 1000) // Delay to ensure gamification is loaded
      }
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">
              Welcome back, {user?.displayName || user?.email}
            </p>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              🎉 All Features Unlocked FREE
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button onClick={() => navigate('/transactions')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/transactions?filter=income')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month • Click to view details
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/transactions?filter=expense')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              +4.3% from last month • Click to view details
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/reports?view=profit')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month • Click to view details
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/customers')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +2 new this month • Click to view details
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/invoices?filter=pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment • Click to view details
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Gamification */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Monthly comparison for the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="income" fill="#10B981" />
                    <Bar dataKey="expenses" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Trend</CardTitle>
                <CardDescription>Net profit over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#2563EB" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to keep your business running smoothly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/ai-assistant')}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Ask Buck AI</div>
                    <div className="text-xs text-muted-foreground">Get instant CFO advice</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/transactions')}
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Add Transaction</div>
                    <div className="text-xs text-muted-foreground">Record income/expense</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/invoices')}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Create Invoice</div>
                    <div className="text-xs text-muted-foreground">Bill your customers</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/reports')}
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">View Reports</div>
                    <div className="text-xs text-muted-foreground">Analyze performance</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Widget */}
        <div className="space-y-4">
          <GamificationWidget />
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest business actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Transaction added</div>
                    <div className="text-xs text-muted-foreground">2 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Invoice sent</div>
                    <div className="text-xs text-muted-foreground">1 hour ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Buck AI consultation</div>
                    <div className="text-xs text-muted-foreground">3 hours ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Launch Special Status</CardTitle>
          <CardDescription>All premium features unlocked for free</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">🎉 Everything FREE</Badge>
              <span className="text-sm text-muted-foreground">
                Enterprise features, unlimited AI, priority support - all included
              </span>
            </div>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              View Features
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}