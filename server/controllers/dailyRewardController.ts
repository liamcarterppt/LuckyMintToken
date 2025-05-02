import { Request, Response } from 'express';
import { storage } from '../storage';

interface AuthRequest extends Request {
  user?: any;
}

const dailyRewardController = {
  // Get all daily rewards
  getDailyRewards: async (_req: Request, res: Response) => {
    try {
      const rewards = await storage.getDailyRewards();
      return res.status(200).json(rewards);
    } catch (error) {
      console.error('Error getting daily rewards:', error);
      return res.status(500).json({ message: 'Failed to get daily rewards' });
    }
  },
  
  // Get user daily login streak
  getUserStreak: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const userLogins = await storage.getUserDailyLogins(userId);
      const lastLogin = await storage.getLastUserDailyLogin(userId);
      
      // Determine if streak is active by checking if last login was yesterday or today
      let isStreakActive = false;
      let currentStreak = 0;
      
      if (lastLogin) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastLoginDate = new Date(lastLogin.loginDate);
        lastLoginDate.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // If last login was today, return the current streak
        if (lastLoginDate.getTime() === today.getTime()) {
          isStreakActive = true;
          currentStreak = lastLogin.day;
        } 
        // If last login was yesterday, streak is still active
        else if (lastLoginDate.getTime() === yesterday.getTime()) {
          isStreakActive = true;
          currentStreak = lastLogin.day;
        }
        // Otherwise streak is broken
      }
      
      return res.status(200).json({
        streak: currentStreak,
        isActive: isStreakActive,
        history: userLogins.slice(0, 10) // Return only the last 10 logins
      });
    } catch (error) {
      console.error('Error getting user streak:', error);
      return res.status(500).json({ message: 'Failed to get user streak' });
    }
  },
  
  // Process daily login reward
  claimDailyReward: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const settings = await storage.getSystemSettings();
      
      // Check if daily rewards are enabled
      if (!settings.dailyRewardsEnabled) {
        return res.status(403).json({ message: 'Daily rewards are currently disabled' });
      }
      
      // Get the last login
      const lastLogin = await storage.getLastUserDailyLogin(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if already claimed today
      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin.loginDate);
        lastLoginDate.setHours(0, 0, 0, 0);
        
        if (lastLoginDate.getTime() === today.getTime()) {
          return res.status(400).json({ message: 'Daily reward already claimed today' });
        }
      }
      
      // Determine current streak
      let currentStreak = 1; // Default to day 1
      let streakBroken = false;
      
      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin.loginDate);
        lastLoginDate.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // If last login was yesterday, increment streak
        if (lastLoginDate.getTime() === yesterday.getTime()) {
          currentStreak = lastLogin.day + 1;
          
          // Cap streak at maxStreakDays
          if (currentStreak > settings.maxStreakDays) {
            currentStreak = 1; // Reset to day 1 after max days
          }
        } else {
          // Streak broken
          streakBroken = true;
        }
      }
      
      // Calculate reward amount
      // Base reward + (streak bonus * streak)
      const baseReward = Number(settings.dailyLoginBaseReward);
      const streakBonus = Number(settings.streakBonusMultiplier);
      const rewardAmount = baseReward + (baseReward * streakBonus * (currentStreak - 1));
      
      // Create daily login record
      const dailyLogin = await storage.createUserDailyLogin({
        userId,
        loginDate: new Date(),
        day: currentStreak,
        reward: rewardAmount,
        isRewarded: true,
      });
      
      // Create reward transaction
      await storage.createRewardTransaction({
        userId,
        amount: rewardAmount,
        type: 'login',
        referenceId: dailyLogin.id,
        status: 'completed',
      });
      
      // Update user's balance and consecutive login count
      await storage.updateUser(userId, {
        lkmtBalance: Number(user.lkmtBalance) + rewardAmount,
        consecutiveLogins: currentStreak,
        lastLoginDate: new Date(),
      });
      
      // Award experience points for daily login
      await storage.updateUserExperience(userId, 10); // 10 XP for daily login
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        type: 'login',
        description: streakBroken
          ? 'Daily login reward claimed (streak reset)'
          : `Daily login reward claimed (Day ${currentStreak})`,
        reward: rewardAmount,
        status: 'completed',
        referenceId: dailyLogin.id,
      });
      
      // Check for login achievements
      const loginAchievements = await storage.getAchievementsByType('login');
      
      for (const achievement of loginAchievements) {
        // If user meets the login requirement
        if (currentStreak >= achievement.requirement || user.consecutiveLogins >= achievement.requirement) {
          // Check if user already has this achievement
          const hasAchievement = await storage.hasUserUnlockedAchievement(userId, achievement.id);
          
          if (!hasAchievement) {
            // Unlock achievement
            const userAchievement = await storage.createUserAchievement({
              userId,
              achievementId: achievement.id,
              isRewarded: false,
            });
            
            // Create activity log
            await storage.createActivityLog({
              userId,
              type: 'achievement',
              description: `Unlocked achievement: ${achievement.title}`,
              status: 'completed',
              referenceId: achievement.id,
            });
            
            // Award achievement reward separately
            await storage.updateUser(userId, {
              lkmtBalance: Number(user.lkmtBalance) + Number(achievement.reward),
            });
            
            // Create reward transaction for achievement
            await storage.createRewardTransaction({
              userId,
              amount: achievement.reward,
              type: 'achievement',
              referenceId: userAchievement.id,
              status: 'completed',
            });
            
            // Update achievement to mark as rewarded
            await storage.updateUserAchievement(userAchievement.id, {
              isRewarded: true,
            });
          }
        }
      }
      
      return res.status(200).json({
        success: true,
        day: currentStreak,
        reward: rewardAmount,
        streakBroken,
      });
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return res.status(500).json({ message: 'Failed to claim daily reward' });
    }
  },
  
  // Admin endpoints for managing daily rewards
  createDailyReward: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { day, reward, description } = req.body;
      
      if (!day || !reward || !description) {
        return res.status(400).json({ message: 'Day, reward and description are required' });
      }
      
      const newReward = await storage.createDailyReward({
        day,
        reward,
        description,
        isActive: true,
      });
      
      return res.status(201).json(newReward);
    } catch (error) {
      console.error('Error creating daily reward:', error);
      return res.status(500).json({ message: 'Failed to create daily reward' });
    }
  },
  
  updateDailyReward: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id } = req.params;
      const { reward, description, isActive } = req.body;
      
      const updatedReward = await storage.updateDailyReward(Number(id), {
        reward: reward !== undefined ? reward : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      });
      
      return res.status(200).json(updatedReward);
    } catch (error) {
      console.error('Error updating daily reward:', error);
      return res.status(500).json({ message: 'Failed to update daily reward' });
    }
  }
};

export default dailyRewardController;