import { useState, useEffect } from 'react'
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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Send,
  Download,
  Eye,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import blink from '@/blink/client'

interface Invoice {
  id: string
  userId: string
  customerId: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: string
  dueDate: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string
  createdAt: string
  updatedAt: string
}

interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Customer {
  id: string
  name: string
  email: string
  company: string
}

export default function Invoices() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: '',
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    taxRate: 0,
    notes: ''
  })

  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', quantity: 1, rate: 0 }
  ])

  const loadData = async (userId: string) => {
    try {
      setLoading(true)
      
      // Load invoices
      const invoicesData = await blink.db.invoices.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      setInvoices(invoicesData)

      // Load customers
      const customersData = await blink.db.customers.list({
        where: { userId }
      })
      setCustomers(customersData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      invoiceNumber: '',
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 0,
      notes: ''
    })
    setInvoiceItems([{ description: '', quantity: 1, rate: 0 }])
    setEditingInvoice(null)
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadData(state.user.id)
      }
    })
    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${year}${month}-${random}`
  }

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    const taxAmount = subtotal * (formData.taxRate / 100)
    const total = subtotal + taxAmount
    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      
      const { subtotal, taxAmount, total } = calculateTotals()
      
      const invoiceData = {
        ...formData,
        userId: user.id,
        invoiceNumber: formData.invoiceNumber || generateInvoiceNumber(),
        subtotal,
        taxAmount,
        total,
        id: editingInvoice?.id || `inv_${Date.now()}`,
        updatedAt: new Date().toISOString()
      }

      if (editingInvoice) {
        await blink.db.invoices.update(editingInvoice.id, invoiceData)
        setInvoices(prev => prev.map(i => i.id === editingInvoice.id ? { ...i, ...invoiceData } : i))
        toast({
          title: "Success",
          description: "Invoice updated successfully"
        })
      } else {
        const newInvoice = {
          ...invoiceData,
          createdAt: new Date().toISOString()
        }
        await blink.db.invoices.create(newInvoice)
        
        // Create invoice items
        for (const item of invoiceItems) {
          if (item.description && item.quantity > 0 && item.rate > 0) {
            await blink.db.invoiceItems.create({
              id: `item_${Date.now()}_${Math.random()}`,
              invoiceId: newInvoice.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.quantity * item.rate
            })
          }
        }
        
        setInvoices(prev => [newInvoice, ...prev])
        toast({
          title: "Success",
          description: "Invoice created successfully"
        })
      }

      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      customerId: invoice.customerId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      taxRate: invoice.taxRate,
      notes: invoice.notes
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      await blink.db.invoices.delete(id)
      setInvoices(prev => prev.filter(i => i.id !== id))
      toast({
        title: "Success",
        description: "Invoice deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      await blink.db.invoices.update(invoiceId, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status: newStatus } : i))
      toast({
        title: "Success",
        description: `Invoice marked as ${newStatus}`
      })
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive"
      })
    }
  }

  const addInvoiceItem = () => {
    setInvoiceItems(prev => [...prev, { description: '', quantity: 1, rate: 0 }])
  }

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    setInvoiceItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const filteredInvoices = invoices.filter(invoice => {
    const customer = customers.find(c => c.id === invoice.customerId)
    const customerName = customer ? (customer.company || customer.name) : ''
    
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />
      case 'sent': return <Send className="h-4 w-4" />
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <Clock className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'sent': return 'default'
      case 'paid': return 'default'
      case 'overdue': return 'destructive'
      case 'cancelled': return 'secondary'
      default: return 'secondary'
    }
  }

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

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0)
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + Number(i.total), 0)
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.total), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Create and manage your invoices</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                </DialogTitle>
                <DialogDescription>
                  {editingInvoice ? 'Update invoice details' : 'Fill in the invoice details below'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer *</Label>
                    <Select 
                      value={formData.customerId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <SelectItem value="" disabled>
                            No customers found. Create a customer first.
                          </SelectItem>
                        ) : (
                          customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company || customer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {customers.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        <a href="/customers" className="text-primary hover:underline">
                          Create a customer first
                        </a> to create invoices.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input 
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: Invoice['status']) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input 
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input 
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Invoice Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Label htmlFor={`description-${index}`}>Description</Label>
                          <Input
                            id={`description-${index}`}
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`quantity-${index}`}>Qty</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`rate-${index}`}>Rate ($)</Label>
                          <Input
                            id={`rate-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate || ''}
                            onChange={(e) => updateInvoiceItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Amount</Label>
                          <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                            {formatCurrency(item.quantity * item.rate)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          {invoiceItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input 
                        id="taxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.taxRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Total</Label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-muted font-medium">
                        {formatCurrency(calculateTotals().total)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or terms..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : (editingInvoice ? 'Update Invoice' : 'Create Invoice')}
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => i.status === 'paid').length} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => i.status === 'sent').length} sent invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(i => i.status === 'overdue').length} overdue invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              All time invoices
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
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: typeof filterStatus) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            {filteredInvoices.length} of {invoices.length} invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const customer = customers.find(c => c.id === invoice.customerId)
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {customer ? (customer.company || customer.name) : 'Unknown Customer'}
                      </TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(invoice.total))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === 'sent' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(invoice.id, 'paid')}
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(invoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {filteredInvoices.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No invoices match your filters' 
                  : 'No invoices yet. Create your first invoice to get started.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}