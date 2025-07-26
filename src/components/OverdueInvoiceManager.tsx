import React, { useState, useEffect } from 'react';
import { Mail, Clock, AlertTriangle, Send, CheckCircle, Users, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@blinkdotnew/sdk';
import { EmailIntegrationService } from '../lib/emailIntegration';

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
});

interface OverdueInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  total: number;
  due_date: string;
  issue_date: string;
  status: string;
  daysPastDue: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const OverdueInvoiceManager: React.FC = () => {
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [reminderResults, setReminderResults] = useState<any>(null);

  const loadOverdueInvoices = async () => {
    try {
      setLoading(true);
      const user = await blink.auth.me();
      
      // Get all sent invoices
      const invoices = await blink.db.invoices.list({
        where: { 
          AND: [
            { user_id: user.id },
            { status: 'sent' }
          ]
        },
        orderBy: { due_date: 'asc' }
      });

      // Get customers for name lookup
      const customerData = await blink.db.customers.list({
        where: { user_id: user.id }
      });
      setCustomers(customerData);

      // Calculate overdue invoices
      const today = new Date();
      const overdue = invoices
        .map(invoice => {
          const dueDate = new Date(invoice.due_date);
          const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysPastDue > 0) {
            const customer = customerData.find(c => c.id === invoice.customer_id);
            
            let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
            if (daysPastDue > 90) urgencyLevel = 'CRITICAL';
            else if (daysPastDue > 60) urgencyLevel = 'HIGH';
            else if (daysPastDue > 30) urgencyLevel = 'MEDIUM';

            return {
              ...invoice,
              customerName: customer?.name || 'Unknown Customer',
              customerEmail: customer?.email || '',
              daysPastDue,
              urgencyLevel
            };
          }
          return null;
        })
        .filter(Boolean) as OverdueInvoice[];

      setOverdueInvoices(overdue);
    } catch (error) {
      console.error('Error loading overdue invoices:', error);
      toast({
        title: "Error loading data",
        description: "Unable to load overdue invoices.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverdueInvoices();
  }, []);

  const sendSingleReminder = async (invoice: OverdueInvoice) => {
    try {
      if (!invoice.customerEmail) {
        toast({
          title: "Missing email",
          description: `No email address found for ${invoice.customerName}`,
          variant: "destructive"
        });
        return;
      }

      const user = await blink.auth.me();
      const companyProfile = {
        companyName: 'Buck AI Accounting',
        email: user.email,
        phone: '(555) 123-4567',
        website: 'https://buckaiplatform.com',
        address: '123 Business St, Suite 100, City, State 12345',
        contactPerson: user.displayName || 'Accounts Receivable'
      };

      const emailResult = await EmailIntegrationService.sendOverdueReminder(
        invoice,
        companyProfile,
        invoice.daysPastDue,
        invoice.customerEmail
      );

      if (emailResult.success) {
        toast({
          title: "Reminder sent! 📧",
          description: `Overdue notice sent to ${invoice.customerName}`,
        });
      } else {
        throw new Error(emailResult.error || 'Email sending failed');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Send failed",
        description: `Unable to send reminder: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const sendBulkReminders = async () => {
    try {
      setSendingReminders(true);
      const user = await blink.auth.me();
      const companyProfile = {
        companyName: 'Buck AI Accounting',
        email: user.email,
        phone: '(555) 123-4567',
        website: 'https://buckaiplatform.com',
        address: '123 Business St, Suite 100, City, State 12345',
        contactPerson: user.displayName || 'Accounts Receivable'
      };

      const results = [];
      const invoicesToProcess = selectedInvoices.length > 0 
        ? overdueInvoices.filter(inv => selectedInvoices.includes(inv.id))
        : overdueInvoices.filter(inv => inv.customerEmail);

      for (const invoice of invoicesToProcess) {
        try {
          const emailResult = await EmailIntegrationService.sendOverdueReminder(
            invoice,
            companyProfile,
            invoice.daysPastDue,
            invoice.customerEmail
          );

          results.push({
            invoiceNumber: invoice.invoice_number,
            customerName: invoice.customerName,
            daysPastDue: invoice.daysPastDue,
            emailSent: emailResult.success,
            error: emailResult.error
          });

          // Add delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          results.push({
            invoiceNumber: invoice.invoice_number,
            customerName: invoice.customerName,
            daysPastDue: invoice.daysPastDue,
            emailSent: false,
            error: error.message
          });
        }
      }

      setReminderResults({
        totalProcessed: results.length,
        successful: results.filter(r => r.emailSent).length,
        failed: results.filter(r => !r.emailSent).length,
        results
      });

      toast({
        title: "Bulk reminders completed! 📧",
        description: `Sent ${results.filter(r => r.emailSent).length} of ${results.length} reminders`,
      });
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
      toast({
        title: "Bulk send failed",
        description: `Unable to send reminders: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSendingReminders(false);
    }
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const selectAllInvoices = () => {
    const invoicesWithEmail = overdueInvoices.filter(inv => inv.customerEmail);
    setSelectedInvoices(invoicesWithEmail.map(inv => inv.id));
  };

  const clearSelection = () => {
    setSelectedInvoices([]);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const criticalInvoices = overdueInvoices.filter(inv => inv.urgencyLevel === 'CRITICAL').length;
  const invoicesWithEmail = overdueInvoices.filter(inv => inv.customerEmail).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overdue Invoice Manager</h1>
          <p className="text-gray-600 mt-1">
            Send professional overdue payment reminders to customers
          </p>
        </div>
        
        {overdueInvoices.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Mail className="w-4 h-4 mr-2" />
                Send Bulk Reminders
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Bulk Overdue Reminders</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Select invoices to send reminders for:
                  </p>
                  <div className="space-x-2">
                    <Button onClick={selectAllInvoices} variant="outline" size="sm">
                      Select All ({invoicesWithEmail})
                    </Button>
                    <Button onClick={clearSelection} variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {overdueInvoices.filter(inv => inv.customerEmail).map(invoice => (
                    <div key={invoice.id} className="flex items-center p-3 border-b last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">#{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-600">
                          {invoice.customerName} • ${invoice.total.toFixed(2)} • {invoice.daysPastDue} days overdue
                        </div>
                      </div>
                      <Badge className={getUrgencyColor(invoice.urgencyLevel)}>
                        {invoice.urgencyLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={sendBulkReminders}
                    disabled={sendingReminders || selectedInvoices.length === 0}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {sendingReminders ? 'Sending...' : `Send ${selectedInvoices.length} Reminders`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Overdue</p>
                <p className="text-2xl font-bold text-red-600">${totalOverdueAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Invoices</p>
                <p className="text-2xl font-bold text-orange-600">{overdueInvoices.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical (90+ days)</p>
                <p className="text-2xl font-bold text-red-600">{criticalInvoices}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Email</p>
                <p className="text-2xl font-bold text-blue-600">{invoicesWithEmail}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Overdue Invoices! 🎉</h3>
              <p className="text-gray-500">All your invoices are up to date. Great job!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueInvoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">#{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.customerName}</div>
                        <div className="text-sm text-gray-500">{invoice.customerEmail || 'No email'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${invoice.total.toFixed(2)}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="font-medium text-red-600">{invoice.daysPastDue} days</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(invoice.urgencyLevel)}>
                        {invoice.urgencyLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => sendSingleReminder(invoice)}
                        disabled={!invoice.customerEmail}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send Reminder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      {reminderResults && (
        <Dialog open={!!reminderResults} onOpenChange={() => setReminderResults(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Reminder Results</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{reminderResults.successful}</div>
                  <div className="text-sm text-green-700">Sent Successfully</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{reminderResults.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reminderResults.totalProcessed}</div>
                  <div className="text-sm text-blue-700">Total Processed</div>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {reminderResults.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b">
                    <div>
                      <div className="font-medium">#{result.invoiceNumber}</div>
                      <div className="text-sm text-gray-600">{result.customerName}</div>
                    </div>
                    <div className="text-right">
                      {result.emailSent ? (
                        <Badge className="bg-green-100 text-green-800">Sent</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Failed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OverdueInvoiceManager;