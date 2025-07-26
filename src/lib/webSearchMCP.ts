import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  publishedDate?: string
  relevanceScore: number
}

export interface CompetitorAnalysis {
  competitor: string
  website: string
  pricing: string[]
  features: string[]
  strengths: string[]
  weaknesses: string[]
  marketPosition: string
}

export interface IndustryTrends {
  trend: string
  impact: 'high' | 'medium' | 'low'
  timeframe: string
  description: string
  businessImplications: string[]
}

export interface MarketIntelligence {
  industryOverview: string
  marketSize: string
  growthRate: string
  keyPlayers: string[]
  trends: IndustryTrends[]
  opportunities: string[]
  threats: string[]
}

export class WebSearchMCP {
  private static instance: WebSearchMCP
  private searchCache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  static getInstance(): WebSearchMCP {
    if (!WebSearchMCP.instance) {
      WebSearchMCP.instance = new WebSearchMCP()
    }
    return WebSearchMCP.instance
  }

  // Advanced web search with multiple sources
  async searchWeb(query: string, options?: {
    type?: 'general' | 'news' | 'academic' | 'business'
    limit?: number
    timeframe?: 'day' | 'week' | 'month' | 'year'
  }): Promise<SearchResult[]> {
    try {
      const cacheKey = `search_${query}_${JSON.stringify(options)}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      console.log(`🔍 Searching web for: "${query}"`)

      // Use Blink's built-in search capabilities
      const searchResults = await blink.data.search(query, {
        type: options?.type === 'news' ? 'news' : undefined,
        limit: options?.limit || 10
      })

      const results: SearchResult[] = []

      // Process organic results
      if (searchResults.organic_results) {
        searchResults.organic_results.forEach((result: any, index: number) => {
          results.push({
            title: result.title || '',
            url: result.link || '',
            snippet: result.snippet || '',
            source: this.extractDomain(result.link || ''),
            relevanceScore: Math.max(0.9 - (index * 0.1), 0.1)
          })
        })
      }

      // Process news results if available
      if (searchResults.news_results) {
        searchResults.news_results.forEach((result: any, index: number) => {
          results.push({
            title: result.title || '',
            url: result.link || '',
            snippet: result.snippet || '',
            source: result.source || this.extractDomain(result.link || ''),
            publishedDate: result.date,
            relevanceScore: Math.max(0.8 - (index * 0.1), 0.1)
          })
        })
      }

      this.setCache(cacheKey, results)
      console.log(`✅ Found ${results.length} search results`)
      return results

    } catch (error) {
      console.error('❌ Web search failed:', error)
      return []
    }
  }

  // Competitor analysis with pricing intelligence
  async analyzeCompetitors(industry: string, businessType: string): Promise<CompetitorAnalysis[]> {
    try {
      console.log(`🏢 Analyzing competitors in ${industry} industry...`)

      // Search for competitors
      const competitorQuery = `${industry} ${businessType} competitors pricing features`
      const searchResults = await this.searchWeb(competitorQuery, { 
        type: 'business', 
        limit: 15 
      })

      // Extract competitor information using AI
      const competitorData: CompetitorAnalysis[] = []

      for (const result of searchResults.slice(0, 5)) {
        try {
          // Scrape competitor website for detailed analysis
          const websiteData = await blink.data.scrape(result.url)
          
          // Use AI to analyze competitor
          const { object: analysis } = await blink.ai.generateObject({
            prompt: `Analyze this competitor website and extract business intelligence:

Website: ${result.url}
Title: ${result.title}
Content: ${websiteData.markdown?.substring(0, 2000)}

Extract competitor information including pricing, features, strengths, and market position.`,
            schema: {
              type: 'object',
              properties: {
                competitor: { type: 'string' },
                website: { type: 'string' },
                pricing: { type: 'array', items: { type: 'string' } },
                features: { type: 'array', items: { type: 'string' } },
                strengths: { type: 'array', items: { type: 'string' } },
                weaknesses: { type: 'array', items: { type: 'string' } },
                marketPosition: { type: 'string' }
              },
              required: ['competitor', 'website', 'marketPosition']
            }
          })

          competitorData.push({
            competitor: analysis.competitor || this.extractDomain(result.url),
            website: result.url,
            pricing: analysis.pricing || [],
            features: analysis.features || [],
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            marketPosition: analysis.marketPosition || 'Unknown'
          })

        } catch (error) {
          console.error(`❌ Failed to analyze competitor ${result.url}:`, error)
        }
      }

      console.log(`✅ Analyzed ${competitorData.length} competitors`)
      return competitorData

    } catch (error) {
      console.error('❌ Competitor analysis failed:', error)
      return []
    }
  }

  // Industry trends and market intelligence
  async getIndustryTrends(industry: string): Promise<MarketIntelligence> {
    try {
      console.log(`📈 Analyzing trends for ${industry} industry...`)

      // Search for industry trends and market data
      const trendsQuery = `${industry} industry trends 2024 market size growth rate`
      const newsQuery = `${industry} industry news latest developments`
      
      const [trendsResults, newsResults] = await Promise.all([
        this.searchWeb(trendsQuery, { type: 'business', limit: 10 }),
        this.searchWeb(newsQuery, { type: 'news', limit: 10 })
      ])

      // Combine and analyze results
      const allResults = [...trendsResults, ...newsResults]
      const combinedContent = allResults
        .map(r => `${r.title}: ${r.snippet}`)
        .join('\n')
        .substring(0, 3000)

      // Generate comprehensive market intelligence
      const { object: intelligence } = await blink.ai.generateObject({
        prompt: `Analyze this industry information and provide comprehensive market intelligence:

Industry: ${industry}
Research Data: ${combinedContent}

Provide detailed market analysis including overview, size, growth, trends, and business implications.`,
        schema: {
          type: 'object',
          properties: {
            industryOverview: { type: 'string' },
            marketSize: { type: 'string' },
            growthRate: { type: 'string' },
            keyPlayers: { type: 'array', items: { type: 'string' } },
            trends: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trend: { type: 'string' },
                  impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                  timeframe: { type: 'string' },
                  description: { type: 'string' },
                  businessImplications: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            opportunities: { type: 'array', items: { type: 'string' } },
            threats: { type: 'array', items: { type: 'string' } }
          },
          required: ['industryOverview', 'marketSize', 'growthRate']
        }
      })

      const marketIntelligence: MarketIntelligence = {
        industryOverview: intelligence.industryOverview || `${industry} industry analysis`,
        marketSize: intelligence.marketSize || 'Data not available',
        growthRate: intelligence.growthRate || 'Data not available',
        keyPlayers: intelligence.keyPlayers || [],
        trends: intelligence.trends || [],
        opportunities: intelligence.opportunities || [],
        threats: intelligence.threats || []
      }

      console.log('✅ Industry analysis complete')
      return marketIntelligence

    } catch (error) {
      console.error('❌ Industry trends analysis failed:', error)
      return {
        industryOverview: `Analysis for ${industry} industry temporarily unavailable`,
        marketSize: 'Data not available',
        growthRate: 'Data not available',
        keyPlayers: [],
        trends: [],
        opportunities: [],
        threats: []
      }
    }
  }

  // Real-time business alerts and monitoring
  async createBusinessAlert(keywords: string[], alertType: 'competitor' | 'industry' | 'regulatory'): Promise<{
    alertId: string
    keywords: string[]
    type: string
    created: string
  }> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Store alert configuration (in a real implementation, this would be in a database)
      const alertConfig = {
        alertId,
        keywords,
        type: alertType,
        created: new Date().toISOString(),
        lastChecked: new Date().toISOString()
      }

      console.log(`🚨 Created business alert: ${alertId}`)
      return alertConfig

    } catch (error) {
      console.error('❌ Failed to create business alert:', error)
      throw error
    }
  }

  // Monitor business mentions and sentiment
  async monitorBrandMentions(brandName: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalMentions: number
    sentiment: 'positive' | 'negative' | 'neutral'
    sources: Array<{ source: string; mentions: number; sentiment: string }>
    keyMentions: SearchResult[]
    recommendations: string[]
  }> {
    try {
      console.log(`👁️ Monitoring brand mentions for: ${brandName}`)

      // Search for brand mentions
      const mentionsQuery = `"${brandName}" review opinion feedback`
      const newsQuery = `"${brandName}" news`
      
      const [mentionResults, newsResults] = await Promise.all([
        this.searchWeb(mentionsQuery, { type: 'general', limit: 20 }),
        this.searchWeb(newsQuery, { type: 'news', limit: 10 })
      ])

      const allMentions = [...mentionResults, ...newsResults]

      // Analyze sentiment using AI
      const mentionTexts = allMentions.map(m => m.snippet).join('\n').substring(0, 2000)
      
      const { object: sentimentAnalysis } = await blink.ai.generateObject({
        prompt: `Analyze the sentiment of these brand mentions for "${brandName}":

${mentionTexts}

Determine overall sentiment and provide insights.`,
        schema: {
          type: 'object',
          properties: {
            overallSentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
            positiveCount: { type: 'number' },
            negativeCount: { type: 'number' },
            neutralCount: { type: 'number' },
            keyThemes: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      })

      // Group mentions by source
      const sourceGroups: Record<string, { mentions: number; sentiment: string }> = {}
      allMentions.forEach(mention => {
        const source = mention.source
        if (!sourceGroups[source]) {
          sourceGroups[source] = { mentions: 0, sentiment: 'neutral' }
        }
        sourceGroups[source].mentions++
      })

      const sources = Object.entries(sourceGroups).map(([source, data]) => ({
        source,
        mentions: data.mentions,
        sentiment: data.sentiment
      }))

      return {
        totalMentions: allMentions.length,
        sentiment: sentimentAnalysis.overallSentiment || 'neutral',
        sources,
        keyMentions: allMentions.slice(0, 5),
        recommendations: sentimentAnalysis.recommendations || [
          'Monitor brand mentions regularly',
          'Respond to negative feedback promptly',
          'Leverage positive mentions for marketing'
        ]
      }

    } catch (error) {
      console.error('❌ Brand monitoring failed:', error)
      return {
        totalMentions: 0,
        sentiment: 'neutral',
        sources: [],
        keyMentions: [],
        recommendations: ['Brand monitoring temporarily unavailable']
      }
    }
  }

  // Helper methods
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return 'unknown'
    }
  }

  private getFromCache(key: string): any {
    const cached = this.searchCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.searchCache.set(key, { data, timestamp: Date.now() })
  }
}

export const webSearchMCP = WebSearchMCP.getInstance()