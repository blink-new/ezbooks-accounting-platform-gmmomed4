import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import EstimatesQuotes from '@/components/EstimatesQuotes';

const EstimatesQuotesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estimates & Quotes</h1>
        <p className="text-gray-600 mt-2">
          Create, send, and manage professional estimates and quotes for your business.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>Professional Estimates & Quotes</span>
          </CardTitle>
          <p className="text-gray-600">
            Create, send, and manage professional estimates and quotes.
            Generate PDF documents and track customer responses.
          </p>
        </CardHeader>
      </Card>
      
      <EstimatesQuotes />
    </div>
  );
};

export default EstimatesQuotesPage;