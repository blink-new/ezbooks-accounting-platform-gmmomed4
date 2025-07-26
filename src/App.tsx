import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/toaster'
import blink from '@/blink/client'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import EstimatesQuotesPage from '@/pages/EstimatesQuotes'
import Invoices from '@/pages/Invoices'
import Customers from '@/pages/Customers'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Pricing from '@/pages/Pricing'
import AIAssistant from '@/pages/AIAssistant'
import CompanyProfile from '@/pages/CompanyProfile'
import PurchaseOrders from '@/pages/PurchaseOrders'
import AccountsReceivable from '@/pages/AccountsReceivable'
import AccountsPayable from '@/pages/AccountsPayable'
import AdminAnalytics from '@/pages/AdminAnalytics'
import Tools from '@/pages/Tools'
import FinancialStatements from '@/pages/FinancialStatements'
import DataMigration from '@/pages/DataMigration'
import VendorsSupplyChain from '@/pages/VendorsSupplyChain'
import AboutBuckAI from '@/pages/AboutBuckAI'
import LoadingScreen from '@/components/LoadingScreen'
import { SmartFeedbackSystem } from '@/components/SmartFeedbackSystem'
import FinanceTicker from '@/components/FinanceTicker'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      const unsubscribe = blink.auth.onAuthStateChanged((state) => {
        setUser(state.user)
        setLoading(state.isLoading)
        setError(null)
      })
      return unsubscribe
    } catch (err) {
      console.error('Auth error:', err)
      setError(err)
      setLoading(false)
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingScreen />
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Buck AI</h1>
          <p className="text-gray-600 mb-4">Please sign in to continue</p>
          <button 
            onClick={() => blink.auth.login()} 
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/estimates-quotes" element={<EstimatesQuotesPage />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/accounts-receivable" element={<AccountsReceivable />} />
          <Route path="/accounts-payable" element={<AccountsPayable />} />
          <Route path="/admin-analytics" element={<AdminAnalytics />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/financial-statements" element={<FinancialStatements />} />
          <Route path="/data-migration" element={<DataMigration />} />
          <Route path="/vendors-supply-chain" element={<VendorsSupplyChain />} />
          <Route path="/about-buck-ai" element={<AboutBuckAI />} />
        </Routes>
      </Layout>
      <SmartFeedbackSystem />
      <FinanceTicker />
      <Toaster />
    </Router>
  )
}

export default App