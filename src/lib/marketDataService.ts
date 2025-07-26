// Real-Time Market Data Service for Enhanced Financial Insights

import blink from '@/blink/client'

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: number
}

interface CurrencyRate {
  from: string
  to: string
  rate: number
  timestamp: number
}

interface EconomicIndicator {
  name: string
  value: number
  unit: string
  timestamp: number
  description: string
}

class MarketDataService {
  private marketDataCache = new Map<string, MarketData>()
  private currencyCache = new Map<string, CurrencyRate>()
  private economicCache = new Map<string, EconomicIndicator>()
  private readonly CACHE_DURATION = 1000 * 60 * 5 // 5 minutes for market data

  // Get real-time stock price data
  async getStockPrice(symbol: string): Promise<MarketData | null> {
    const cacheKey = symbol.toUpperCase()
    const cached = this.marketDataCache.get(cacheKey)
    
    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached
    }

    try {
      // Use Alpha Vantage free API for real-time stock data
      const response = await blink.data.fetch({
        url: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey={{alpha_vantage_api_key}}`,
        method: 'GET'
      })

      if (response.status === 200 && response.body['Global Quote']) {
        const quote = response.body['Global Quote']
        const marketData: MarketData = {
          symbol: symbol.toUpperCase(),
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          timestamp: Date.now()
        }

        this.marketDataCache.set(cacheKey, marketData)
        return marketData
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
    }

    return null
  }

  // Get real-time currency exchange rates
  async getCurrencyRate(from: string, to: string): Promise<CurrencyRate | null> {
    const cacheKey = `${from}_${to}`
    const cached = this.currencyCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached
    }

    try {
      // Use Alpha Vantage for currency exchange rates
      const response = await blink.data.fetch({
        url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey={{alpha_vantage_api_key}}`,
        method: 'GET'
      })

      if (response.status === 200 && response.body['Realtime Currency Exchange Rate']) {
        const rate = response.body['Realtime Currency Exchange Rate']
        const currencyRate: CurrencyRate = {
          from: from.toUpperCase(),
          to: to.toUpperCase(),
          rate: parseFloat(rate['5. Exchange Rate']),
          timestamp: Date.now()
        }

        this.currencyCache.set(cacheKey, currencyRate)
        return currencyRate
      }
    } catch (error) {
      console.error('Error fetching currency rate:', error)
    }

    return null
  }

  // Get economic indicators
  async getEconomicIndicators(): Promise<EconomicIndicator[]> {
    const indicators: EconomicIndicator[] = []
    
    try {
      // Get key economic indicators
      const gdpResponse = await blink.data.fetch({
        url: `https://www.alphavantage.co/query?function=REAL_GDP&interval=annual&apikey={{alpha_vantage_api_key}}`,
        method: 'GET'
      })

      const inflationResponse = await blink.data.fetch({
        url: `https://www.alphavantage.co/query?function=INFLATION&apikey={{alpha_vantage_api_key}}`,
        method: 'GET'
      })

      const unemploymentResponse = await blink.data.fetch({
        url: `https://www.alphavantage.co/query?function=UNEMPLOYMENT&apikey={{alpha_vantage_api_key}}`,
        method: 'GET'
      })

      // Process GDP data
      if (gdpResponse.status === 200 && gdpResponse.body.data) {
        const latestGDP = gdpResponse.body.data[0]
        indicators.push({
          name: 'Real GDP',
          value: parseFloat(latestGDP.value),
          unit: 'Billions USD',
          timestamp: Date.now(),
          description: 'Real Gross Domestic Product measures economic output'
        })
      }

      // Process inflation data
      if (inflationResponse.status === 200 && inflationResponse.body.data) {
        const latestInflation = inflationResponse.body.data[0]
        indicators.push({
          name: 'Inflation Rate',
          value: parseFloat(latestInflation.value),
          unit: '%',
          timestamp: Date.now(),
          description: 'Consumer Price Index inflation rate'
        })
      }

      // Process unemployment data
      if (unemploymentResponse.status === 200 && unemploymentResponse.body.data) {
        const latestUnemployment = unemploymentResponse.body.data[0]
        indicators.push({
          name: 'Unemployment Rate',
          value: parseFloat(latestUnemployment.value),
          unit: '%',
          timestamp: Date.now(),
          description: 'National unemployment rate'
        })
      }

    } catch (error) {
      console.error('Error fetching economic indicators:', error)
    }

    return indicators
  }

  // Get market sentiment and trends
  async getMarketSentiment(): Promise<string> {
    try {
      // Get major indices for market sentiment
      const [spyData, vixData] = await Promise.all([
        this.getStockPrice('SPY'), // S&P 500 ETF
        this.getStockPrice('VIX')  // Volatility Index
      ])

      let sentiment = "Market sentiment is "
      
      if (spyData && vixData) {
        if (spyData.changePercent > 1 && vixData.price < 20) {
          sentiment += "**strongly bullish** 🚀 - Strong gains with low volatility"
        } else if (spyData.changePercent > 0 && vixData.price < 25) {
          sentiment += "**bullish** 📈 - Positive momentum with moderate volatility"
        } else if (spyData.changePercent < -1 && vixData.price > 30) {
          sentiment += "**bearish** 📉 - Declining with high volatility"
        } else if (spyData.changePercent < 0) {
          sentiment += "**cautious** ⚠️ - Slight decline, watching for trends"
        } else {
          sentiment += "**neutral** ➡️ - Mixed signals, consolidating"
        }
        
        sentiment += `\n\n**Key Metrics:**\n• S&P 500: ${spyData.changePercent.toFixed(2)}%\n• VIX (Fear Index): ${vixData.price.toFixed(2)}`
      } else {
        sentiment += "**data unavailable** - Unable to fetch current market data"
      }

      return sentiment
    } catch (error) {
      console.error('Error getting market sentiment:', error)
      return "Market sentiment data is currently unavailable"
    }
  }

  // Get business-relevant financial insights
  async getBusinessInsights(industry?: string): Promise<string> {
    try {
      const [currencyUSD, economicData, marketSentiment] = await Promise.all([
        this.getCurrencyRate('USD', 'EUR'),
        this.getEconomicIndicators(),
        this.getMarketSentiment()
      ])

      let insights = "## 📊 **Current Business Environment**\n\n"
      
      // Currency insights
      if (currencyUSD) {
        insights += `**Currency Markets:**\n• USD/EUR: ${currencyUSD.rate.toFixed(4)} (impacts international business)\n\n`
      }

      // Economic insights
      if (economicData.length > 0) {
        insights += "**Economic Indicators:**\n"
        economicData.forEach(indicator => {
          insights += `• ${indicator.name}: ${indicator.value}${indicator.unit}\n`
        })
        insights += "\n"
      }

      // Market sentiment
      insights += marketSentiment + "\n\n"

      // Industry-specific insights
      if (industry) {
        insights += `**${industry} Industry Impact:**\n`
        insights += this.getIndustrySpecificInsights(industry, economicData)
      }

      insights += "**Business Recommendations:**\n"
      insights += "• Monitor cash flow closely during market volatility\n"
      insights += "• Consider currency hedging for international transactions\n"
      insights += "• Review pricing strategies based on inflation trends\n"
      insights += "• Maintain adequate cash reserves for opportunities"

      return insights
    } catch (error) {
      console.error('Error getting business insights:', error)
      return "Business insights are currently unavailable. Please try again later."
    }
  }

  // Get industry-specific insights
  private getIndustrySpecificInsights(industry: string, economicData: EconomicIndicator[]): string {
    const inflationRate = economicData.find(d => d.name === 'Inflation Rate')?.value || 0
    const unemploymentRate = economicData.find(d => d.name === 'Unemployment Rate')?.value || 0

    switch (industry.toLowerCase()) {
      case 'retail':
        return `• Consumer spending may ${inflationRate > 3 ? 'decrease' : 'remain stable'} with ${inflationRate.toFixed(1)}% inflation\n• Labor costs ${unemploymentRate < 4 ? 'rising due to tight job market' : 'stable with higher unemployment'}\n`
      
      case 'technology':
        return `• Tech stocks sensitive to interest rate changes\n• Innovation spending may ${inflationRate > 4 ? 'slow' : 'continue'} with current economic conditions\n`
      
      case 'manufacturing':
        return `• Raw material costs affected by ${inflationRate.toFixed(1)}% inflation\n• Labor availability ${unemploymentRate < 4 ? 'tight' : 'improving'}\n`
      
      case 'services':
        return `• Service demand ${unemploymentRate < 4 ? 'strong with low unemployment' : 'may soften'}\n• Pricing power ${inflationRate > 3 ? 'exists' : 'limited'} in current environment\n`
      
      default:
        return `• Monitor inflation impact on costs (${inflationRate.toFixed(1)}%)\n• Labor market conditions: ${unemploymentRate.toFixed(1)}% unemployment\n`
    }
  }

  // Clear all caches
  clearCache(): void {
    this.marketDataCache.clear()
    this.currencyCache.clear()
    this.economicCache.clear()
  }

  // Get cache statistics
  getCacheStats(): { marketData: number; currency: number; economic: number } {
    return {
      marketData: this.marketDataCache.size,
      currency: this.currencyCache.size,
      economic: this.economicCache.size
    }
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService()
export default marketDataService