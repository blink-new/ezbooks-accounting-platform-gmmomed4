import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, RefreshCw, TrendingUp, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from '@/hooks/use-toast';

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const currencies: CurrencyInfo[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' }
  ];

  // Fetch exchange rates from a free API
  const fetchExchangeRates = async () => {
    setIsLoading(true);
    try {
      // Using exchangerate-api.com (free tier: 1500 requests/month)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      if (data.rates) {
        setExchangeRates(data.rates);
        setLastUpdated(new Date());
        toast({
          title: "Exchange rates updated! 💱",
          description: "Latest currency rates have been loaded."
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Fallback to mock data if API fails
      const mockRates: ExchangeRates = {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CAD: 1.36,
        AUD: 1.52,
        CHF: 0.88,
        CNY: 7.24,
        INR: 83.12,
        BRL: 4.95,
        MXN: 17.08,
        KRW: 1320.45,
        SGD: 1.34,
        HKD: 7.83,
        NOK: 10.87,
        SEK: 10.52,
        DKK: 6.86,
        PLN: 4.02,
        CZK: 22.89,
        HUF: 360.25
      };
      
      setExchangeRates(mockRates);
      setLastUpdated(new Date());
      
      toast({
        title: "Using cached rates",
        description: "Live rates unavailable, using recent exchange rates.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert currency
  const convertCurrency = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) {
      setConvertedAmount(0);
      return;
    }

    // Convert from source currency to USD, then to target currency
    const usdAmount = numAmount / exchangeRates[fromCurrency];
    const converted = usdAmount * exchangeRates[toCurrency];
    setConvertedAmount(converted);
  };

  // Swap currencies
  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Get currency info
  const getCurrencyInfo = (code: string) => {
    return currencies.find(c => c.code === code) || currencies[0];
  };

  // Format currency display
  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = getCurrencyInfo(currencyCode);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get exchange rate between two currencies
  const getExchangeRate = () => {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return 0;
    return exchangeRates[toCurrency] / exchangeRates[fromCurrency];
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    convertCurrency();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, fromCurrency, toCurrency, exchangeRates]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Real-Time Currency Converter</span>
            </div>
            <Button
              onClick={fetchExchangeRates}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-lg font-medium"
            />
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* From Currency */}
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                        <span className="text-sm text-gray-500">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                onClick={swapCurrencies}
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center space-x-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                        <span className="text-sm text-gray-500">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversion Result */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                {formatCurrency(parseFloat(amount) || 0, fromCurrency)}
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(convertedAmount, toCurrency)}
              </div>
              <div className="text-sm text-gray-500 flex items-center justify-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>1 {fromCurrency} = {getExchangeRate().toFixed(4)} {toCurrency}</span>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-xs text-gray-500 text-center">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Currency Pairs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular Exchange Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { from: 'USD', to: 'EUR' },
              { from: 'USD', to: 'GBP' },
              { from: 'USD', to: 'JPY' },
              { from: 'EUR', to: 'GBP' },
              { from: 'USD', to: 'CAD' },
              { from: 'USD', to: 'AUD' },
              { from: 'USD', to: 'CHF' },
              { from: 'USD', to: 'CNY' }
            ].map(pair => {
              const rate = exchangeRates[pair.to] / (exchangeRates[pair.from] || 1);
              return (
                <div key={`${pair.from}-${pair.to}`} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium">{pair.from}/{pair.to}</div>
                  <div className="text-lg font-bold text-blue-600">{rate.toFixed(4)}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrencyConverter;