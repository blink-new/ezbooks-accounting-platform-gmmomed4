import React, { useState, useEffect } from 'react'
import { createClient } from '@blinkdotnew/sdk'
import { Plus, Search, Filter, Send, Download, Edit, Trash2, AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { FormValidator, ValidationRules, ErrorHandler, FormUtils } from '@/lib/validation'
import { EmailIntegrationService } from '@/lib/emailIntegration'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

interface PurchaseOrder {
  id: string
  userId: string
  poNumber: string
  vendorName: string
  vendorEmail: string
  vendorAddress: string
  issueDate: string
  expectedDeliveryDate: string
  paymentTerms: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string
  status: string
  createdAt: string
}

interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
  createdAt: string
}

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  // Form state
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorAddress: '',
    expectedDeliveryDate: '',
    paymentTerms: 'Net 30',
    taxRate: 8.25,
    notes: ''
  })

  const [items, setItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 }
  ])

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!blink.auth.isAuthenticated()) {
        setError('Please sign in to view purchase orders')
        return
      }

      const user = await blink.auth.me()
      const orders = await blink.db['purchase_orders'].list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      setPurchaseOrders(orders || [])
    } catch (err: any) {
      console.error('Error loading purchase orders:', err)
      setError('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  const generatePONumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `PO-${timestamp}-${random}`
  }

  const generateId = (prefix: string) => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${prefix}_${timestamp}_${random}`
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)
    
    const taxAmount = subtotal * (formData.taxRate / 100)
    const total = subtotal + taxAmount
    
    return { subtotal, taxAmount, total }
  }

  const updateItemTotal = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const resetForm = () => {
    setFormData({
      vendorName: '',
      vendorEmail: '',
      vendorAddress: '',
      expectedDeliveryDate: '',
      paymentTerms: 'Net 30',
      taxRate: 8.25,
      notes: ''
    })
    setItems([{ description: '', quantity: 1, unitPrice: 0 }])
    setShowForm(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      setError('')

      // Enhanced form validation
      const validator = new FormValidator([
        { field: 'vendorName', required: true, minLength: 2, maxLength: 100 },
        { field: 'vendorEmail', pattern: ValidationRules.email.pattern, custom: ValidationRules.email.custom },
        { field: 'taxRate', custom: ValidationRules.percentage.custom },
        { field: 'expectedDeliveryDate', custom: ValidationRules.date.custom }
      ])

      const sanitizedData = FormUtils.sanitizeFormData(formData)
      const validationResult = validator.validate(sanitizedData)

      if (!validationResult.isValid) {
        ErrorHandler.showValidationErrors(validationResult.errors)
        return
      }

      // Validate items
      const itemErrors: string[] = []
      items.forEach((item, index) => {
        if (!item.description.trim()) {
          itemErrors.push(`Item ${index + 1}: Description is required`)
        }
        if (item.quantity <= 0) {
          itemErrors.push(`Item ${index + 1}: Quantity must be greater than 0`)
        }
        if (item.unitPrice < 0) {
          itemErrors.push(`Item ${index + 1}: Unit price cannot be negative`)
        }
      })

      if (itemErrors.length > 0) {
        ErrorHandler.showValidationErrors(itemErrors)
        return
      }

      if (!blink.auth.isAuthenticated()) {
        setError('Please sign in to create purchase orders')
        return
      }

      const user = await blink.auth.me()
      const { subtotal, taxAmount, total } = calculateTotals()
      const poNumber = generatePONumber()
      const purchaseOrderId = generateId('po')

      console.log('Creating purchase order with data:', {
        id: purchaseOrderId,
        userId: user.id,
        poNumber,
        vendorName: formData.vendorName,
        vendorEmail: formData.vendorEmail || null,
        vendorAddress: formData.vendorAddress || null,
        issueDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: formData.expectedDeliveryDate || null,
        paymentTerms: formData.paymentTerms,
        subtotal: Number(subtotal.toFixed(2)),
        taxRate: Number(formData.taxRate),
        taxAmount: Number(taxAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        notes: formData.notes || null,
        status: 'Draft'
      })

      // Create purchase order (let database handle createdAt automatically)
      const purchaseOrder = await blink.db['purchase_orders'].create({
        id: purchaseOrderId,
        userId: user.id,
        poNumber,
        vendorName: formData.vendorName,
        vendorEmail: formData.vendorEmail || null,
        vendorAddress: formData.vendorAddress || null,
        issueDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: formData.expectedDeliveryDate || null,
        paymentTerms: formData.paymentTerms,
        subtotal: Number(subtotal.toFixed(2)),
        taxRate: Number(formData.taxRate),
        taxAmount: Number(taxAmount.toFixed(2)),
        total: Number(total.toFixed(2)),
        notes: formData.notes || null,
        status: 'Draft'
      })

      console.log('Purchase order created:', purchaseOrder)

      // Create purchase order items
      for (const item of items) {
        const itemId = generateId('poi')
        const lineTotal = item.quantity * item.unitPrice

        console.log('Creating purchase order item:', {
          id: itemId,
          purchaseOrderId: purchaseOrderId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice.toFixed(2)),
          lineTotal: Number(lineTotal.toFixed(2))
        })

        await blink.db['purchase_order_items'].create({
          id: itemId,
          purchaseOrderId: purchaseOrderId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice.toFixed(2)),
          lineTotal: Number(lineTotal.toFixed(2))
        })
      }

      console.log('Purchase order created successfully!')
      
      // Show success message
      ErrorHandler.showSuccess('created', 'Purchase Order')
      
      // Reload purchase orders and reset form
      await loadPurchaseOrders()
      resetForm()
      
    } catch (err: any) {
      console.error('Error creating purchase order:', err)
      ErrorHandler.showDatabaseError('create purchase order', err)
    } finally {
      setSubmitting(false)
    }
  }

  const sendPOToVendor = async (po: PurchaseOrder) => {
    try {
      if (!po.vendorEmail) {
        setError('Vendor email is required to send purchase order')
        return
      }

      // Get company profile for email template
      const user = await blink.auth.me()
      const companyProfile = {
        companyName: 'Buck AI Accounting',
        email: user.email,
        phone: '(555) 123-4567',
        website: 'https://buckaiplatform.com',
        address: '123 Business St, Suite 100, City, State 12345',
        contactPerson: user.displayName || 'Purchasing Department'
      }

      // Send purchase order via email with professional template
      const emailResult = await EmailIntegrationService.sendPurchaseOrder(
        po,
        companyProfile,
        po.vendorEmail
      )

      if (emailResult.success) {
        // Update status to sent
        await blink.db['purchase_orders'].update(po.id, { status: 'Sent' })
        
        // Show success message
        ErrorHandler.showSuccess('sent', 'Purchase Order')
        
        // Reload purchase orders
        await loadPurchaseOrders()
      } else {
        throw new Error(emailResult.error || 'Email sending failed')
      }
    } catch (err: any) {
      console.error('Error sending purchase order:', err)
      setError(`Failed to send purchase order: ${err.message}`)
    }
  }

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All Status' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const { subtotal, taxAmount, total } = calculateTotals()

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {!showForm ? (
        <>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
              <p className="text-gray-600">Manage your purchase orders and vendor relationships</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Purchase Order
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search purchase orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option>All Status</option>
                    <option>Draft</option>
                    <option>Sent</option>
                    <option>Received</option>
                    <option>Paid</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Purchase Orders</h2>
                <span className="text-gray-500">{filteredOrders.length} purchase orders</span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first purchase order</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create your first purchase order
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">PO Number</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Vendor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-blue-600">{order.poNumber}</td>
                          <td className="py-3 px-4">{order.vendorName}</td>
                          <td className="py-3 px-4">{new Date(order.issueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium">${order.total.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                              order.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Received' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {order.vendorEmail && (
                                <button
                                  onClick={() => sendPOToVendor(order)}
                                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                  title="Send to Vendor"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Create Purchase Order</h2>
            <p className="text-gray-600 mt-1">Create a new purchase order for your vendor</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Vendor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter vendor name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Email
                </label>
                <input
                  type="email"
                  value={formData.vendorEmail}
                  onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="vendor@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Address
              </label>
              <textarea
                value={formData.vendorAddress}
                onChange={(e) => setFormData({ ...formData, vendorAddress: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter vendor address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => updateItemTotal(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Item description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItemTotal(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItemTotal(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line Total
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-blue-600 font-medium">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="ml-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-lg px-4 py-2 w-full justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Item
              </button>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Net 30">Net 30</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes or instructions..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrders