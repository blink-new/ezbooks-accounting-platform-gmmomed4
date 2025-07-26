import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

export interface InvoiceItem {
  id: string
  invoiceId: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  userId: string
  customerId: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  terms?: string
  createdAt: string
  updatedAt: string
}

export function useInvoices(userId?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadInvoices = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const data = await blink.db.invoices.list({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      setInvoices(data)
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadInvoiceItems = useCallback(async (invoiceId: string) => {
    try {
      const items = await blink.db.invoiceItems.list({
        where: { invoiceId },
        orderBy: { id: 'asc' }
      })
      setInvoiceItems(items)
      return items
    } catch (error) {
      console.error('Error loading invoice items:', error)
      return []
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadInvoices(userId)
    }
  }, [userId, loadInvoices])

  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now().toString().slice(-4)
    return `INV-${year}${month}-${timestamp}`
  }

  const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>, items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]) => {
    if (!userId) return { success: false, error: 'User ID required' }

    setSaving(true)
    try {
      const invoiceId = `inv_${Date.now()}`
      const invoiceNumber = generateInvoiceNumber()
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
      const taxAmount = subtotal * (invoiceData.taxRate / 100)
      const total = subtotal + taxAmount

      const newInvoice = {
        ...invoiceData,
        id: invoiceId,
        invoiceNumber,
        userId,
        subtotal,
        taxAmount,
        total,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Create invoice
      await blink.db.invoices.create(newInvoice)
      
      // Create invoice items
      const invoiceItems = items.map((item, index) => ({
        ...item,
        id: `item_${Date.now()}_${index}`,
        invoiceId
      }))
      
      await blink.db.invoiceItems.createMany(invoiceItems)
      
      setInvoices(prev => [newInvoice, ...prev])
      
      toast({
        title: 'Success',
        description: 'Invoice created successfully'
      })
      return { success: true, invoice: newInvoice }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const updateInvoice = async (id: string, updates: Partial<Invoice>, items?: Omit<InvoiceItem, 'id' | 'invoiceId'>[]) => {
    setSaving(true)
    try {
      let updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // If items are provided, recalculate totals
      if (items) {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
        const taxAmount = subtotal * ((updates.taxRate || 0) / 100)
        const total = subtotal + taxAmount
        
        updatedData = {
          ...updatedData,
          subtotal,
          taxAmount,
          total
        }

        // Delete existing items and create new ones
        const existingItems = await blink.db.invoiceItems.list({
          where: { invoiceId: id }
        })
        
        for (const item of existingItems) {
          await blink.db.invoiceItems.delete(item.id)
        }
        
        const newItems = items.map((item, index) => ({
          ...item,
          id: `item_${Date.now()}_${index}`,
          invoiceId: id
        }))
        
        await blink.db.invoiceItems.createMany(newItems)
      }

      await blink.db.invoices.update(id, updatedData)
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updatedData } : inv))
      
      toast({
        title: 'Success',
        description: 'Invoice updated successfully'
      })
      return { success: true }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      // Delete invoice items first
      const items = await blink.db.invoiceItems.list({
        where: { invoiceId: id }
      })
      
      for (const item of items) {
        await blink.db.invoiceItems.delete(item.id)
      }
      
      // Delete invoice
      await blink.db.invoices.delete(id)
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully'
      })
      return { success: true }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  const markAsPaid = async (id: string) => {
    return updateInvoice(id, { status: 'paid' })
  }

  const sendInvoice = async (id: string) => {
    return updateInvoice(id, { status: 'sent' })
  }

  const getInvoiceStats = () => {
    const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total), 0)
    const pendingAmount = invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + Number(inv.total), 0)
    const overdueAmount = invoices
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + Number(inv.total), 0)

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalCount: invoices.length,
      paidCount: invoices.filter(inv => inv.status === 'paid').length,
      pendingCount: invoices.filter(inv => inv.status === 'sent').length,
      overdueCount: invoices.filter(inv => inv.status === 'overdue').length
    }
  }

  const exportInvoices = (format: 'csv' | 'json' = 'csv') => {
    if (format === 'csv') {
      const csvContent = [
        ['Invoice Number', 'Customer ID', 'Issue Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total'],
        ...invoices.map(inv => [
          inv.invoiceNumber,
          inv.customerId,
          inv.issueDate,
          inv.dueDate,
          inv.status,
          inv.subtotal.toString(),
          inv.taxAmount.toString(),
          inv.total.toString()
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const jsonContent = JSON.stringify(invoices, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  return {
    invoices,
    invoiceItems,
    loading,
    saving,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markAsPaid,
    sendInvoice,
    loadInvoiceItems,
    getInvoiceStats,
    exportInvoices,
    refreshInvoices: () => userId && loadInvoices(userId)
  }
}