import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, DollarSign, Clock, AlertTriangle, Mail } from 'lucide-react'
import OverdueInvoiceManager from '../components/OverdueInvoiceManager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

interface AccountsReceivableItem {
  id: string
  customer_id: string
  invoice_id: string
  amount: number
  due_date: string
  status: string
  aging_days: number
  notes: string
  created_at: string
  customer_name?: string
  invoice_number?: string
}

export default function AccountsReceivable() {
  const [receivables, setReceivables] = useState<AccountsReceivableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [agingFilter, setAgingFilter] = useState('all')
  const { toast } = useToast()

  const loadAccountsReceivable = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load receivables with customer and invoice data
      const receivablesData = await blink.db.accounts_receivable.list({
        where: { userId: user.id },
        orderBy: { dueDate: 'asc' }
      })

      // Load customers and invoices for reference
      const customers = await blink.db.customers.list({
        where: { userId: user.id }
      })
      
      const invoices = await blink.db.invoices.list({
        where: { userId: user.id }
      })

      // Enrich receivables with customer and invoice data
      const enrichedReceivables = receivablesData.map(receivable => {
        const customer = customers.find(c => c.id === receivable.customer_id)
        const invoice = invoices.find(i => i.id === receivable.invoice_id)
        
        // Calculate aging days
        const dueDate = new Date(receivable.due_date)
        const today = new Date()
        const agingDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          ...receivable,
          customer_name: customer?.name || 'Unknown Customer',
          invoice_number: invoice?.invoice_number || 'N/A',
          aging_days: agingDays
        }
      })

      setReceivables(enrichedReceivables)
    } catch (error) {
      console.error('Error loading accounts receivable:', error)
      toast({
        title: 'Error',
        description: 'Failed to load accounts receivable',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccountsReceivable()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateReceivableStatus = async (id: string, status: string) => {
    try {
      await blink.db.accounts_receivable.update(id, { status })
      
      toast({
        title: 'Success',
        description: `Status updated to ${status}`
      })
      
      loadAccountsReceivable()
    } catch (error) {
      console.error('Error updating receivable status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      outstanding: { label: 'Outstanding', variant: 'secondary' as const },
      overdue: { label: 'Overdue', variant: 'destructive' as const },
      paid: { label: 'Paid', variant: 'default' as const },
      partial: { label: 'Partial', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.outstanding
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getAgingBadge = (days: number) => {
    if (days <= 0) return <Badge variant="default">Current</Badge>
    if (days <= 30) return <Badge variant="secondary">1-30 days</Badge>
    if (days <= 60) return <Badge variant="outline">31-60 days</Badge>
    if (days <= 90) return <Badge variant="destructive">61-90 days</Badge>
    return <Badge variant="destructive">90+ days</Badge>
  }

  const calculateTotals = () => {
    const total = receivables.reduce((sum, item) => sum + item.amount, 0)
    const overdue = receivables.filter(item => item.aging_days > 0).reduce((sum, item) => sum + item.amount, 0)
    const current = receivables.filter(item => item.aging_days <= 0).reduce((sum, item) => sum + item.amount, 0)
    
    return { total, overdue, current }
  }

  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = receivable.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receivable.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || receivable.status === statusFilter
    
    let matchesAging = true
    if (agingFilter === 'current') matchesAging = receivable.aging_days <= 0
    else if (agingFilter === '1-30') matchesAging = receivable.aging_days > 0 && receivable.aging_days <= 30
    else if (agingFilter === '31-60') matchesAging = receivable.aging_days > 30 && receivable.aging_days <= 60
    else if (agingFilter === '61-90') matchesAging = receivable.aging_days > 60 && receivable.aging_days <= 90
    else if (agingFilter === '90+') matchesAging = receivable.aging_days > 90
    
    return matchesSearch && matchesStatus && matchesAging
  })

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading accounts receivable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-gray-600">Track outstanding customer payments and send overdue reminders</p>
        </div>
      </div>

      <Tabs defaultValue="receivables" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receivables" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Outstanding Receivables
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Overdue Reminders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {receivables.length} outstanding invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current (Not Due)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totals.current.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {receivables.filter(r => r.aging_days <= 0).length} current invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totals.overdue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {receivables.filter(r => r.aging_days > 0).length} overdue invoices
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by customer or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agingFilter} onValueChange={setAgingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Aging</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="1-30">1-30 days</SelectItem>
                <SelectItem value="31-60">31-60 days</SelectItem>
                <SelectItem value="61-90">61-90 days</SelectItem>
                <SelectItem value="90+">90+ days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receivables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Receivables</CardTitle>
          <CardDescription>
            {filteredReceivables.length} receivable{filteredReceivables.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceivables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No receivables found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceivables.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell className="font-medium">{receivable.customer_name}</TableCell>
                      <TableCell>{receivable.invoice_number}</TableCell>
                      <TableCell>${receivable.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(receivable.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getAgingBadge(receivable.aging_days)}</TableCell>
                      <TableCell>{getStatusBadge(receivable.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {receivable.status === 'outstanding' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateReceivableStatus(receivable.id, 'paid')}
                              >
                                Mark Paid
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateReceivableStatus(receivable.id, 'partial')}
                              >
                                Partial
                              </Button>
                            </>
                          )}
                          {receivable.status === 'partial' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateReceivableStatus(receivable.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <OverdueInvoiceManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}