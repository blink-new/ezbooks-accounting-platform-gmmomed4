import React, { useState, useRef } from 'react';
import { Camera, Upload, Scan, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';
import { createClient } from '@blinkdotnew/sdk';
import { receiptOCRMCP } from '@/lib/receiptOCRMCP';

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: true
});

interface ExtractedData {
  vendor: string;
  amount: number;
  date: string;
  category: string;
  description: string;
}

const ReceiptScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Office Supplies', 'Travel', 'Meals & Entertainment', 'Equipment',
    'Software', 'Marketing', 'Utilities', 'Rent', 'Insurance', 'Other'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setExtractedData(null);
    }
  };

  const scanReceipt = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a receipt image to scan.",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    
    try {
      // Step 1: Extract text using Tesseract.js
      toast({
        title: "Scanning receipt...",
        description: "Extracting text from your receipt image."
      });

      const { data: { text } } = await Tesseract.recognize(selectedFile, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      console.log('Extracted text:', text);

      // Step 2: Use Buck AI to structure the data
      toast({
        title: "Processing data...",
        description: "Buck AI is analyzing the receipt content."
      });

      const { object } = await blink.ai.generateObject({
        prompt: `Extract transaction data from this receipt text. Be smart about parsing amounts, dates, and vendor names:

Receipt Text:
${text}

Extract the following information:
- vendor: The business/store name
- amount: The total amount (just the number, no currency symbol)
- date: The transaction date in YYYY-MM-DD format
- category: Best category for this expense (Office Supplies, Travel, Meals & Entertainment, Equipment, Software, Marketing, Utilities, Rent, Insurance, or Other)
- description: A brief description of the purchase`,
        schema: {
          type: 'object',
          properties: {
            vendor: { type: 'string' },
            amount: { type: 'number' },
            date: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['vendor', 'amount', 'date', 'category', 'description']
        }
      });

      setExtractedData(object as ExtractedData);
      
      toast({
        title: "Receipt scanned successfully! 🎉",
        description: "Review the extracted data and save to your books."
      });

    } catch (error) {
      console.error('Receipt scanning error:', error);
      toast({
        title: "Scanning failed",
        description: "Unable to process the receipt. Please try again or enter data manually.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const saveTransaction = async () => {
    if (!extractedData) return;

    try {
      const user = await blink.auth.me();
      
      await blink.db.transactions.create({
        userId: user.id,
        type: 'expense',
        amount: extractedData.amount,
        description: extractedData.description,
        category: extractedData.category,
        vendor: extractedData.vendor,
        date: extractedData.date,
        receiptScanned: true,
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Transaction saved! 💰",
        description: `Added ${extractedData.vendor} expense for $${extractedData.amount.toFixed(2)}`
      });

      // Reset form
      setExtractedData(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Save failed",
        description: "Unable to save transaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-blue-600" />
            <span>Smart Receipt Scanner</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload Receipt Image</Label>
            <div className="flex space-x-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img 
                  src={previewUrl} 
                  alt="Receipt preview" 
                  className="max-w-full h-48 object-contain mx-auto rounded"
                />
              </div>
            </div>
          )}

          {/* Scan Button */}
          <Button
            onClick={scanReceipt}
            disabled={!selectedFile || isScanning}
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning Receipt...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Scan Receipt with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Extracted Data */}
      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Extracted Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input 
                  value={extractedData.vendor} 
                  onChange={(e) => setExtractedData({...extractedData, vendor: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={extractedData.amount} 
                  onChange={(e) => setExtractedData({...extractedData, amount: parseFloat(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Input 
                  type="date"
                  value={extractedData.date} 
                  onChange={(e) => setExtractedData({...extractedData, date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={extractedData.category} 
                  onValueChange={(value) => setExtractedData({...extractedData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={extractedData.description} 
                onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
              />
            </div>

            <Button onClick={saveTransaction} className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" />
              Save to Books
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReceiptScanner;