import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

// Comprehensive user data aggregation for B.U.C.K. AI
async function getUserFinancialProfile(userId: string) {
  try {
    const [
      user,
      transactions,
      invoices,
      customers,
      companyProfile,
      subscription
    ] = await Promise.all([
      // User profile
      blink.db.users.list({ where: { id: userId }, limit: 1 }),
      
      // Financial transactions (last 90 days)
      blink.db.transactions.list({
        where: { userId },
        orderBy: { date: 'desc' },
        limit: 100
      }),
      
      // Invoices
      blink.db.invoices.list({
        where: { userId },
        orderBy: { issueDate: 'desc' },
        limit: 50
      }),
      
      // Customers
      blink.db.customers.list({
        where: { userId },
        limit: 100
      }),
      
      // Company profile
      blink.db.companyProfiles.list({
        where: { userId },
        limit: 1
      }),
      
      // Subscription info
      blink.db.users.list({
        where: { id: userId },
        limit: 1
      })
    ]);

    return {
      user: user[0] || null,
      transactions: transactions || [],
      invoices: invoices || [],
      customers: customers || [],
      companyProfile: companyProfile[0] || null,
      subscription: user[0] || null
    };
  } catch (error) {
    console.error('Error getting user financial profile:', error);
    return null;
  }
}

// Generate comprehensive financial insights
function generateFinancialInsights(data: any) {
  const { transactions, invoices, customers, companyProfile } = data;
  
  // Calculate key metrics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    
  const netProfit = totalIncome - totalExpenses;
  
  const totalInvoiced = invoices
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    
  const paidInvoices = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
    
  const outstandingInvoices = totalInvoiced - paidInvoices;
  
  // Expense categories analysis
  const expenseCategories = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const category = t.category || 'Uncategorized';
      expenseCategories[category] = (expenseCategories[category] || 0) + parseFloat(t.amount || '0');
    });
    
  // Customer analysis
  const customerCount = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  
  return {
    totalIncome,
    totalExpenses,
    netProfit,
    profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    totalInvoiced,
    paidInvoices,
    outstandingInvoices,
    collectionRate: totalInvoiced > 0 ? (paidInvoices / totalInvoiced) * 100 : 0,
    expenseCategories,
    customerCount,
    activeCustomers,
    customerRetentionRate: customerCount > 0 ? (activeCustomers / customerCount) * 100 : 0,
    transactionCount: transactions.length,
    invoiceCount: invoices.length,
    averageInvoiceValue: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
    businessType: companyProfile?.businessType || 'Unknown',
    industry: companyProfile?.industry || 'Unknown'
  };
}

// Build comprehensive context for B.U.C.K. AI
function buildUserDataContext(userData: any, insights: any, query: string) {
  const { user, companyProfile } = userData;
  
  let context = `USER FINANCIAL PROFILE FOR B.U.C.K. AI ANALYSIS:\n\n`;
  
  // Company Information
  if (companyProfile) {
    context += `COMPANY DETAILS:\n`;
    context += `• Business Name: ${companyProfile.companyName || 'Not specified'}\n`;
    context += `• Industry: ${companyProfile.industry || 'Not specified'}\n`;
    context += `• Business Type: ${companyProfile.businessType || 'Not specified'}\n`;
    context += `• Founded: ${companyProfile.foundedYear || 'Not specified'}\n`;
    context += `• Employees: ${companyProfile.employeeCount || 'Not specified'}\n\n`;
  }
  
  // Financial Performance
  context += `CURRENT FINANCIAL PERFORMANCE:\n`;
  context += `• Total Income: $${insights.totalIncome.toLocaleString()}\n`;
  context += `• Total Expenses: $${insights.totalExpenses.toLocaleString()}\n`;
  context += `• Net Profit: $${insights.netProfit.toLocaleString()}\n`;
  context += `• Profit Margin: ${insights.profitMargin.toFixed(1)}%\n`;
  context += `• Outstanding Invoices: $${insights.outstandingInvoices.toLocaleString()}\n`;
  context += `• Collection Rate: ${insights.collectionRate.toFixed(1)}%\n\n`;
  
  // Business Metrics
  context += `BUSINESS METRICS:\n`;
  context += `• Total Customers: ${insights.customerCount}\n`;
  context += `• Active Customers: ${insights.activeCustomers}\n`;
  context += `• Customer Retention: ${insights.customerRetentionRate.toFixed(1)}%\n`;
  context += `• Average Invoice Value: $${insights.averageInvoiceValue.toLocaleString()}\n`;
  context += `• Total Transactions: ${insights.transactionCount}\n`;
  context += `• Total Invoices: ${insights.invoiceCount}\n\n`;
  
  // Expense Analysis
  if (Object.keys(insights.expenseCategories).length > 0) {
    context += `EXPENSE BREAKDOWN:\n`;
    Object.entries(insights.expenseCategories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([category, amount]) => {
        context += `• ${category}: $${amount.toLocaleString()}\n`;
      });
    context += `\n`;
  }
  
  // Subscription tier
  if (user?.subscriptionTier) {
    context += `SUBSCRIPTION: ${user.subscriptionTier.toUpperCase()} tier\n\n`;
  }
  
  context += `USER QUESTION: "${query}"\n\n`;
  context += `As B.U.C.K., provide personalized CFO-level advice based on this specific user's financial data. Reference their actual numbers, identify specific opportunities and risks, and provide actionable recommendations tailored to their business situation.`;
  
  return context;
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

  try {
    const { query, userId, language = 'en' } = await req.json();
    
    if (!query || !userId) {
      return new Response(JSON.stringify({
        error: 'Query and userId are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Get comprehensive user financial data
    const userData = await getUserFinancialProfile(userId);
    
    if (!userData) {
      return new Response(JSON.stringify({
        error: 'Failed to retrieve user data'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Generate financial insights
    const insights = generateFinancialInsights(userData);
    
    // Build personalized context
    const personalizedContext = buildUserDataContext(userData, insights, query);
    
    // Get relevant knowledge from knowledge base
    const relevantKnowledge = await blink.db.knowledge_base.list({
      orderBy: { priority: 'asc' },
      limit: 3
    });
    
    // Add knowledge base context
    let knowledgeContext = '';
    if (relevantKnowledge.length > 0) {
      knowledgeContext = '\n\nRELEVANT PROFESSIONAL KNOWLEDGE:\n';
      relevantKnowledge.forEach((entry, index) => {
        knowledgeContext += `${index + 1}. ${entry.source_name}: ${entry.content.substring(0, 200)}...\n`;
      });
    }
    
    const fullContext = personalizedContext + knowledgeContext;
    
    // Language-specific instructions
    const languageInstructions = {
      en: 'Respond in English with a friendly, professional tone.',
      es: 'Responde en español con un tono amigable y profesional. Usa emojis apropiados.',
      fr: 'Répondez en français avec un ton amical et professionnel. Utilisez des emojis appropriés.',
      pt: 'Responda em português com um tom amigável e profissional. Use emojis apropriados.',
      de: 'Antworten Sie auf Deutsch mit einem freundlichen, professionellen Ton. Verwenden Sie angemessene Emojis.',
      it: 'Rispondi in italiano con un tono amichevole e professionale. Usa emoji appropriati.',
      zh: '用中文回答，语调友好专业。适当使用表情符号。',
      ja: '日本語で親しみやすく専門的な口調で回答してください。適切な絵文字を使用してください。'
    };

    const languageInstruction = languageInstructions[language] || languageInstructions.en;

    // Generate personalized AI response
    const aiResponse = await blink.ai.generateText({
      prompt: `${fullContext}

LANGUAGE INSTRUCTION: ${languageInstruction}

You are Buck, an enthusiastic AI Chief Financial Officer who loves helping business owners succeed. Be social, encouraging, and use the user's actual financial data to provide specific, actionable advice.`,
      maxTokens: 800,
      search: true
    });
    
    // Log the personalized consultation
    try {
      await blink.db.aiTasks.create({
        userId,
        taskType: 'personalized_cfo_consultation',
        status: 'completed',
        inputData: JSON.stringify({ 
          query, 
          insights,
          dataPointsAnalyzed: {
            transactions: userData.transactions.length,
            invoices: userData.invoices.length,
            customers: userData.customers.length
          }
        }),
        outputData: JSON.stringify({ 
          response: aiResponse.text,
          personalizedInsights: insights
        }),
        completedAt: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log personalized consultation:', logError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      response: aiResponse.text,
      insights,
      dataPointsAnalyzed: {
        transactions: userData.transactions.length,
        invoices: userData.invoices.length,
        customers: userData.customers.length,
        hasCompanyProfile: !!userData.companyProfile
      },
      personalized: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('B.U.C.K. Data Connector error:', error);
    
    return new Response(JSON.stringify({
      success: false,
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