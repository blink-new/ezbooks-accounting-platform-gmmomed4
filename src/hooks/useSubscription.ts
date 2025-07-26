import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import blink from '@/blink/client'

export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: string
  updatedAt: string
}

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Up to 5 transactions per month',
      'Basic reporting',
      'Email support',
      '1 user account'
    ],
    limits: {
      transactions: 5,
      invoices: 2,
      customers: 10,
      storage: '100MB'
    }
  },
  starter: {
    name: 'Starter',
    price: 15,
    features: [
      'Unlimited transactions',
      'Advanced reporting',
      'Invoice generation',
      'Customer management',
      'Email support',
      '1 user account'
    ],
    limits: {
      transactions: -1, // unlimited
      invoices: -1,
      customers: -1,
      storage: '1GB'
    }
  },
  pro: {
    name: 'Pro',
    price: 35,
    features: [
      'Everything in Starter',
      'AI-powered insights',
      'Automated categorization',
      'Advanced analytics',
      'Priority support',
      'Up to 3 user accounts',
      'API access'
    ],
    limits: {
      transactions: -1,
      invoices: -1,
      customers: -1,
      storage: '10GB',
      users: 3
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 75,
    features: [
      'Everything in Pro',
      'AI autonomous task handling',
      'Custom integrations',
      'Dedicated support',
      'Unlimited user accounts',
      'Advanced security',
      'Custom reporting'
    ],
    limits: {
      transactions: -1,
      invoices: -1,
      customers: -1,
      storage: '100GB',
      users: -1
    }
  }
}

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const { toast } = useToast()

  const loadSubscription = useCallback(async (userId: string) => {
    setLoading(true)
    try {
      const subscriptions = await blink.db.userSubscriptions.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 1
      })
      
      if (subscriptions.length > 0) {
        setSubscription(subscriptions[0])
      } else {
        // Create default free subscription
        const freeSubscription = {
          id: `sub_${Date.now()}`,
          userId,
          plan: 'free' as const,
          status: 'active' as const,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await blink.db.userSubscriptions.create(freeSubscription)
        setSubscription(freeSubscription)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (userId) {
      loadSubscription(userId)
    }
  }, [userId, loadSubscription])

  const upgradePlan = async (newPlan: keyof typeof SUBSCRIPTION_PLANS) => {
    if (!userId || !subscription) return { success: false, error: 'No subscription found' }

    setUpgrading(true)
    try {
      // In a real app, this would integrate with Stripe
      // For now, we'll just update the database
      const updatedSubscription = {
        ...subscription,
        plan: newPlan,
        updatedAt: new Date().toISOString()
      }

      await blink.db.userSubscriptions.update(subscription.id, updatedSubscription)
      setSubscription(updatedSubscription)
      
      toast({
        title: 'Success',
        description: `Successfully upgraded to ${SUBSCRIPTION_PLANS[newPlan].name} plan`
      })
      return { success: true }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast({
        title: 'Error',
        description: 'Failed to upgrade plan',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setUpgrading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!subscription) return { success: false, error: 'No subscription found' }

    try {
      const updatedSubscription = {
        ...subscription,
        cancelAtPeriodEnd: true,
        updatedAt: new Date().toISOString()
      }

      await blink.db.userSubscriptions.update(subscription.id, updatedSubscription)
      setSubscription(updatedSubscription)
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the current period'
      })
      return { success: true }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  const reactivateSubscription = async () => {
    if (!subscription) return { success: false, error: 'No subscription found' }

    try {
      const updatedSubscription = {
        ...subscription,
        cancelAtPeriodEnd: false,
        status: 'active' as const,
        updatedAt: new Date().toISOString()
      }

      await blink.db.userSubscriptions.update(subscription.id, updatedSubscription)
      setSubscription(updatedSubscription)
      
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been reactivated'
      })
      return { success: true }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      toast({
        title: 'Error',
        description: 'Failed to reactivate subscription',
        variant: 'destructive'
      })
      return { success: false, error }
    }
  }

  const checkUsageLimits = async () => {
    if (!userId || !subscription) return null

    try {
      const plan = SUBSCRIPTION_PLANS[subscription.plan]
      
      // Get current usage
      const [transactions, invoices, customers] = await Promise.all([
        blink.db.transactions.list({ where: { userId } }),
        blink.db.invoices.list({ where: { userId } }),
        blink.db.customers.list({ where: { userId } })
      ])

      const usage = {
        transactions: transactions.length,
        invoices: invoices.length,
        customers: customers.length
      }

      const limits = {
        transactions: plan.limits.transactions === -1 ? Infinity : plan.limits.transactions,
        invoices: plan.limits.invoices === -1 ? Infinity : plan.limits.invoices,
        customers: plan.limits.customers === -1 ? Infinity : plan.limits.customers
      }

      const isOverLimit = {
        transactions: usage.transactions >= limits.transactions,
        invoices: usage.invoices >= limits.invoices,
        customers: usage.customers >= limits.customers
      }

      return {
        usage,
        limits: plan.limits,
        isOverLimit,
        canCreate: {
          transaction: !isOverLimit.transactions,
          invoice: !isOverLimit.invoices,
          customer: !isOverLimit.customers
        }
      }
    } catch (error) {
      console.error('Error checking usage limits:', error)
      return null
    }
  }

  const getCurrentPlan = () => {
    if (!subscription) return SUBSCRIPTION_PLANS.free
    return SUBSCRIPTION_PLANS[subscription.plan]
  }

  const isFeatureAvailable = (feature: string) => {
    const plan = getCurrentPlan()
    return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()))
  }

  const getDaysUntilRenewal = () => {
    if (!subscription) return null
    const endDate = new Date(subscription.currentPeriodEnd)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return {
    subscription,
    loading,
    upgrading,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription,
    checkUsageLimits,
    getCurrentPlan,
    isFeatureAvailable,
    getDaysUntilRenewal,
    refreshSubscription: () => userId && loadSubscription(userId)
  }
}