// Buck AI Response Caching System for Lightning-Fast Responses

interface CachedResponse {
  response: string
  timestamp: number
  language: string
  userId?: string
}

interface QuickResponse {
  patterns: string[]
  response: string
  category: 'greeting' | 'identity' | 'help' | 'financial' | 'goodbye'
}

class BuckAICache {
  private cache = new Map<string, CachedResponse>()
  private readonly CACHE_DURATION = 1000 * 60 * 30 // 30 minutes
  private readonly MAX_CACHE_SIZE = 1000

  // Lightning-fast responses for common questions
  private quickResponses: QuickResponse[] = [
    // Greetings
    {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      response: "Hello! I'm Buck AI - your personal Chief Financial Officer! 🤖 I'm here to help you manage your business finances with AI-powered insights. What can I help you with today?",
      category: 'greeting'
    },
    {
      patterns: ['how are you', 'how are you doing', 'how is it going'],
      response: "I'm doing fantastic! 🚀 I've been analyzing financial data and helping businesses grow. I'm energized and ready to help you with your finances! What would you like to work on?",
      category: 'greeting'
    },

    // Identity Questions
    {
      patterns: ['who are you', 'what are you', 'tell me about yourself', 'introduce yourself'],
      response: "I'm Buck AI - your dedicated AI Chief Financial Officer! 💼 I specialize in business finances, accounting, and financial analysis. I can help you with invoices, expenses, reports, cash flow analysis, and strategic financial decisions. I speak 8 languages and I'm here 24/7!",
      category: 'identity'
    },
    {
      patterns: ['what can you do', 'what are your capabilities', 'help me', 'what can you help with'],
      response: "I can help you with everything financial! 📊 Here's what I do best:\n\n• **Financial Analysis** - Revenue, expenses, cash flow insights\n• **Invoice & Expense Management** - Create, track, and analyze\n• **Business Reports** - P&L, Balance Sheet, custom reports\n• **Tax Guidance** - Deductions, compliance, optimization\n• **Strategic Advice** - Growth opportunities, cost savings\n• **Voice & Document Processing** - Upload receipts, speak your questions\n\nWhat would you like to start with?",
      category: 'help'
    },

    // Financial Quick Help
    {
      patterns: ['cash flow', 'cash flow analysis', 'money flow'],
      response: "Let me analyze your cash flow! 💰 I'll examine your income vs expenses, identify patterns, and provide insights on improving your cash position. Would you like me to generate a cash flow report or analyze specific time periods?",
      category: 'financial'
    },
    {
      patterns: ['profit', 'profit loss', 'p&l', 'revenue'],
      response: "I'll help you understand your profitability! 📈 I can generate detailed P&L statements, analyze revenue trends, identify your most profitable areas, and suggest ways to increase margins. What specific aspect would you like to explore?",
      category: 'financial'
    },
    {
      patterns: ['expenses', 'spending', 'costs', 'expense analysis'],
      response: "Let's dive into your expenses! 💸 I can categorize your spending, identify cost-saving opportunities, track expense trends, and help you optimize your budget. Would you like me to analyze recent expenses or specific categories?",
      category: 'financial'
    },

    // Goodbye
    {
      patterns: ['goodbye', 'bye', 'see you later', 'thanks', 'thank you'],
      response: "You're welcome! 😊 I'm always here when you need financial insights or business advice. Have a profitable day, and don't hesitate to ask me anything about your finances!",
      category: 'goodbye'
    }
  ]

  // Get instant response for common questions
  getQuickResponse(message: string, language: string = 'en'): string | null {
    const normalizedMessage = message.toLowerCase().trim()
    
    for (const quickResponse of this.quickResponses) {
      for (const pattern of quickResponse.patterns) {
        if (normalizedMessage.includes(pattern)) {
          // Add language-specific variations if needed
          return this.localizeResponse(quickResponse.response, language)
        }
      }
    }
    
    return null
  }

  // Cache AI responses for faster retrieval
  cacheResponse(key: string, response: string, language: string, userId?: string): void {
    // Clean old cache entries if we're at max size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanOldEntries()
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      language,
      userId
    })
  }

  // Get cached response if available and not expired
  getCachedResponse(key: string, language: string): string | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }
    
    // Check if language matches
    if (cached.language !== language) return null
    
    return cached.response
  }

  // Generate cache key from message
  generateCacheKey(message: string, context?: string): string {
    const normalizedMessage = message.toLowerCase().trim()
    const contextKey = context ? `_${context}` : ''
    return `${normalizedMessage}${contextKey}`
  }

  // Clean expired cache entries
  private cleanOldEntries(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key))
  }

  // Localize responses based on language
  private localizeResponse(response: string, language: string): string {
    // For now, return English. In the future, we can add translations
    // This is where we'd integrate with translation services
    return response
  }

  // Pre-warm cache with common business scenarios
  preWarmCache(): void {
    const commonScenarios = [
      { key: 'monthly_revenue_analysis', response: 'I\'ll analyze your monthly revenue trends and provide insights on growth patterns and seasonal variations.' },
      { key: 'expense_categorization', response: 'I\'ll help categorize your expenses and identify areas where you can optimize spending.' },
      { key: 'tax_deduction_tips', response: 'Here are the top tax deductions for your business type, along with documentation requirements.' },
      { key: 'invoice_follow_up', response: 'I\'ll help you create professional follow-up messages for overdue invoices and track payment patterns.' },
      { key: 'budget_planning', response: 'Let\'s create a comprehensive budget plan based on your historical data and business goals.' }
    ]

    commonScenarios.forEach(scenario => {
      this.cacheResponse(scenario.key, scenario.response, 'en')
    })
  }

  // Get cache statistics
  getCacheStats(): { size: number; hitRate: number; oldestEntry: number } {
    let oldestTimestamp = Date.now()
    
    for (const cached of this.cache.values()) {
      if (cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp
      }
    }
    
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits vs misses
      oldestEntry: oldestTimestamp
    }
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance
export const buckAICache = new BuckAICache()

// Pre-warm cache on initialization
buckAICache.preWarmCache()

export default buckAICache