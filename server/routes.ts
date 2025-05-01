import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authMiddleware from "./middleware/auth";
import userController from "./controllers/userController";
import taskController from "./controllers/taskController";
import gameController from "./controllers/gameController";
import rewardController from "./controllers/rewardController";
import adminController from "./controllers/adminController";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiPrefix = "/api";
  
  // Auth routes
  app.post(`${apiPrefix}/auth/register`, userController.register);
  app.post(`${apiPrefix}/auth/login`, userController.login);
  app.post(`${apiPrefix}/auth/logout`, userController.logout);
  
  // Telegram auth routes
  app.get(`${apiPrefix}/auth/telegram/status`, userController.getTelegramAuthStatus);
  app.post(`${apiPrefix}/auth/telegram`, userController.authenticateWithTelegram);
  app.post(`${apiPrefix}/auth/telegram/webapp`, userController.authenticateWithTelegramWebApp);
  app.post(`${apiPrefix}/auth/telegram/logout`, userController.disconnectTelegram);
  
  // User routes
  app.get(`${apiPrefix}/users/profile`, authMiddleware.optional, userController.getProfile);
  app.get(`${apiPrefix}/users/stats`, authMiddleware.required, userController.getUserStats);
  app.get(`${apiPrefix}/users/tasks`, authMiddleware.required, userController.getUserTasks);
  app.get(`${apiPrefix}/users/activity`, authMiddleware.required, userController.getUserActivity);
  app.post(`${apiPrefix}/users/wallet`, authMiddleware.optional, userController.connectWallet);
  
  // Stats routes
  app.get(`${apiPrefix}/stats`, userController.getPublicStats);
  app.get(`${apiPrefix}/stats/leaderboard`, userController.getLeaderboardStats);
  
  // Task routes
  app.get(`${apiPrefix}/tasks`, taskController.getAllTasks);
  app.post(`${apiPrefix}/tasks/:id/complete`, authMiddleware.required, taskController.completeTask);
  
  // Game routes
  // Spin wheel
  app.get(`${apiPrefix}/games/spinwheel`, gameController.getSpinWheel);
  app.get(`${apiPrefix}/games/spinwheel/history`, authMiddleware.required, gameController.getSpinHistory);
  app.post(`${apiPrefix}/games/spinwheel/spin`, authMiddleware.required, gameController.performSpin);
  
  // Quiz
  app.get(`${apiPrefix}/games/quiz/questions`, gameController.getQuizQuestions);
  app.get(`${apiPrefix}/games/quiz/history`, authMiddleware.required, gameController.getQuizHistory);
  app.post(`${apiPrefix}/games/quiz/answer`, authMiddleware.required, gameController.submitQuizAnswer);
  
  // Leaderboard
  app.get(`${apiPrefix}/leaderboard`, userController.getLeaderboard);
  
  // Reward routes
  app.post(`${apiPrefix}/rewards/claim`, authMiddleware.required, rewardController.claimRewards);
  
  // Admin routes (all require admin authentication)
  app.get(`${apiPrefix}/admin/info`, authMiddleware.adminRequired, adminController.getAdminInfo);
  app.get(`${apiPrefix}/admin/stats`, authMiddleware.adminRequired, adminController.getDashboardStats);
  app.get(`${apiPrefix}/admin/stats/chart`, authMiddleware.adminRequired, adminController.getStatsOverTime);
  app.get(`${apiPrefix}/admin/activities/recent`, authMiddleware.adminRequired, adminController.getRecentActivities);
  
  // Admin user management
  app.get(`${apiPrefix}/admin/users`, authMiddleware.adminRequired, adminController.getUsers);
  app.get(`${apiPrefix}/admin/users/recent`, authMiddleware.adminRequired, adminController.getRecentUsers);
  app.post(`${apiPrefix}/admin/users/:id/reward`, authMiddleware.adminRequired, adminController.sendRewardToUser);
  app.patch(`${apiPrefix}/admin/users/:id`, authMiddleware.adminRequired, adminController.updateUser);
  app.patch(`${apiPrefix}/admin/users/:id/ban`, authMiddleware.adminRequired, adminController.toggleUserBan);
  app.delete(`${apiPrefix}/admin/users/:id`, authMiddleware.adminRequired, adminController.deleteUser);
  
  // Admin task management
  app.get(`${apiPrefix}/admin/tasks`, authMiddleware.adminRequired, adminController.getTasks);
  app.post(`${apiPrefix}/admin/tasks`, authMiddleware.adminRequired, adminController.createTask);
  app.patch(`${apiPrefix}/admin/tasks/:id`, authMiddleware.adminRequired, adminController.updateTask);
  app.delete(`${apiPrefix}/admin/tasks/:id`, authMiddleware.adminRequired, adminController.deleteTask);
  app.get(`${apiPrefix}/admin/tasks/:id/completions`, authMiddleware.adminRequired, adminController.getTaskCompletions);
  app.patch(`${apiPrefix}/admin/tasks/completion/:id`, authMiddleware.adminRequired, adminController.verifyTaskCompletion);
  
  // Admin rewards management
  app.get(`${apiPrefix}/admin/rewards/pending`, authMiddleware.adminRequired, adminController.getPendingRewards);
  app.post(`${apiPrefix}/admin/rewards/process`, authMiddleware.adminRequired, adminController.processRewards);
  app.post(`${apiPrefix}/admin/rewards/manual`, authMiddleware.adminRequired, adminController.createManualReward);
  
  // Admin game management
  app.patch(`${apiPrefix}/admin/spinwheel`, authMiddleware.adminRequired, adminController.updateSpinWheel);
  app.post(`${apiPrefix}/admin/spinwheel/segments`, authMiddleware.adminRequired, adminController.createSpinWheelSegment);
  app.patch(`${apiPrefix}/admin/spinwheel/segments/:id`, authMiddleware.adminRequired, adminController.updateSpinWheelSegment);
  app.delete(`${apiPrefix}/admin/spinwheel/segments/:id`, authMiddleware.adminRequired, adminController.deleteSpinWheelSegment);
  
  app.post(`${apiPrefix}/admin/quiz/questions`, authMiddleware.adminRequired, adminController.createQuizQuestion);
  app.patch(`${apiPrefix}/admin/quiz/questions/:id`, authMiddleware.adminRequired, adminController.updateQuizQuestion);
  app.delete(`${apiPrefix}/admin/quiz/questions/:id`, authMiddleware.adminRequired, adminController.deleteQuizQuestion);
  
  // Admin settings
  app.get(`${apiPrefix}/admin/settings`, authMiddleware.adminRequired, adminController.getSystemSettings);
  app.patch(`${apiPrefix}/admin/settings`, authMiddleware.adminRequired, adminController.updateSystemSettings);
  
  return httpServer;
}
