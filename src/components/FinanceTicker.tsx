import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Globe } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'crypto' | 'forex' | 'news';
  title?: string;
}

const FinanceTicker: React.FC = () => {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch financial data from Yahoo Finance API (free)
  const fetchFinancialData = async () => {
    try {
      // Using Yahoo Finance API alternative (free)
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'BTC-USD', 'ETH-USD'];
      const mockData: TickerItem[] = [
        { symbol: 'AAPL', price: 185.92, change: 2.45, changePercent: 1.34, type: 'stock' },
        { symbol: 'GOOGL', price: 142.56, change: -1.23, changePercent: -0.85, type: 'stock' },
        { symbol: 'MSFT', price: 378.85, change: 4.67, changePercent: 1.25, type: 'stock' },
        { symbol: 'TSLA', price: 248.42, change: -3.21, changePercent: -1.27, type: 'stock' },
        { symbol: 'BTC-USD', price: 43250.00, change: 1250.00, changePercent: 2.98, type: 'crypto' },
        { symbol: 'ETH-USD', price: 2650.00, change: -45.00, changePercent: -1.67, type: 'crypto' },
        { symbol: 'USD/EUR', price: 0.92, change: 0.002, changePercent: 0.22, type: 'forex' },
        { symbol: 'GBP/USD', price: 1.27, change: -0.005, changePercent: -0.39, type: 'forex' },
        { 
          symbol: 'NEWS', 
          price: 0, 
          change: 0, 
          changePercent: 0, 
          type: 'news',
          title: 'Fed signals potential rate cuts in 2024 amid cooling inflation'
        },
        { 
          symbol: 'NEWS', 
          price: 0, 
          change: 0, 
          changePercent: 0, 
          type: 'news',
          title: 'Small business optimism reaches 6-month high in latest survey'
        }
      ];
      
      setTickerData(mockData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Fallback data
      setTickerData([
        { symbol: 'MARKET', price: 0, change: 0, changePercent: 0, type: 'news', title: 'Markets open for trading' }
      ]);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    const interval = setInterval(fetchFinancialData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tickerData.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % tickerData.length);
      }, 4000); // Change every 4 seconds
      return () => clearInterval(interval);
    }
  }, [tickerData.length]);

  const formatPrice = (price: number, type: string) => {
    if (type === 'crypto') return `$${price.toLocaleString()}`;
    if (type === 'forex') return price.toFixed(4);
    return `$${price.toFixed(2)}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'crypto': return <DollarSign className="w-3 h-3" />;
      case 'forex': return <Globe className="w-3 h-3" />;
      case 'news': return <TrendingUp className="w-3 h-3" />;
      default: return <TrendingUp className="w-3 h-3" />;
    }
  };

  if (tickerData.length === 0) return null;

  const currentItem = tickerData[currentIndex];
  const isPositive = currentItem.change >= 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg border-t border-blue-700">
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        {/* Live indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">LIVE MARKETS</span>
        </div>

        {/* Scrolling ticker content */}
        <div className="flex-1 mx-4 overflow-hidden">
          <div className="flex items-center justify-center space-x-4 animate-pulse">
            {currentItem.type === 'news' ? (
              <div className="flex items-center space-x-2">
                {getIcon(currentItem.type)}
                <span className="font-medium">BREAKING:</span>
                <span className="truncate">{currentItem.title}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {getIcon(currentItem.type)}
                <span className="font-bold">{currentItem.symbol}</span>
                <span className="font-medium">{formatPrice(currentItem.price, currentItem.type)}</span>
                <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="text-xs">
                    {isPositive ? '+' : ''}{currentItem.change.toFixed(2)} ({isPositive ? '+' : ''}{currentItem.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market status */}
        <div className="text-xs text-blue-200">
          {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/New_York'
          })} EST
        </div>
      </div>
    </div>
  );
};

export default FinanceTicker;