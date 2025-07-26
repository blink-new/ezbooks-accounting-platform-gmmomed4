/**
 * Cryptocurrency Service - Free APIs for Digital Currency Holdings
 * Provides real-time crypto prices, portfolio tracking, and market data
 */

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  last_updated: string;
}

interface CryptoHolding {
  symbol: string;
  name: string;
  amount: number;
  current_price: number;
  value: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
}

interface CryptoPortfolio {
  total_value: number;
  total_change_24h: number;
  total_change_percentage_24h: number;
  holdings: CryptoHolding[];
  last_updated: string;
}

class CryptoService {
  private readonly FREE_APIS = {
    // CoinGecko - Free tier: 50 calls/minute
    COINGECKO: 'https://api.coingecko.com/api/v3',
    
    // CoinCap - Free tier: 1000 requests/day
    COINCAP: 'https://api.coincap.io/v2',
    
    // CryptoCompare - Free tier: 100,000 calls/month
    CRYPTOCOMPARE: 'https://min-api.cryptocompare.com/data',
    
    // Binance - Free tier: 1200 requests/minute
    BINANCE: 'https://api.binance.com/api/v3',
    
    // Kraken - Free tier: 1 call/second
    KRAKEN: 'https://api.kraken.com/0/public'
  };

  /**
   * Get current prices for multiple cryptocurrencies
   * Uses CoinGecko API (free tier)
   */
  async getCryptoPrices(symbols: string[] = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 'polkadot', 'dogecoin', 'avalanche-2', 'chainlink', 'polygon']): Promise<CryptoPrice[]> {
    try {
      const symbolsParam = symbols.join(',');
      const response = await fetch(
        `${this.FREE_APIS.COINGECKO}/simple/price?ids=${symbolsParam}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return symbols.map(symbol => ({
        id: symbol,
        symbol: symbol.toUpperCase(),
        name: this.getCryptoName(symbol),
        current_price: data[symbol]?.usd || 0,
        price_change_24h: data[symbol]?.usd_24h_change || 0,
        price_change_percentage_24h: data[symbol]?.usd_24h_change || 0,
        market_cap: data[symbol]?.usd_market_cap || 0,
        volume_24h: data[symbol]?.usd_24h_vol || 0,
        last_updated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      return this.getFallbackPrices(symbols);
    }
  }

  /**
   * Get detailed crypto data using CoinCap API
   */
  async getCryptoDetails(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.FREE_APIS.COINCAP}/assets/${symbol.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error(`CoinCap API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching crypto details:', error);
      return null;
    }
  }

  /**
   * Calculate portfolio value based on holdings
   */
  async calculatePortfolio(holdings: { symbol: string; amount: number }[]): Promise<CryptoPortfolio> {
    try {
      const symbols = holdings.map(h => h.symbol.toLowerCase());
      const prices = await this.getCryptoPrices(symbols);
      
      let totalValue = 0;
      let totalChange24h = 0;
      
      const portfolioHoldings: CryptoHolding[] = holdings.map(holding => {
        const priceData = prices.find(p => p.id === holding.symbol.toLowerCase());
        const currentPrice = priceData?.current_price || 0;
        const value = holding.amount * currentPrice;
        const change24h = holding.amount * (priceData?.price_change_24h || 0);
        
        totalValue += value;
        totalChange24h += change24h;
        
        return {
          symbol: holding.symbol.toUpperCase(),
          name: priceData?.name || holding.symbol,
          amount: holding.amount,
          current_price: currentPrice,
          value: value,
          price_change_24h: priceData?.price_change_24h || 0,
          price_change_percentage_24h: priceData?.price_change_percentage_24h || 0
        };
      });
      
      const totalChangePercentage = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0;
      
      return {
        total_value: totalValue,
        total_change_24h: totalChange24h,
        total_change_percentage_24h: totalChangePercentage,
        holdings: portfolioHoldings,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating portfolio:', error);
      return {
        total_value: 0,
        total_change_24h: 0,
        total_change_percentage_24h: 0,
        holdings: [],
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrendingCryptos(): Promise<any[]> {
    try {
      const response = await fetch(`${this.FREE_APIS.COINGECKO}/search/trending`);
      
      if (!response.ok) {
        throw new Error(`CoinGecko trending API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.coins || [];
    } catch (error) {
      console.error('Error fetching trending cryptos:', error);
      return [];
    }
  }

  /**
   * Get crypto market data using CryptoCompare
   */
  async getMarketData(symbol: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.FREE_APIS.CRYPTOCOMPARE}/pricemultifull?fsyms=${symbol.toUpperCase()}&tsyms=USD`
      );
      
      if (!response.ok) {
        throw new Error(`CryptoCompare API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.RAW?.[symbol.toUpperCase()]?.USD;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  /**
   * Format currency values
   */
  formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Format percentage changes
   */
  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  /**
   * Get crypto name from symbol
   */
  private getCryptoName(symbol: string): string {
    const names: { [key: string]: string } = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'binancecoin': 'BNB',
      'cardano': 'Cardano',
      'solana': 'Solana',
      'polkadot': 'Polkadot',
      'dogecoin': 'Dogecoin',
      'avalanche-2': 'Avalanche',
      'chainlink': 'Chainlink',
      'polygon': 'Polygon'
    };
    return names[symbol] || symbol.toUpperCase();
  }

  /**
   * Fallback prices when API fails
   */
  private getFallbackPrices(symbols: string[]): CryptoPrice[] {
    return symbols.map(symbol => ({
      id: symbol,
      symbol: symbol.toUpperCase(),
      name: this.getCryptoName(symbol),
      current_price: 0,
      price_change_24h: 0,
      price_change_percentage_24h: 0,
      market_cap: 0,
      volume_24h: 0,
      last_updated: new Date().toISOString()
    }));
  }

  /**
   * Get business insights for crypto holdings
   */
  async getCryptoBusinessInsights(portfolio: CryptoPortfolio): Promise<string[]> {
    const insights: string[] = [];
    
    if (portfolio.total_value > 0) {
      insights.push(`💰 Your crypto portfolio is worth ${this.formatCurrency(portfolio.total_value)}`);
      
      if (portfolio.total_change_percentage_24h > 0) {
        insights.push(`📈 Portfolio is up ${this.formatPercentage(portfolio.total_change_percentage_24h)} today (+${this.formatCurrency(portfolio.total_change_24h)})`);
      } else if (portfolio.total_change_percentage_24h < 0) {
        insights.push(`📉 Portfolio is down ${this.formatPercentage(Math.abs(portfolio.total_change_percentage_24h))} today (${this.formatCurrency(portfolio.total_change_24h)})`);
      }
      
      // Find best and worst performers
      const sortedHoldings = [...portfolio.holdings].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      
      if (sortedHoldings.length > 0) {
        const bestPerformer = sortedHoldings[0];
        const worstPerformer = sortedHoldings[sortedHoldings.length - 1];
        
        if (bestPerformer.price_change_percentage_24h > 0) {
          insights.push(`🚀 Best performer: ${bestPerformer.name} is up ${this.formatPercentage(bestPerformer.price_change_percentage_24h)}`);
        }
        
        if (worstPerformer.price_change_percentage_24h < 0) {
          insights.push(`⚠️ Worst performer: ${worstPerformer.name} is down ${this.formatPercentage(Math.abs(worstPerformer.price_change_percentage_24h))}`);
        }
      }
      
      // Diversification insights
      if (portfolio.holdings.length === 1) {
        insights.push(`⚠️ Consider diversifying your crypto portfolio across multiple assets to reduce risk`);
      } else if (portfolio.holdings.length > 5) {
        insights.push(`✅ Good diversification with ${portfolio.holdings.length} different cryptocurrencies`);
      }
    } else {
      insights.push(`💡 Consider adding cryptocurrency to your investment portfolio for diversification`);
    }
    
    return insights;
  }
}

export const cryptoService = new CryptoService();
export type { CryptoPrice, CryptoHolding, CryptoPortfolio };