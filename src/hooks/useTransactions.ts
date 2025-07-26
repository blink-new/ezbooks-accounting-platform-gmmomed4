import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

export interface Transaction {
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

export function useTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadTransactions = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const data = await blink.db.transactions.list({
        where: { userId },
        orderBy: { date: 'desc' }
      })
      setTransactions(data)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (userId) {
      loadTransactions(userId)
    }
  }, [userId, loadTransactions])

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return { success: false, error: 'User ID required' }

    setSaving(true)
    try {
      const newTransaction = {
        ...transactionData,
        id: `txn_${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.transactions.create(newTransaction)
      setTransactions(prev => [newTransaction, ...prev])
      
      toast({
        title: 'Success',
        description: 'Transaction created successfully'
      })
      return { success: true, transaction: newTransaction }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to create transaction',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setSaving(true)
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }

      await blink.db.transactions.update(id, updatedData)
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t))
      
      toast({
        title: 'Success',
        description: 'Transaction updated successfully'
      })
      return { success: true }
    } catch (error) {
      console.error('Error updating transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to update transaction',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setSaving(false)
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      await blink.db.transactions.delete(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      
      toast({
        title: 'Success',
        description: 'Transaction deleted successfully'
      })
      return { success: true }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete transaction',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  const uploadAttachment = async (transactionId: string, file: File) => {
    if (!userId) return { success: false, error: 'User ID required' }

    try {
      const { publicUrl } = await blink.storage.upload(
        file,
        `transactions/${userId}/${transactionId}/${file.name}`,
        { upsert: true }
      )
      
      await updateTransaction(transactionId, { attachmentUrl: publicUrl })
      
      toast({
        title: 'Success',
        description: 'Attachment uploaded successfully'
      })
      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading attachment:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload attachment',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  const getTransactionStats = () => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      transactionCount: transactions.length,
      incomeCount: transactions.filter(t => t.type === 'income').length,
      expenseCount: transactions.filter(t => t.type === 'expense').length
    }
  }

  const exportTransactions = (format: 'csv' | 'json' = 'csv') => {
    if (format === 'csv') {
      const csvContent = [
        ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment Method', 'Reference'],
        ...transactions.map(t => [
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
    } else {
      const jsonContent = JSON.stringify(transactions, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  return {
    transactions,
    loading,
    saving,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    uploadAttachment,
    getTransactionStats,
    exportTransactions,
    refreshTransactions: () => userId && loadTransactions(userId)
  }
}