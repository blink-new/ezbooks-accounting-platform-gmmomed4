import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Flame } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

export function GamificationWidget() {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({ points: 0, message: '' });

  try {
    const gamificationData = useGamification();

    // Safely destructure with fallbacks
    const {
      stats = {
        user_id: '',
        total_points: 0,
        level: 1,
        transactions_created: 0,
        invoices_sent: 0,
        customers_added: 0,
        days_active: 0,
        streak_days: 0
      },
      achievements = [],
      dailyChallenges = [],
      loading = true,
      getProgressToNextLevel = () => 0
    } = gamificationData || {};

    if (loading || !stats) {
      return (
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    const levelProgress = getProgressToNextLevel();
    const completedChallenges = dailyChallenges.filter(c => c.is_completed).length;
    const recentAchievements = achievements.slice(0, 3);

    return (
      <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 rounded-full p-2">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Level {stats.level}</CardTitle>
                <p className="text-sm text-gray-600">{stats.total_points.toLocaleString()} points</p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Level Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Level Progress</span>
                <span>{Math.round(levelProgress)}/100</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
            </div>
            
            {/* Quick Stats */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{stats.streak_days} day streak</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span>{completedChallenges}/3 challenges</span>
              </div>
            </div>
            
            {/* Recent Achievement */}
            {recentAchievements.length > 0 && (
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{recentAchievements[0].badge_icon || '🏆'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{recentAchievements[0].achievement_name || 'Achievement'}</p>
                    <p className="text-xs text-gray-600">Latest achievement</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">+{recentAchievements[0].points || 0}</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('GamificationWidget error:', error);
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Gamification temporarily unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }
}