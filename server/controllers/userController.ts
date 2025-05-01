import { Request, Response } from 'express';
import { storage } from '../storage';
import { web3Service } from '../services/web3Service';
import { telegramService } from '../services/telegramService';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import * as schema from '@shared/schema';

interface AuthRequest extends Request {
  user?: any;
}

const userController = {
  // User registration
  register: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Create new user
      const user = await storage.createUser({ username, password });
      
      // Set user session
      req.session.userId = user.id;
      
      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      return res.status(201).json(userData);
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'An error occurred during registration' });
    }
  },
  
  // User login
  login: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({ message: 'Your account has been suspended' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user session
      req.session.userId = user.id;
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      return res.status(200).json(userData);
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'An error occurred during login' });
    }
  },
  
  // User logout
  logout: (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  },
  
  // Get telegram auth status
  getTelegramAuthStatus: async (req: AuthRequest, res: Response) => {
    try {
      // Check if Telegram auth is enabled
      const isEnabled = await telegramService.isAuthEnabled();
      
      // Check if user is authenticated with Telegram
      const telegramUser = req.user?.telegramId ? {
        id: req.user.telegramId,
        first_name: req.user.telegramFirstName,
        last_name: req.user.telegramLastName,
        username: req.user.telegramUsername,
        photo_url: req.user.telegramPhotoUrl,
      } : null;
      
      return res.status(200).json({
        authenticated: !!telegramUser,
        telegramAuthEnabled: isEnabled,
        user: telegramUser,
      });
    } catch (error) {
      console.error('Telegram auth status error:', error);
      return res.status(500).json({ message: 'Failed to get Telegram auth status' });
    }
  },
  
  // Authenticate with Telegram
  authenticateWithTelegram: async (req: AuthRequest, res: Response) => {
    try {
      // Check if Telegram auth is enabled
      const isEnabled = await telegramService.isAuthEnabled();
      if (!isEnabled) {
        return res.status(403).json({ 
          success: false, 
          message: 'Telegram authentication is currently disabled' 
        });
      }
      
      // Get telegram data from request
      const telegramData = req.body;
      
      // Validate Telegram data
      const isValid = telegramService.validateAuthData(telegramData);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Telegram authentication data' 
        });
      }
      
      // Check if a user with this Telegram ID already exists
      let user = await storage.getUserByTelegramId(telegramData.id.toString());
      
      if (user) {
        // User found with this Telegram ID, update the session
        req.session.userId = user.id;
        
        // Update last login
        await storage.updateUserLastLogin(user.id);
        
        return res.status(200).json({ 
          success: true, 
          user: {
            id: telegramData.id,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            photo_url: telegramData.photo_url,
          }
        });
      }
      
      // If the user is already logged in, connect Telegram to their account
      if (req.user) {
        // Update user with Telegram data
        await storage.connectUserTelegram(req.user.id, {
          telegramId: telegramData.id.toString(),
          telegramUsername: telegramData.username,
          telegramFirstName: telegramData.first_name,
          telegramLastName: telegramData.last_name,
          telegramPhotoUrl: telegramData.photo_url,
        });
        
        return res.status(200).json({ 
          success: true, 
          user: {
            id: telegramData.id,
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            photo_url: telegramData.photo_url,
          }
        });
      }
      
      // No existing user with this Telegram ID and not logged in, create a new user
      const newUsername = telegramData.username || `telegram_${telegramData.id}`;
      const randomPassword = nanoid(12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Check if username exists
      let username = newUsername;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        // Username exists, append a random string
        username = `${newUsername}_${nanoid(5)}`;
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
      });
      
      // Connect Telegram data
      await storage.connectUserTelegram(newUser.id, {
        telegramId: telegramData.id.toString(),
        telegramUsername: telegramData.username,
        telegramFirstName: telegramData.first_name,
        telegramLastName: telegramData.last_name,
        telegramPhotoUrl: telegramData.photo_url,
      });
      
      // Set user session
      req.session.userId = newUser.id;
      
      return res.status(200).json({ 
        success: true, 
        user: {
          id: telegramData.id,
          first_name: telegramData.first_name,
          last_name: telegramData.last_name,
          username: telegramData.username,
          photo_url: telegramData.photo_url,
        }
      });
    } catch (error) {
      console.error('Telegram authentication error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'An error occurred during Telegram authentication' 
      });
    }
  },
  
  // Authenticate with Telegram WebApp
  authenticateWithTelegramWebApp: async (req: AuthRequest, res: Response) => {
    try {
      // Check if Telegram auth is enabled
      const isEnabled = await telegramService.isAuthEnabled();
      if (!isEnabled) {
        return res.status(403).json({ 
          success: false, 
          message: 'Telegram authentication is currently disabled' 
        });
      }
      
      // Get initData from request
      const { initData } = req.body;
      if (!initData) {
        return res.status(400).json({ 
          success: false, 
          message: 'Telegram WebApp init data is required' 
        });
      }
      
      // Validate WebApp data
      const userData = telegramService.validateWebAppData(initData);
      if (!userData || !userData.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid Telegram WebApp data' 
        });
      }
      
      const telegramUser = userData.user;
      
      // Check if a user with this Telegram ID already exists
      let user = await storage.getUserByTelegramId(telegramUser.id.toString());
      
      if (user) {
        // User found with this Telegram ID, update the session
        req.session.userId = user.id;
        
        // Update last login
        await storage.updateUserLastLogin(user.id);
        
        return res.status(200).json({ 
          success: true, 
          user: telegramUser
        });
      }
      
      // If the user is already logged in, connect Telegram to their account
      if (req.user) {
        // Update user with Telegram data
        await storage.connectUserTelegram(req.user.id, {
          telegramId: telegramUser.id.toString(),
          telegramUsername: telegramUser.username,
          telegramFirstName: telegramUser.first_name,
          telegramLastName: telegramUser.last_name,
          telegramPhotoUrl: telegramUser.photo_url,
        });
        
        return res.status(200).json({ 
          success: true, 
          user: telegramUser
        });
      }
      
      // No existing user with this Telegram ID and not logged in, create a new user
      const newUsername = telegramUser.username || `telegram_${telegramUser.id}`;
      const randomPassword = nanoid(12);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Check if username exists
      let username = newUsername;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        // Username exists, append a random string
        username = `${newUsername}_${nanoid(5)}`;
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
      });
      
      // Connect Telegram data
      await storage.connectUserTelegram(newUser.id, {
        telegramId: telegramUser.id.toString(),
        telegramUsername: telegramUser.username,
        telegramFirstName: telegramUser.first_name,
        telegramLastName: telegramUser.last_name,
        telegramPhotoUrl: telegramUser.photo_url,
      });
      
      // Set user session
      req.session.userId = newUser.id;
      
      return res.status(200).json({ 
        success: true, 
        user: telegramUser
      });
    } catch (error) {
      console.error('Telegram WebApp authentication error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'An error occurred during Telegram WebApp authentication' 
      });
    }
  },
  
  // Disconnect Telegram
  disconnectTelegram: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Check if the user has Telegram connected
      if (!req.user.telegramId) {
        return res.status(400).json({ message: 'No Telegram account connected' });
      }
      
      // Disconnect Telegram
      await storage.disconnectUserTelegram(req.user.id);
      
      return res.status(200).json({ message: 'Telegram account disconnected successfully' });
    } catch (error) {
      console.error('Disconnect Telegram error:', error);
      return res.status(500).json({ message: 'Failed to disconnect Telegram account' });
    }
  },
  
  // Get user profile
  getProfile: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(200).json({ message: 'Not authenticated' });
      }
      
      // Get system settings for referral reward
      const settings = await storage.getSystemSettings();
      const referralReward = settings?.referralReward || 75;
      
      // Get user's global rank
      const leaderboard = await storage.getLeaderboard(1000);
      const userRank = leaderboard.entries.findIndex(entry => entry.userId === req.user.id) + 1;
      
      // Get referrals count
      const referralsCount = await storage.countUserReferrals(req.user.id);
      
      // Return user profile data
      return res.status(200).json({
        id: req.user.id,
        username: req.user.username,
        telegramId: req.user.telegramId,
        telegramUsername: req.user.telegramUsername,
        walletAddress: req.user.walletAddress,
        lkmtBalance: Number(req.user.lkmtBalance),
        claimableRewards: Number(req.user.claimableRewards),
        referralCode: req.user.referralCode,
        referralReward,
        isAdmin: req.user.isAdmin,
        globalRank: userRank > 0 ? userRank : 'N/A',
        referralsCount,
        createdAt: req.user.createdAt,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ message: 'Failed to get profile' });
    }
  },
  
  // Get user stats
  getUserStats: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const stats = await storage.getUserStats(req.user.id);
      
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      return res.status(500).json({ message: 'Failed to get user stats' });
    }
  },
  
  // Get user tasks
  getUserTasks: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userTasks = await storage.getUserTasks(req.user.id);
      
      return res.status(200).json(userTasks);
    } catch (error) {
      console.error('Get user tasks error:', error);
      return res.status(500).json({ message: 'Failed to get user tasks' });
    }
  },
  
  // Get user activity
  getUserActivity: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const type = req.query.type as string;
      const activities = await storage.getUserActivityLogs(req.user.id, type);
      
      return res.status(200).json(activities);
    } catch (error) {
      console.error('Get user activity error:', error);
      return res.status(500).json({ message: 'Failed to get user activity' });
    }
  },
  
  // Connect wallet
  connectWallet: async (req: AuthRequest, res: Response) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Validate wallet address
      if (!web3Service.isValidAddress(address)) {
        return res.status(400).json({ message: 'Invalid wallet address' });
      }
      
      // Check if address is already connected to another user
      const existingUser = await storage.getUserByWalletAddress(address);
      if (existingUser && (!req.user || existingUser.id !== req.user.id)) {
        return res.status(400).json({ message: 'Wallet address already connected to another account' });
      }
      
      // If user is not authenticated, create or find user by wallet
      if (!req.user) {
        if (existingUser) {
          // User found with this wallet, log them in
          req.session.userId = existingUser.id;
          
          // Update last login
          await storage.updateUserLastLogin(existingUser.id);
          
          // Create activity log
          await storage.createActivityLog({
            userId: existingUser.id,
            type: 'task',
            description: 'Logged in with wallet',
            status: 'completed',
          });
          
          const { password: _, ...userData } = existingUser;
          return res.status(200).json(userData);
        } else {
          // Create new user with wallet
          const username = `wallet_${address.slice(0, 6)}`;
          const randomPassword = nanoid(12);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          
          const newUser = await storage.createUser({
            username,
            password: hashedPassword,
          });
          
          // Connect wallet
          await storage.connectUserWallet(newUser.id, address);
          
          // Set user session
          req.session.userId = newUser.id;
          
          // Create activity log
          await storage.createActivityLog({
            userId: newUser.id,
            type: 'task',
            description: 'Created account with wallet',
            status: 'completed',
          });
          
          // Check if this was a "connect wallet" task and complete it
          const connectWalletTask = (await storage.getAllTasks()).find(
            task => task.type === 'custom' && task.title.toLowerCase().includes('connect wallet')
          );
          
          if (connectWalletTask) {
            const existingUserTask = await storage.getUserTask(newUser.id, connectWalletTask.id);
            
            if (!existingUserTask) {
              // Create user task
              await storage.createUserTask({
                userId: newUser.id,
                taskId: connectWalletTask.id,
                status: 'completed',
                completedAt: new Date(),
              });
              
              // Create reward transaction
              await storage.createRewardTransaction({
                userId: newUser.id,
                amount: connectWalletTask.reward,
                type: 'task',
                referenceId: connectWalletTask.id,
                status: 'completed',
              });
              
              // Update user balance
              await storage.updateUserLkmtBalance(newUser.id, Number(connectWalletTask.reward));
              
              // Create activity log
              await storage.createActivityLog({
                userId: newUser.id,
                type: 'task',
                description: `Completed task: ${connectWalletTask.title}`,
                reward: Number(connectWalletTask.reward),
                status: 'completed',
                referenceId: connectWalletTask.id,
              });
            }
          }
          
          const user = await storage.getUserById(newUser.id);
          const { password: __, ...userData } = user!;
          return res.status(201).json(userData);
        }
      }
      
      // Connect wallet to existing user
      await storage.connectUserWallet(req.user.id, address);
      
      // Create activity log
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'task',
        description: 'Connected wallet',
        status: 'completed',
      });
      
      // Check if this was a "connect wallet" task and complete it
      const connectWalletTask = (await storage.getAllTasks()).find(
        task => task.type === 'custom' && task.title.toLowerCase().includes('connect wallet')
      );
      
      if (connectWalletTask) {
        const existingUserTask = await storage.getUserTask(req.user.id, connectWalletTask.id);
        
        if (!existingUserTask) {
          // Create user task
          await storage.createUserTask({
            userId: req.user.id,
            taskId: connectWalletTask.id,
            status: 'completed',
            completedAt: new Date(),
          });
          
          // Create reward transaction
          await storage.createRewardTransaction({
            userId: req.user.id,
            amount: connectWalletTask.reward,
            type: 'task',
            referenceId: connectWalletTask.id,
            status: 'completed',
          });
          
          // Update user balance
          await storage.updateUserLkmtBalance(req.user.id, Number(connectWalletTask.reward));
          
          // Create activity log
          await storage.createActivityLog({
            userId: req.user.id,
            type: 'task',
            description: `Completed task: ${connectWalletTask.title}`,
            reward: Number(connectWalletTask.reward),
            status: 'completed',
            referenceId: connectWalletTask.id,
          });
        }
      }
      
      const updatedUser = await storage.getUserById(req.user.id);
      const { password: _, ...userData } = updatedUser!;
      return res.status(200).json(userData);
    } catch (error) {
      console.error('Connect wallet error:', error);
      return res.status(500).json({ message: 'Failed to connect wallet' });
    }
  },
  
  // Get public stats
  getPublicStats: async (_req: Request, res: Response) => {
    try {
      const participantCount = await storage.countUsers();
      
      return res.status(200).json({
        participantCount,
      });
    } catch (error) {
      console.error('Get public stats error:', error);
      return res.status(500).json({ message: 'Failed to get public stats' });
    }
  },
  
  // Get leaderboard
  getLeaderboard: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const leaderboard = await storage.getLeaderboard(limit, page);
      
      return res.status(200).json(leaderboard);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return res.status(500).json({ message: 'Failed to get leaderboard' });
    }
  },
  
  // Get leaderboard stats
  getLeaderboardStats: async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getLeaderboardStats();
      
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Get leaderboard stats error:', error);
      return res.status(500).json({ message: 'Failed to get leaderboard stats' });
    }
  },
};

export default userController;
