import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export interface TaxRate {
  jurisdiction: string
  taxType: 'income' | 'sales' | 'payroll' | 'property' | 'excise'
  rate: number
  effectiveDate: string
  description: string
  applicableIncome?: string
  deductions?: string[]
}

export interface ComplianceRequirement {
  id: string
  title: string
  description: string
  jurisdiction: string
  businessType: string[]
  deadline: string
  frequency: 'annual' | 'quarterly' | 'monthly' | 'weekly'
  penalty: string
  resources: string[]
  lastUpdated: string
}

export interface RegulatoryUpdate {
  id: string
  title: string
  summary: string
  effectiveDate: string
  impact: 'high' | 'medium' | 'low'
  affectedBusinessTypes: string[]
  actionRequired: string[]
  source: string
  lastUpdated: string
}

export interface ComplianceAlert {
  id: string
  type: 'deadline' | 'regulatory_change' | 'tax_update' | 'filing_required'
  title: string
  description: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  dueDate?: string
  actionItems: string[]
  resources: string[]
  createdAt: string
}

export class GovernmentComplianceMCP {
  private static instance: GovernmentComplianceMCP
  private complianceCache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  static getInstance(): GovernmentComplianceMCP {
    if (!GovernmentComplianceMCP.instance) {
      GovernmentComplianceMCP.instance = new GovernmentComplianceMCP()
    }
    return GovernmentComplianceMCP.instance
  }

  // Get current tax rates for jurisdiction
  async getTaxRates(jurisdiction: string, businessType: string): Promise<TaxRate[]> {
    try {
      const cacheKey = `tax_rates_${jurisdiction}_${businessType}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      console.log(`💰 Fetching tax rates for ${jurisdiction}...`)

      // Search for current tax information
      const taxQuery = `${jurisdiction} tax rates 2024 ${businessType} income sales payroll`
      const searchResults = await blink.data.search(taxQuery, { 
        type: 'general',
        limit: 10 
      })

      // Extract tax information using AI
      const taxContent = searchResults.organic_results
        ?.map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n')
        .substring(0, 2000) || ''

      const { object: taxData } = await blink.ai.generateObject({
        prompt: `Extract current tax rates and information for ${jurisdiction}:

${taxContent}

Provide accurate tax rates for different types of taxes applicable to ${businessType} businesses.`,
        schema: {
          type: 'object',
          properties: {
            taxRates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  jurisdiction: { type: 'string' },
                  taxType: { type: 'string', enum: ['income', 'sales', 'payroll', 'property', 'excise'] },
                  rate: { type: 'number' },
                  effectiveDate: { type: 'string' },
                  description: { type: 'string' },
                  applicableIncome: { type: 'string' },
                  deductions: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      })

      const taxRates: TaxRate[] = taxData.taxRates?.map(rate => ({
        jurisdiction,
        taxType: rate.taxType as TaxRate['taxType'],
        rate: rate.rate || 0,
        effectiveDate: rate.effectiveDate || new Date().toISOString().split('T')[0],
        description: rate.description || '',
        applicableIncome: rate.applicableIncome,
        deductions: rate.deductions || []
      })) || []

      this.setCache(cacheKey, taxRates)
      console.log(`✅ Found ${taxRates.length} tax rates`)
      return taxRates

    } catch (error) {
      console.error('❌ Failed to fetch tax rates:', error)
      return []
    }
  }

  // Get compliance requirements for business
  async getComplianceRequirements(jurisdiction: string, businessType: string): Promise<ComplianceRequirement[]> {
    try {
      const cacheKey = `compliance_${jurisdiction}_${businessType}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      console.log(`📋 Fetching compliance requirements for ${businessType} in ${jurisdiction}...`)

      // Search for compliance information
      const complianceQuery = `${jurisdiction} ${businessType} business compliance requirements filing deadlines 2024`
      const searchResults = await blink.data.search(complianceQuery, { 
        type: 'general',
        limit: 15 
      })

      // Extract compliance requirements using AI
      const complianceContent = searchResults.organic_results
        ?.map((r: any) => `${r.title}: ${r.snippet}`)
        .join('\n')
        .substring(0, 3000) || ''

      const { object: complianceData } = await blink.ai.generateObject({
        prompt: `Extract compliance requirements for ${businessType} businesses in ${jurisdiction}:

${complianceContent}

Identify filing requirements, deadlines, penalties, and necessary documentation.`,
        schema: {
          type: 'object',
          properties: {
            requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  deadline: { type: 'string' },
                  frequency: { type: 'string', enum: ['annual', 'quarterly', 'monthly', 'weekly'] },
                  penalty: { type: 'string' },
                  resources: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      })

      const requirements: ComplianceRequirement[] = complianceData.requirements?.map((req, index) => ({
        id: `req_${Date.now()}_${index}`,
        title: req.title || 'Compliance Requirement',
        description: req.description || '',
        jurisdiction,
        businessType: [businessType],
        deadline: req.deadline || 'TBD',
        frequency: req.frequency as ComplianceRequirement['frequency'] || 'annual',
        penalty: req.penalty || 'Varies',
        resources: req.resources || [],
        lastUpdated: new Date().toISOString()
      })) || []

      this.setCache(cacheKey, requirements)
      console.log(`✅ Found ${requirements.length} compliance requirements`)
      return requirements

    } catch (error) {
      console.error('❌ Failed to fetch compliance requirements:', error)
      return []
    }
  }

  // Monitor regulatory updates and changes
  async getRegulatoryUpdates(jurisdiction: string, businessType: string): Promise<RegulatoryUpdate[]> {
    try {
      console.log(`📢 Checking regulatory updates for ${businessType} in ${jurisdiction}...`)

      // Search for recent regulatory changes
      const updatesQuery = `${jurisdiction} ${businessType} regulatory changes new laws 2024 business compliance updates`
      const newsQuery = `${jurisdiction} business law changes ${businessType} regulations 2024`

      const [updatesResults, newsResults] = await Promise.all([
        blink.data.search(updatesQuery, { type: 'general', limit: 10 }),
        blink.data.search(newsQuery, { type: 'news', limit: 10 })
      ])

      const allResults = [
        ...(updatesResults.organic_results || []),
        ...(newsResults.news_results || [])
      ]

      const updates: RegulatoryUpdate[] = []

      for (const result of allResults.slice(0, 8)) {
        try {
          // Analyze each result for regulatory impact
          const { object: updateAnalysis } = await blink.ai.generateObject({
            prompt: `Analyze this regulatory update for business impact:

Title: ${result.title}
Content: ${result.snippet}
Source: ${result.link}

Determine if this is a significant regulatory change affecting ${businessType} businesses.`,
            schema: {
              type: 'object',
              properties: {
                isSignificant: { type: 'boolean' },
                title: { type: 'string' },
                summary: { type: 'string' },
                effectiveDate: { type: 'string' },
                impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                affectedBusinessTypes: { type: 'array', items: { type: 'string' } },
                actionRequired: { type: 'array', items: { type: 'string' } }
              }
            }
          })

          if (updateAnalysis.isSignificant) {
            updates.push({
              id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: updateAnalysis.title || result.title,
              summary: updateAnalysis.summary || result.snippet,
              effectiveDate: updateAnalysis.effectiveDate || new Date().toISOString().split('T')[0],
              impact: updateAnalysis.impact || 'medium',
              affectedBusinessTypes: updateAnalysis.affectedBusinessTypes || [businessType],
              actionRequired: updateAnalysis.actionRequired || [],
              source: result.link || 'Unknown',
              lastUpdated: new Date().toISOString()
            })
          }

        } catch (error) {
          console.error(`❌ Failed to analyze update: ${result.title}`, error)
        }
      }

      console.log(`✅ Found ${updates.length} regulatory updates`)
      return updates

    } catch (error) {
      console.error('❌ Failed to fetch regulatory updates:', error)
      return []
    }
  }

  // Generate compliance alerts based on deadlines and requirements
  async generateComplianceAlerts(jurisdiction: string, businessType: string): Promise<ComplianceAlert[]> {
    try {
      console.log(`🚨 Generating compliance alerts for ${businessType} in ${jurisdiction}...`)

      // Get current requirements and updates
      const [requirements, updates] = await Promise.all([
        this.getComplianceRequirements(jurisdiction, businessType),
        this.getRegulatoryUpdates(jurisdiction, businessType)
      ])

      const alerts: ComplianceAlert[] = []
      const currentDate = new Date()

      // Create deadline alerts
      requirements.forEach(req => {
        try {
          const deadline = new Date(req.deadline)
          const daysUntilDeadline = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

          let urgency: ComplianceAlert['urgency'] = 'low'
          if (daysUntilDeadline <= 7) urgency = 'critical'
          else if (daysUntilDeadline <= 30) urgency = 'high'
          else if (daysUntilDeadline <= 60) urgency = 'medium'

          if (daysUntilDeadline > 0 && daysUntilDeadline <= 90) {
            alerts.push({
              id: `alert_deadline_${req.id}`,
              type: 'deadline',
              title: `Upcoming Deadline: ${req.title}`,
              description: `${req.description} - Due in ${daysUntilDeadline} days`,
              urgency,
              dueDate: req.deadline,
              actionItems: [
                'Review filing requirements',
                'Gather necessary documentation',
                'Schedule preparation time',
                'Consider professional assistance if needed'
              ],
              resources: req.resources,
              createdAt: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error(`❌ Failed to process deadline for ${req.title}:`, error)
        }
      })

      // Create regulatory change alerts
      updates.forEach(update => {
        if (update.impact === 'high' || update.impact === 'medium') {
          alerts.push({
            id: `alert_regulatory_${update.id}`,
            type: 'regulatory_change',
            title: `Regulatory Update: ${update.title}`,
            description: update.summary,
            urgency: update.impact === 'high' ? 'high' : 'medium',
            dueDate: update.effectiveDate,
            actionItems: update.actionRequired.length > 0 ? update.actionRequired : [
              'Review regulatory changes',
              'Assess impact on business operations',
              'Update compliance procedures',
              'Consult with legal/tax professional'
            ],
            resources: [update.source],
            createdAt: new Date().toISOString()
          })
        }
      })

      // Sort alerts by urgency and due date
      alerts.sort((a, b) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
        if (urgencyDiff !== 0) return urgencyDiff

        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        return 0
      })

      console.log(`✅ Generated ${alerts.length} compliance alerts`)
      return alerts

    } catch (error) {
      console.error('❌ Failed to generate compliance alerts:', error)
      return []
    }
  }

  // Calculate tax liability estimates
  async calculateTaxEstimate(income: number, jurisdiction: string, businessType: string): Promise<{
    totalTax: number
    breakdown: Array<{ taxType: string; rate: number; amount: number }>
    deductions: Array<{ description: string; amount: number }>
    recommendations: string[]
  }> {
    try {
      console.log(`🧮 Calculating tax estimate for ${jurisdiction}...`)

      const taxRates = await this.getTaxRates(jurisdiction, businessType)
      const breakdown: Array<{ taxType: string; rate: number; amount: number }> = []
      let totalTax = 0

      // Calculate taxes based on rates
      taxRates.forEach(rate => {
        let taxableIncome = income
        
        // Apply basic deductions (simplified)
        if (rate.taxType === 'income') {
          taxableIncome = Math.max(0, income - 12000) // Standard deduction approximation
        }

        const taxAmount = (taxableIncome * rate.rate) / 100
        totalTax += taxAmount

        breakdown.push({
          taxType: rate.taxType,
          rate: rate.rate,
          amount: taxAmount
        })
      })

      // Generate tax optimization recommendations
      const { text: recommendationsText } = await blink.ai.generateText({
        prompt: `Provide tax optimization recommendations for a ${businessType} business in ${jurisdiction} with $${income} income:

Current Tax Estimate: $${totalTax.toFixed(2)}
Tax Breakdown: ${breakdown.map(b => `${b.taxType}: ${b.rate}% = $${b.amount.toFixed(2)}`).join(', ')}

Provide 3-5 specific tax optimization strategies.`,
        maxTokens: 400
      })

      const recommendations = recommendationsText
        .split('\n')
        .filter(line => line.trim().length > 0 && /^\d+\./.test(line.trim()))
        .map(line => line.trim())

      return {
        totalTax,
        breakdown,
        deductions: [
          { description: 'Standard Deduction', amount: 12000 },
          { description: 'Business Expenses', amount: 0 }
        ],
        recommendations: recommendations.length > 0 ? recommendations : [
          'Maximize business expense deductions',
          'Consider retirement plan contributions',
          'Track all business-related expenses',
          'Consult with a tax professional for optimization'
        ]
      }

    } catch (error) {
      console.error('❌ Tax calculation failed:', error)
      return {
        totalTax: 0,
        breakdown: [],
        deductions: [],
        recommendations: ['Tax calculation temporarily unavailable']
      }
    }
  }

  // Helper methods
  private getFromCache(key: string): any {
    const cached = this.complianceCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.complianceCache.set(key, { data, timestamp: Date.now() })
  }
}

export const governmentComplianceMCP = GovernmentComplianceMCP.getInstance()