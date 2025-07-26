import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Bot,
  Building2,
  ShoppingCart,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wrench,
  Calculator,
  Download,
  Truck,
  Brain
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Estimates/Quotes', href: '/estimates-quotes', icon: FileText },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { name: 'Vendors & Supply Chain', href: '/vendors-supply-chain', icon: Truck },
  { name: 'Accounts Receivable', href: '/accounts-receivable', icon: DollarSign },
  { name: 'Accounts Payable', href: '/accounts-payable', icon: TrendingDown },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Financial Statements', href: '/financial-statements', icon: Calculator },
  { name: 'Data Migration', href: '/data-migration', icon: Download },
  { name: 'Tools', href: '/tools', icon: Wrench },
  { name: 'Company Profile', href: '/company-profile', icon: Building2 },
  { name: 'Buck AI', href: '/ai-assistant', icon: Bot },
  { name: 'Admin Analytics', href: '/admin-analytics', icon: TrendingUp },
  { name: 'Pricing', href: '/pricing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'About B.U.C.K. AI', href: '/about-buck-ai', icon: Brain },
]

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const location = useLocation()
  const { user } = useAuth()
  
  // Only show Admin Analytics to admin users (you can customize this logic)
  const isAdmin = user?.email === 'kai.jiabo.feng@gmail.com' // Replace with your admin email
  
  const filteredNavigation = navigation.filter(item => 
    item.name !== 'Admin Analytics' || isAdmin
  )

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-border">
      <div className="flex h-16 shrink-0 items-center">
        <Bot className="h-8 w-8 text-primary" />
        <div className="ml-2 flex flex-col">
          <span className="text-xl font-bold text-foreground">Buck AI</span>
          <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
            All Features FREE
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => {
                        // Small delay to allow visual feedback before closing mobile sidebar
                        if (onNavigate) {
                          setTimeout(() => onNavigate(), 150)
                        }
                      }}
                      className={cn(
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}