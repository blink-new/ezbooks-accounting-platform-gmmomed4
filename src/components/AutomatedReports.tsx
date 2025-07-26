import React, { useState, useEffect } from 'react';
import { createClient } from '@blinkdotnew/sdk';
import { Plus, Mail, Clock, Settings, Trash2, Edit, Bell, BellOff } from 'lucide-react';
import { NotificationScheduler, NotificationSettings } from '@/lib/notificationScheduler';

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
});

const AutomatedReports: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    reportType: 'financial_summary' as const,
    frequency: 'daily' as const,
    enabled: true,
    emailAddress: '',
    timeOfDay: '09:00',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    monthOfYear: 1 // January
  });

  const reportTypes = [
    { value: 'financial_summary', label: '📊 Financial Summary', description: 'Revenue, expenses, and net income overview' },
    { value: 'cash_flow', label: '💰 Cash Flow Report', description: 'Cash inflows and outflows analysis' },
    { value: 'overdue_invoices', label: '⚠️ Overdue Invoices', description: 'Outstanding invoices and payment reminders' },
    { value: 'expense_alerts', label: '💳 Expense Alerts', description: 'High expense notifications and budget warnings' },
    { value: 'revenue_updates', label: '📈 Revenue Updates', description: 'Revenue trends and growth metrics' },
    { value: 'vendor_payments', label: '🏢 Vendor Payments', description: 'Upcoming vendor payments and due dates' }
  ];

  const frequencies = [
    { value: 'hourly', label: 'Hourly', description: 'Every hour (business hours only)' },
    { value: 'daily', label: 'Daily', description: 'Once per day at specified time' },
    { value: 'weekly', label: 'Weekly', description: 'Once per week on specified day' },
    { value: 'monthly', label: 'Monthly', description: 'Once per month on specified date' },
    { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
    { value: 'annual', label: 'Annual', description: 'Once per year' }
  ];

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const user = await blink.auth.me();
      const settings = await NotificationScheduler.getUserNotificationSettings(user.id);
      setNotifications(settings);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const resetForm = () => {
    setFormData({
      reportType: 'financial_summary',
      frequency: 'daily',
      enabled: true,
      emailAddress: '',
      timeOfDay: '09:00',
      dayOfWeek: 1,
      dayOfMonth: 1,
      monthOfYear: 1
    });
    setShowForm(false);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');

      if (!formData.emailAddress.trim()) {
        setError('Email address is required');
        return;
      }

      const user = await blink.auth.me();
      
      if (editingId) {
        // Update existing notification
        await NotificationScheduler.updateNotificationSetting(editingId, {
          ...formData,
          emailAddress: formData.emailAddress || user.email
        });
        setSuccess('Notification setting updated successfully!');
      } else {
        // Create new notification
        await NotificationScheduler.createNotificationSetting({
          ...formData,
          userId: user.id,
          emailAddress: formData.emailAddress || user.email
        });
        setSuccess('Automated report created successfully!');
      }

      await loadNotifications();
      resetForm();
    } catch (err: any) {
      console.error('Error saving notification:', err);
      setError(`Failed to save notification: ${err.message}`);
    }
  };

  const handleEdit = (notification: NotificationSettings) => {
    setFormData({
      reportType: notification.reportType,
      frequency: notification.frequency,
      enabled: notification.enabled,
      emailAddress: notification.emailAddress,
      timeOfDay: notification.timeOfDay || '09:00',
      dayOfWeek: notification.dayOfWeek || 1,
      dayOfMonth: notification.dayOfMonth || 1,
      monthOfYear: notification.monthOfYear || 1
    });
    setEditingId(notification.id!);
    setShowForm(true);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await NotificationScheduler.updateNotificationSetting(id, { enabled });
      await loadNotifications();
      setSuccess(`Notification ${enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (err: any) {
      setError(`Failed to update notification: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automated report?')) return;
    
    try {
      await NotificationScheduler.deleteNotificationSetting(id);
      await loadNotifications();
      setSuccess('Automated report deleted successfully!');
    } catch (err: any) {
      setError(`Failed to delete notification: ${err.message}`);
    }
  };

  const sendTestReport = async (notification: NotificationSettings) => {
    try {
      setError('');
      setSuccess('');
      
      const success = await NotificationScheduler.sendScheduledReport(notification);
      
      if (success) {
        setSuccess('Test report sent successfully! Check your email.');
        await loadNotifications(); // Refresh to update lastSent timestamp
      } else {
        setError('Failed to send test report. Please try again.');
      }
    } catch (err: any) {
      setError(`Failed to send test report: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📧 Automated Reports</h2>
          <p className="text-gray-600">Set up automated email reports to stay informed about your business finances</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Automated Report
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Automated Report' : 'Create New Automated Report'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type *
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {reportTypes.find(t => t.value === formData.reportType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {frequencies.find(f => f.value === formData.frequency)?.description}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address for reports"
                required
              />
            </div>

            {(formData.frequency === 'daily' || formData.frequency === 'weekly' || formData.frequency === 'monthly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time of Day
                </label>
                <input
                  type="time"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Month
                </label>
                <select
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                Enable this automated report
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingId ? 'Update Report' : 'Create Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Automated Reports</h3>
          <p className="text-gray-600 mt-1">{notifications.length} automated report{notifications.length !== 1 ? 's' : ''} configured</p>
        </div>

        <div className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Mail className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No automated reports yet</h3>
              <p className="text-gray-500 mb-4">Set up your first automated report to stay informed about your business</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create your first automated report
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const reportType = reportTypes.find(t => t.value === notification.reportType);
                const frequency = frequencies.find(f => f.value === notification.frequency);
                
                return (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${notification.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {notification.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{reportType?.label}</h4>
                            <p className="text-sm text-gray-500">{reportType?.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{frequency?.label}</span>
                            {notification.timeOfDay && (
                              <span>at {notification.timeOfDay}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{notification.emailAddress}</span>
                          </div>
                        </div>
                        
                        {notification.lastSent && (
                          <p className="text-xs text-gray-500 mt-2">
                            Last sent: {new Date(notification.lastSent).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => sendTestReport(notification)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send Test Report"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(notification.id!, !notification.enabled)}
                          className={`p-2 rounded-lg transition-colors ${
                            notification.enabled 
                              ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          }`}
                          title={notification.enabled ? 'Disable' : 'Enable'}
                        >
                          {notification.enabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(notification)}
                          className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notification.id!)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomatedReports;