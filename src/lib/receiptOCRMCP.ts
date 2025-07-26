import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export interface ReceiptData {
  id: string
  vendor: string
  amount: number
  date: string
  category: string
  description: string
  taxAmount?: number
  paymentMethod?: string
  confidence: number
  rawText: string
  processedAt: string
}

export interface ExpenseCategory {
  category: string
  subcategory?: string
  confidence: number
  taxDeductible: boolean
  businessPurpose?: string
}

export class ReceiptOCRMCP {
  private static instance: ReceiptOCRMCP
  private categoryCache = new Map<string, ExpenseCategory>()

  static getInstance(): ReceiptOCRMCP {
    if (!ReceiptOCRMCP.instance) {
      ReceiptOCRMCP.instance = new ReceiptOCRMCP()
    }
    return ReceiptOCRMCP.instance
  }

  // Advanced OCR with AI-powered data extraction
  async processReceiptImage(imageFile: File | string): Promise<ReceiptData> {
    try {
      console.log('🧾 Processing receipt with advanced OCR...')
      
      // Extract text using Blink's OCR capabilities
      const extractedText = typeof imageFile === 'string' 
        ? await blink.data.extractFromUrl(imageFile)
        : await blink.data.extractFromBlob(imageFile)

      console.log('📄 Extracted text:', extractedText.substring(0, 200) + '...')

      // Use AI to structure the receipt data
      const { object: receiptData } = await blink.ai.generateObject({
        prompt: `Analyze this receipt text and extract structured data. Be very accurate with amounts and dates.

Receipt Text:
${extractedText}

Extract the following information:
- Vendor/merchant name
- Total amount (as number)
- Date (YYYY-MM-DD format)
- Individual line items if visible
- Tax amount if shown
- Payment method if mentioned
- Any business-relevant details`,
        schema: {
          type: 'object',
          properties: {
            vendor: { type: 'string' },
            amount: { type: 'number' },
            date: { type: 'string' },
            description: { type: 'string' },
            taxAmount: { type: 'number' },
            paymentMethod: { type: 'string' },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  amount: { type: 'number' }
                }
              }
            }
          },
          required: ['vendor', 'amount', 'date', 'description']
        }
      })

      // Auto-categorize the expense
      const category = await this.categorizeExpense(receiptData.vendor, receiptData.description)

      const processedReceipt: ReceiptData = {
        id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vendor: receiptData.vendor || 'Unknown Vendor',
        amount: receiptData.amount || 0,
        date: receiptData.date || new Date().toISOString().split('T')[0],
        category: category.category,
        description: receiptData.description || 'Receipt expense',
        taxAmount: receiptData.taxAmount,
        paymentMethod: receiptData.paymentMethod,
        confidence: 0.95, // High confidence with AI processing
        rawText: extractedText,
        processedAt: new Date().toISOString()
      }

      console.log('✅ Receipt processed successfully:', processedReceipt)
      return processedReceipt

    } catch (error) {
      console.error('❌ Receipt processing failed:', error)
      throw new Error(`Receipt processing failed: ${error.message}`)
    }
  }

  // AI-powered expense categorization
  async categorizeExpense(vendor: string, description: string): Promise<ExpenseCategory> {
    const cacheKey = `${vendor}_${description}`.toLowerCase()
    
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey)!
    }

    try {
      const { object: category } = await blink.ai.generateObject({
        prompt: `Categorize this business expense for accounting purposes:

Vendor: ${vendor}
Description: ${description}

Provide the most appropriate business expense category and determine if it's tax deductible.

Common categories:
- Office Supplies
- Travel & Transportation
- Meals & Entertainment
- Professional Services
- Software & Technology
- Marketing & Advertising
- Utilities
- Rent & Facilities
- Equipment & Hardware
- Training & Education
- Insurance
- Legal & Professional Fees
- Bank & Finance Charges
- Miscellaneous`,
        schema: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            subcategory: { type: 'string' },
            confidence: { type: 'number' },
            taxDeductible: { type: 'boolean' },
            businessPurpose: { type: 'string' }
          },
          required: ['category', 'confidence', 'taxDeductible']
        }
      })

      const expenseCategory: ExpenseCategory = {
        category: category.category,
        subcategory: category.subcategory,
        confidence: category.confidence || 0.8,
        taxDeductible: category.taxDeductible,
        businessPurpose: category.businessPurpose
      }

      // Cache the result
      this.categoryCache.set(cacheKey, expenseCategory)
      return expenseCategory

    } catch (error) {
      console.error('❌ Expense categorization failed:', error)
      return {
        category: 'Miscellaneous',
        confidence: 0.5,
        taxDeductible: false,
        businessPurpose: 'Uncategorized business expense'
      }
    }
  }

  // Auto-create transactions from processed receipts
  async createTransactionFromReceipt(receiptData: ReceiptData, userId: string): Promise<void> {
    try {
      await blink.db.transactions.create({
        id: `txn_${receiptData.id}`,
        user_id: userId,
        amount: -Math.abs(receiptData.amount), // Negative for expenses
        description: `${receiptData.vendor} - ${receiptData.description}`,
        category: receiptData.category,
        date: receiptData.date,
        type: 'expense',
        payment_method: receiptData.paymentMethod || 'unknown',
        receipt_id: receiptData.id,
        tax_amount: receiptData.taxAmount || 0,
        created_at: new Date().toISOString()
      })

      console.log('✅ Transaction created from receipt:', receiptData.id)
    } catch (error) {
      console.error('❌ Failed to create transaction from receipt:', error)
      throw error
    }
  }

  // Bulk expense processing for maximum efficiency
  async processBulkReceipts(files: File[], userId: string): Promise<{
    processed: ReceiptData[]
    transactions: number
    totalAmount: number
    categories: Record<string, number>
  }> {
    console.log(`🚀 Starting bulk processing of ${files.length} receipts...`)
    
    const processed: ReceiptData[] = []
    const categories: Record<string, number> = {}
    let totalAmount = 0

    for (const file of files) {
      try {
        const receiptData = await this.processReceiptImage(file)
        processed.push(receiptData)
        
        // Create transaction automatically
        await this.createTransactionFromReceipt(receiptData, userId)
        
        // Update statistics
        totalAmount += receiptData.amount
        categories[receiptData.category] = (categories[receiptData.category] || 0) + receiptData.amount
        
      } catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error)
      }
    }

    const result = {
      processed,
      transactions: processed.length,
      totalAmount,
      categories
    }

    console.log('🎉 Bulk processing complete:', result)
    return result
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/') || 
           ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
             file.name.split('.').pop()?.toLowerCase() || ''
           )
  }
}

export const receiptOCRMCP = ReceiptOCRMCP.getInstance()