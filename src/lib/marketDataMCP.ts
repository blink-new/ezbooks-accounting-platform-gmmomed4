import { createClient } from '@blinkdotnew/sdk'

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
})

export interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: number
  marketCap?: number
  lastUpdated: string
}

export interface CryptoData {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  marketCap: number
  volume24h: number
  rank: number
}

export interface ForexData {
  pair: string
  rate: number
  change: number
  changePercent: number
  lastUpdated: string
}

export interface MarketInsights {
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
  topGainers: MarketData[]
  topLosers: MarketData[]
  recommendations: string[]
  economicIndicators: {
    vix: number
    sp500: number
    nasdaq: number
  }
}

export class MarketDataMCP {
  private static instance: MarketDataMCP
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): MarketDataMCP {
    if (!MarketDataMCP.instance) {
      MarketDataMCP.instance = new MarketDataMCP()
    }
    return MarketDataMCP.instance
  }

  // Get real-time stock data with multiple API fallbacks
  async getStockData(symbols: string[]): Promise<MarketData[]> {
    const results: MarketData[] = []
    
    for (const symbol of symbols) {
      try {
        const cachedData = this.getFromCache(`stock_${symbol}`)
        if (cachedData) {
          results.push(cachedData)
          continue
        }

        // Try Alpha Vantage first
        let stockData = await this.fetchFromAlphaVantage(symbol)
        
        // Fallback to Yahoo Finance if Alpha Vantage fails
        if (!stockData) {
          stockData = await this.fetchFromYahooFinance(symbol)
        }

        if (stockData) {
          this.setCache(`stock_${symbol}`, stockData)
          results.push(stockData)
        }

      } catch (error) {
        console.error(`❌ Failed to fetch data for ${symbol}:`, error)
      }
    }

    return results
  }

  // Get cryptocurrency data from multiple sources
  async getCryptoData(symbols: string[]): Promise<CryptoData[]> {
    try {
      const cachedData = this.getFromCache('crypto_data')
      if (cachedData) {
        return cachedData.filter((crypto: CryptoData) => 
          symbols.includes(crypto.symbol.toUpperCase())
        )
      }

      // Use CoinGecko API (free tier: 50 calls/minute)
      const cryptoData = await this.fetchFromCoinGecko(symbols)
      
      if (cryptoData.length > 0) {
        this.setCache('crypto_data', cryptoData)
      }

      return cryptoData

    } catch (error) {
      console.error('❌ Failed to fetch crypto data:', error)
      return []
    }
  }

  // Get forex rates
  async getForexData(pairs: string[]): Promise<ForexData[]> {
    const results: ForexData[] = []

    for (const pair of pairs) {
      try {
        const cachedData = this.getFromCache(`forex_${pair}`)
        if (cachedData) {
          results.push(cachedData)
          continue
        }

        const forexData = await this.fetchForexRate(pair)
        if (forexData) {
          this.setCache(`forex_${pair}`, forexData)
          results.push(forexData)
        }

      } catch (error) {
        console.error(`❌ Failed to fetch forex data for ${pair}:`, error)
      }
    }

    return results
  }

  // Alpha Vantage API integration
  private async fetchFromAlphaVantage(symbol: string): Promise<MarketData | null> {
    try {
      const response = await blink.data.fetch({
        url: `https://www.alphavantage.co/query`,
        method: 'GET',
        query: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: '{{alpha_vantage_api_key}}'
        }
      })

      if (response.status === 200 && response.body['Global Quote']) {
        const quote = response.body['Global Quote']
        return {
          symbol: symbol.toUpperCase(),
          name: symbol,
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          lastUpdated: new Date().toISOString()
        }
      }

      return null

    } catch (error) {
      console.error(`❌ Alpha Vantage API error for ${symbol}:`, error)
      return null
    }
  }

  // Yahoo Finance fallback (unofficial API)
  private async fetchFromYahooFinance(symbol: string): Promise<MarketData | null> {
    try {
      // Using a public Yahoo Finance API proxy
      const response = await blink.data.fetch({
        url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        method: 'GET'
      })

      if (response.status === 200 && response.body.chart?.result?.[0]) {
        const result = response.body.chart.result[0]
        const meta = result.meta
        
        return {
          symbol: symbol.toUpperCase(),
          name: meta.longName || symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.previousClose,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
          volume: meta.regularMarketVolume,
          marketCap: meta.marketCap,
          lastUpdated: new Date().toISOString()
        }
      }

      return null

    } catch (error) {
      console.error(`❌ Yahoo Finance API error for ${symbol}:`, error)
      return null
    }
  }

  // CoinGecko API for cryptocurrency data
  private async fetchFromCoinGecko(symbols: string[]): Promise<CryptoData[]> {
    try {
      const ids = symbols.map(s => this.getCoinGeckoId(s)).join(',')
      
      const response = await blink.data.fetch({
        url: `https://api.coingecko.com/api/v3/coins/markets`,
        method: 'GET',
        query: {
          vs_currency: 'usd',
          ids: ids,
          order: 'market_cap_desc',
          per_page: '250',
          page: '1',
          sparkline: 'false'
        }
      })

      if (response.status === 200 && Array.isArray(response.body)) {
        return response.body.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_24h,
          changePercent24h: coin.price_change_percentage_24h,
          marketCap: coin.market_cap,
          volume24h: coin.total_volume,
          rank: coin.market_cap_rank
        }))
      }

      return []

    } catch (error) {
      console.error('❌ CoinGecko API error:', error)
      return []
    }
  }

  // Get forex rates
  private async fetchForexRate(pair: string): Promise<ForexData | null> {
    try {
      const [from, to] = pair.split('/')
      
      const response = await blink.data.fetch({
        url: `https://api.exchangerate-api.com/v4/latest/${from}`,
        method: 'GET'
      })

      if (response.status === 200 && response.body.rates?.[to]) {
        const rate = response.body.rates[to]
        
        return {
          pair: pair,
          rate: rate,
          change: 0, // Would need historical data for change
          changePercent: 0,
          lastUpdated: new Date().toISOString()
        }
      }

      return null

    } catch (error) {
      console.error(`❌ Forex API error for ${pair}:`, error)
      return null
    }
  }

  // Generate market insights and recommendations
  async getMarketInsights(): Promise<MarketInsights> {
    try {
      // Get major market indices
      const indices = await this.getStockData(['SPY', 'QQQ', 'VIX'])
      const cryptos = await this.getCryptoData(['BTC', 'ETH', 'BNB'])

      // Analyze market sentiment
      const sp500Data = indices.find(i => i.symbol === 'SPY')
      const vixData = indices.find(i => i.symbol === 'VIX')
      
      let marketSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      
      if (sp500Data && vixData) {
        if (sp500Data.changePercent > 1 && vixData.price < 20) {
          marketSentiment = 'bullish'
        } else if (sp500Data.changePercent < -1 || vixData.price > 30) {
          marketSentiment = 'bearish'
        }
      }

      // Generate AI-powered recommendations
      const { text: recommendationsText } = await blink.ai.generateText({
        prompt: `Based on current market conditions, provide 3 actionable investment recommendations for business owners:

Market Sentiment: ${marketSentiment}
S&P 500 Change: ${sp500Data?.changePercent.toFixed(2)}%
VIX Level: ${vixData?.price.toFixed(2)}
Bitcoin Price: $${cryptos.find(c => c.symbol === 'BTC')?.price.toFixed(0)}

Focus on:
1. Portfolio diversification strategies
2. Risk management in current market
3. Business investment opportunities`,
        maxTokens: 300
      })

      const recommendations = recommendationsText
        .split('\n')
        .filter(line => line.trim().length > 0 && /^\d+\./.test(line.trim()))
        .map(line => line.trim())

      return {
        marketSentiment,
        topGainers: indices.filter(i => i.changePercent > 0).slice(0, 3),
        topLosers: indices.filter(i => i.changePercent < 0).slice(0, 3),
        recommendations: recommendations.length > 0 ? recommendations : [
          'Monitor market volatility and adjust risk tolerance accordingly',
          'Consider diversifying across asset classes including crypto',
          'Focus on quality investments during uncertain times'
        ],
        economicIndicators: {
          vix: vixData?.price || 0,
          sp500: sp500Data?.changePercent || 0,
          nasdaq: indices.find(i => i.symbol === 'QQQ')?.changePercent || 0
        }
      }

    } catch (error) {
      console.error('❌ Failed to generate market insights:', error)
      return {
        marketSentiment: 'neutral',
        topGainers: [],
        topLosers: [],
        recommendations: ['Market data temporarily unavailable'],
        economicIndicators: { vix: 0, sp500: 0, nasdaq: 0 }
      }
    }
  }

  // Portfolio analysis for business investments
  async analyzeBusinessPortfolio(holdings: Array<{ symbol: string; quantity: number; type: 'stock' | 'crypto' }>): Promise<{
    totalValue: number
    totalChange: number
    totalChangePercent: number
    breakdown: Array<{ symbol: string; value: number; weight: number; change: number }>
    recommendations: string[]
  }> {
    try {
      const stockHoldings = holdings.filter(h => h.type === 'stock')
      const cryptoHoldings = holdings.filter(h => h.type === 'crypto')

      const stockData = stockHoldings.length > 0 ? 
        await this.getStockData(stockHoldings.map(h => h.symbol)) : []
      const cryptoData = cryptoHoldings.length > 0 ? 
        await this.getCryptoData(cryptoHoldings.map(h => h.symbol)) : []

      let totalValue = 0
      let totalChange = 0
      const breakdown: Array<{ symbol: string; value: number; weight: number; change: number }> = []

      // Calculate stock values
      stockHoldings.forEach(holding => {
        const data = stockData.find(d => d.symbol === holding.symbol.toUpperCase())
        if (data) {
          const value = data.price * holding.quantity
          const change = data.change * holding.quantity
          totalValue += value
          totalChange += change
          breakdown.push({
            symbol: holding.symbol,
            value,
            weight: 0, // Will calculate after total
            change
          })
        }
      })

      // Calculate crypto values
      cryptoHoldings.forEach(holding => {
        const data = cryptoData.find(d => d.symbol === holding.symbol.toUpperCase())
        if (data) {
          const value = data.price * holding.quantity
          const change = data.change24h * holding.quantity
          totalValue += value
          totalChange += change
          breakdown.push({
            symbol: holding.symbol,
            value,
            weight: 0, // Will calculate after total
            change
          })
        }
      })

      // Calculate weights
      breakdown.forEach(item => {
        item.weight = (item.value / totalValue) * 100
      })

      const totalChangePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0

      // Generate portfolio recommendations
      const { text: recommendationsText } = await blink.ai.generateText({
        prompt: `Analyze this business investment portfolio and provide 3 recommendations:

Total Portfolio Value: $${totalValue.toFixed(2)}
Total Change: ${totalChangePercent.toFixed(2)}%
Holdings: ${breakdown.map(b => `${b.symbol}: $${b.value.toFixed(2)} (${b.weight.toFixed(1)}%)`).join(', ')}

Provide recommendations for:
1. Portfolio rebalancing
2. Risk management
3. Growth opportunities`,
        maxTokens: 300
      })

      const recommendations = recommendationsText
        .split('\n')
        .filter(line => line.trim().length > 0 && /^\d+\./.test(line.trim()))
        .map(line => line.trim())

      return {
        totalValue,
        totalChange,
        totalChangePercent,
        breakdown: breakdown.sort((a, b) => b.value - a.value),
        recommendations: recommendations.length > 0 ? recommendations : [
          'Consider diversifying across different asset classes',
          'Monitor portfolio allocation and rebalance quarterly',
          'Set stop-loss orders to manage downside risk'
        ]
      }

    } catch (error) {
      console.error('❌ Portfolio analysis failed:', error)
      throw error
    }
  }

  // Helper methods
  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'DOGE': 'dogecoin',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'MATIC': 'matic-network'
    }
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase()
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}

export const marketDataMCP = MarketDataMCP.getInstance()