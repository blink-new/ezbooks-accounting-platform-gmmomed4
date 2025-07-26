import React, { useState } from 'react';
import { Camera, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceiptScanner from '@/components/ReceiptScanner';
import CurrencyConverter from '@/components/CurrencyConverter';

const Tools: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Tools</h1>
        <p className="text-gray-600 mt-2">
          Powerful tools to streamline your business operations and save time.
        </p>
      </div>

      <Tabs defaultValue="receipt-scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receipt-scanner" className="flex items-center space-x-2">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Receipt Scanner</span>
            <span className="sm:hidden">Scanner</span>
          </TabsTrigger>
          <TabsTrigger value="currency-converter" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Currency Converter</span>
            <span className="sm:hidden">Currency</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipt-scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <span>Smart Receipt Scanner</span>
              </CardTitle>
              <p className="text-gray-600">
                Upload receipt images and automatically extract transaction data using AI-powered OCR.
                Save hours of manual data entry every week.
              </p>
            </CardHeader>
          </Card>
          <ReceiptScanner />
        </TabsContent>

        <TabsContent value="currency-converter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-600" />
                <span>Real-Time Currency Converter</span>
              </CardTitle>
              <p className="text-gray-600">
                Convert between 12 major currencies with real-time exchange rates.
                Perfect for international business transactions.
              </p>
            </CardHeader>
          </Card>
          <CurrencyConverter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tools;