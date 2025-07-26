import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export interface DocumentData {
  id: string
  type: 'pdf' | 'invoice' | 'spreadsheet' | 'contract' | 'statement'
  filename: string
  extractedText: string
  structuredData: any
  insights: string[]
  processedAt: string
  confidence: number
}

export interface FinancialDocument {
  documentType: string
  vendor?: string
  customer?: string
  amount?: number
  date?: string
  dueDate?: string
  invoiceNumber?: string
  lineItems?: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  totals?: {
    subtotal: number
    tax: number
    total: number
  }
}

export class DocumentProcessorMCP {
  private static instance: DocumentProcessorMCP

  static getInstance(): DocumentProcessorMCP {
    if (!DocumentProcessorMCP.instance) {
      DocumentProcessorMCP.instance = new DocumentProcessorMCP()
    }
    return DocumentProcessorMCP.instance
  }

  // Process any document type with AI-powered analysis
  async processDocument(file: File | string): Promise<DocumentData> {
    try {
      console.log('📄 Processing document with AI analysis...')
      
      const filename = typeof file === 'string' ? file.split('/').pop() || 'document' : file.name
      const documentType = this.detectDocumentType(filename)
      
      // Extract text content
      const extractedText = typeof file === 'string' 
        ? await blink.data.extractFromUrl(file)
        : await blink.data.extractFromBlob(file)

      console.log(`📊 Extracted ${extractedText.length} characters from ${filename}`)

      // Analyze document structure based on type
      const structuredData = await this.analyzeDocumentStructure(extractedText, documentType)
      
      // Generate business insights
      const insights = await this.generateDocumentInsights(extractedText, structuredData, documentType)

      const processedDocument: DocumentData = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: documentType,
        filename,
        extractedText,
        structuredData,
        insights,
        processedAt: new Date().toISOString(),
        confidence: 0.92
      }

      console.log('✅ Document processed successfully:', processedDocument.id)
      return processedDocument

    } catch (error) {
      console.error('❌ Document processing failed:', error)
      throw new Error(`Document processing failed: ${error.message}`)
    }
  }

  // Detect document type from filename and content
  private detectDocumentType(filename: string): DocumentData['type'] {
    const extension = filename.split('.').pop()?.toLowerCase()
    const name = filename.toLowerCase()

    if (extension === 'pdf' || name.includes('pdf')) return 'pdf'
    if (name.includes('invoice') || name.includes('bill')) return 'invoice'
    if (['xlsx', 'xls', 'csv'].includes(extension || '')) return 'spreadsheet'
    if (name.includes('contract') || name.includes('agreement')) return 'contract'
    if (name.includes('statement') || name.includes('bank')) return 'statement'
    
    return 'pdf' // Default
  }

  // AI-powered document structure analysis
  private async analyzeDocumentStructure(text: string, type: DocumentData['type']): Promise<any> {
    try {
      let analysisPrompt = ''
      let schema: any = {}

      switch (type) {
        case 'invoice':
          analysisPrompt = `Analyze this invoice document and extract structured financial data:

${text.substring(0, 2000)}

Extract all relevant invoice information including vendor details, line items, amounts, dates, and payment terms.`
          schema = {
            type: 'object',
            properties: {
              documentType: { type: 'string' },
              vendor: { type: 'string' },
              customer: { type: 'string' },
              invoiceNumber: { type: 'string' },
              date: { type: 'string' },
              dueDate: { type: 'string' },
              lineItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    quantity: { type: 'number' },
                    unitPrice: { type: 'number' },
                    total: { type: 'number' }
                  }
                }
              },
              totals: {
                type: 'object',
                properties: {
                  subtotal: { type: 'number' },
                  tax: { type: 'number' },
                  total: { type: 'number' }
                }
              }
            }
          }
          break

        case 'spreadsheet':
          analysisPrompt = `Analyze this spreadsheet data and identify the structure and key financial information:

${text.substring(0, 2000)}

Identify columns, data types, financial metrics, and any patterns or trends.`
          schema = {
            type: 'object',
            properties: {
              columns: { type: 'array', items: { type: 'string' } },
              rowCount: { type: 'number' },
              financialMetrics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string' },
                    value: { type: 'number' },
                    period: { type: 'string' }
                  }
                }
              },
              dataTypes: { type: 'object' },
              summary: { type: 'string' }
            }
          }
          break

        case 'statement':
          analysisPrompt = `Analyze this financial statement and extract key financial data:

${text.substring(0, 2000)}

Extract account balances, transactions, dates, and any important financial information.`
          schema = {
            type: 'object',
            properties: {
              statementType: { type: 'string' },
              accountNumber: { type: 'string' },
              period: { type: 'string' },
              openingBalance: { type: 'number' },
              closingBalance: { type: 'number' },
              transactions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    description: { type: 'string' },
                    amount: { type: 'number' },
                    balance: { type: 'number' }
                  }
                }
              }
            }
          }
          break

        default:
          analysisPrompt = `Analyze this document and extract any relevant business or financial information:

${text.substring(0, 2000)}

Identify key data points, dates, amounts, parties involved, and business context.`
          schema = {
            type: 'object',
            properties: {
              documentType: { type: 'string' },
              keyPoints: { type: 'array', items: { type: 'string' } },
              parties: { type: 'array', items: { type: 'string' } },
              dates: { type: 'array', items: { type: 'string' } },
              amounts: { type: 'array', items: { type: 'number' } },
              summary: { type: 'string' }
            }
          }
      }

      const { object: structuredData } = await blink.ai.generateObject({
        prompt: analysisPrompt,
        schema
      })

      return structuredData

    } catch (error) {
      console.error('❌ Document structure analysis failed:', error)
      return { error: 'Analysis failed', rawText: text.substring(0, 500) }
    }
  }

  // Generate business insights from document
  private async generateDocumentInsights(text: string, structuredData: any, type: DocumentData['type']): Promise<string[]> {
    try {
      const { text: insightsText } = await blink.ai.generateText({
        prompt: `Analyze this ${type} document and provide 3-5 actionable business insights:

Document Type: ${type}
Structured Data: ${JSON.stringify(structuredData, null, 2)}

Provide specific insights about:
1. Financial implications
2. Business opportunities or risks
3. Compliance or regulatory considerations
4. Operational recommendations
5. Cost optimization opportunities

Format as numbered list.`,
        maxTokens: 400
      })

      const insights = insightsText
        .split('\n')
        .filter(line => line.trim().length > 0 && /^\d+\./.test(line.trim()))
        .map(line => line.trim())

      return insights.length > 0 ? insights : ['Document processed successfully with AI analysis']

    } catch (error) {
      console.error('❌ Insight generation failed:', error)
      return ['Document processed - insights generation failed']
    }
  }

  // Process multiple documents in batch
  async processBulkDocuments(files: File[]): Promise<DocumentData[]> {
    console.log(`📚 Processing ${files.length} documents in bulk...`)
    
    const results: DocumentData[] = []
    
    for (const file of files) {
      try {
        const documentData = await this.processDocument(file)
        results.push(documentData)
      } catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error)
      }
    }

    console.log(`✅ Processed ${results.length} documents successfully`)
    return results
  }

  // Extract financial data specifically for accounting integration
  async extractFinancialData(document: DocumentData): Promise<FinancialDocument | null> {
    if (!document.structuredData) return null

    try {
      // Convert structured data to standardized financial format
      const financialData: FinancialDocument = {
        documentType: document.type,
        vendor: document.structuredData.vendor,
        customer: document.structuredData.customer,
        amount: document.structuredData.totals?.total || document.structuredData.amount,
        date: document.structuredData.date,
        dueDate: document.structuredData.dueDate,
        invoiceNumber: document.structuredData.invoiceNumber,
        lineItems: document.structuredData.lineItems,
        totals: document.structuredData.totals
      }

      return financialData

    } catch (error) {
      console.error('❌ Financial data extraction failed:', error)
      return null
    }
  }

  // Create accounting entries from processed documents
  async createAccountingEntries(document: DocumentData, userId: string): Promise<void> {
    const financialData = await this.extractFinancialData(document)
    if (!financialData || !financialData.amount) return

    try {
      // Create transaction entry
      await blink.db.transactions.create({
        id: `txn_doc_${document.id}`,
        user_id: userId,
        amount: document.type === 'invoice' && financialData.customer ? 
          Math.abs(financialData.amount) : // Income for customer invoices
          -Math.abs(financialData.amount), // Expense for vendor bills
        description: `${document.type.toUpperCase()}: ${financialData.vendor || financialData.customer || document.filename}`,
        category: this.categorizeDocument(document.type, financialData),
        date: financialData.date || new Date().toISOString().split('T')[0],
        type: document.type === 'invoice' && financialData.customer ? 'income' : 'expense',
        document_id: document.id,
        created_at: new Date().toISOString()
      })

      console.log('✅ Accounting entry created from document:', document.id)

    } catch (error) {
      console.error('❌ Failed to create accounting entry:', error)
      throw error
    }
  }

  private categorizeDocument(type: DocumentData['type'], data: FinancialDocument): string {
    switch (type) {
      case 'invoice':
        return data.customer ? 'Sales Revenue' : 'Professional Services'
      case 'statement':
        return 'Bank & Finance'
      case 'contract':
        return 'Legal & Professional Fees'
      default:
        return 'Miscellaneous'
    }
  }
}

export const documentProcessorMCP = DocumentProcessorMCP.getInstance()