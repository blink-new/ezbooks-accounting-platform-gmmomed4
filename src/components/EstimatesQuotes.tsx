import React, { useState, useEffect } from 'react';
import { Plus, Send, Edit, Trash2, FileText, Download, Eye, Mail, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { createClient } from '@blinkdotnew/sdk';
import jsPDF from 'jspdf';
import { EmailIntegrationService } from '../lib/emailIntegration';

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
});

interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Estimate {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  estimateNumber: string;
  title: string;
  description: string;
  items: EstimateItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  validUntil: string;
  notes: string;
  createdAt: string;
  userId: string;
}

const EstimatesQuotes: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Form state
  const [formData, setFormData] = useState<Partial<Estimate>>({
    customerId: '',
    customerName: '',
    customerEmail: '',
    title: '',
    description: '',
    items: [],
    taxRate: 8.5,
    validUntil: '',
    notes: '',
    status: 'draft'
  });

  const loadEstimates = async () => {
    try {
      const user = await blink.auth.me();
      const data = await blink.db.estimates.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      setEstimates(data);
    } catch (error) {
      console.error('Error loading estimates:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const user = await blink.auth.me();
      const data = await blink.db.customers.list({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
      });
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const generateEstimateNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EST-${year}${month}-${random}`;
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerEmail: '',
      title: '',
      description: '',
      items: [],
      taxRate: 8.5,
      validUntil: '',
      notes: '',
      status: 'draft'
    });
    setShowNewCustomerForm(false);
    setNewCustomerData({ name: '', email: '', phone: '', address: '' });
  };

  const generatePDF = (estimate: Estimate) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('ESTIMATE', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Estimate #: ${estimate.estimateNumber}`, 20, 45);
    doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, 20, 55);
    doc.text(`Valid Until: ${new Date(estimate.validUntil).toLocaleDateString()}`, 20, 65);
    
    // Customer info
    doc.text('Bill To:', 20, 85);
    doc.text(estimate.customerName, 20, 95);
    doc.text(estimate.customerEmail, 20, 105);
    
    // Title and description
    doc.setFontSize(14);
    doc.text(estimate.title, 20, 125);
    doc.setFontSize(10);
    doc.text(estimate.description, 20, 135);
    
    // Items table
    let yPos = 155;
    doc.setFontSize(10);
    doc.text('Description', 20, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Rate', 140, yPos);
    doc.text('Amount', 170, yPos);
    
    yPos += 10;
    estimate.items.forEach(item => {
      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`${item.rate.toFixed(2)}`, 140, yPos);
      doc.text(`${item.amount.toFixed(2)}`, 170, yPos);
      yPos += 10;
    });
    
    // Totals
    yPos += 10;
    doc.text(`Subtotal: ${estimate.subtotal.toFixed(2)}`, 140, yPos);
    yPos += 10;
    doc.text(`Tax (${estimate.taxRate}%): ${estimate.taxAmount.toFixed(2)}`, 140, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Total: ${estimate.total.toFixed(2)}`, 140, yPos);
    
    // Notes
    if (estimate.notes) {
      yPos += 20;
      doc.setFontSize(10);
      doc.text('Notes:', 20, yPos);
      doc.text(estimate.notes, 20, yPos + 10);
    }
    
    return doc;
  };

  const addItem = () => {
    const newItem: EstimateItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem]
    });
  };

  const updateItem = (id: string, field: keyof EstimateItem, value: any) => {
    const updatedItems = (formData.items || []).map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (formData.taxRate || 0) / 100;
    const total = subtotal + taxAmount;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      taxAmount,
      total
    });
  };

  const removeItem = (id: string) => {
    const updatedItems = (formData.items || []).filter(item => item.id !== id);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (formData.taxRate || 0) / 100;
    const total = subtotal + taxAmount;

    setFormData({
      ...formData,
      items: updatedItems,
      subtotal,
      taxAmount,
      total
    });
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === 'create_new') {
      setShowNewCustomerForm(true);
      return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData({
        ...formData,
        customerId: customerId,
        customerName: customer.name,
        customerEmail: customer.email
      });
    }
  };

  const createNewCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.email) {
      toast({
        title: "Missing information",
        description: "Please enter customer name and email.",
        variant: "destructive"
      });
      return;
    }

    try {
      const user = await blink.auth.me();
      const customerData = {
        ...newCustomerData,
        userId: user.id,
        createdAt: new Date().toISOString()
      };

      const newCustomer = await blink.db.customers.create(customerData);
      
      // Update customers list
      setCustomers([...customers, newCustomer]);
      
      // Select the new customer
      setFormData({
        ...formData,
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        customerEmail: newCustomer.email
      });
      
      // Reset form and hide
      setNewCustomerData({ name: '', email: '', phone: '', address: '' });
      setShowNewCustomerForm(false);
      
      toast({
        title: "Customer created! 🎉",
        description: `Added ${newCustomer.name} to your customers.`
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Creation failed",
        description: "Unable to create customer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveEstimate = async () => {
    if (!formData.customerId || !formData.title || !formData.items?.length) {
      toast({
        title: "Missing information",
        description: "Please fill in customer, title, and add at least one item.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await blink.auth.me();
      
      const estimateData = {
        ...formData,
        userId: user.id,
        estimateNumber: editingEstimate?.estimateNumber || generateEstimateNumber(),
        createdAt: editingEstimate?.createdAt || new Date().toISOString()
      };

      if (editingEstimate) {
        await blink.db.estimates.update(editingEstimate.id!, estimateData);
        toast({
          title: "Estimate updated! 📝",
          description: `Updated estimate ${estimateData.estimateNumber}`
        });
      } else {
        await blink.db.estimates.create(estimateData);
        toast({
          title: "Estimate created! 🎉",
          description: `Created estimate ${estimateData.estimateNumber}`
        });
      }

      setIsDialogOpen(false);
      setEditingEstimate(null);
      resetForm();
      loadEstimates();
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast({
        title: "Save failed",
        description: "Unable to save estimate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data
  useEffect(() => {
    loadEstimates();
    loadCustomers();
  }, []);

  const sendEstimate = async (estimate: Estimate) => {
    try {
      // Get company profile for email template
      const user = await blink.auth.me();
      const companyProfile = {
        companyName: 'Buck AI Accounting',
        email: user.email,
        phone: '(555) 123-4567',
        website: 'https://buckaiplatform.com',
        address: '123 Business St, Suite 100, City, State 12345',
        contactPerson: user.displayName || 'Accounts Department'
      };

      // Send estimate via email with professional template
      const emailResult = await EmailIntegrationService.sendEstimate(
        estimate,
        companyProfile,
        estimate.customerEmail
      );

      if (emailResult.success) {
        // Update status to sent
        await blink.db.estimates.update(estimate.id!, { status: 'sent' });
        
        toast({
          title: "Estimate sent successfully! 📧",
          description: `Professional estimate ${estimate.estimateNumber} sent to ${estimate.customerEmail}`,
        });
      } else {
        throw new Error(emailResult.error || 'Email sending failed');
      }
      
      loadEstimates();
    } catch (error) {
      console.error('Error sending estimate:', error);
      toast({
        title: "Send failed",
        description: `Unable to send estimate: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const downloadPDF = (estimate: Estimate) => {
    const doc = generatePDF(estimate);
    doc.save(`estimate-${estimate.estimateNumber}.pdf`);
  };

  const editEstimate = (estimate: Estimate) => {
    setEditingEstimate(estimate);
    setFormData(estimate);
    setIsDialogOpen(true);
  };

  const deleteEstimate = async (id: string) => {
    try {
      await blink.db.estimates.delete(id);
      toast({
        title: "Estimate deleted",
        description: "The estimate has been removed."
      });
      loadEstimates();
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast({
        title: "Delete failed",
        description: "Unable to delete estimate.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Estimates & Quotes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingEstimate(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Estimate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEstimate ? 'Edit Estimate' : 'Create New Estimate'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Customer Selection */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer *</Label>
                    <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="create_new" className="text-blue-600 font-medium">
                          + Create New Customer
                        </SelectItem>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                    />
                  </div>
                </div>

                {/* New Customer Form */}
                {showNewCustomerForm && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-blue-800">Create New Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Customer Name *</Label>
                          <Input
                            value={newCustomerData.name}
                            onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})}
                            placeholder="e.g., John Smith or ABC Company"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email Address *</Label>
                          <Input
                            type="email"
                            value={newCustomerData.email}
                            onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                            placeholder="customer@example.com"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input
                            value={newCustomerData.phone}
                            onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Input
                            value={newCustomerData.address}
                            onChange={(e) => setNewCustomerData({...newCustomerData, address: e.target.value})}
                            placeholder="123 Main St, City, State 12345"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          onClick={() => {
                            setShowNewCustomerForm(false);
                            setNewCustomerData({ name: '', email: '', phone: '', address: '' });
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createNewCustomer}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Create Customer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Title and Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Website Development Project"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the work to be performed"
                    rows={3}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Items</Label>
                  <Button onClick={addItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {(formData.items || []).map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          placeholder="Rate"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={`$${item.amount.toFixed(2)}`}
                          disabled
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.taxRate}
                      onChange={(e) => {
                        const taxRate = parseFloat(e.target.value) || 0;
                        const subtotal = (formData.items || []).reduce((sum, item) => sum + item.amount, 0);
                        const taxAmount = subtotal * taxRate / 100;
                        const total = subtotal + taxAmount;
                        setFormData({
                          ...formData,
                          taxRate: taxRate,
                          subtotal,
                          taxAmount,
                          total
                        });
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes or terms"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-right">
                    <div>Subtotal: ${(formData.subtotal || 0).toFixed(2)}</div>
                    <div>Tax ({formData.taxRate}%): ${(formData.taxAmount || 0).toFixed(2)}</div>
                    <div className="text-lg font-bold">Total: ${(formData.total || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEstimate}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingEstimate ? 'Update' : 'Create'} Estimate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estimates List */}
      <Card>
        <CardHeader>
          <CardTitle>All Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.map(estimate => (
                <TableRow key={estimate.id}>
                  <TableCell className="font-medium">{estimate.estimateNumber}</TableCell>
                  <TableCell>{estimate.customerName}</TableCell>
                  <TableCell>{estimate.title}</TableCell>
                  <TableCell>${estimate.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(estimate.status)}>
                      {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(estimate.validUntil).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => editEstimate(estimate)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => downloadPDF(estimate)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {estimate.status === 'draft' && (
                        <Button
                          onClick={() => sendEstimate(estimate)}
                          variant="outline"
                          size="sm"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteEstimate(estimate.id!)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstimatesQuotes;