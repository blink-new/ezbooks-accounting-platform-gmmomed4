import React, { useState, useEffect } from 'react'
import { Calendar, Download, Eye, Plus, TrendingUp, TrendingDown, DollarSign, FileText, BarChart3, PieChart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

interface FinancialStatement {
  id: string
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow'
  title: string
  period_start: string
  period_end: string
  data: any
  created_at: string
  user_id: string
}

interface PLData {
  revenue: { [key: string]: number }
  expenses: { [key: string]: number }
  net_income: number
}

interface BalanceSheetData {
  assets: { current: { [key: string]: number }, fixed: { [key: string]: number } }
  liabilities: { current: { [key: string]: number }, long_term: { [key: string]: number } }
  equity: { [key: string]: number }
}

interface CashFlowData {
  operating: { [key: string]: number }
  investing: { [key: string]: number }
  financing: { [key: string]: number }
  net_change: number
}

export default function FinancialStatements() {
  const [statements, setStatements] = useState<FinancialStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profit_loss')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedStatement, setSelectedStatement] = useState<FinancialStatement | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    type: 'profit_loss' as 'profit_loss' | 'balance_sheet' | 'cash_flow',
    title: '',
    period_start: '',
    period_end: ''
  })

  const loadStatements = async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.financial_statements.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setStatements(data)
    } catch (error) {
      console.error('Error loading financial statements:', error)
      toast({
        title: 'Error',
        description: 'Failed to load financial statements',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePLStatement = async (startDate: string, endDate: string) => {
    try {
      const user = await blink.auth.me()
      
      // Get transactions for the period
      const transactions = await blink.db.transactions.list({
        where: { 
          user_id: user.id,
          date: { gte: startDate, lte: endDate }
        }
      })

      const revenue: { [key: string]: number } = {}
      const expenses: { [key: string]: number } = {}

      transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount.toString())
        const category = transaction.category || 'Other'
        
        if (transaction.type === 'income') {
          revenue[category] = (revenue[category] || 0) + amount
        } else if (transaction.type === 'expense') {
          expenses[category] = (expenses[category] || 0) + amount
        }
      })

      const totalRevenue = Object.values(revenue).reduce((sum, val) => sum + val, 0)
      const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0)
      const net_income = totalRevenue - totalExpenses

      return { revenue, expenses, net_income }
    } catch (error) {
      console.error('Error generating P&L statement:', error)
      throw error
    }
  }

  const generateBalanceSheet = async (asOfDate: string) => {
    try {
      const user = await blink.auth.me()
      
      // Get all transactions up to the date
      const transactions = await blink.db.transactions.list({
        where: { 
          user_id: user.id,
          date: { lte: asOfDate }
        }
      })

      // Get customers for accounts receivable
      const customers = await blink.db.customers.list({
        where: { user_id: user.id }
      })

      // Calculate cash from transactions
      const cash = transactions.reduce((sum, transaction) => {
        const amount = parseFloat(transaction.amount.toString())
        return transaction.type === 'income' ? sum + amount : sum - amount
      }, 0)

      // Calculate accounts receivable from pending invoices
      const invoices = await blink.db.invoices.list({
        where: { 
          user_id: user.id,
          status: 'pending'
        }
      })
      
      const accounts_receivable = invoices.reduce((sum, invoice) => {
        return sum + parseFloat(invoice.total.toString())
      }, 0)

      const assets = {
        current: {
          'Cash and Cash Equivalents': cash,
          'Accounts Receivable': accounts_receivable,
          'Inventory': 0 // Placeholder
        },
        fixed: {
          'Equipment': 0, // Placeholder
          'Furniture': 0, // Placeholder
          'Less: Accumulated Depreciation': 0 // Placeholder
        }
      }

      const liabilities = {
        current: {
          'Accounts Payable': 0, // Placeholder
          'Accrued Expenses': 0, // Placeholder
          'Short-term Debt': 0 // Placeholder
        },
        long_term: {
          'Long-term Debt': 0, // Placeholder
          'Deferred Tax Liability': 0 // Placeholder
        }
      }

      const totalAssets = Object.values(assets.current).reduce((sum, val) => sum + val, 0) +
                         Object.values(assets.fixed).reduce((sum, val) => sum + val, 0)
      const totalLiabilities = Object.values(liabilities.current).reduce((sum, val) => sum + val, 0) +
                              Object.values(liabilities.long_term).reduce((sum, val) => sum + val, 0)

      const equity = {
        'Owner\'s Equity': totalAssets - totalLiabilities,
        'Retained Earnings': 0 // Placeholder
      }

      return { assets, liabilities, equity }
    } catch (error) {
      console.error('Error generating balance sheet:', error)
      throw error
    }
  }

  const generateCashFlowStatement = async (startDate: string, endDate: string) => {
    try {
      const user = await blink.auth.me()
      
      const transactions = await blink.db.transactions.list({
        where: { 
          user_id: user.id,
          date: { gte: startDate, lte: endDate }
        }
      })

      const operating: { [key: string]: number } = {}
      const investing: { [key: string]: number } = {}
      const financing: { [key: string]: number } = {}

      transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount.toString())
        const category = transaction.category || 'Other'
        
        // Categorize cash flows (simplified logic)
        if (['Sales', 'Service Revenue', 'Interest Income'].includes(category)) {
          operating[category] = (operating[category] || 0) + (transaction.type === 'income' ? amount : -amount)
        } else if (['Equipment Purchase', 'Investment'].includes(category)) {
          investing[category] = (investing[category] || 0) + (transaction.type === 'expense' ? -amount : amount)
        } else if (['Loan', 'Owner Investment'].includes(category)) {
          financing[category] = (financing[category] || 0) + (transaction.type === 'income' ? amount : -amount)
        } else {
          // Default to operating activities
          operating[category] = (operating[category] || 0) + (transaction.type === 'income' ? amount : -amount)
        }
      })

      const operatingTotal = Object.values(operating).reduce((sum, val) => sum + val, 0)
      const investingTotal = Object.values(investing).reduce((sum, val) => sum + val, 0)
      const financingTotal = Object.values(financing).reduce((sum, val) => sum + val, 0)
      const net_change = operatingTotal + investingTotal + financingTotal

      return { operating, investing, financing, net_change }
    } catch (error) {
      console.error('Error generating cash flow statement:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const user = await blink.auth.me()
      let data: any

      if (formData.type === 'profit_loss') {
        data = await generatePLStatement(formData.period_start, formData.period_end)
      } else if (formData.type === 'balance_sheet') {
        data = await generateBalanceSheet(formData.period_end)
      } else if (formData.type === 'cash_flow') {
        data = await generateCashFlowStatement(formData.period_start, formData.period_end)
      }

      await blink.db.financial_statements.create({
        id: `fs_${Date.now()}`,
        user_id: user.id,
        type: formData.type,
        title: formData.title,
        period_start: formData.period_start,
        period_end: formData.period_end,
        data: JSON.stringify(data)
      })

      toast({
        title: 'Success',
        description: 'Financial statement created successfully'
      })

      setIsCreateDialogOpen(false)
      setFormData({
        type: 'profit_loss',
        title: '',
        period_start: '',
        period_end: ''
      })
      loadStatements()
    } catch (error) {
      console.error('Error creating financial statement:', error)
      toast({
        title: 'Error',
        description: 'Failed to create financial statement',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatementIcon = (type: string) => {
    switch (type) {
      case 'profit_loss': return <TrendingUp className="h-5 w-5" />
      case 'balance_sheet': return <BarChart3 className="h-5 w-5" />
      case 'cash_flow': return <DollarSign className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getStatementTypeName = (type: string) => {
    switch (type) {
      case 'profit_loss': return 'Profit & Loss'
      case 'balance_sheet': return 'Balance Sheet'
      case 'cash_flow': return 'Cash Flow'
      default: return 'Financial Statement'
    }
  }

  const renderPLStatement = (data: PLData) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-green-700">Revenue</h3>
        <div className="space-y-2">
          {Object.entries(data.revenue).map(([category, amount]) => (
            <div key={category} className="flex justify-between">
              <span>{category}</span>
              <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Revenue</span>
            <span className="text-green-600">
              {formatCurrency(Object.values(data.revenue).reduce((sum, val) => sum + val, 0))}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-red-700">Expenses</h3>
        <div className="space-y-2">
          {Object.entries(data.expenses).map(([category, amount]) => (
            <div key={category} className="flex justify-between">
              <span>{category}</span>
              <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Expenses</span>
            <span className="text-red-600">
              {formatCurrency(Object.values(data.expenses).reduce((sum, val) => sum + val, 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t-2 pt-4">
        <div className="flex justify-between text-xl font-bold">
          <span>Net Income</span>
          <span className={data.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(data.net_income)}
          </span>
        </div>
      </div>
    </div>
  )

  const renderBalanceSheet = (data: BalanceSheetData) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-blue-700">Assets</h3>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Current Assets</h4>
          <div className="space-y-1 ml-4">
            {Object.entries(data.assets.current).map(([item, amount]) => (
              <div key={item} className="flex justify-between text-sm">
                <span>{item}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Fixed Assets</h4>
          <div className="space-y-1 ml-4">
            {Object.entries(data.assets.fixed).map(([item, amount]) => (
              <div key={item} className="flex justify-between text-sm">
                <span>{item}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-2 font-semibold">
          <div className="flex justify-between">
            <span>Total Assets</span>
            <span className="text-blue-600">
              {formatCurrency(
                Object.values(data.assets.current).reduce((sum, val) => sum + val, 0) +
                Object.values(data.assets.fixed).reduce((sum, val) => sum + val, 0)
              )}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-orange-700">Liabilities & Equity</h3>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Current Liabilities</h4>
          <div className="space-y-1 ml-4">
            {Object.entries(data.liabilities.current).map(([item, amount]) => (
              <div key={item} className="flex justify-between text-sm">
                <span>{item}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Long-term Liabilities</h4>
          <div className="space-y-1 ml-4">
            {Object.entries(data.liabilities.long_term).map(([item, amount]) => (
              <div key={item} className="flex justify-between text-sm">
                <span>{item}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Equity</h4>
          <div className="space-y-1 ml-4">
            {Object.entries(data.equity).map(([item, amount]) => (
              <div key={item} className="flex justify-between text-sm">
                <span>{item}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-2 font-semibold">
          <div className="flex justify-between">
            <span>Total Liabilities & Equity</span>
            <span className="text-orange-600">
              {formatCurrency(
                Object.values(data.liabilities.current).reduce((sum, val) => sum + val, 0) +
                Object.values(data.liabilities.long_term).reduce((sum, val) => sum + val, 0) +
                Object.values(data.equity).reduce((sum, val) => sum + val, 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCashFlowStatement = (data: CashFlowData) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-blue-700">Operating Activities</h3>
        <div className="space-y-2">
          {Object.entries(data.operating).map(([item, amount]) => (
            <div key={item} className="flex justify-between">
              <span>{item}</span>
              <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(amount)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Net Cash from Operating Activities</span>
            <span className="text-blue-600">
              {formatCurrency(Object.values(data.operating).reduce((sum, val) => sum + val, 0))}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-purple-700">Investing Activities</h3>
        <div className="space-y-2">
          {Object.entries(data.investing).map(([item, amount]) => (
            <div key={item} className="flex justify-between">
              <span>{item}</span>
              <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(amount)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Net Cash from Investing Activities</span>
            <span className="text-purple-600">
              {formatCurrency(Object.values(data.investing).reduce((sum, val) => sum + val, 0))}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-green-700">Financing Activities</h3>
        <div className="space-y-2">
          {Object.entries(data.financing).map(([item, amount]) => (
            <div key={item} className="flex justify-between">
              <span>{item}</span>
              <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(amount)}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Net Cash from Financing Activities</span>
            <span className="text-green-600">
              {formatCurrency(Object.values(data.financing).reduce((sum, val) => sum + val, 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t-2 pt-4">
        <div className="flex justify-between text-xl font-bold">
          <span>Net Change in Cash</span>
          <span className={data.net_change >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(data.net_change)}
          </span>
        </div>
      </div>
    </div>
  )

  useEffect(() => {
    loadStatements()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading financial statements...</p>
        </div>
      </div>
    )
  }

  const filteredStatements = statements.filter(statement => 
    activeTab === 'all' || statement.type === activeTab
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Statements</h1>
          <p className="text-gray-600">Generate and manage your financial reports</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Statement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Financial Statement</DialogTitle>
              <DialogDescription>
                Generate a new financial statement based on your transaction data
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="type">Statement Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profit_loss">Profit & Loss Statement</SelectItem>
                    <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                    <SelectItem value="cash_flow">Cash Flow Statement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Statement Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Q1 2024 Profit & Loss"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period_start">
                    {formData.type === 'balance_sheet' ? 'As of Date' : 'Period Start'}
                  </Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    required={formData.type !== 'balance_sheet'}
                  />
                </div>
                {formData.type !== 'balance_sheet' && (
                  <div>
                    <Label htmlFor="period_end">Period End</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                    />
                  </div>
                )}
                {formData.type === 'balance_sheet' && (
                  <div>
                    <Label htmlFor="period_end">As of Date</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Generate Statement</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statement Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Statements</TabsTrigger>
          <TabsTrigger value="profit_loss">P&L</TabsTrigger>
          <TabsTrigger value="balance_sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash_flow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredStatements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No financial statements found</p>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first statement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStatements.map((statement) => (
                <Card key={statement.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatementIcon(statement.type)}
                        <CardTitle className="text-lg">{statement.title}</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {getStatementTypeName(statement.type)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {statement.type === 'balance_sheet' 
                        ? `As of ${new Date(statement.period_end).toLocaleDateString()}`
                        : `${new Date(statement.period_start).toLocaleDateString()} - ${new Date(statement.period_end).toLocaleDateString()}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Created {new Date(statement.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStatement(statement)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement PDF download
                            toast({
                              title: 'Coming Soon',
                              description: 'PDF download will be available soon'
                            })
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Statement Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedStatement && getStatementIcon(selectedStatement.type)}
              <span>{selectedStatement?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedStatement && (
                selectedStatement.type === 'balance_sheet' 
                  ? `As of ${new Date(selectedStatement.period_end).toLocaleDateString()}`
                  : `${new Date(selectedStatement.period_start).toLocaleDateString()} - ${new Date(selectedStatement.period_end).toLocaleDateString()}`
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedStatement && (
            <div className="mt-6">
              {selectedStatement.type === 'profit_loss' && renderPLStatement(JSON.parse(selectedStatement.data))}
              {selectedStatement.type === 'balance_sheet' && renderBalanceSheet(JSON.parse(selectedStatement.data))}
              {selectedStatement.type === 'cash_flow' && renderCashFlowStatement(JSON.parse(selectedStatement.data))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}