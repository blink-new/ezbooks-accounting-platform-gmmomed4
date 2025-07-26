import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, DollarSign, FileText, AlertTriangle, CheckCircle, Clock, Search, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'
import { useGamification } from '@/hooks/useGamification'

interface Bill {
  id: string
  user_id: string
  vendor_name: string
  bill_number: string
  amount: number
  due_date: string
  status: 'pending' | 'overdue' | 'paid' | 'partial'
  description: string
  category: string
  created_at: string
  updated_at?: string
  paid_amount?: number
}

export default function AccountsPayable() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const { toast } = useToast()
  const { trackActivity } = useGamification()

  const [newBill, setNewBill] = useState({
    vendorName: '',
    billNumber: '',
    amount: '',
    dueDate: '',
    description: '',
    category: 'office_supplies'
  })

  const [paymentAmount, setPaymentAmount] = useState('')

  const loadBills = useCallback(async () => {
    try {
      if (!blink.auth.isAuthenticated()) {
        console.log('User not authenticated, skipping bills load')
        setLoading(false)
        return
      }
      
      const user = await blink.auth.me()
      const data = await blink.db.bills.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setBills(data || [])
    } catch (error) {
      console.error('Error loading bills:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bills',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadBills()
  }, [loadBills])

  const handleAddBill = async () => {
    try {
      if (!blink.auth.isAuthenticated()) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to add bills',
          variant: 'destructive'
        })
        return
      }

      const user = await blink.auth.me()
      const billData = {
        id: `bill_${Date.now()}`,
        user_id: user.id,
        vendor_name: newBill.vendorName,
        bill_number: newBill.billNumber,
        amount: parseFloat(newBill.amount),
        due_date: newBill.dueDate,
        description: newBill.description,
        category: newBill.category,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      await blink.db.bills.create(billData)
      await trackActivity('bill_created')
      
      toast({
        title: 'Success',
        description: 'Bill added successfully'
      })

      setNewBill({
        vendorName: '',
        billNumber: '',
        amount: '',
        dueDate: '',
        description: '',
        category: 'office_supplies'
      })
      setIsAddDialogOpen(false)
      loadBills()
    } catch (error) {
      console.error('Error adding bill:', error)
      toast({
        title: 'Error',
        description: 'Failed to add bill',
        variant: 'destructive'
      })
    }
  }

  const handlePayment = async () => {
    if (!selectedBill) return

    try {
      if (!blink.auth.isAuthenticated()) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to record payments',
          variant: 'destructive'
        })
        return
      }

      const amount = parseFloat(paymentAmount)
      const currentPaid = selectedBill.paid_amount || 0
      const newPaidAmount = currentPaid + amount
      const totalAmount = selectedBill.amount

      let newStatus = selectedBill.status
      if (newPaidAmount >= totalAmount) {
        newStatus = 'paid'
      } else if (newPaidAmount > 0) {
        newStatus = 'partial'
      }

      await blink.db.bills.update(selectedBill.id, {
        paid_amount: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString()
      })

      // Create payment transaction
      const user = await blink.auth.me()
      await blink.db.transactions.create({
        id: `txn_${Date.now()}`,
        userId: user.id,
        type: 'expense',
        amount: amount,
        category: 'bill_payment',
        description: `Payment for ${selectedBill.vendor_name} - ${selectedBill.bill_number}`,
        date: new Date().toISOString().split('T')[0]
      })

      await trackActivity('bill_paid')

      toast({
        title: 'Success',
        description: 'Payment recorded successfully'
      })

      setPaymentAmount('')
      setIsPaymentDialogOpen(false)
      setSelectedBill(null)
      loadBills()
    } catch (error) {
      console.error('Error recording payment:', error)
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      overdue: { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-600' },
      paid: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      partial: { variant: 'outline' as const, icon: Clock, color: 'text-blue-600' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalOwed = bills.reduce((sum, bill) => {
    if (bill.status === 'paid') return sum
    return sum + (bill.amount - (bill.paid_amount || 0))
  }, 0)

  const overdueCount = bills.filter(bill => {
    if (bill.status === 'paid') return false
    return new Date(bill.due_date) < new Date()
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts Payable</h1>
          <p className="text-muted-foreground">Manage bills and vendor payments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Bill</DialogTitle>
              <DialogDescription>
                Enter the details for the new bill to track.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor" className="text-right">Vendor</Label>
                <Input
                  id="vendor"
                  value={newBill.vendorName}
                  onChange={(e) => setNewBill({ ...newBill, vendorName: e.target.value })}
                  className="col-span-3"
                  placeholder="Vendor name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="billNumber" className="text-right">Bill #</Label>
                <Input
                  id="billNumber"
                  value={newBill.billNumber}
                  onChange={(e) => setNewBill({ ...newBill, billNumber: e.target.value })}
                  className="col-span-3"
                  placeholder="Bill number"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={newBill.category} onValueChange={(value) => setNewBill({ ...newBill, category: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office_supplies">Office Supplies</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="professional_services">Professional Services</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea
                  id="description"
                  value={newBill.description}
                  onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Bill description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBill}>Add Bill</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalOwed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bills.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>Track and manage your vendor bills</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {bills.length === 0 ? 'No bills found. Add your first bill to get started.' : 'No bills match your search criteria.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.vendor_name}</TableCell>
                      <TableCell>{bill.bill_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">${bill.amount.toFixed(2)}</div>
                          {bill.paid_amount && bill.paid_amount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Paid: ${bill.paid_amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(bill.due_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell>
                        {bill.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBill(bill)
                              setIsPaymentDialogOpen(true)
                            }}
                          >
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedBill?.vendor_name} - {selectedBill?.bill_number}
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Total Amount:</Label>
                <div className="col-span-3 font-medium">${selectedBill.amount.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Paid Amount:</Label>
                <div className="col-span-3 font-medium">${(selectedBill.paid_amount || 0).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Remaining:</Label>
                <div className="col-span-3 font-medium text-red-600">
                  ${(selectedBill.amount - (selectedBill.paid_amount || 0)).toFixed(2)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentAmount" className="text-right">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment}>Record Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}