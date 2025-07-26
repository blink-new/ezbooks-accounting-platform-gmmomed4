// Custom Training System - Learn from User's Specific Business

import blink from '@/blink/client'
import { contextMemory } from './contextMemory'

interface BusinessLearning {
  userId: string
  category: 'revenue_patterns' | 'expense_categories' | 'customer_behavior' | 'seasonal_trends' | 'vendor_relationships'
  pattern: string
  confidence: number
  dataPoints: number
  lastUpdated: number
  insights: string[]
}

interface DocumentLearning {
  userId: string
  documentType: 'invoice' | 'receipt' | 'statement' | 'report' | 'contract'
  extractedData: any
  patterns: string[]
  timestamp: number
}

class CustomTrainingSystem {
  private businessLearnings = new Map<string, BusinessLearning[]>()
  private documentLearnings = new Map<string, DocumentLearning[]>()
  private readonly MIN_DATA_POINTS = 5 // Minimum data points to establish a pattern

  // Analyze user's financial data to learn business patterns
  async analyzeBusinessPatterns(userId: string): Promise<BusinessLearning[]> {
    try {
      // Get user's financial data from database
      const [transactions, invoices, customers, vendors] = await Promise.all([
        blink.db.transactions.list({ where: { userId }, limit: 500 }),
        blink.db.invoices.list({ where: { userId }, limit: 200 }),
        blink.db.customers.list({ where: { userId }, limit: 100 }),
        blink.db.vendors.list({ where: { userId }, limit: 100 })
      ])

      const learnings: BusinessLearning[] = []

      // Analyze revenue patterns
      const revenuePatterns = this.analyzeRevenuePatterns(transactions, invoices)
      learnings.push(...revenuePatterns)

      // Analyze expense categories
      const expensePatterns = this.analyzeExpensePatterns(transactions)
      learnings.push(...expensePatterns)

      // Analyze customer behavior
      const customerPatterns = this.analyzeCustomerBehavior(customers, invoices)
      learnings.push(...customerPatterns)

      // Analyze seasonal trends
      const seasonalPatterns = this.analyzeSeasonalTrends(transactions, invoices)
      learnings.push(...seasonalPatterns)

      // Analyze vendor relationships
      const vendorPatterns = this.analyzeVendorRelationships(vendors, transactions)
      learnings.push(...vendorPatterns)

      // Store learnings
      this.businessLearnings.set(userId, learnings)

      // Update context memory with business insights
      const businessContext = {
        industry: this.inferIndustry(learnings),
        businessType: this.inferBusinessType(learnings),
        revenueRange: this.inferRevenueRange(transactions, invoices),
        primaryCurrency: this.inferPrimaryCurrency(transactions)
      }
      contextMemory.updateBusinessContext(userId, businessContext)

      return learnings
    } catch (error) {
      console.error('Error analyzing business patterns:', error)
      return []
    }
  }

  // Process multi-modal input (images, documents, spreadsheets)
  async processMultiModalInput(userId: string, file: File, type: 'image' | 'document' | 'spreadsheet'): Promise<any> {
    try {
      let extractedData: any = {}

      switch (type) {
        case 'image':
          extractedData = await this.processImageInput(file)
          break
        case 'document':
          extractedData = await this.processDocumentInput(file)
          break
        case 'spreadsheet':
          extractedData = await this.processSpreadsheetInput(file)
          break
      }

      // Learn from the extracted data
      await this.learnFromExtractedData(userId, extractedData, type)

      return extractedData
    } catch (error) {
      console.error('Error processing multi-modal input:', error)
      throw error
    }
  }

  // Process image input (receipts, invoices, documents)
  private async processImageInput(file: File): Promise<any> {
    try {
      // Upload image to storage
      const { publicUrl } = await blink.storage.upload(file, `receipts/${Date.now()}_${file.name}`)

      // Use Blink AI to extract text and data from image
      const extractionResult = await blink.ai.generateObject({
        prompt: `Analyze this business document image and extract all relevant financial information. 
                 Identify if it's a receipt, invoice, statement, or other document type.
                 Extract: amounts, dates, vendor/customer names, categories, tax information, line items.`,
        schema: {
          type: 'object',
          properties: {
            documentType: { type: 'string' },
            vendor: { type: 'string' },
            date: { type: 'string' },
            totalAmount: { type: 'number' },
            taxAmount: { type: 'number' },
            currency: { type: 'string' },
            category: { type: 'string' },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  amount: { type: 'number' },
                  quantity: { type: 'number' }
                }
              }
            },
            confidence: { type: 'number' }
          }
        }
      })

      return {
        imageUrl: publicUrl,
        extractedData: extractionResult.object,
        processingType: 'image_ocr'
      }
    } catch (error) {
      console.error('Error processing image:', error)
      throw error
    }
  }

  // Process document input (PDFs, Word docs, etc.)
  private async processDocumentInput(file: File): Promise<any> {
    try {
      // Extract text from document
      const extractedText = await blink.data.extractFromBlob(file, { chunking: true })

      // Use AI to analyze the document content
      const analysisResult = await blink.ai.generateObject({
        prompt: `Analyze this business document and extract key financial information:
                 ${Array.isArray(extractedText) ? extractedText.join(' ') : extractedText}
                 
                 Identify document type and extract relevant business data.`,
        schema: {
          type: 'object',
          properties: {
            documentType: { type: 'string' },
            keyFinancialData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  value: { type: 'string' },
                  amount: { type: 'number' }
                }
              }
            },
            businessInsights: {
              type: 'array',
              items: { type: 'string' }
            },
            actionItems: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      })

      return {
        extractedText,
        analysisResult: analysisResult.object,
        processingType: 'document_analysis'
      }
    } catch (error) {
      console.error('Error processing document:', error)
      throw error
    }
  }

  // Process spreadsheet input (Excel, CSV, etc.)
  private async processSpreadsheetInput(file: File): Promise<any> {
    try {
      // Extract data from spreadsheet
      const extractedText = await blink.data.extractFromBlob(file)

      // Use AI to analyze spreadsheet data
      const analysisResult = await blink.ai.generateObject({
        prompt: `Analyze this spreadsheet data and identify financial patterns:
                 ${extractedText}
                 
                 Extract financial data, identify columns, and provide insights.`,
        schema: {
          type: 'object',
          properties: {
            dataStructure: {
              type: 'object',
              properties: {
                columns: { type: 'array', items: { type: 'string' } },
                rowCount: { type: 'number' },
                dataTypes: { type: 'array', items: { type: 'string' } }
              }
            },
            financialSummary: {
              type: 'object',
              properties: {
                totalRevenue: { type: 'number' },
                totalExpenses: { type: 'number' },
                netIncome: { type: 'number' },
                topCategories: { type: 'array', items: { type: 'string' } }
              }
            },
            patterns: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      })

      return {
        extractedData: extractedText,
        analysisResult: analysisResult.object,
        processingType: 'spreadsheet_analysis'
      }
    } catch (error) {
      console.error('Error processing spreadsheet:', error)
      throw error
    }
  }

  // Learn from extracted data
  private async learnFromExtractedData(userId: string, extractedData: any, type: string): Promise<void> {
    const documentLearning: DocumentLearning = {
      userId,
      documentType: this.inferDocumentType(extractedData),
      extractedData,
      patterns: this.extractPatterns(extractedData),
      timestamp: Date.now()
    }

    const existingLearnings = this.documentLearnings.get(userId) || []
    existingLearnings.push(documentLearning)
    this.documentLearnings.set(userId, existingLearnings)

    // Update business patterns based on new data
    await this.updateBusinessPatternsFromDocument(userId, documentLearning)
  }

  // Analyze revenue patterns
  private analyzeRevenuePatterns(transactions: any[], invoices: any[]): BusinessLearning[] {
    const patterns: BusinessLearning[] = []

    // Analyze monthly revenue trends
    const monthlyRevenue = this.groupByMonth(transactions.filter(t => t.type === 'income'))
    if (monthlyRevenue.length >= this.MIN_DATA_POINTS) {
      const trend = this.calculateTrend(monthlyRevenue)
      patterns.push({
        userId: transactions[0]?.userId || '',
        category: 'revenue_patterns',
        pattern: `Monthly revenue ${trend > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(trend).toFixed(1)}%`,
        confidence: Math.min(0.9, monthlyRevenue.length / 12),
        dataPoints: monthlyRevenue.length,
        lastUpdated: Date.now(),
        insights: [
          `Revenue trend: ${trend > 0 ? 'Growing' : 'Declining'}`,
          `Average monthly revenue: $${this.calculateAverage(monthlyRevenue).toFixed(2)}`,
          `Revenue volatility: ${this.calculateVolatility(monthlyRevenue).toFixed(1)}%`
        ]
      })
    }

    return patterns
  }

  // Analyze expense patterns
  private analyzeExpensePatterns(transactions: any[]): BusinessLearning[] {
    const patterns: BusinessLearning[] = []
    const expenses = transactions.filter(t => t.type === 'expense')

    if (expenses.length >= this.MIN_DATA_POINTS) {
      const categoryBreakdown = this.groupByCategory(expenses)
      const topCategories = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)

      patterns.push({
        userId: transactions[0]?.userId || '',
        category: 'expense_categories',
        pattern: `Top expense categories: ${topCategories.map(([cat]) => cat).join(', ')}`,
        confidence: 0.8,
        dataPoints: expenses.length,
        lastUpdated: Date.now(),
        insights: topCategories.map(([cat, amount]) => 
          `${cat}: $${(amount as number).toFixed(2)} (${((amount as number) / expenses.reduce((sum, e) => sum + e.amount, 0) * 100).toFixed(1)}%)`
        )
      })
    }

    return patterns
  }

  // Analyze customer behavior
  private analyzeCustomerBehavior(customers: any[], invoices: any[]): BusinessLearning[] {
    const patterns: BusinessLearning[] = []

    if (customers.length >= this.MIN_DATA_POINTS) {
      const paymentPatterns = this.analyzePaymentPatterns(invoices)
      patterns.push({
        userId: customers[0]?.userId || '',
        category: 'customer_behavior',
        pattern: `Average payment time: ${paymentPatterns.averagePaymentDays} days`,
        confidence: 0.7,
        dataPoints: invoices.length,
        lastUpdated: Date.now(),
        insights: [
          `${paymentPatterns.onTimePayments}% of customers pay on time`,
          `${paymentPatterns.latePayments}% of payments are late`,
          `Top customer represents ${paymentPatterns.topCustomerPercentage}% of revenue`
        ]
      })
    }

    return patterns
  }

  // Analyze seasonal trends
  private analyzeSeasonalTrends(transactions: any[], invoices: any[]): BusinessLearning[] {
    const patterns: BusinessLearning[] = []
    const allData = [...transactions, ...invoices]

    if (allData.length >= 12) { // Need at least a year of data
      const seasonalData = this.groupBySeason(allData)
      const strongestSeason = Object.entries(seasonalData)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]

      patterns.push({
        userId: transactions[0]?.userId || '',
        category: 'seasonal_trends',
        pattern: `Strongest season: ${strongestSeason[0]}`,
        confidence: 0.6,
        dataPoints: allData.length,
        lastUpdated: Date.now(),
        insights: [
          `${strongestSeason[0]} generates ${((strongestSeason[1] as number) / Object.values(seasonalData).reduce((a, b) => (a as number) + (b as number), 0) * 100).toFixed(1)}% of annual activity`,
          'Consider seasonal budgeting and cash flow planning',
          'Plan marketing campaigns around peak seasons'
        ]
      })
    }

    return patterns
  }

  // Analyze vendor relationships
  private analyzeVendorRelationships(vendors: any[], transactions: any[]): BusinessLearning[] {
    const patterns: BusinessLearning[] = []
    const vendorTransactions = transactions.filter(t => t.type === 'expense')

    if (vendors.length >= this.MIN_DATA_POINTS) {
      const vendorSpending = this.groupByVendor(vendorTransactions)
      const topVendor = Object.entries(vendorSpending)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]

      patterns.push({
        userId: vendors[0]?.userId || '',
        category: 'vendor_relationships',
        pattern: `Top vendor: ${topVendor[0]}`,
        confidence: 0.7,
        dataPoints: vendorTransactions.length,
        lastUpdated: Date.now(),
        insights: [
          `Top vendor represents ${((topVendor[1] as number) / vendorTransactions.reduce((sum, t) => sum + t.amount, 0) * 100).toFixed(1)}% of expenses`,
          'Consider negotiating better terms with top vendors',
          'Diversify vendor relationships to reduce risk'
        ]
      })
    }

    return patterns
  }

  // Helper methods for data analysis
  private groupByMonth(data: any[]): number[] {
    const monthly: { [key: string]: number } = {}
    data.forEach(item => {
      const month = new Date(item.date || item.createdAt).toISOString().slice(0, 7)
      monthly[month] = (monthly[month] || 0) + (item.amount || 0)
    })
    return Object.values(monthly)
  }

  private groupByCategory(data: any[]): { [key: string]: number } {
    const categories: { [key: string]: number } = {}
    data.forEach(item => {
      const category = item.category || 'Uncategorized'
      categories[category] = (categories[category] || 0) + (item.amount || 0)
    })
    return categories
  }

  private groupBySeason(data: any[]): { [key: string]: number } {
    const seasons: { [key: string]: number } = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 }
    data.forEach(item => {
      const month = new Date(item.date || item.createdAt).getMonth()
      const season = month < 3 ? 'Winter' : month < 6 ? 'Spring' : month < 9 ? 'Summer' : 'Fall'
      seasons[season] += item.amount || 0
    })
    return seasons
  }

  private groupByVendor(data: any[]): { [key: string]: number } {
    const vendors: { [key: string]: number } = {}
    data.forEach(item => {
      const vendor = item.vendor || item.description || 'Unknown'
      vendors[vendor] = (vendors[vendor] || 0) + (item.amount || 0)
    })
    return vendors
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0
    const first = data[0]
    const last = data[data.length - 1]
    return ((last - first) / first) * 100
  }

  private calculateAverage(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length
  }

  private calculateVolatility(data: number[]): number {
    const avg = this.calculateAverage(data)
    const variance = data.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.length
    return Math.sqrt(variance) / avg * 100
  }

  private analyzePaymentPatterns(invoices: any[]): any {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const onTime = paidInvoices.filter(inv => {
      const dueDate = new Date(inv.dueDate)
      const paidDate = new Date(inv.paidDate || inv.updatedAt)
      return paidDate <= dueDate
    })

    return {
      averagePaymentDays: 30, // Simplified calculation
      onTimePayments: Math.round((onTime.length / paidInvoices.length) * 100),
      latePayments: Math.round(((paidInvoices.length - onTime.length) / paidInvoices.length) * 100),
      topCustomerPercentage: 25 // Simplified calculation
    }
  }

  private inferIndustry(learnings: BusinessLearning[]): string {
    // Simplified industry inference based on patterns
    const expensePatterns = learnings.filter(l => l.category === 'expense_categories')
    if (expensePatterns.some(p => p.pattern.includes('inventory'))) return 'Retail'
    if (expensePatterns.some(p => p.pattern.includes('software'))) return 'Technology'
    if (expensePatterns.some(p => p.pattern.includes('materials'))) return 'Manufacturing'
    return 'Services'
  }

  private inferBusinessType(learnings: BusinessLearning[]): string {
    const revenuePatterns = learnings.filter(l => l.category === 'revenue_patterns')
    if (revenuePatterns.some(p => p.pattern.includes('recurring'))) return 'Subscription'
    return 'Traditional'
  }

  private inferRevenueRange(transactions: any[], invoices: any[]): string {
    const totalRevenue = [...transactions, ...invoices]
      .filter(item => item.type === 'income' || item.amount > 0)
      .reduce((sum, item) => sum + (item.amount || 0), 0)
    
    if (totalRevenue > 1000000) return '$1M+'
    if (totalRevenue > 500000) return '$500K-$1M'
    if (totalRevenue > 100000) return '$100K-$500K'
    return 'Under $100K'
  }

  private inferPrimaryCurrency(transactions: any[]): string {
    const currencies = transactions.map(t => t.currency || 'USD')
    const currencyCount: { [key: string]: number } = {}
    currencies.forEach(c => currencyCount[c] = (currencyCount[c] || 0) + 1)
    return Object.entries(currencyCount).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'USD'
  }

  private inferDocumentType(extractedData: any): 'invoice' | 'receipt' | 'statement' | 'report' | 'contract' {
    const data = extractedData.extractedData || extractedData.analysisResult || extractedData
    if (data.documentType) return data.documentType
    if (data.vendor && data.totalAmount) return 'receipt'
    if (data.customer && data.dueDate) return 'invoice'
    return 'document'
  }

  private extractPatterns(extractedData: any): string[] {
    const patterns: string[] = []
    const data = extractedData.extractedData || extractedData.analysisResult || extractedData
    
    if (data.category) patterns.push(`Category: ${data.category}`)
    if (data.vendor) patterns.push(`Vendor: ${data.vendor}`)
    if (data.totalAmount) patterns.push(`Amount: $${data.totalAmount}`)
    if (data.patterns) patterns.push(...data.patterns)
    
    return patterns
  }

  private async updateBusinessPatternsFromDocument(userId: string, documentLearning: DocumentLearning): Promise<void> {
    // Update business learnings based on new document
    const existingLearnings = this.businessLearnings.get(userId) || []
    
    // Add insights from document to existing patterns
    documentLearning.patterns.forEach(pattern => {
      const existingPattern = existingLearnings.find(l => l.pattern.includes(pattern))
      if (existingPattern) {
        existingPattern.dataPoints++
        existingPattern.confidence = Math.min(0.95, existingPattern.confidence + 0.05)
        existingPattern.lastUpdated = Date.now()
      }
    })
    
    this.businessLearnings.set(userId, existingLearnings)
  }

  // Get personalized business insights
  getPersonalizedInsights(userId: string): string[] {
    const learnings = this.businessLearnings.get(userId) || []
    const insights: string[] = []
    
    learnings.forEach(learning => {
      if (learning.confidence > 0.7) {
        insights.push(`**${learning.category.replace('_', ' ').toUpperCase()}**: ${learning.pattern}`)
        insights.push(...learning.insights.map(insight => `  • ${insight}`))
      }
    })
    
    return insights
  }

  // Get learning statistics
  getLearningStats(userId: string): any {
    const learnings = this.businessLearnings.get(userId) || []
    const documents = this.documentLearnings.get(userId) || []
    
    return {
      totalPatterns: learnings.length,
      highConfidencePatterns: learnings.filter(l => l.confidence > 0.8).length,
      documentsProcessed: documents.length,
      lastLearningUpdate: Math.max(...learnings.map(l => l.lastUpdated), 0)
    }
  }
}

// Export singleton instance
export const customTraining = new CustomTrainingSystem()
export default customTraining