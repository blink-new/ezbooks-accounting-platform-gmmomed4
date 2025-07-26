import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Zap, Globe, Mic, FileText, TrendingUp, Shield, Clock } from 'lucide-react'

const AboutBuckAI = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <img 
              src="/buck-ai-avatar.png" 
              alt="Buck AI - Your AI Chief Financial Officer" 
              className="w-64 h-64 mx-auto rounded-2xl shadow-2xl border-4 border-blue-200"
            />
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-lg font-semibold">
                B.U.C.K. AI
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Meet B.U.C.K. AI
            </h1>
            <p className="text-2xl text-gray-600 font-medium">
              Your Personal AI Chief Financial Officer
            </p>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
              B.U.C.K. (Business Understanding & Computational Knowledge) AI is the world's most advanced 
              AI-powered financial assistant, designed to revolutionize how businesses manage their finances.
            </p>
          </div>
        </div>

        {/* Core Capabilities */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
            <CardHeader className="text-center">
              <Brain className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <CardTitle className="text-lg">AI Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Powered by GPT-4.1 with advanced financial knowledge and real-time learning capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
            <CardHeader className="text-center">
              <Globe className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <CardTitle className="text-lg">8 Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Communicate in English, Spanish, French, German, Italian, Portuguese, Chinese, and Japanese.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
            <CardHeader className="text-center">
              <Mic className="w-12 h-12 mx-auto text-purple-600 mb-2" />
              <CardTitle className="text-lg">Voice Enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Speak naturally with Buck AI using advanced voice recognition and synthesis technology.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 mx-auto text-orange-600 mb-2" />
              <CardTitle className="text-lg">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Instant responses with advanced caching and real-time streaming for immediate insights.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Multi-Modal Intelligence
              </CardTitle>
              <CardDescription>
                Process any type of business document or data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Receipt Scanning</Badge>
                <Badge variant="secondary">Document Analysis</Badge>
                <Badge variant="secondary">Spreadsheet Processing</Badge>
                <Badge variant="secondary">Image Recognition</Badge>
                <Badge variant="secondary">PDF Extraction</Badge>
                <Badge variant="secondary">Voice Transcription</Badge>
              </div>
              <p className="text-sm text-gray-600">
                Upload receipts, invoices, bank statements, or any financial document. Buck AI can read, 
                understand, and extract data from any format.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Real-Time Market Data
              </CardTitle>
              <CardDescription>
                Live financial insights and market intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Stock Prices</Badge>
                <Badge variant="secondary">Currency Rates</Badge>
                <Badge variant="secondary">Economic Indicators</Badge>
                <Badge variant="secondary">Market Trends</Badge>
                <Badge variant="secondary">Industry Benchmarks</Badge>
                <Badge variant="secondary">Predictive Analytics</Badge>
              </div>
              <p className="text-sm text-gray-600">
                Access live market data, currency exchange rates, and economic indicators to make 
                informed business decisions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Custom Learning */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              Custom Business Learning
            </CardTitle>
            <CardDescription className="text-lg">
              Buck AI learns and adapts to your specific business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <Shield className="w-10 h-10 mx-auto text-blue-600" />
                <h3 className="font-semibold">Pattern Recognition</h3>
                <p className="text-sm text-gray-600">
                  Learns your business patterns, seasonal trends, and customer behaviors
                </p>
              </div>
              <div className="text-center space-y-2">
                <Clock className="w-10 h-10 mx-auto text-green-600" />
                <h3 className="font-semibold">Predictive Insights</h3>
                <p className="text-sm text-gray-600">
                  Forecasts cash flow, revenue, and expenses based on your historical data
                </p>
              </div>
              <div className="text-center space-y-2">
                <TrendingUp className="w-10 h-10 mx-auto text-purple-600" />
                <h3 className="font-semibold">Smart Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Provides personalized advice tailored to your industry and business model
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-blue-200">
              <h4 className="font-semibold text-lg mb-3">What Buck AI Learns About Your Business:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Revenue patterns and seasonality
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Customer payment behaviors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Expense categories and trends
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Vendor relationships and terms
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Industry-specific metrics
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Cash flow cycles
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Tax optimization opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Growth opportunities
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specifications */}
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Technical Specifications</CardTitle>
            <CardDescription>
              Built with cutting-edge AI technology and enterprise-grade security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">AI Models</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• OpenAI GPT-4.1 (Complex Analysis)</li>
                  <li>• GPT-4.1-mini (Quick Responses)</li>
                  <li>• Whisper (Voice Recognition)</li>
                  <li>• TTS (Speech Synthesis)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Data Processing</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• OCR Text Extraction</li>
                  <li>• Image Recognition</li>
                  <li>• Document Analysis</li>
                  <li>• Spreadsheet Processing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Security</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• End-to-end Encryption</li>
                  <li>• SOC 2 Compliance</li>
                  <li>• GDPR Compliant</li>
                  <li>• Bank-level Security</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">
            Ready to Experience the Future of Finance?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start chatting with Buck AI today and discover how artificial intelligence can 
            transform your business finances.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/ai-assistant'}
          >
            Chat with Buck AI Now
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AboutBuckAI