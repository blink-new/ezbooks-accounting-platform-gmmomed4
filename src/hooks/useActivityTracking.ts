import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { blink } from '@/blink/client';

interface ActivityData {
  action_type: string;
  action_details?: any;
  page_url?: string;
}

export function useActivityTracking() {
  const { user } = useAuth();

  const updateUserAnalytics = useCallback(async (actionType: string) => {
    if (!user?.id) return;

    try {
      // Get or create user analytics record
      const userAnalytics = await blink.db.user_analytics.list({
        where: { user_id: user.id },
        limit: 1
      });

      if (!userAnalytics || userAnalytics.length === 0) {
        // Create new analytics record
        await blink.db.user_analytics.create({
          user_id: user.id,
          email: user.email,
          display_name: user.displayName || user.name,
          last_active: new Date().toISOString(),
          session_count: 1
        });
        return;
      }

      const analytics = userAnalytics[0];
      const updates: any = {
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update specific counters based on action type
      switch (actionType) {
        case 'transaction_create':
          updates.total_transactions = (analytics.total_transactions || 0) + 1;
          break;
        case 'invoice_create':
          updates.total_invoices = (analytics.total_invoices || 0) + 1;
          break;
        case 'customer_create':
          updates.total_customers = (analytics.total_customers || 0) + 1;
          break;
        case 'ai_chat':
          updates.ai_conversations = (analytics.ai_conversations || 0) + 1;
          break;
        case 'voice_command':
          updates.voice_commands = (analytics.voice_commands || 0) + 1;
          break;
        case 'dashboard_visit':
          updates.dashboard_visits = (analytics.dashboard_visits || 0) + 1;
          break;
        case 'report_generate':
          updates.reports_generated = (analytics.reports_generated || 0) + 1;
          break;
        case 'settings_access':
          updates.settings_accessed = (analytics.settings_accessed || 0) + 1;
          break;
        case 'login':
          updates.session_count = (analytics.session_count || 0) + 1;
          updates.last_login = new Date().toISOString();
          break;
      }

      await blink.db.user_analytics.update(analytics.id, updates);
    } catch (error) {
      console.error('Failed to update user analytics:', error);
    }
  }, [user?.id, user?.email, user?.displayName, user?.name]);

  const trackActivity = useCallback(async (activityData: ActivityData) => {
    if (!user?.id) return;

    try {
      // Log to activity_log table
      await blink.db.activity_log.create({
        user_id: user.id,
        action_type: activityData.action_type,
        action_details: JSON.stringify(activityData.action_details || {}),
        page_url: activityData.page_url || window.location.pathname,
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || 'unknown',
        timestamp: new Date().toISOString()
      });

      // Update user analytics
      await updateUserAnalytics(activityData.action_type);
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }, [user?.id, updateUserAnalytics]);

  // Track page visits automatically
  useEffect(() => {
    if (!user?.id) return;

    const currentPath = window.location.pathname;
    let actionType = 'page_visit';

    // Map specific pages to action types
    if (currentPath === '/') actionType = 'dashboard_visit';
    else if (currentPath === '/transactions') actionType = 'transactions_page';
    else if (currentPath === '/invoices') actionType = 'invoices_page';
    else if (currentPath === '/customers') actionType = 'customers_page';
    else if (currentPath === '/reports') actionType = 'reports_page';
    else if (currentPath === '/ai-assistant') actionType = 'ai_assistant_page';
    else if (currentPath === '/settings') actionType = 'settings_access';

    trackActivity({
      action_type: actionType,
      action_details: { path: currentPath }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Track session start
  useEffect(() => {
    if (!user?.id) return;

    // Generate session ID if not exists
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }

    trackActivity({
      action_type: 'session_start',
      action_details: { 
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language
      }
    });

    // Track session end on page unload
    const handleBeforeUnload = () => {
      trackActivity({
        action_type: 'session_end',
        action_details: { 
          timestamp: new Date().toISOString(),
          session_duration: Date.now() - parseInt(sessionStorage.getItem('session_start') || '0')
        }
      });
    };

    sessionStorage.setItem('session_start', Date.now().toString());
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { trackActivity };
}

// Convenience functions for common activities
export const useTransactionTracking = () => {
  const { trackActivity } = useActivityTracking();
  
  return {
    trackTransactionCreate: (amount: number, category: string) => 
      trackActivity({
        action_type: 'transaction_create',
        action_details: { amount, category }
      }),
    trackTransactionEdit: (id: string, changes: any) =>
      trackActivity({
        action_type: 'transaction_edit',
        action_details: { transaction_id: id, changes }
      }),
    trackTransactionDelete: (id: string) =>
      trackActivity({
        action_type: 'transaction_delete',
        action_details: { transaction_id: id }
      })
  };
};

export const useAITracking = () => {
  const { trackActivity } = useActivityTracking();
  
  return {
    trackAIChat: (message: string, responseTime?: number) =>
      trackActivity({
        action_type: 'ai_chat',
        action_details: { 
          message_length: message.length,
          response_time: responseTime,
          timestamp: new Date().toISOString()
        }
      }),
    trackVoiceCommand: (command: string, language?: string) =>
      trackActivity({
        action_type: 'voice_command',
        action_details: { 
          command_length: command.length,
          language: language || 'en',
          timestamp: new Date().toISOString()
        }
      })
  };
};

export const useInvoiceTracking = () => {
  const { trackActivity } = useActivityTracking();
  
  return {
    trackInvoiceCreate: (amount: number, customer: string) =>
      trackActivity({
        action_type: 'invoice_create',
        action_details: { amount, customer }
      }),
    trackInvoiceSend: (invoiceId: string, customer: string) =>
      trackActivity({
        action_type: 'invoice_send',
        action_details: { invoice_id: invoiceId, customer }
      }),
    trackInvoicePayment: (invoiceId: string, amount: number) =>
      trackActivity({
        action_type: 'invoice_payment',
        action_details: { invoice_id: invoiceId, amount }
      })
  };
};