import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UserStats {
  id?: string;
  user_id: string;
  total_points: number;
  level: number;
  transactions_created: number;
  invoices_sent: number;
  customers_added: number;
  days_active: number;
  streak_days: number;
  last_activity_date?: string;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  points: number;
  badge_icon: string;
  unlocked_at: string;
}

interface DailyChallenge {
  id: string;
  challenge_type: string;
  challenge_name: string;
  description: string;
  target_value: number;
  current_progress: number;
  points_reward: number;
  is_completed: boolean;
  challenge_date: string;
}

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const GAMIFICATION_API = 'https://gmmomed4--gamification-engine.functions.blink.new';

  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(GAMIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_user_stats',
          userId: user.id
        })
      });

      if (response.ok) {
        const userStats = await response.json();
        setStats(userStats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }, [user?.id]);

  const loadAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(GAMIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_achievements',
          userId: user.id
        })
      });

      if (response.ok) {
        const userAchievements = await response.json();
        setAchievements(userAchievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }, [user?.id]);

  const loadDailyChallenges = useCallback(async () => {
    if (!user?.id) return;

    try {
      // First generate challenges for today if they don't exist
      await fetch(GAMIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_daily_challenges',
          userId: user.id
        })
      });

      // Then load the challenges
      const response = await fetch(GAMIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_daily_challenges',
          userId: user.id
        })
      });

      if (response.ok) {
        const challenges = await response.json();
        setDailyChallenges(challenges);
      }
    } catch (error) {
      console.error('Error loading daily challenges:', error);
    }
  }, [user?.id]);

  const trackActivity = useCallback(async (activityType: string, data?: any) => {
    if (!user?.id) return;

    try {
      const response = await fetch(GAMIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_activity',
          userId: user.id,
          activityType,
          data
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.stats) {
          setStats(result.stats);
        }
        
        if (result.newAchievements && result.newAchievements.length > 0) {
          setNewAchievements(result.newAchievements);
          // Auto-clear new achievements after 5 seconds
          setTimeout(() => setNewAchievements([]), 5000);
        }

        // Reload challenges to update progress
        if (loadDailyChallenges) {
          await loadDailyChallenges();
        }
        
        return result;
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
      return null;
    }
  }, [user?.id, loadDailyChallenges]);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        loadUserStats(),
        loadAchievements(),
        loadDailyChallenges()
      ]).finally(() => setLoading(false));
    }
  }, [user?.id, loadUserStats, loadAchievements, loadDailyChallenges]);

  const getProgressToNextLevel = () => {
    if (!stats) return 0;
    const currentLevelPoints = (stats.level - 1) * 100;
    const nextLevelPoints = stats.level * 100;
    const progress = stats.total_points - currentLevelPoints;
    const total = nextLevelPoints - currentLevelPoints;
    return Math.min((progress / total) * 100, 100);
  };

  const getPointsToNextLevel = () => {
    if (!stats) return 0;
    const nextLevelPoints = stats.level * 100;
    return Math.max(nextLevelPoints - stats.total_points, 0);
  };

  const dismissNewAchievements = () => {
    setNewAchievements([]);
  };

  return {
    stats: stats || {
      user_id: user?.id || '',
      total_points: 0,
      level: 1,
      transactions_created: 0,
      invoices_sent: 0,
      customers_added: 0,
      days_active: 0,
      streak_days: 0
    },
    achievements: achievements || [],
    dailyChallenges: dailyChallenges || [],
    newAchievements: newAchievements || [],
    loading,
    trackActivity: trackActivity || (() => Promise.resolve(null)),
    getProgressToNextLevel,
    getPointsToNextLevel,
    dismissNewAchievements,
    reload: () => {
      if (loadUserStats) loadUserStats();
      if (loadAchievements) loadAchievements();
      if (loadDailyChallenges) loadDailyChallenges();
    }
  };
}