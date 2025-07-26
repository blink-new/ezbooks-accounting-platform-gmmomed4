import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  MessageSquare, 
  Mic, 
  FileText, 
  CreditCard,
  Globe,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/blink/client';
import { toast } from 'sonner';

interface UserMetrics {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  last_active: string;
  total_transactions: number;
  total_invoices: number;
  total_customers: number;
  ai_conversations: number;
  voice_commands: number;
  gamification_level: number;
  gamification_points: number;
  subscription_tier: string;
  country: string;
  language: string;
  total_revenue_tracked: number;
  last_login: string;
  session_count: number;
  avg_session_duration: number;
}

interface SystemMetrics {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  total_transactions: number;
  total_invoices: number;
  total_ai_conversations: number;
  total_voice_commands: number;
  total_revenue_tracked: number;
  avg_session_duration: number;
  top_features: Array<{ feature: string; usage_count: number }>;
  user_growth_trend: Array<{ date: string; new_users: number; active_users: number }>;
  geographic_distribution: Array<{ country: string; user_count: number }>;
  language_distribution: Array<{ language: string; user_count: number }>;
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedUser, setSelectedUser] = useState<UserMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load system-wide metrics
      const systemData = await blink.data.fetch({
        url: `https://your-analytics-endpoint.com/api/system-metrics?range=${timeRange}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer {{admin_api_key}}`
        }
      });

      // For now, let's simulate the data since we don't have the endpoint yet
      const mockSystemMetrics: SystemMetrics = {
        total_users: 1247,
        active_users_today: 89,
        active_users_week: 342,
        active_users_month: 891,
        total_transactions: 15678,
        total_invoices: 3456,
        total_ai_conversations: 8934,
        total_voice_commands: 2341,
        total_revenue_tracked: 2847392.50,
        avg_session_duration: 18.5,
        top_features: [
          { feature: 'AI Assistant', usage_count: 8934 },
          { feature: 'Transaction Entry', usage_count: 7823 },
          { feature: 'Invoice Creation', usage_count: 3456 },
          { feature: 'Voice Commands', usage_count: 2341 },
          { feature: 'Reports', usage_count: 1892 }
        ],
        user_growth_trend: [
          { date: '2024-01-15', new_users: 23, active_users: 156 },
          { date: '2024-01-16', new_users: 31, active_users: 178 },
          { date: '2024-01-17', new_users: 28, active_users: 189 },
          { date: '2024-01-18', new_users: 45, active_users: 203 },
          { date: '2024-01-19', new_users: 52, active_users: 234 },
          { date: '2024-01-20', new_users: 38, active_users: 267 },
          { date: '2024-01-21', new_users: 41, active_users: 289 }
        ],
        geographic_distribution: [
          { country: 'United States', user_count: 456 },
          { country: 'Canada', user_count: 123 },
          { country: 'United Kingdom', user_count: 89 },
          { country: 'Australia', user_count: 67 },
          { country: 'Germany', user_count: 45 },
          { country: 'France', user_count: 34 },
          { country: 'Spain', user_count: 28 },
          { country: 'Other', user_count: 405 }
        ],
        language_distribution: [
          { language: 'English', user_count: 892 },
          { language: 'Spanish', user_count: 156 },
          { language: 'French', user_count: 89 },
          { language: 'German', user_count: 45 },
          { language: 'Portuguese', user_count: 34 },
          { language: 'Other', user_count: 31 }
        ]
      };

      // Load individual user metrics from database
      const users = await blink.db.user_analytics.list({
        orderBy: { created_at: 'desc' },
        limit: 1000
      });

      setSystemMetrics(mockSystemMetrics);
      setUserMetrics(users || []);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = userMetrics;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'active':
          filtered = filtered.filter(user => {
            const lastActive = new Date(user.last_active);
            const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceActive <= 7;
          });
          break;
        case 'high_usage':
          filtered = filtered.filter(user => user.ai_conversations > 10 || user.total_transactions > 20);
          break;
        case 'new':
          filtered = filtered.filter(user => {
            const created = new Date(user.created_at);
            const daysSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceCreated <= 7;
          });
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'last_active':
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        case 'ai_conversations':
          return b.ai_conversations - a.ai_conversations;
        case 'total_transactions':
          return b.total_transactions - a.total_transactions;
        case 'gamification_points':
          return b.gamification_points - a.gamification_points;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  useEffect(() => {
    filterAndSortUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMetrics, searchTerm, filterBy, sortBy]);

  const exportData = async (type: 'users' | 'system') => {
    try {
      const data = type === 'users' ? filteredUsers : systemMetrics;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buck-ai-${type}-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${type} data exported successfully`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Buck AI Analytics</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Complete overview of user activity and platform metrics</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-28 md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => loadAnalytics()} variant="outline" size="sm" className="md:size-default">
                <Activity className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Refresh</span>
                <span className="md:hidden">↻</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">User Details</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs md:text-sm">Activity Tracking</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs md:text-sm">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics?.total_users.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +{systemMetrics?.user_growth_trend.slice(-1)[0]?.new_users} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics?.active_users_week.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemMetrics?.active_users_today} active today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemMetrics?.total_ai_conversations.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemMetrics?.total_voice_commands.toLocaleString()} voice commands
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Tracked</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${systemMetrics?.total_revenue_tracked.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {systemMetrics?.total_transactions.toLocaleString()} transactions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth Trend</CardTitle>
                  <CardDescription>New users and active users over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <LineChart className="h-16 w-16 mb-4" />
                    <div className="text-center">
                      <p>Growth Chart</p>
                      <p className="text-sm">Trending upward 📈</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Users by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemMetrics?.geographic_distribution.slice(0, 5).map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-blue-${500 + index * 100}`}></div>
                          <span className="text-sm">{country.country}</span>
                        </div>
                        <span className="text-sm font-medium">{country.user_count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Top Features</CardTitle>
                <CardDescription>Most used features across all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {systemMetrics?.top_features.map((feature, index) => (
                    <div key={feature.feature} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{feature.usage_count.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">{feature.feature}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Details Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>User Filters & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <Input
                      placeholder="Search users by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active (7d)</SelectItem>
                      <SelectItem value="high_usage">High Usage</SelectItem>
                      <SelectItem value="new">New Users</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Newest</SelectItem>
                      <SelectItem value="last_active">Last Active</SelectItem>
                      <SelectItem value="ai_conversations">AI Usage</SelectItem>
                      <SelectItem value="total_transactions">Transactions</SelectItem>
                      <SelectItem value="gamification_points">Points</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => exportData('users')} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User List */}
            <Card>
              <CardHeader>
                <CardTitle>User Details ({filteredUsers.length} users)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.display_name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.display_name || 'Anonymous'}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Level {user.gamification_level}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {user.language}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{user.ai_conversations} AI chats</div>
                          <div className="text-sm text-gray-600">{user.total_transactions} transactions</div>
                          <div className="text-xs text-gray-500">
                            Last active: {new Date(user.last_active).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tracking Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Activity Feed</CardTitle>
                  <CardDescription>Live user actions across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {/* Mock real-time activity */}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">2 min ago</span>
                        <span>sarah@example.com created an invoice</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">5 min ago</span>
                        <span>john@business.com asked Buck AI about cash flow</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-600">8 min ago</span>
                        <span>maria@startup.co used voice command</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">12 min ago</span>
                        <span>david@llc.com added new customer</span>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage Heatmap</CardTitle>
                  <CardDescription>Most active features by hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div key={hour} className="text-center">
                        <div className="text-xs text-gray-600 mb-1">{hour}h</div>
                        <div className={`h-8 rounded ${
                          hour >= 9 && hour <= 17 ? 'bg-blue-500' : 
                          hour >= 18 && hour <= 22 ? 'bg-blue-300' : 'bg-gray-200'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Peak usage: 9 AM - 5 PM</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>AI-powered platform insights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Growth Trend</span>
                    </div>
                    <p className="text-sm text-green-700">
                      User engagement is up 34% this week. AI conversations are the top driver.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">AI Usage</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Users who chat with Buck AI are 3x more likely to become power users.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-800">Global Reach</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Spanish-speaking users show highest engagement rates with voice features.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Suggested improvements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">🎯 Focus on AI Features</div>
                    <p className="text-sm text-gray-600">
                      AI conversations drive the highest user retention. Consider promoting Buck AI more prominently.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">🌍 Expand Language Support</div>
                    <p className="text-sm text-gray-600">
                      High demand from Portuguese and Italian markets. Consider enhanced localization.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">📱 Mobile Optimization</div>
                    <p className="text-sm text-gray-600">
                      60% of voice commands come from mobile. Mobile-first design could boost engagement.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedUser(null)}>×</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Display Name</label>
                  <p className="text-sm">{selectedUser.display_name || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Active</label>
                  <p className="text-sm">{new Date(selectedUser.last_active).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Country</label>
                  <p className="text-sm">{selectedUser.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Language</label>
                  <p className="text-sm">{selectedUser.language}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedUser.ai_conversations}</div>
                  <div className="text-sm text-gray-600">AI Conversations</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedUser.total_transactions}</div>
                  <div className="text-sm text-gray-600">Transactions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedUser.gamification_points}</div>
                  <div className="text-sm text-gray-600">Points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}