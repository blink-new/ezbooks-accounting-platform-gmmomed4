import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

export interface Customer {
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
  taxId: string
  notes: string
  createdAt: string
  updatedAt: string
}

export function useCustomers(userId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadCustomers = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const data = await blink.db.customers.list({
        where: { userId },
        orderBy: { name: 'asc' }
      })
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (userId) {
      loadCustomers(userId)
    }
  }, [userId, loadCustomers])

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return { success: false, error: 'User ID required' }

    setSaving(true)
    try {
      const newCustomer = {
        ...customerData,
        id: `cust_${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.customers.create(newCustomer)
      setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)))
      
      toast({
        title: 'Success',
        description: 'Customer created successfully'
      })
      return { success: true, customer: newCustomer }
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    setSaving(true)
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await blink.db.customers.update(id, updatedData)
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c)
        .sort((a, b) => a.name.localeCompare(b.name)))
      
      toast({
        title: 'Success',
        description: 'Customer updated successfully'
      })
      return { success: true }
    } catch (error) {
      console.error('Error updating customer:', error)
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const deleteCustomer = async (id: string) => {
    try {
      // Check if customer has any invoices
      const invoices = await blink.db.invoices.list({
        where: { customerId: id }
      })

      if (invoices.length > 0) {
        toast({
          title: 'Cannot Delete',
          description: 'Customer has existing invoices. Please delete or reassign invoices first.',
          variant: 'destructive'
        })
        return { success: false, error: 'Customer has existing invoices' }
      }

      await blink.db.customers.delete(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
      
      toast({
        title: 'Success',
        description: 'Customer deleted successfully'
      })
      return { success: true }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  const getCustomerById = (id: string) => {
    return customers.find(c => c.id === id)
  }

  const searchCustomers = (query: string) => {
    if (!query.trim()) return customers
    
    const lowercaseQuery = query.toLowerCase()
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(lowercaseQuery) ||
      customer.email.toLowerCase().includes(lowercaseQuery) ||
      customer.company.toLowerCase().includes(lowercaseQuery) ||
      customer.phone.includes(query)
    )
  }

  const getCustomerStats = async () => {
    if (!userId) return null

    try {
      // Get all invoices for this user
      const invoices = await blink.db.invoices.list({
        where: { userId }
      })

      // Calculate stats per customer
      const customerStats = customers.map(customer => {
        const customerInvoices = invoices.filter(inv => inv.customerId === customer.id)
        const totalAmount = customerInvoices.reduce((sum, inv) => sum + Number(inv.total), 0)
        const paidAmount = customerInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.total), 0)
        const pendingAmount = customerInvoices
          .filter(inv => inv.status === 'sent')
          .reduce((sum, inv) => sum + Number(inv.total), 0)

        return {
          customerId: customer.id,
          customerName: customer.name,
          totalInvoices: customerInvoices.length,
          totalAmount,
          paidAmount,
          pendingAmount,
          lastInvoiceDate: customerInvoices.length > 0 
            ? Math.max(...customerInvoices.map(inv => new Date(inv.createdAt).getTime()))
            : null
        }
      })

      return customerStats
    } catch (error) {
      console.error('Error calculating customer stats:', error)
      return null
    }
  }

  const exportCustomers = (format: 'csv' | 'json' = 'csv') => {
    if (format === 'csv') {
      const csvContent = [
        ['Name', 'Email', 'Phone', 'Company', 'Address', 'City', 'State', 'ZIP', 'Country', 'Tax ID'],
        ...customers.map(c => [
          c.name,
          c.email,
          c.phone,
          c.company,
          c.address,
          c.city,
          c.state,
          c.zipCode,
          c.country,
          c.taxId
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const jsonContent = JSON.stringify(customers, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const importCustomers = async (file: File) => {
    if (!userId) return { success: false, error: 'User ID required' }

    try {
      const text = await file.text()
      let customersData: any[] = []

      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim())
            const customer: any = { userId }
            
            headers.forEach((header, index) => {
              const key = header.toLowerCase().replace(/\s+/g, '')
              customer[key] = values[index] || ''
            })
            
            customersData.push(customer)
          }
        }
      } else if (file.name.endsWith('.json')) {
        customersData = JSON.parse(text)
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.')
      }

      // Validate and create customers
      let successCount = 0
      let errorCount = 0

      for (const customerData of customersData) {
        try {
          if (customerData.name && customerData.email) {
            await createCustomer({
              ...customerData,
              id: undefined, // Let createCustomer generate the ID
              createdAt: undefined,
              updatedAt: undefined
            })
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${successCount} customers. ${errorCount} errors.`
      })

      return { success: true, imported: successCount, errors: errorCount }
    } catch (error) {
      console.error('Error importing customers:', error)
      toast({
        title: 'Import Failed',
        description: 'Failed to import customers. Please check the file format.',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  return {
    customers,
    loading,
    saving,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    searchCustomers,
    getCustomerStats,
    exportCustomers,
    importCustomers,
    refreshCustomers: () => userId && loadCustomers(userId)
  }
}