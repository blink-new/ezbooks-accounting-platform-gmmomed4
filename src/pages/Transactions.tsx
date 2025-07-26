import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useGamification } from '@/hooks/useGamification'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  DollarSign
} from 'lucide-react'
import blink from '@/blink/client'

interface Transaction {
  id: string
  userId: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  paymentMethod: string
  reference: string
  attachmentUrl?: string
  createdAt: string
  updatedAt: string
}

const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Revenue', 
  'Interest Income',
  'Investment Income',
  'Rental Income',
  'Other Income'
]

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Marketing',
  'Travel',
  'Meals & Entertainment',
  'Professional Services',
  'Software & Subscriptions',
  'Rent',
  'Utilities',
  'Insurance',
  'Equipment',
  'Other Expenses'
]

const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'PayPal',
  'Other'
]

export default function Transactions() {
  const { toast } = useToast()
  const { trackActivity } = useGamification()
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    reference: ''
  })

  const loadTransactions = async (userId: string) => {
    try {
      setLoading(true)
      const data = await blink.db.transactions.list({
        where: { userId },
        orderBy: { date: 'desc' }
      })
      setTransactions(data)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      reference: ''
    })
    setEditingTransaction(null)
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadTransactions(state.user.id)
      }
    })
    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle URL parameters for filtering from dashboard
  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'income' || filter === 'expense') {
      setFilterType(filter)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: user.id,
        id: editingTransaction?.id || `txn_${Date.now()}`,
        updatedAt: new Date().toISOString()
      }

      if (editingTransaction) {
        await blink.db.transactions.update(editingTransaction.id, transactionData)
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, ...transactionData } : t))
        toast({
          title: "Success",
          description: "Transaction updated successfully"
        })
      } else {
        const newTransaction = {
          ...transactionData,
          createdAt: new Date().toISOString()
        }
        await blink.db.transactions.create(newTransaction)
        setTransactions(prev => [newTransaction, ...prev])
        
        // Track gamification activity
        await trackActivity('transaction_created', { 
          type: formData.type, 
          amount: parseFloat(formData.amount) 
        })
        
        toast({
          title: "Success",
          description: "Transaction created successfully"
        })
      }

      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving transaction:', error)
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      reference: transaction.reference
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await blink.db.transactions.delete(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast({
        title: "Success",
        description: "Transaction deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      })
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory
    
    return matchesSearch && matchesType && matchesCategory
  })

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment Method', 'Reference'],
      ...filteredTransactions.map(t => [
        t.date,
        t.type,
        t.description,
        t.category,
        t.amount.toString(),
        t.paymentMethod,
        t.reference
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button onClick={exportTransactions} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </DialogTitle>
                <DialogDescription>
                  {editingTransaction ? 'Update transaction details' : 'Enter transaction details below'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value, category: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input 
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Transaction description"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input 
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Invoice #, check #, etc."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : (editingTransaction ? 'Update' : 'Create')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === 'income').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === 'expense').length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalIncome - totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.length} total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
                <SelectItem value="expense">Expenses Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.reference && (
                          <p className="text-sm text-muted-foreground">Ref: {transaction.reference}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}
                    </TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' 
                  ? 'No transactions match your filters' 
                  : 'No transactions yet. Add your first transaction to get started.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}