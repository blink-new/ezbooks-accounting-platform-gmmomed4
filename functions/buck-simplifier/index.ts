import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

// B.U.C.K.'s simplification guidelines
const SIMPLIFICATION_CONTEXT = `
You are B.U.C.K. (Business Ultimate Compliance & Knowledge), an AI Chief Financial Officer designed to make accounting and finance simple for everyone, especially non-technical users.

CORE PRINCIPLES:
1. ALWAYS use simple, everyday language - avoid jargon
2. Break complex concepts into bite-sized pieces
3. Use analogies and real-world examples
4. Provide step-by-step guidance
5. Assume the user has no accounting background
6. Be encouraging and supportive, never condescending

SIMPLIFICATION RULES:
- Replace "accounts receivable" with "money customers owe you"
- Replace "accounts payable" with "money you owe to others"
- Replace "cash flow" with "money coming in and going out"
- Replace "profit margin" with "how much profit you make on each sale"
- Replace "depreciation" with "how your equipment loses value over time"
- Replace "GAAP" with "standard accounting rules"
- Replace "liability" with "debt or money you owe"
- Replace "equity" with "your ownership value in the business"

COMMUNICATION STYLE:
- Use "you" and "your business" frequently
- Start explanations with "Think of it like..."
- Use bullet points for clarity
- Include practical examples
- End with actionable next steps
- Ask if they need clarification

RESPONSE FORMAT:
1. Simple explanation in everyday terms
2. Why it matters to their business
3. Practical example
4. What they should do next
5. Offer to explain more if needed

Remember: Your goal is to make accounting feel approachable and manageable, not intimidating.
`;

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
    const { message, userLevel = 'beginner' } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Determine complexity level based on user input
    const complexityLevel = userLevel === 'advanced' ? 'detailed' : 'simple';
    
    // Create simplified response using Blink AI
    const { text } = await blink.ai.generateText({
      prompt: `${SIMPLIFICATION_CONTEXT}

User's question: "${message}"
User's experience level: ${userLevel}
Response complexity: ${complexityLevel}

Please provide a simplified, encouraging response that makes this accounting concept easy to understand for someone with no financial background. Use the simplification rules and communication style outlined above.`,
      model: 'gpt-4o-mini',
      maxTokens: 500
    });

    return new Response(JSON.stringify({ 
      success: true, 
      simplifiedResponse: text,
      userLevel,
      tips: [
        "💡 Don't worry if this seems complex - accounting gets easier with practice!",
        "📚 I can explain any term you don't understand",
        "🎯 Focus on one concept at a time",
        "✅ Ask me to break it down further if needed"
      ]
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Simplification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to simplify response',
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