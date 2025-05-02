import { Request, Response } from 'express';
import { storage } from '../storage';

interface AuthRequest extends Request {
  user?: any;
}

const achievementController = {
  // Get all achievements
  getAchievements: async (_req: Request, res: Response) => {
    try {
      const achievements = await storage.getAchievements();
      return res.status(200).json(achievements);
    } catch (error) {
      console.error('Error getting achievements:', error);
      return res.status(500).json({ message: 'Failed to get achievements' });
    }
  },
  
  // Get user's achievements
  getUserAchievements: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const userAchievements = await storage.getUserAchievements(userId);
      
      // Get all possible achievements
      const allAchievements = await storage.getAchievements();
      
      // Create a map of unlocked achievements by ID
      const unlockedMap = new Map();
      userAchievements.forEach(ua => {
        unlockedMap.set(ua.achievementId, ua);
      });
      
      // Create response with all achievements and their unlock status
      const achievements = allAchievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedMap.has(achievement.id),
        unlockedAt: unlockedMap.has(achievement.id) ? unlockedMap.get(achievement.id).unlockedAt : null,
      }));
      
      return res.status(200).json({
        unlockedCount: userAchievements.length,
        totalCount: allAchievements.length,
        achievements,
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return res.status(500).json({ message: 'Failed to get user achievements' });
    }
  },
  
  // Claim achievement reward
  claimAchievementReward: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const { achievementId } = req.params;
      
      // Check if user has unlocked this achievement
      const userAchievements = await storage.getUserAchievements(userId);
      const userAchievement = userAchievements.find(ua => 
        ua.achievementId === Number(achievementId) && !ua.isRewarded
      );
      
      if (!userAchievement) {
        return res.status(400).json({ 
          message: 'Achievement not unlocked or reward already claimed' 
        });
      }
      
      // Get the achievement details
      const achievement = await storage.getAchievementById(Number(achievementId));
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      
      // Update user balance
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await storage.updateUser(userId, {
        lkmtBalance: Number(user.lkmtBalance) + Number(achievement.reward),
      });
      
      // Create reward transaction
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
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        type: 'achievement',
        description: `Claimed reward for achievement: ${achievement.title}`,
        reward: Number(achievement.reward),
        status: 'completed',
        referenceId: achievement.id,
      });
      
      return res.status(200).json({
        success: true,
        reward: Number(achievement.reward),
        achievement: achievement.title,
      });
    } catch (error) {
      console.error('Error claiming achievement reward:', error);
      return res.status(500).json({ message: 'Failed to claim achievement reward' });
    }
  },
  
  // Admin endpoints for managing achievements
  createAchievement: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { title, description, type, requirement, reward, icon } = req.body;
      
      if (!title || !description || !type || !requirement || !reward) {
        return res.status(400).json({ 
          message: 'Title, description, type, requirement and reward are required' 
        });
      }
      
      const newAchievement = await storage.createAchievement({
        title,
        description,
        type,
        requirement,
        reward,
        icon,
        isActive: true,
      });
      
      return res.status(201).json(newAchievement);
    } catch (error) {
      console.error('Error creating achievement:', error);
      return res.status(500).json({ message: 'Failed to create achievement' });
    }
  },
  
  updateAchievement: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id } = req.params;
      const { title, description, requirement, reward, icon, isActive } = req.body;
      
      const updatedAchievement = await storage.updateAchievement(Number(id), {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        requirement: requirement !== undefined ? requirement : undefined,
        reward: reward !== undefined ? reward : undefined,
        icon: icon !== undefined ? icon : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      });
      
      return res.status(200).json(updatedAchievement);
    } catch (error) {
      console.error('Error updating achievement:', error);
      return res.status(500).json({ message: 'Failed to update achievement' });
    }
  },
  
  // Manually grant achievement to user (admin only)
  grantAchievement: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { userId, achievementId } = req.body;
      
      if (!userId || !achievementId) {
        return res.status(400).json({ message: 'User ID and achievement ID are required' });
      }
      
      // Check if user already has this achievement
      const hasAchievement = await storage.hasUserUnlockedAchievement(userId, achievementId);
      
      if (hasAchievement) {
        return res.status(400).json({ message: 'User already has this achievement' });
      }
      
      // Get achievement
      const achievement = await storage.getAchievementById(achievementId);
      if (!achievement) {
        return res.status(404).json({ message: 'Achievement not found' });
      }
      
      // Create user achievement
      const userAchievement = await storage.createUserAchievement({
        userId,
        achievementId,
        isRewarded: false,
      });
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        type: 'achievement',
        description: `Manually granted achievement: ${achievement.title}`,
        status: 'completed',
        referenceId: achievement.id,
      });
      
      return res.status(201).json({
        success: true,
        userAchievement,
      });
    } catch (error) {
      console.error('Error granting achievement:', error);
      return res.status(500).json({ message: 'Failed to grant achievement' });
    }
  }
};

export default achievementController;