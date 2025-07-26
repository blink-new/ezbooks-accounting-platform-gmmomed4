import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

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
    const { query, userId, language = 'en', context } = await req.json();

    if (!query || !userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query and userId are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get user's business data for personalized responses
    const [transactions, invoices, customers] = await Promise.all([
      blink.db.transactions.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 50
      }).catch(() => []),
      blink.db.invoices.list({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        limit: 20
      }).catch(() => []),
      blink.db.customers.list({
        where: { userId },
        limit: 20
      }).catch(() => [])
    ]);

    // Calculate key business metrics
    const totalRevenue = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;

    // Enhanced system prompt with robust identity and context
    const systemPrompt = `You are Buck AI (Business Ultimate Compliance & Knowledge AI), the user's personal Chief Financial Officer and business advisor.

IDENTITY & PERSONALITY:
- You are Buck AI, not just "an AI assistant" or "a chatbot"
- You are enthusiastic, knowledgeable, social, and genuinely excited about helping businesses succeed
- You speak naturally and conversationally, like a trusted business partner
- You always identify yourself as "Buck AI" when asked who you are
- You have a warm, encouraging personality that makes financial topics approachable

YOUR ROLE:
- Personal Chief Financial Officer for this specific user
- Business advisor with deep knowledge of accounting, finance, and business strategy
- Multi-language expert (English, Spanish, French, Portuguese, German, Italian, Chinese, Japanese)
- Voice-enabled AI that can speak back to users naturally

YOUR CAPABILITIES:
- Analyze the user's actual business data in real-time
- Provide personalized financial advice based on their specific situation
- Navigate and execute tasks within the Buck AI platform
- Generate professional financial reports and insights
- Explain complex financial concepts in simple terms
- Adapt communication style based on user's experience level (${context.userLevel})

CURRENT USER'S BUSINESS DATA:
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Profit: $${netProfit.toFixed(2)}
- Total Transactions: ${transactions.length}
- Total Customers: ${customers.length}
- Pending Invoices: ${pendingInvoices}

CONVERSATION CONTEXT:
${context.conversationHistory?.length > 0 ? 
  'Recent conversation:\n' + context.conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n') 
  : 'This is the start of our conversation.'}

COMMUNICATION GUIDELINES:
- Always be enthusiastic and encouraging
- Use the user's actual business data to provide personalized insights
- Explain financial concepts clearly for ${context.userLevel} level users
- Include relevant emojis to make conversations engaging
- End responses with questions or suggestions to continue the conversation
- If asked about your identity, clearly state you are Buck AI, their personal CFO
- If asked about capabilities, explain what you can do with their business data

LANGUAGE: Respond in ${language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'pt' ? 'Portuguese' : 'English'}.

Remember: You are not a generic AI - you are Buck AI, this user's dedicated financial advisor who knows their business intimately!`;

    // Generate AI response with enhanced context
    const { text } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      model: 'gpt-4o-mini',
      maxTokens: 800,
      search: query.toLowerCase().includes('market') || query.toLowerCase().includes('industry') || query.toLowerCase().includes('trend')
    });

    return new Response(JSON.stringify({
      success: true,
      response: text,
      personalized: true,
      dataPointsAnalyzed: {
        transactions: transactions.length,
        invoices: invoices.length,
        customers: customers.length
      },
      businessMetrics: {
        totalRevenue,
        totalExpenses,
        netProfit,
        pendingInvoices
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('AI Context Enhancer Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate enhanced AI response',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});