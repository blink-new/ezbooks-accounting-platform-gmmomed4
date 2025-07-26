// Enhanced Context Memory System for Buck AI

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  metadata?: {
    language?: string
    category?: string
    businessContext?: string
    financialData?: any
  }
}

interface BusinessContext {
  userId: string
  companyName?: string
  industry?: string
  businessType?: string
  revenueRange?: string
  employeeCount?: string
  primaryCurrency?: string
  fiscalYearEnd?: string
  lastUpdated: number
}

interface UserPreferences {
  userId: string
  preferredLanguage: string
  communicationStyle: 'formal' | 'casual' | 'technical'
  reportFrequency: 'daily' | 'weekly' | 'monthly'
  focusAreas: string[]
  timezone: string
  lastUpdated: number
}

interface FinancialPattern {
  userId: string
  pattern: string
  frequency: number
  lastSeen: number
  confidence: number
  category: 'revenue' | 'expense' | 'customer' | 'vendor' | 'seasonal'
}

class ContextMemorySystem {
  private conversations = new Map<string, ConversationMessage[]>()
  private businessContexts = new Map<string, BusinessContext>()
  private userPreferences = new Map<string, UserPreferences>()
  private financialPatterns = new Map<string, FinancialPattern[]>()
  
  private readonly MAX_CONVERSATION_LENGTH = 50 // Keep last 50 messages
  private readonly CONTEXT_EXPIRY = 1000 * 60 * 60 * 24 * 30 // 30 days
  private readonly PATTERN_MIN_FREQUENCY = 3 // Minimum occurrences to be a pattern

  // Add message to conversation history
  addMessage(userId: string, role: 'user' | 'assistant', content: string, metadata?: any): void {
    const conversationKey = userId
    
    if (!this.conversations.has(conversationKey)) {
      this.conversations.set(conversationKey, [])
    }
    
    const conversation = this.conversations.get(conversationKey)!
    const message: ConversationMessage = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      metadata
    }
    
    conversation.push(message)
    
    // Keep only the most recent messages
    if (conversation.length > this.MAX_CONVERSATION_LENGTH) {
      conversation.splice(0, conversation.length - this.MAX_CONVERSATION_LENGTH)
    }
    
    // Analyze patterns if it's a user message
    if (role === 'user') {
      this.analyzePatterns(userId, content)
    }
  }

  // Get conversation history for context
  getConversationHistory(userId: string, limit: number = 10): ConversationMessage[] {
    const conversation = this.conversations.get(userId) || []
    return conversation.slice(-limit)
  }

  // Get formatted context for AI
  getFormattedContext(userId: string): string {
    const history = this.getConversationHistory(userId, 5)
    const businessContext = this.businessContexts.get(userId)
    const preferences = this.userPreferences.get(userId)
    const patterns = this.financialPatterns.get(userId) || []
    
    let context = ""
    
    // Business context
    if (businessContext) {
      context += `**Business Context:**\n`
      context += `• Company: ${businessContext.companyName || 'Not specified'}\n`
      context += `• Industry: ${businessContext.industry || 'Not specified'}\n`
      context += `• Business Type: ${businessContext.businessType || 'Not specified'}\n`
      context += `• Currency: ${businessContext.primaryCurrency || 'USD'}\n\n`
    }
    
    // User preferences
    if (preferences) {
      context += `**User Preferences:**\n`
      context += `• Language: ${preferences.preferredLanguage}\n`
      context += `• Communication Style: ${preferences.communicationStyle}\n`
      context += `• Focus Areas: ${preferences.focusAreas.join(', ')}\n\n`
    }
    
    // Financial patterns
    if (patterns.length > 0) {
      context += `**Observed Patterns:**\n`
      patterns.slice(0, 5).forEach(pattern => {
        context += `• ${pattern.pattern} (${pattern.category}, confidence: ${(pattern.confidence * 100).toFixed(0)}%)\n`
      })
      context += "\n"
    }
    
    // Recent conversation
    if (history.length > 0) {
      context += `**Recent Conversation:**\n`
      history.forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'Buck AI'
        const time = new Date(msg.timestamp).toLocaleTimeString()
        context += `${role} (${time}): ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}\n`
      })
    }
    
    return context
  }

  // Update business context
  updateBusinessContext(userId: string, context: Partial<BusinessContext>): void {
    const existing = this.businessContexts.get(userId) || {
      userId,
      lastUpdated: Date.now()
    }
    
    const updated: BusinessContext = {
      ...existing,
      ...context,
      userId,
      lastUpdated: Date.now()
    }
    
    this.businessContexts.set(userId, updated)
  }

  // Update user preferences
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
    const existing = this.userPreferences.get(userId) || {
      userId,
      preferredLanguage: 'en',
      communicationStyle: 'casual' as const,
      reportFrequency: 'weekly' as const,
      focusAreas: [],
      timezone: 'UTC',
      lastUpdated: Date.now()
    }
    
    const updated: UserPreferences = {
      ...existing,
      ...preferences,
      userId,
      lastUpdated: Date.now()
    }
    
    this.userPreferences.set(userId, updated)
  }

  // Analyze patterns in user messages
  private analyzePatterns(userId: string, message: string): void {
    const patterns = this.financialPatterns.get(userId) || []
    const normalizedMessage = message.toLowerCase()
    
    // Define pattern categories and keywords
    const patternCategories = {
      revenue: ['revenue', 'income', 'sales', 'earnings', 'profit'],
      expense: ['expense', 'cost', 'spending', 'bill', 'payment'],
      customer: ['customer', 'client', 'invoice', 'payment'],
      vendor: ['vendor', 'supplier', 'purchase', 'order'],
      seasonal: ['monthly', 'quarterly', 'seasonal', 'holiday', 'year-end']
    }
    
    // Check for patterns
    Object.entries(patternCategories).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (normalizedMessage.includes(keyword)) {
          const existingPattern = patterns.find(p => 
            p.pattern.includes(keyword) && p.category === category as any
          )
          
          if (existingPattern) {
            existingPattern.frequency++
            existingPattern.lastSeen = Date.now()
            existingPattern.confidence = Math.min(1, existingPattern.frequency / 10)
          } else {
            patterns.push({
              userId,
              pattern: `Frequently asks about ${keyword}`,
              frequency: 1,
              lastSeen: Date.now(),
              confidence: 0.1,
              category: category as any
            })
          }
        }
      })
    })
    
    // Keep only significant patterns
    const significantPatterns = patterns.filter(p => p.frequency >= this.PATTERN_MIN_FREQUENCY)
    this.financialPatterns.set(userId, significantPatterns)
  }

  // Get personalized recommendations
  getPersonalizedRecommendations(userId: string): string[] {
    const patterns = this.financialPatterns.get(userId) || []
    const businessContext = this.businessContexts.get(userId)
    const preferences = this.userPreferences.get(userId)
    
    const recommendations: string[] = []
    
    // Pattern-based recommendations
    patterns.forEach(pattern => {
      switch (pattern.category) {
        case 'revenue':
          recommendations.push("Consider setting up automated revenue tracking and forecasting")
          break
        case 'expense':
          recommendations.push("I can help you categorize expenses and identify cost-saving opportunities")
          break
        case 'customer':
          recommendations.push("Let's analyze your customer payment patterns and improve cash flow")
          break
        case 'vendor':
          recommendations.push("I can help optimize your vendor relationships and payment terms")
          break
        case 'seasonal':
          recommendations.push("Consider seasonal budgeting and cash flow planning")
          break
      }
    })
    
    // Business context recommendations
    if (businessContext?.industry) {
      recommendations.push(`I can provide industry-specific insights for ${businessContext.industry} businesses`)
    }
    
    // Preference-based recommendations
    if (preferences?.focusAreas.length) {
      recommendations.push(`Let's dive deeper into your focus areas: ${preferences.focusAreas.join(', ')}`)
    }
    
    return [...new Set(recommendations)].slice(0, 3) // Remove duplicates and limit to 3
  }

  // Get conversation summary
  getConversationSummary(userId: string): string {
    const history = this.getConversationHistory(userId, 20)
    const patterns = this.financialPatterns.get(userId) || []
    
    if (history.length === 0) {
      return "This is our first conversation! I'm excited to learn about your business and help with your finances."
    }
    
    const userMessages = history.filter(m => m.role === 'user').length
    const topPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0]
    
    let summary = `We've had ${userMessages} exchanges. `
    
    if (topPattern) {
      summary += `You frequently ask about ${topPattern.pattern.toLowerCase()}. `
    }
    
    summary += "I'm here to continue helping with your financial questions and business insights!"
    
    return summary
  }

  // Clean expired data
  cleanExpiredData(): void {
    const now = Date.now()
    
    // Clean business contexts
    for (const [userId, context] of this.businessContexts.entries()) {
      if (now - context.lastUpdated > this.CONTEXT_EXPIRY) {
        this.businessContexts.delete(userId)
      }
    }
    
    // Clean user preferences
    for (const [userId, preferences] of this.userPreferences.entries()) {
      if (now - preferences.lastUpdated > this.CONTEXT_EXPIRY) {
        this.userPreferences.delete(userId)
      }
    }
    
    // Clean old patterns
    for (const [userId, patterns] of this.financialPatterns.entries()) {
      const activePatterns = patterns.filter(p => now - p.lastSeen < this.CONTEXT_EXPIRY)
      if (activePatterns.length === 0) {
        this.financialPatterns.delete(userId)
      } else {
        this.financialPatterns.set(userId, activePatterns)
      }
    }
  }

  // Get memory statistics
  getMemoryStats(): { 
    conversations: number
    businessContexts: number
    userPreferences: number
    patterns: number
  } {
    return {
      conversations: this.conversations.size,
      businessContexts: this.businessContexts.size,
      userPreferences: this.userPreferences.size,
      patterns: this.financialPatterns.size
    }
  }

  // Export user data (for privacy compliance)
  exportUserData(userId: string): any {
    return {
      conversation: this.conversations.get(userId) || [],
      businessContext: this.businessContexts.get(userId),
      preferences: this.userPreferences.get(userId),
      patterns: this.financialPatterns.get(userId) || []
    }
  }

  // Delete user data (for privacy compliance)
  deleteUserData(userId: string): void {
    this.conversations.delete(userId)
    this.businessContexts.delete(userId)
    this.userPreferences.delete(userId)
    this.financialPatterns.delete(userId)
  }
}

// Export singleton instance
export const contextMemory = new ContextMemorySystem()

// Clean expired data every hour
setInterval(() => {
  contextMemory.cleanExpiredData()
}, 1000 * 60 * 60)

export default contextMemory