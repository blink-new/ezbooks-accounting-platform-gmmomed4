import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

interface TaskRequest {
  task: string;
  userId: string;
  context?: any;
}

interface TaskResponse {
  success: boolean;
  message: string;
  data?: any;
  actions?: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { task, userId, context }: TaskRequest = await req.json();

    // Set user context for database operations
    blink.auth.setToken(`user_${userId}`);

    // Parse the task and determine what action to take
    const taskLower = task.toLowerCase();
    let response: TaskResponse;

    if (taskLower.includes('create') && taskLower.includes('transaction')) {
      response = await createTransaction(task, userId, context);
    } else if (taskLower.includes('create') && taskLower.includes('invoice')) {
      response = await createInvoice(task, userId, context);
    } else if (taskLower.includes('create') && taskLower.includes('customer')) {
      response = await createCustomer(task, userId, context);
    } else if (taskLower.includes('create') && taskLower.includes('purchase order')) {
      response = await createPurchaseOrder(task, userId, context);
    } else if (taskLower.includes('show') || taskLower.includes('display') || taskLower.includes('list')) {
      response = await showData(task, userId, context);
    } else if (taskLower.includes('update') || taskLower.includes('modify') || taskLower.includes('change')) {
      response = await updateData(task, userId, context);
    } else if (taskLower.includes('delete') || taskLower.includes('remove')) {
      response = await deleteData(task, userId, context);
    } else {
      // Use AI to understand the task and provide guidance
      response = await analyzeTask(task, userId, context);
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Task execution error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Failed to execute task',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

async function createTransaction(task: string, userId: string, context: any): Promise<TaskResponse> {
  try {
    // Use AI to extract transaction details from the task
    const { object: transactionData } = await blink.ai.generateObject({
      prompt: `Extract transaction details from this request: "${task}". If any required information is missing, use reasonable defaults or ask for clarification.`,
      schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string' },
          date: { type: 'string' },
          needsMoreInfo: { type: 'boolean' },
          missingFields: { type: 'array', items: { type: 'string' } }
        },
        required: ['description', 'amount', 'type', 'category', 'date', 'needsMoreInfo']
      }
    });

    if (transactionData.needsMoreInfo) {
      return {
        success: false,
        message: `I need more information to create this transaction. Please provide: ${transactionData.missingFields?.join(', ')}`,
        data: transactionData
      };
    }

    // Create the transaction
    const transaction = await blink.db.transactions.create({
      id: `txn_${Date.now()}`,
      userId,
      description: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.category,
      date: transactionData.date,
      paymentMethod: 'cash',
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Successfully created ${transactionData.type} transaction for $${transactionData.amount}`,
      data: transaction,
      actions: ['Transaction created', 'Dashboard updated']
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to create transaction: ${error.message}`
    };
  }
}

async function createInvoice(task: string, userId: string, context: any): Promise<TaskResponse> {
  try {
    // Use AI to extract invoice details
    const { object: invoiceData } = await blink.ai.generateObject({
      prompt: `Extract invoice details from this request: "${task}". Generate a reasonable invoice number if not provided.`,
      schema: {
        type: 'object',
        properties: {
          customerName: { type: 'string' },
          invoiceNumber: { type: 'string' },
          amount: { type: 'number' },
          description: { type: 'string' },
          dueDate: { type: 'string' },
          needsMoreInfo: { type: 'boolean' },
          missingFields: { type: 'array', items: { type: 'string' } }
        },
        required: ['customerName', 'invoiceNumber', 'amount', 'description', 'needsMoreInfo']
      }
    });

    if (invoiceData.needsMoreInfo) {
      return {
        success: false,
        message: `I need more information to create this invoice. Please provide: ${invoiceData.missingFields?.join(', ')}`,
        data: invoiceData
      };
    }

    // Check if customer exists, create if not
    let customer;
    const existingCustomers = await blink.db.customers.list({
      where: { userId, name: invoiceData.customerName }
    });

    if (existingCustomers.length > 0) {
      customer = existingCustomers[0];
    } else {
      customer = await blink.db.customers.create({
        id: `cust_${Date.now()}`,
        userId,
        name: invoiceData.customerName,
        email: '',
        phone: '',
        address: '',
        customerType: 'business',
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }

    // Create the invoice
    const invoice = await blink.db.invoices.create({
      id: `inv_${Date.now()}`,
      userId,
      customerId: customer.id,
      invoiceNumber: invoiceData.invoiceNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal: invoiceData.amount,
      taxRate: 0,
      taxAmount: 0,
      total: invoiceData.amount,
      notes: invoiceData.description,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Successfully created invoice ${invoiceData.invoiceNumber} for ${invoiceData.customerName} - $${invoiceData.amount}`,
      data: invoice,
      actions: ['Invoice created', 'Customer updated', 'Accounts receivable updated']
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to create invoice: ${error.message}`
    };
  }
}

async function createCustomer(task: string, userId: string, context: any): Promise<TaskResponse> {
  try {
    // Use AI to extract customer details
    const { object: customerData } = await blink.ai.generateObject({
      prompt: `Extract customer details from this request: "${task}".`,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          company: { type: 'string' },
          customerType: { type: 'string', enum: ['individual', 'business'] },
          needsMoreInfo: { type: 'boolean' },
          missingFields: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'needsMoreInfo']
      }
    });

    if (customerData.needsMoreInfo && !customerData.name) {
      return {
        success: false,
        message: `I need at least a customer name to create a customer record.`,
        data: customerData
      };
    }

    // Create the customer
    const customer = await blink.db.customers.create({
      id: `cust_${Date.now()}`,
      userId,
      name: customerData.name,
      email: customerData.email || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      company: customerData.company || '',
      customerType: customerData.customerType || 'business',
      status: 'active',
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Successfully created customer: ${customerData.name}`,
      data: customer,
      actions: ['Customer created', 'Customer database updated']
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to create customer: ${error.message}`
    };
  }
}

async function createPurchaseOrder(task: string, userId: string, context: any): Promise<TaskResponse> {
  try {
    // Use AI to extract purchase order details
    const { object: poData } = await blink.ai.generateObject({
      prompt: `Extract purchase order details from this request: "${task}". Generate a PO number if not provided.`,
      schema: {
        type: 'object',
        properties: {
          vendorName: { type: 'string' },
          poNumber: { type: 'string' },
          items: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' }
              }
            }
          },
          expectedDeliveryDate: { type: 'string' },
          needsMoreInfo: { type: 'boolean' },
          missingFields: { type: 'array', items: { type: 'string' } }
        },
        required: ['vendorName', 'poNumber', 'items', 'needsMoreInfo']
      }
    });

    if (poData.needsMoreInfo) {
      return {
        success: false,
        message: `I need more information to create this purchase order. Please provide: ${poData.missingFields?.join(', ')}`,
        data: poData
      };
    }

    // Calculate totals
    const subtotal = poData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

    // Create the purchase order
    const purchaseOrder = await blink.db.purchase_orders.create({
      id: `po_${Date.now()}`,
      userId,
      poNumber: poData.poNumber,
      vendorName: poData.vendorName,
      vendorEmail: '',
      vendorAddress: '',
      issueDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: poData.expectedDeliveryDate || '',
      status: 'pending',
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      total: subtotal,
      notes: '',
      terms: 'Net 30',
      createdAt: new Date().toISOString()
    });

    // Create purchase order items
    for (const item of poData.items) {
      await blink.db.purchase_order_items.create({
        id: `poi_${Date.now()}_${Math.random()}`,
        purchaseOrderId: purchaseOrder.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        createdAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      message: `Successfully created purchase order ${poData.poNumber} for ${poData.vendorName} - $${subtotal.toFixed(2)}`,
      data: purchaseOrder,
      actions: ['Purchase order created', 'Vendor added', 'Accounts payable updated']
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to create purchase order: ${error.message}`
    };
  }
}

async function showData(task: string, userId: string, context: any): Promise<TaskResponse> {
  try {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('transaction')) {
      const transactions = await blink.db.transactions.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 10
      });
      
      return {
        success: true,
        message: `Found ${transactions.length} recent transactions`,
        data: transactions,
        actions: ['Data retrieved']
      };
    } else if (taskLower.includes('invoice')) {
      const invoices = await blink.db.invoices.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 10
      });
      
      return {
        success: true,
        message: `Found ${invoices.length} recent invoices`,
        data: invoices,
        actions: ['Data retrieved']
      };
    } else if (taskLower.includes('customer')) {
      const customers = await blink.db.customers.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 10
      });
      
      return {
        success: true,
        message: `Found ${customers.length} customers`,
        data: customers,
        actions: ['Data retrieved']
      };
    } else {
      return {
        success: false,
        message: "I'm not sure what data you want to see. Please specify transactions, invoices, customers, or purchase orders."
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to retrieve data: ${error.message}`
    };
  }
}

async function updateData(task: string, userId: string, context: any): Promise<TaskResponse> {
  return {
    success: false,
    message: "Update functionality is coming soon. For now, please use the web interface to update records."
  };
}

async function deleteData(task: string, userId: string, context: any): Promise<TaskResponse> {
  return {
    success: false,
    message: "Delete functionality requires confirmation. Please use the web interface to delete records safely."
  };
}

async function analyzeTask(task: string, userId: string, context: any): Promise<TaskResponse> {
  try {
    // Use AI to understand the task and provide guidance
    const { text } = await blink.ai.generateText({
      prompt: `As B.U.C.K. (Business Ultimate Compliance & Knowledge), analyze this accounting task request: "${task}". 
      
      Provide helpful guidance on:
      1. What the user is trying to accomplish
      2. What information might be needed
      3. Suggested next steps
      4. Any compliance or best practice considerations
      
      Be professional, helpful, and specific to accounting/finance tasks.`,
      maxTokens: 300
    });

    return {
      success: true,
      message: text,
      actions: ['Task analyzed', 'Guidance provided']
    };
  } catch (error) {
    return {
      success: false,
      message: "I couldn't analyze that task. Please try rephrasing your request or be more specific about what you'd like to do."
    };
  }
}