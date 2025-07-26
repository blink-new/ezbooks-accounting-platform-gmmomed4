import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Check,
  Star,
  Zap,
  Shield,
  Users,
  FileText,
  TrendingUp,
  Bot,
  Calculator,
  CreditCard,
  Loader2
} from 'lucide-react'
import blink from '@/blink/client'

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const plans = [
    {
      name: 'Everything Free',
      description: 'All features unlocked - No limits!',
      price: { monthly: 0, annual: 0 },
      originalPrice: { monthly: 150, annual: 1800 },
      badge: '🔥 Launch Special',
      features: [
        '✨ UNLIMITED everything - transactions, users, invoices',
        '🤖 Full B.U.C.K. AI CFO capabilities with voice chat',
        '📊 Advanced financial analytics & custom reports',
        '💳 Professional invoicing & payment processing',
        '📈 Real-time financial insights & forecasting',
        '🔐 Enterprise-grade security & compliance',
        '🎯 Autonomous AI bookkeeping & categorization',
        '🔄 Automatic backups & data sync'
      ],
      limitations: [],
      cta: 'Get Everything FREE Now',
      popular: true,
      savings: 'Save $1,800/year'
    }
  ]

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `${price}`
  }

  const handleSubscribe = async (planName: string) => {
    if (planName === 'Free') {
      // Handle free plan signup
      return
    }

    setLoading(planName)
    
    try {
      const user = await blink.auth.me()
      
      // Map plan names to Stripe price IDs
      const priceIds = {
        'Starter': 'price_1RoFlsP5xOxGSbWX6VEp0wfG',
        'Pro': 'price_1RoFlwP5xOxGSbWXNaIjWb1R',
        'Enterprise': 'price_1RoFlzP5xOxGSbWXzSYXyvX4'
      }

      const priceId = priceIds[planName as keyof typeof priceIds]
      
      if (!priceId) {
        throw new Error('Invalid plan selected')
      }

      // Create Stripe checkout session
      const response = await blink.data.fetch({
        url: 'https://api.stripe.com/v1/checkout/sessions',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{STRIPE_SECRET_KEY}}',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'mode': 'subscription',
          'line_items[0][price]': priceId,
          'line_items[0][quantity]': '1',
          'success_url': `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          'cancel_url': `${window.location.origin}/pricing`,
          'customer_email': user.email,
          'allow_promotion_codes': 'true',
          'metadata[user_id]': user.id,
          'metadata[plan]': planName.toLowerCase()
        }).toString()
      })

      if (response.status === 200) {
        // Open Stripe checkout in new tab (required for iframe compatibility)
        window.open(response.body.url, '_blank')
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          🎉 LAUNCH SPECIAL: Everything is 100% FREE!
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          Get $150,000+ CFO Value for FREE
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're making Buck AI completely free to help every business succeed. 
          Get unlimited access to all premium features, AI capabilities, and professional tools.
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg max-w-2xl mx-auto mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🚀 Limited Time: Everything Unlocked</h3>
          <p className="text-gray-600">
            Full Enterprise features • Unlimited users • Advanced AI • Priority support
          </p>
        </div>

      </div>

      {/* Pricing Cards */}
      <div className="flex justify-center">
        <div className="max-w-md w-full">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className="relative border-primary shadow-2xl bg-gradient-to-br from-white to-blue-50"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-1 text-sm">
                  {plan.badge}
                </Badge>
              </div>
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-primary">{plan.name}</CardTitle>
                <CardDescription className="text-lg">{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-4xl font-bold text-green-600">
                      FREE
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground line-through">
                        Was ${plan.originalPrice?.monthly}/month
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        {plan.savings}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    🎉 Launch special - Everything unlocked!
                  </div>
                </div>
              </CardHeader>
            
              <CardContent className="space-y-4">
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 text-lg"
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loading === plan.name}
                >
                  {loading === plan.name ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      🚀 {plan.cta}
                    </>
                  )}
                </Button>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">🎁 Everything included (normally $150/month):</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-sm text-yellow-800">Launch Special Benefits</span>
                    </div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• No credit card required</li>
                      <li>• No hidden fees or limits</li>
                      <li>• Full access to all premium features</li>
                      <li>• Priority support included</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials & Use Cases Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-12">Real Stories from Buck AI Users</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Testimonial 1 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <div className="flex-1">
                <blockquote className="text-gray-700 mb-4 italic">
                  "Buck AI saved me 5 hours this week alone! I used to spend my entire Saturday doing bookkeeping. Now Buck handles categorizing transactions, suggests tax deductions I missed, and even caught a duplicate payment I would have never noticed. It's like having a $150,000/year CFO working 24/7 for my small business."
                </blockquote>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">Sarah Chen</div>
                  <div className="text-gray-600">Owner, Chen's Digital Marketing Agency</div>
                  <div className="text-blue-600 mt-1">💰 Saved $2,400 in missed deductions last month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <div className="flex-1">
                <blockquote className="text-gray-700 mb-4 italic">
                  "I was drowning in receipts and invoices. Buck AI transformed my chaos into organized financial insights in minutes. The voice chat feature is incredible - I just say 'Hey Buck, how's my cash flow?' and get instant, detailed analysis. My accountant was amazed at how organized my books became."
                </blockquote>
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">Marcus Rodriguez</div>
                  <div className="text-gray-600">Founder, Rodriguez Construction LLC</div>
                  <div className="text-green-600 mt-1">📈 Improved cash flow visibility by 300%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Case Stories */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">How Buck AI Saves Business Owners Time</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
                <h4 className="font-semibold text-lg">The 5-Hour Saturday Rescue</h4>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>Before Buck AI:</strong> Jessica spent every Saturday morning sorting receipts, categorizing expenses, and updating spreadsheets. 5 hours of her weekend gone.
                <br /><br />
                <strong>With Buck AI:</strong> She takes a photo of receipts during the week, asks Buck "How are my expenses looking?" and gets instant categorization and insights. Saturday mornings are now for family time.
                <br /><br />
                <span className="text-blue-600 font-medium">⚡ Time saved: 5 hours/week = 260 hours/year</span>
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
                <h4 className="font-semibold text-lg">The $3,200 Tax Deduction Discovery</h4>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong>The Problem:</strong> David's landscaping business had dozens of small equipment purchases he forgot to track for tax deductions.
                <br /><br />
                <strong>Buck's Solution:</strong> During a casual chat, Buck analyzed his transactions and said "I noticed $3,200 in equipment purchases that qualify for Section 179 deductions. Want me to categorize these for your accountant?"
                <br /><br />
                <span className="text-green-600 font-medium">💰 Money saved: $3,200 in deductions = $960 tax savings</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What Happens After Start Now */}
      <div className="mt-16">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">What Happens When You Click "Start Now"?</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-4xl mb-3">1️⃣</div>
              <h3 className="font-semibold text-lg mb-2">Instant Access</h3>
              <p className="text-sm opacity-90">
                Sign up with your email and immediately access ALL features - no credit card required, no trial limitations.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-4xl mb-3">2️⃣</div>
              <h3 className="font-semibold text-lg mb-2">Everything FREE</h3>
              <p className="text-sm opacity-90">
                Use all Enterprise features (worth $75/month) completely free until further notice. No hidden timers or limits.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-4xl mb-3">3️⃣</div>
              <h3 className="font-semibold text-lg mb-2">Future Pricing</h3>
              <p className="text-sm opacity-90">
                When we eventually introduce paid plans ($15+ tiers), you'll get 30 days advance notice to decide.
              </p>
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="font-semibold text-lg mb-3">🎯 Our Promise to You</h4>
            <p className="text-sm opacity-95 leading-relaxed">
              <strong>Right now:</strong> Everything is 100% free with no end date set.<br />
              <strong>In the future:</strong> If we introduce paid subscriptions, you'll receive 30 days advance notice and can choose to continue with a paid plan or export your data.<br />
              <strong>No surprises:</strong> We believe in complete transparency about pricing changes.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Feature Comparison</h2>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            🎉 All tiers unlocked FREE during launch special
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 font-semibold">Features</th>
                <th className="text-center p-4 font-semibold">Free Tier<br/><span className="text-xs text-green-600">✨ Unlocked</span></th>
                <th className="text-center p-4 font-semibold">Starter ($15)<br/><span className="text-xs text-green-600">✨ Unlocked</span></th>
                <th className="text-center p-4 font-semibold">Pro ($35)<br/><span className="text-xs text-green-600">✨ Unlocked</span></th>
                <th className="text-center p-4 font-semibold">Enterprise ($75)<br/><span className="text-xs text-green-600">✨ Unlocked</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4">Monthly Transactions</td>
                <td className="text-center p-4">Unlimited ✨</td>
                <td className="text-center p-4">Unlimited ✨</td>
                <td className="text-center p-4">Unlimited ✨</td>
                <td className="text-center p-4">Unlimited ✨</td>
              </tr>
              <tr className="border-t bg-gray-50">
                <td className="p-4">Users</td>
                <td className="text-center p-4">5 ✨</td>
                <td className="text-center p-4">10 ✨</td>
                <td className="text-center p-4">25 ✨</td>
                <td className="text-center p-4">Unlimited ✨</td>
              </tr>

              <tr className="border-t bg-gray-50">
                <td className="p-4">B.U.C.K. AI Conversations</td>
                <td className="text-center p-4">50/month ✨</td>
                <td className="text-center p-4">500/month ✨</td>
                <td className="text-center p-4">2,000/month ✨</td>
                <td className="text-center p-4">Unlimited ✨</td>
              </tr>
              <tr className="border-t">
                <td className="p-4">Voice Commands</td>
                <td className="text-center p-4">✅ ✨</td>
                <td className="text-center p-4">✅ ✨</td>
                <td className="text-center p-4">✅ ✨</td>
                <td className="text-center p-4">✅ ✨</td>
              </tr>
              <tr className="border-t bg-gray-50">
                <td className="p-4">Advanced Reports</td>
                <td className="text-center p-4">Basic ✨</td>
                <td className="text-center p-4">Standard ✨</td>
                <td className="text-center p-4">Advanced ✨</td>
                <td className="text-center p-4">Custom ✨</td>
              </tr>

              <tr className="border-t bg-gray-50">
                <td className="p-4">White Label</td>
                <td className="text-center p-4">❌</td>
                <td className="text-center p-4">❌</td>
                <td className="text-center p-4">❌</td>
                <td className="text-center p-4">✅ ✨</td>
              </tr>
              <tr className="border-t">
                <td className="p-4">Priority Support</td>
                <td className="text-center p-4">Email ✨</td>
                <td className="text-center p-4">Email + Chat ✨</td>
                <td className="text-center p-4">Phone + Chat ✨</td>
                <td className="text-center p-4">Dedicated Manager ✨</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="text-center mt-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-gray-700">
              <strong>🎉 Launch Special:</strong> All features from all tiers are currently unlocked for everyone! 
              Experience the full power of Buck AI without any limitations.
            </p>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Why We're Making Everything Free</h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Help Every Business</h3>
              <p className="text-sm text-muted-foreground">
                We believe every business deserves access to professional financial tools, regardless of size or budget.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Build Community</h3>
              <p className="text-sm text-muted-foreground">
                By removing barriers, we're creating a community of successful businesses that grow together.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Prove AI Value</h3>
              <p className="text-sm text-muted-foreground">
                We're confident Buck AI will transform your business - experience the value before any commitment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Are all tiers really free right now?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! All tiers (Free, Starter, Pro, and Enterprise) are completely unlocked and free until further notice. 
                This means you get unlimited access to every feature, unlimited users, full AI capabilities, and priority support 
                at no cost during our launch special.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's the catch with all tiers being free?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                There's no catch! We're making all tiers (Free, Starter, Pro, Enterprise) completely free 
                until further notice to build a community of successful businesses. This gives you full access 
                to features normally worth $75/month at no cost while we prove Buck AI's value.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What AI features are included?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Everything! Full B.U.C.K. AI CFO capabilities including voice chat, autonomous bookkeeping, 
                predictive analytics, smart expense categorization, tax optimization, and custom AI workflows. 
                Normally $150/month - now completely free.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is my data secure?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely. We use bank-level 256-bit SSL encryption, SOC 2 compliance, and regular security audits. 
                Your financial data is stored in secure, encrypted databases with multiple backup layers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do I need a credit card to sign up?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No credit card required! Simply create your account and start using all features immediately. 
                No hidden fees, no trial periods, no payment information needed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I export my data?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! All plans include data export functionality. You can export transactions, invoices, 
                customer data, and reports in CSV, PDF, or Excel formats at any time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When will the free access to all tiers end?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We haven't determined an end date yet. All tiers remain completely free until further notice. 
                We're committed to helping businesses succeed and will provide significant advance notice 
                (at least 30 days) if we ever decide to implement the original pricing structure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there multi-user support?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Unlimited users included for free. Each user gets their own login with customizable 
                permissions and access levels. Perfect for teams of any size.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Do you integrate with banks?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Unlimited bank account synchronization with over 12,000 financial institutions included free. 
                Transactions are automatically imported and categorized using AI.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What kind of support do you provide?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Full priority support included free! Email, phone, and chat support with dedicated account management 
                and guaranteed response times. We're here to help you succeed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I use Buck AI for tax preparation?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely! Full tax preparation features included free with automatic categorization, 
                deduction tracking, and export formats compatible with TurboTax, H&R Block, and all major tax software.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a mobile app?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Buck AI is fully responsive and works perfectly on mobile browsers. Native iOS and Android 
                apps are coming soon with offline capability and receipt scanning features.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Will you notify users before changing pricing?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Absolutely! If we ever decide to implement the original pricing tiers (Free, Starter $15, Pro $35, Enterprise $75), 
                we will provide at least 30 days advance notice to all users. Currently, no end date has been determined 
                for the free access to all tiers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-4">🎉 Get $150,000+ CFO Value for FREE!</h2>
            <p className="text-xl mb-6 opacity-90">
              Join the thousands of businesses already transforming their finances with Buck AI.
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-sm">
                ✨ No credit card • No limits • No catch<br/>
                🚀 Full Enterprise features unlocked immediately
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg"
                onClick={() => handleSubscribe('Everything Free')}
              >
                🚀 Start Using Buck AI FREE Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-600 font-semibold"
              >
                💬 Chat with Buck AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}