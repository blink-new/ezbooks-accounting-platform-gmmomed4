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
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  DollarSign
} from 'lucide-react'
import blink from '@/blink/client'

interface Customer {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  customerType: 'individual' | 'business'
  status: 'active' | 'inactive'
  notes: string
  createdAt: string
  updatedAt: string
}

export default function Customers() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'business'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    customerType: 'individual' as 'individual' | 'business',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  })

  const loadCustomers = async (userId: string) => {
    try {
      setLoading(true)
      const data = await blink.db.customers.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      customerType: 'individual',
      status: 'active',
      notes: ''
    })
    setEditingCustomer(null)
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadCustomers(state.user.id)
      }
    })
    return unsubscribe
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      
      const customerData = {
        ...formData,
        userId: user.id,
        id: editingCustomer?.id || `cust_${Date.now()}`,
        updatedAt: new Date().toISOString()
      }

      if (editingCustomer) {
        await blink.db.customers.update(editingCustomer.id, customerData)
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...customerData } : c))
        toast({
          title: "Success",
          description: "Customer updated successfully"
        })
      } else {
        const newCustomer = {
          ...customerData,
          createdAt: new Date().toISOString()
        }
        await blink.db.customers.create(newCustomer)
        setCustomers(prev => [newCustomer, ...prev])
        toast({
          title: "Success",
          description: "Customer created successfully"
        })
      }

      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({
        title: "Error",
        description: "Failed to save customer",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      country: customer.country,
      customerType: customer.customerType,
      status: customer.status,
      notes: customer.notes
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      await blink.db.customers.delete(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
      toast({
        title: "Success",
        description: "Customer deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      })
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
    const matchesType = filterType === 'all' || customer.customerType === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const activeCustomers = customers.filter(c => c.status === 'active').length
  const businessCustomers = customers.filter(c => c.customerType === 'business').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer ? 'Update customer information' : 'Enter customer details below'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerType">Customer Type</Label>
                    <Select 
                      value={formData.customerType} 
                      onValueChange={(value: 'individual' | 'business') => setFormData(prev => ({ ...prev, customerType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {formData.customerType === 'business' ? 'Contact Name' : 'Full Name'} *
                    </Label>
                    <Input 
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  {formData.customerType === 'business' && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name *</Label>
                      <Input 
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Acme Corporation"
                        required={formData.customerType === 'business'}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, Suite 100"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input 
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this customer..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Create Customer')}
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
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {customers.length > 0 ? `${activeCustomers} active` : 'No customers yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Customers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {customers.length - businessCustomers} individual customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0 ? Math.round((activeCustomers / customers.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Customer retention rate
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
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(value: 'all' | 'individual' | 'business') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>
            {filteredCustomers.length} of {customers.length} customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        {customer.company && (
                          <p className="text-sm text-muted-foreground">{customer.company}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                              {customer.email}
                            </a>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                              {customer.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.customerType === 'business' ? 'default' : 'secondary'}>
                        {customer.customerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.city || customer.state ? (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[customer.city, customer.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCustomers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                  ? 'No customers match your filters' 
                  : 'No customers yet. Add your first customer to get started.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}