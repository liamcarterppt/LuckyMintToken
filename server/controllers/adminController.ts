import { Request, Response } from 'express';
import { storage } from '../storage';
import { web3Service } from '../services/web3Service';
import { telegramService } from '../services/telegramService';
import * as schema from '@shared/schema';
import { db } from '@db';
import { eq, desc } from 'drizzle-orm';
import rewardController from './rewardController';

interface AuthRequest extends Request {
  user?: any;
}

const adminController = {
  // Get admin dashboard info
  getAdminInfo: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }

      const settings = await storage.getSystemSettings();
      
      return res.status(200).json({
        adminUser: {
          id: req.user.id,
          username: req.user.username,
          walletAddress: req.user.walletAddress,
        },
        settings,
      });
    } catch (error) {
      console.error('Get admin info error:', error);
      return res.status(500).json({ message: 'Failed to get admin info' });
    }
  },
  
  // Get dashboard stats
  getDashboardStats: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const totalUsers = await storage.countUsers();
      const walletConnectedUsers = await storage.countWalletConnectedUsers();
      const totalTasks = await storage.countTotalTasks();
      const activeTasks = await storage.countActiveTasks();
      const taskCompletionRate = await storage.getTaskCompletionRate();
      const pendingRewards = await storage.getTotalPendingRewards();
      const distributedRewards = await storage.getTotalDistributedRewards();
      
      return res.status(200).json({
        totalUsers,
        walletConnectedUsers,
        walletConnectionRate: totalUsers ? (walletConnectedUsers / totalUsers * 100).toFixed(2) : 0,
        totalTasks,
        activeTasks,
        taskCompletionRate: taskCompletionRate.toFixed(2),
        pendingRewards,
        distributedRewards,
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return res.status(500).json({ message: 'Failed to get dashboard stats' });
    }
  },
  
  // Get user growth and other stats over time
  getStatsOverTime: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const days = parseInt(req.query.days as string) || 30;
      
      const stats = await storage.getStatsOverTime(days);
      const userGrowth = await storage.getUserGrowthByWeek();
      
      return res.status(200).json({
        dailyStats: stats,
        userGrowth,
      });
    } catch (error) {
      console.error('Get stats over time error:', error);
      return res.status(500).json({ message: 'Failed to get stats over time' });
    }
  },
  
  // Get recent activities
  getRecentActivities: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivityLogs(limit);
      
      return res.status(200).json(activities);
    } catch (error) {
      console.error('Get recent activities error:', error);
      return res.status(500).json({ message: 'Failed to get recent activities' });
    }
  },
  
  // User management
  // Get users with pagination
  getUsers: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string;
      
      const { users, total } = await storage.getAllUsers(page, pageSize, search);
      
      return res.status(200).json({
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ message: 'Failed to get users' });
    }
  },
  
  // Get recent users
  getRecentUsers: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const limit = parseInt(req.query.limit as string) || 5;
      const users = await storage.getRecentUsers(limit);
      
      return res.status(200).json(users);
    } catch (error) {
      console.error('Get recent users error:', error);
      return res.status(500).json({ message: 'Failed to get recent users' });
    }
  },
  
  // Send reward to user
  sendRewardToUser: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const userId = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid reward amount is required' });
      }
      
      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user LKMT balance
      await storage.updateUserLkmtBalance(userId, amount);
      
      // Create reward transaction
      const reward = await storage.createRewardTransaction({
        userId,
        amount,
        type: 'manual',
        status: 'completed',
      });
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        type: 'manual',
        description: `Admin reward: ${reason || 'Manual distribution'}`,
        reward: amount,
        status: 'completed',
        referenceId: reward.id,
      });
      
      return res.status(200).json({
        message: `Reward of ${amount} $LKMT sent to user successfully`,
        reward,
      });
    } catch (error) {
      console.error('Send reward error:', error);
      return res.status(500).json({ message: 'Failed to send reward' });
    }
  },
  
  // Update user
  updateUser: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Remove sensitive fields that shouldn't be updated directly
      const { password, isAdmin, ...safeUserData } = userData;
      
      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, safeUserData);
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ message: 'Failed to update user' });
    }
  },
  
  // Toggle user ban status
  toggleUserBan: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow banning other admins
      if (user.isAdmin && user.id !== req.user.id) {
        return res.status(403).json({ message: 'Cannot ban other admin users' });
      }
      
      // Toggle ban status
      const updatedUser = await storage.updateUser(userId, {
        isBanned: !user.isBanned,
      });
      
      return res.status(200).json({
        message: updatedUser.isBanned ? 'User banned successfully' : 'User unbanned successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Toggle user ban error:', error);
      return res.status(500).json({ message: 'Failed to toggle user ban status' });
    }
  },
  
  // Delete user
  deleteUser: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't allow deleting other admins
      if (user.isAdmin && user.id !== req.user.id) {
        return res.status(403).json({ message: 'Cannot delete other admin users' });
      }
      
      // Delete user
      await storage.deleteUser(userId);
      
      return res.status(200).json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  },
  
  // Task management
  // Get all tasks
  getTasks: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const tasks = await db.select().from(schema.tasks)
        .orderBy(desc(schema.tasks.createdAt));
      
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      return res.status(500).json({ message: 'Failed to get tasks' });
    }
  },
  
  // Create task
  createTask: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const taskData = req.body;
      
      // Validate task data
      try {
        schema.insertTaskSchema.parse(taskData);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid task data', error });
      }
      
      // Create task
      const task = await storage.createTask(taskData);
      
      return res.status(201).json(task);
    } catch (error) {
      console.error('Create task error:', error);
      return res.status(500).json({ message: 'Failed to create task' });
    }
  },
  
  // Update task
  updateTask: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const taskId = parseInt(req.params.id);
      const taskData = req.body;
      
      // Check if task exists
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Update task
      const updatedTask = await storage.updateTask(taskId, taskData);
      
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error('Update task error:', error);
      return res.status(500).json({ message: 'Failed to update task' });
    }
  },
  
  // Delete task
  deleteTask: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const taskId = parseInt(req.params.id);
      
      // Check if task exists
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Delete task
      await storage.deleteTask(taskId);
      
      return res.status(200).json({
        message: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Delete task error:', error);
      return res.status(500).json({ message: 'Failed to delete task' });
    }
  },
  
  // Get task completions
  getTaskCompletions: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const taskId = parseInt(req.params.id);
      const status = req.query.status as string;
      
      // Get task completions
      const completions = await storage.getTaskCompletions(taskId, status);
      
      return res.status(200).json(completions);
    } catch (error) {
      console.error('Get task completions error:', error);
      return res.status(500).json({ message: 'Failed to get task completions' });
    }
  },
  
  // Verify task completion
  verifyTaskCompletion: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const userTaskId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Valid status (verified or rejected) is required' });
      }
      
      // Get the user task
      const userTask = await db.query.userTasks.findFirst({
        where: eq(schema.userTasks.id, userTaskId),
        with: {
          task: true,
          user: true,
        },
      });
      
      if (!userTask) {
        return res.status(404).json({ message: 'User task not found' });
      }
      
      // Update user task status
      const updatedUserTask = await storage.updateUserTask(userTaskId, {
        status,
        verifiedAt: status === 'verified' ? new Date() : null,
      });
      
      // If verified, give reward to user
      if (status === 'verified') {
        // Create reward transaction
        await storage.createRewardTransaction({
          userId: userTask.userId,
          amount: userTask.task.reward,
          type: 'task',
          referenceId: userTask.taskId,
          status: 'completed',
        });
        
        // Update user balance
        await storage.updateUserLkmtBalance(userTask.userId, Number(userTask.task.reward));
        
        // Create activity log
        await storage.createActivityLog({
          userId: userTask.userId,
          type: 'task',
          description: `Task verified: ${userTask.task.title}`,
          reward: Number(userTask.task.reward),
          status: 'completed',
          referenceId: userTask.taskId,
        });
      } else {
        // Create activity log for rejected task
        await storage.createActivityLog({
          userId: userTask.userId,
          type: 'task',
          description: `Task rejected: ${userTask.task.title}`,
          status: 'rejected',
          referenceId: userTask.taskId,
        });
      }
      
      return res.status(200).json({
        message: status === 'verified'
          ? 'Task verified and reward sent'
          : 'Task rejected',
        userTask: updatedUserTask,
      });
    } catch (error) {
      console.error('Verify task completion error:', error);
      return res.status(500).json({ message: 'Failed to verify task completion' });
    }
  },
  
  // Rewards management
  // Get pending rewards
  getPendingRewards: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const pendingRewards = await storage.getPendingRewardTransactions();
      
      return res.status(200).json(pendingRewards);
    } catch (error) {
      console.error('Get pending rewards error:', error);
      return res.status(500).json({ message: 'Failed to get pending rewards' });
    }
  },
  
  // Process rewards
  processRewards: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      // This would normally trigger a background process to handle rewards
      // For now, it's a synchronous operation
      await rewardController.processPendingRewards();
      
      return res.status(200).json({
        message: 'Reward processing initiated',
      });
    } catch (error) {
      console.error('Process rewards error:', error);
      return res.status(500).json({ message: 'Failed to process rewards' });
    }
  },
  
  // Create manual reward
  createManualReward: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { userId, amount, reason } = req.body;
      
      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({
          message: 'User ID and valid reward amount are required',
        });
      }
      
      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create reward transaction
      const reward = await storage.createRewardTransaction({
        userId,
        amount,
        type: 'manual',
        status: 'completed',
      });
      
      // Update user balance
      await storage.updateUserLkmtBalance(userId, amount);
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        type: 'manual',
        description: `Admin reward: ${reason || 'Manual distribution'}`,
        reward: amount,
        status: 'completed',
        referenceId: reward.id,
      });
      
      return res.status(201).json({
        message: `Reward of ${amount} $LKMT tokens sent to user successfully`,
        reward,
      });
    } catch (error) {
      console.error('Create manual reward error:', error);
      return res.status(500).json({ message: 'Failed to create manual reward' });
    }
  },
  
  // Spin wheel management
  // Update spin wheel
  updateSpinWheel: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id, ...wheelData } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: 'Spin wheel ID is required' });
      }
      
      // Check if spin wheel exists
      const spinWheel = await db.query.spinWheels.findFirst({
        where: eq(schema.spinWheels.id, id),
      });
      
      if (!spinWheel) {
        return res.status(404).json({ message: 'Spin wheel not found' });
      }
      
      // Update spin wheel
      const updatedWheel = await storage.updateSpinWheel(id, wheelData);
      
      return res.status(200).json(updatedWheel);
    } catch (error) {
      console.error('Update spin wheel error:', error);
      return res.status(500).json({ message: 'Failed to update spin wheel' });
    }
  },
  
  // Create spin wheel segment
  createSpinWheelSegment: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const segmentData = req.body;
      
      // Check if wheel exists
      const spinWheel = await db.query.spinWheels.findFirst({
        where: eq(schema.spinWheels.id, segmentData.wheelId),
      });
      
      if (!spinWheel) {
        return res.status(404).json({ message: 'Spin wheel not found' });
      }
      
      // Create segment
      const segment = await storage.createSpinWheelSegment(segmentData);
      
      // Update segment count on wheel
      await storage.updateSpinWheel(segmentData.wheelId, {
        segmentCount: spinWheel.segmentCount + 1,
      });
      
      return res.status(201).json(segment);
    } catch (error) {
      console.error('Create spin wheel segment error:', error);
      return res.status(500).json({ message: 'Failed to create spin wheel segment' });
    }
  },
  
  // Update spin wheel segment
  updateSpinWheelSegment: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const segmentId = parseInt(req.params.id);
      const segmentData = req.body;
      
      // Check if segment exists
      const segment = await db.query.spinWheelSegments.findFirst({
        where: eq(schema.spinWheelSegments.id, segmentId),
      });
      
      if (!segment) {
        return res.status(404).json({ message: 'Spin wheel segment not found' });
      }
      
      // Update segment
      const updatedSegment = await storage.updateSpinWheelSegment(segmentId, segmentData);
      
      return res.status(200).json(updatedSegment);
    } catch (error) {
      console.error('Update spin wheel segment error:', error);
      return res.status(500).json({ message: 'Failed to update spin wheel segment' });
    }
  },
  
  // Delete spin wheel segment
  deleteSpinWheelSegment: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const segmentId = parseInt(req.params.id);
      
      // Check if segment exists
      const segment = await db.query.spinWheelSegments.findFirst({
        where: eq(schema.spinWheelSegments.id, segmentId),
      });
      
      if (!segment) {
        return res.status(404).json({ message: 'Spin wheel segment not found' });
      }
      
      // Get the wheel
      const spinWheel = await db.query.spinWheels.findFirst({
        where: eq(schema.spinWheels.id, segment.wheelId),
      });
      
      // Delete segment
      await storage.deleteSpinWheelSegment(segmentId);
      
      // Update segment count on wheel
      if (spinWheel) {
        await storage.updateSpinWheel(segment.wheelId, {
          segmentCount: Math.max(0, spinWheel.segmentCount - 1),
        });
      }
      
      return res.status(200).json({
        message: 'Spin wheel segment deleted successfully',
      });
    } catch (error) {
      console.error('Delete spin wheel segment error:', error);
      return res.status(500).json({ message: 'Failed to delete spin wheel segment' });
    }
  },
  
  // Quiz management
  // Create quiz question
  createQuizQuestion: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const questionData = req.body;
      
      // Create question
      const question = await storage.createQuizQuestion(questionData);
      
      return res.status(201).json(question);
    } catch (error) {
      console.error('Create quiz question error:', error);
      return res.status(500).json({ message: 'Failed to create quiz question' });
    }
  },
  
  // Update quiz question
  updateQuizQuestion: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const questionId = parseInt(req.params.id);
      const questionData = req.body;
      
      // Check if question exists
      const question = await storage.getQuizQuestionById(questionId);
      
      if (!question) {
        return res.status(404).json({ message: 'Quiz question not found' });
      }
      
      // Update question
      const updatedQuestion = await storage.updateQuizQuestion(questionId, questionData);
      
      return res.status(200).json(updatedQuestion);
    } catch (error) {
      console.error('Update quiz question error:', error);
      return res.status(500).json({ message: 'Failed to update quiz question' });
    }
  },
  
  // Delete quiz question
  deleteQuizQuestion: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const questionId = parseInt(req.params.id);
      
      // Check if question exists
      const question = await storage.getQuizQuestionById(questionId);
      
      if (!question) {
        return res.status(404).json({ message: 'Quiz question not found' });
      }
      
      // Delete question
      await storage.deleteQuizQuestion(questionId);
      
      return res.status(200).json({
        message: 'Quiz question deleted successfully',
      });
    } catch (error) {
      console.error('Delete quiz question error:', error);
      return res.status(500).json({ message: 'Failed to delete quiz question' });
    }
  },
  
  // System settings management
  // Get system settings
  getSystemSettings: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const settings = await storage.getSystemSettings();
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Get system settings error:', error);
      return res.status(500).json({ message: 'Failed to get system settings' });
    }
  },
  
  // Update system settings
  updateSystemSettings: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const settingsData = req.body;
      
      // Update settings
      const settings = await storage.updateSystemSettings(settingsData);
      
      // If Telegram bot token was updated, reinitialize the service
      if (settingsData.telegramBotToken) {
        await telegramService.initialize();
      }
      
      // If BNB RPC URL was updated, reinitialize the service
      if (settingsData.bnbRpcUrl) {
        await web3Service.initialize();
      }
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Update system settings error:', error);
      return res.status(500).json({ message: 'Failed to update system settings' });
    }
  },
};

export default adminController;