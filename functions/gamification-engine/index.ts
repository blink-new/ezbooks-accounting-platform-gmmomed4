import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: 'ezbooks-accounting-platform-gmmomed4',
  authRequired: false
});

interface Achievement {
  type: string;
  name: string;
  description: string;
  points: number;
  badge_icon: string;
  condition: (stats: any) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    type: 'first_transaction',
    name: 'First Steps',
    description: 'Created your first transaction',
    points: 10,
    badge_icon: '🎯',
    condition: (stats) => stats.transactions_created >= 1
  },
  {
    type: 'transaction_master',
    name: 'Transaction Master',
    description: 'Created 50 transactions',
    points: 100,
    badge_icon: '💰',
    condition: (stats) => stats.transactions_created >= 50
  },
  {
    type: 'invoice_pro',
    name: 'Invoice Pro',
    description: 'Sent 10 invoices',
    points: 50,
    badge_icon: '📄',
    condition: (stats) => stats.invoices_sent >= 10
  },
  {
    type: 'customer_collector',
    name: 'Customer Collector',
    description: 'Added 25 customers',
    points: 75,
    badge_icon: '👥',
    condition: (stats) => stats.customers_added >= 25
  },
  {
    type: 'bill_manager',
    name: 'Bill Manager',
    description: 'Created your first bill',
    points: 15,
    badge_icon: '📋',
    condition: (stats) => stats.bills_created >= 1
  },
  {
    type: 'payment_pro',
    name: 'Payment Pro',
    description: 'Paid 10 bills',
    points: 75,
    badge_icon: '💳',
    condition: (stats) => stats.bills_paid >= 10
  },
  {
    type: 'purchase_planner',
    name: 'Purchase Planner',
    description: 'Created your first purchase order',
    points: 20,
    badge_icon: '🛒',
    condition: (stats) => stats.purchase_orders_created >= 1
  },
  {
    type: 'voice_commander',
    name: 'Voice Commander',
    description: 'Used voice commands 10 times',
    points: 50,
    badge_icon: '🎤',
    condition: (stats) => stats.voice_commands_used >= 10
  },
  {
    type: 'ai_buddy',
    name: 'AI Buddy',
    description: 'Had 25 conversations with B.U.C.K.',
    points: 100,
    badge_icon: '🤖',
    condition: (stats) => stats.ai_conversations >= 25
  },
  {
    type: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Used the app for 7 days in a row',
    points: 150,
    badge_icon: '🔥',
    condition: (stats) => stats.streak_days >= 7
  },
  {
    type: 'level_up',
    name: 'Level Up!',
    description: 'Reached level 5',
    points: 200,
    badge_icon: '⭐',
    condition: (stats) => stats.level >= 5
  },
  {
    type: 'financial_guru',
    name: 'Financial Guru',
    description: 'Reached level 10',
    points: 500,
    badge_icon: '🧙‍♂️',
    condition: (stats) => stats.level >= 10
  }
];

const DAILY_CHALLENGES = [
  {
    type: 'daily_transaction',
    name: 'Daily Bookkeeper',
    description: 'Add 3 transactions today',
    target: 3,
    points: 20
  },
  {
    type: 'invoice_sender',
    name: 'Invoice Sender',
    description: 'Send 1 invoice today',
    target: 1,
    points: 25
  },
  {
    type: 'customer_outreach',
    name: 'Customer Outreach',
    description: 'Add 2 new customers today',
    target: 2,
    points: 30
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { action, userId, activityType, data } = await req.json();

    switch (action) {
      case 'track_activity':
        return await trackActivity(userId, activityType, data);
      case 'get_user_stats':
        return await getUserStats(userId);
      case 'get_achievements':
        return await getUserAchievements(userId);
      case 'get_daily_challenges':
        return await getDailyChallenges(userId);
      case 'generate_daily_challenges':
        return await generateDailyChallenges(userId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

async function trackActivity(userId: string, activityType: string, data: any) {
  // Update user stats
  const stats = await getUserStatsRecord(userId);
  const updatedStats = { ...stats };

  // Update activity counters
  switch (activityType) {
    case 'transaction_created':
      updatedStats.transactions_created = (stats.transactions_created || 0) + 1;
      break;
    case 'invoice_sent':
      updatedStats.invoices_sent = (stats.invoices_sent || 0) + 1;
      break;
    case 'customer_added':
      updatedStats.customers_added = (stats.customers_added || 0) + 1;
      break;
    case 'bill_created':
      updatedStats.bills_created = (stats.bills_created || 0) + 1;
      break;
    case 'bill_paid':
      updatedStats.bills_paid = (stats.bills_paid || 0) + 1;
      break;
    case 'purchase_order_created':
      updatedStats.purchase_orders_created = (stats.purchase_orders_created || 0) + 1;
      break;
    case 'voice_command_used':
      updatedStats.voice_commands_used = (stats.voice_commands_used || 0) + 1;
      break;
    case 'ai_conversation':
      updatedStats.ai_conversations = (stats.ai_conversations || 0) + 1;
      break;
  }

  // Update streak and daily activity
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = stats.last_activity_date;
  
  if (lastActivity !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastActivity === yesterdayStr) {
      updatedStats.streak_days = (stats.streak_days || 0) + 1;
    } else {
      updatedStats.streak_days = 1;
    }
    
    updatedStats.days_active = (stats.days_active || 0) + 1;
    updatedStats.last_activity_date = today;
  }

  // Calculate level and points
  const basePoints = calculatePoints(updatedStats);
  updatedStats.total_points = basePoints;
  updatedStats.level = Math.floor(basePoints / 100) + 1;
  updatedStats.updated_at = new Date().toISOString();

  // Save updated stats
  await blink.db.user_stats.upsert(stats.id || `stat_${userId}`, updatedStats);

  // Check for new achievements
  const newAchievements = await checkAchievements(userId, updatedStats);

  // Update daily challenges
  await updateDailyChallenges(userId, activityType);

  return new Response(JSON.stringify({
    stats: updatedStats,
    newAchievements,
    pointsEarned: basePoints - (stats.total_points || 0)
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function getUserStatsRecord(userId: string) {
  try {
    const stats = await blink.db.user_stats.list({
      where: { user_id: userId },
      limit: 1
    });
    return stats[0] || {
      user_id: userId,
      total_points: 0,
      level: 1,
      transactions_created: 0,
      invoices_sent: 0,
      customers_added: 0,
      days_active: 0,
      streak_days: 0
    };
  } catch (error) {
    return {
      user_id: userId,
      total_points: 0,
      level: 1,
      transactions_created: 0,
      invoices_sent: 0,
      customers_added: 0,
      days_active: 0,
      streak_days: 0
    };
  }
}

function calculatePoints(stats: any): number {
  return (stats.transactions_created || 0) * 2 +
         (stats.invoices_sent || 0) * 5 +
         (stats.customers_added || 0) * 3 +
         (stats.bills_created || 0) * 3 +
         (stats.bills_paid || 0) * 4 +
         (stats.purchase_orders_created || 0) * 4 +
         (stats.voice_commands_used || 0) * 2 +
         (stats.ai_conversations || 0) * 1 +
         (stats.days_active || 0) * 10 +
         (stats.streak_days || 0) * 5;
}

async function checkAchievements(userId: string, stats: any) {
  const existingAchievements = await blink.db.user_achievements.list({
    where: { user_id: userId }
  });
  
  const existingTypes = existingAchievements.map(a => a.achievement_type);
  const newAchievements = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!existingTypes.includes(achievement.type) && achievement.condition(stats)) {
      const newAchievement = {
        user_id: userId,
        achievement_type: achievement.type,
        achievement_name: achievement.name,
        description: achievement.description,
        points: achievement.points,
        badge_icon: achievement.badge_icon
      };
      
      await blink.db.user_achievements.create(newAchievement);
      newAchievements.push(newAchievement);
    }
  }

  return newAchievements;
}

async function updateDailyChallenges(userId: string, activityType: string) {
  const today = new Date().toISOString().split('T')[0];
  const challenges = await blink.db.daily_challenges.list({
    where: { user_id: userId, challenge_date: today }
  });

  for (const challenge of challenges) {
    if (challenge.is_completed) continue;

    let shouldUpdate = false;
    let newProgress = challenge.current_progress;

    switch (challenge.challenge_type) {
      case 'daily_transaction':
        if (activityType === 'transaction_created') {
          newProgress += 1;
          shouldUpdate = true;
        }
        break;
      case 'invoice_sender':
        if (activityType === 'invoice_sent') {
          newProgress += 1;
          shouldUpdate = true;
        }
        break;
      case 'customer_outreach':
        if (activityType === 'customer_added') {
          newProgress += 1;
          shouldUpdate = true;
        }
        break;
    }

    if (shouldUpdate) {
      const isCompleted = newProgress >= challenge.target_value;
      await blink.db.daily_challenges.update(challenge.id, {
        current_progress: newProgress,
        is_completed: isCompleted
      });
    }
  }
}

async function getUserStats(userId: string) {
  const stats = await getUserStatsRecord(userId);
  return new Response(JSON.stringify(stats), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function getUserAchievements(userId: string) {
  const achievements = await blink.db.user_achievements.list({
    where: { user_id: userId },
    orderBy: { unlocked_at: 'desc' }
  });
  
  return new Response(JSON.stringify(achievements), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function getDailyChallenges(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const challenges = await blink.db.daily_challenges.list({
    where: { user_id: userId, challenge_date: today }
  });
  
  return new Response(JSON.stringify(challenges), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function generateDailyChallenges(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if challenges already exist for today
  const existingChallenges = await blink.db.daily_challenges.list({
    where: { user_id: userId, challenge_date: today }
  });
  
  if (existingChallenges.length > 0) {
    return new Response(JSON.stringify(existingChallenges), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Generate 2-3 random challenges for today
  const shuffled = DAILY_CHALLENGES.sort(() => 0.5 - Math.random());
  const selectedChallenges = shuffled.slice(0, 2);
  
  const newChallenges = [];
  for (const challenge of selectedChallenges) {
    const newChallenge = {
      user_id: userId,
      challenge_type: challenge.type,
      challenge_name: challenge.name,
      description: challenge.description,
      target_value: challenge.target,
      points_reward: challenge.points,
      challenge_date: today,
      expires_at: tomorrow.toISOString()
    };
    
    const created = await blink.db.daily_challenges.create(newChallenge);
    newChallenges.push(created);
  }
  
  return new Response(JSON.stringify(newChallenges), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}