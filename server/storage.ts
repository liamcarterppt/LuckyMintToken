import { db } from "@db";
import { and, eq, like, desc, gt, lt, isNull, ne, sql, count, sum, asc } from "drizzle-orm";
import * as schema from "@shared/schema";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

class StorageService {
  // User methods
  async getUserById(id: number) {
    return db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
  }
  
  async getUserByUsername(username: string) {
    return db.query.users.findFirst({
      where: eq(schema.users.username, username),
    });
  }
  
  async getUserByTelegramId(telegramId: string) {
    return db.query.users.findFirst({
      where: eq(schema.users.telegramId, telegramId),
    });
  }
  
  async getUserByWalletAddress(walletAddress: string) {
    return db.query.users.findFirst({
      where: eq(schema.users.walletAddress, walletAddress),
    });
  }
  
  async getUserByReferralCode(referralCode: string) {
    return db.query.users.findFirst({
      where: eq(schema.users.referralCode, referralCode),
    });
  }
  
  async createUser(userData: Omit<schema.InsertUser, "referralCode">) {
    const referralCode = nanoid(8);
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db.insert(schema.users).values({
      ...userData,
      password: hashedPassword,
      referralCode,
    }).returning();
    
    return user;
  }
  
  async updateUser(id: number, data: Partial<schema.User>) {
    const [updatedUser] = await db.update(schema.users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserLkmtBalance(id: number, amount: number) {
    const [updatedUser] = await db.update(schema.users)
      .set({
        lkmtBalance: sql`${schema.users.lkmtBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserClaimableRewards(id: number, amount: number) {
    const [updatedUser] = await db.update(schema.users)
      .set({
        claimableRewards: sql`${schema.users.claimableRewards} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async connectUserWallet(id: number, walletAddress: string) {
    const [updatedUser] = await db.update(schema.users)
      .set({
        walletAddress,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async connectUserTelegram(id: number, telegramData: {
    telegramId: string;
    telegramUsername?: string;
    telegramFirstName: string;
    telegramLastName?: string;
    telegramPhotoUrl?: string;
  }) {
    const [updatedUser] = await db.update(schema.users)
      .set({
        ...telegramData,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async disconnectUserTelegram(id: number) {
    const [updatedUser] = await db.update(schema.users)
      .set({
        telegramId: null,
        telegramUsername: null,
        telegramFirstName: null,
        telegramLastName: null,
        telegramPhotoUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserLastLogin(id: number) {
    await db.update(schema.users)
      .set({
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id));
  }
  
  async deleteUser(id: number) {
    await db.delete(schema.users)
      .where(eq(schema.users.id, id));
  }
  
  async getAllUsers(page: number, pageSize: number, search?: string) {
    const offset = (page - 1) * pageSize;
    
    let query = db.select().from(schema.users);
    
    if (search) {
      query = query.where(
        sql`${schema.users.username} ILIKE ${`%${search}%`} OR 
            ${schema.users.telegramUsername} ILIKE ${`%${search}%`} OR 
            ${schema.users.walletAddress} ILIKE ${`%${search}%`}`
      );
    }
    
    const users = await query
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(schema.users.createdAt));
    
    // Count total users matching the search
    const countQuery = db.select({ count: count() }).from(schema.users);
    
    if (search) {
      countQuery.where(
        sql`${schema.users.username} ILIKE ${`%${search}%`} OR 
            ${schema.users.telegramUsername} ILIKE ${`%${search}%`} OR 
            ${schema.users.walletAddress} ILIKE ${`%${search}%`}`
      );
    }
    
    const [{ count: total }] = await countQuery;
    
    return { users, total: Number(total) };
  }
  
  async getRecentUsers(limit: number = 5) {
    return db.select().from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(limit);
  }
  
  async countUsers() {
    const [{ count }] = await db.select({ count: count() }).from(schema.users);
    return Number(count);
  }
  
  async countWalletConnectedUsers() {
    const [{ count }] = await db.select({ count: count() })
      .from(schema.users)
      .where(sql`${schema.users.walletAddress} IS NOT NULL`);
    
    return Number(count);
  }
  
  async getUserReferrals(userId: number) {
    return db.select().from(schema.users)
      .where(eq(schema.users.referredBy, userId));
  }
  
  async countUserReferrals(userId: number) {
    const [{ count }] = await db.select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.referredBy, userId));
    
    return Number(count);
  }
  
  // Task methods
  async getAllTasks() {
    return db.select().from(schema.tasks)
      .where(eq(schema.tasks.isActive, true))
      .orderBy(desc(schema.tasks.createdAt));
  }
  
  async getTaskById(id: number) {
    return db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
    });
  }
  
  async createTask(taskData: schema.InsertTask) {
    const [task] = await db.insert(schema.tasks).values(taskData).returning();
    return task;
  }
  
  async updateTask(id: number, data: Partial<schema.Task>) {
    const [updatedTask] = await db.update(schema.tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.tasks.id, id))
      .returning();
    
    return updatedTask;
  }
  
  async deleteTask(id: number) {
    await db.delete(schema.tasks)
      .where(eq(schema.tasks.id, id));
  }
  
  async getUserTasks(userId: number) {
    return db.query.userTasks.findMany({
      where: eq(schema.userTasks.userId, userId),
      with: {
        task: true,
      },
    });
  }
  
  async getUserTask(userId: number, taskId: number) {
    return db.query.userTasks.findFirst({
      where: and(
        eq(schema.userTasks.userId, userId),
        eq(schema.userTasks.taskId, taskId)
      ),
    });
  }
  
  async createUserTask(userTaskData: schema.InsertUserTask) {
    const [userTask] = await db.insert(schema.userTasks).values(userTaskData).returning();
    return userTask;
  }
  
  async updateUserTask(id: number, data: Partial<schema.UserTask>) {
    const [updatedUserTask] = await db.update(schema.userTasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.userTasks.id, id))
      .returning();
    
    return updatedUserTask;
  }
  
  async getTaskCompletions(taskId: number, status?: string) {
    let query = db.query.userTasks.findMany({
      where: eq(schema.userTasks.taskId, taskId),
      with: {
        user: true,
      },
      orderBy: desc(schema.userTasks.createdAt),
    });
    
    if (status) {
      query = db.query.userTasks.findMany({
        where: and(
          eq(schema.userTasks.taskId, taskId),
          eq(schema.userTasks.status, status)
        ),
        with: {
          user: true,
        },
        orderBy: desc(schema.userTasks.createdAt),
      });
    }
    
    return query;
  }
  
  async countCompletedTasks(userId: number) {
    const [{ count }] = await db.select({ count: count() })
      .from(schema.userTasks)
      .where(
        and(
          eq(schema.userTasks.userId, userId),
          sql`${schema.userTasks.status} IN ('completed', 'verified')`
        )
      );
    
    return Number(count);
  }
  
  async countTotalTasks() {
    const [{ count }] = await db.select({ count: count() }).from(schema.tasks);
    return Number(count);
  }
  
  async countActiveTasks() {
    const [{ count }] = await db.select({ count: count() })
      .from(schema.tasks)
      .where(eq(schema.tasks.isActive, true));
    
    return Number(count);
  }
  
  async getTaskCompletionRate() {
    const [{ totalTasks }] = await db.select({
      totalTasks: count()
    }).from(schema.userTasks);
    
    const [{ completedTasks }] = await db.select({
      completedTasks: count()
    }).from(schema.userTasks)
    .where(sql`${schema.userTasks.status} IN ('completed', 'verified')`);
    
    if (Number(totalTasks) === 0) return 0;
    
    return (Number(completedTasks) / Number(totalTasks)) * 100;
  }
  
  // Spin wheel methods
  async getActiveSpinWheel() {
    return db.query.spinWheels.findFirst({
      where: eq(schema.spinWheels.isActive, true),
      with: {
        segments: {
          orderBy: asc(schema.spinWheelSegments.position),
        },
      },
    });
  }
  
  async updateSpinWheel(id: number, data: Partial<schema.SpinWheel>) {
    const [updatedWheel] = await db.update(schema.spinWheels)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.spinWheels.id, id))
      .returning();
    
    return updatedWheel;
  }
  
  async createSpinWheelSegment(segmentData: schema.InsertSpinWheelSegment) {
    const [segment] = await db.insert(schema.spinWheelSegments).values(segmentData).returning();
    return segment;
  }
  
  async updateSpinWheelSegment(id: number, data: Partial<schema.SpinWheelSegment>) {
    const [updatedSegment] = await db.update(schema.spinWheelSegments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.spinWheelSegments.id, id))
      .returning();
    
    return updatedSegment;
  }
  
  async deleteSpinWheelSegment(id: number) {
    await db.delete(schema.spinWheelSegments)
      .where(eq(schema.spinWheelSegments.id, id));
  }
  
  async getUserSpins(userId: number) {
    return db.query.userSpins.findMany({
      where: eq(schema.userSpins.userId, userId),
      with: {
        segment: true,
      },
      orderBy: desc(schema.userSpins.createdAt),
    });
  }
  
  async createUserSpin(spinData: schema.InsertUserSpin) {
    const [spin] = await db.insert(schema.userSpins).values(spinData).returning();
    return spin;
  }
  
  async getUserSpinsToday(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return db.select().from(schema.userSpins)
      .where(
        and(
          eq(schema.userSpins.userId, userId),
          gt(schema.userSpins.createdAt, today)
        )
      );
  }
  
  // Quiz methods
  async getActiveQuizQuestions() {
    return db.select().from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.isActive, true));
  }
  
  async getQuizQuestionById(id: number) {
    return db.query.quizQuestions.findFirst({
      where: eq(schema.quizQuestions.id, id),
    });
  }
  
  async createQuizQuestion(questionData: schema.InsertQuizQuestion) {
    const [question] = await db.insert(schema.quizQuestions).values(questionData).returning();
    return question;
  }
  
  async updateQuizQuestion(id: number, data: Partial<schema.QuizQuestion>) {
    const [updatedQuestion] = await db.update(schema.quizQuestions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.quizQuestions.id, id))
      .returning();
    
    return updatedQuestion;
  }
  
  async deleteQuizQuestion(id: number) {
    await db.delete(schema.quizQuestions)
      .where(eq(schema.quizQuestions.id, id));
  }
  
  async getUserQuizAnswers(userId: number) {
    return db.query.userQuizAnswers.findMany({
      where: eq(schema.userQuizAnswers.userId, userId),
      with: {
        question: true,
      },
      orderBy: desc(schema.userQuizAnswers.createdAt),
    });
  }
  
  async createUserQuizAnswer(answerData: schema.InsertUserQuizAnswer) {
    const [answer] = await db.insert(schema.userQuizAnswers).values(answerData).returning();
    return answer;
  }
  
  async countCorrectQuizAnswers(userId: number) {
    const [{ count }] = await db.select({ count: count() })
      .from(schema.userQuizAnswers)
      .where(
        and(
          eq(schema.userQuizAnswers.userId, userId),
          eq(schema.userQuizAnswers.isCorrect, true)
        )
      );
    
    return Number(count);
  }
  
  // Reward methods
  async createRewardTransaction(rewardData: schema.InsertRewardTransaction) {
    const [reward] = await db.insert(schema.rewardTransactions).values(rewardData).returning();
    return reward;
  }
  
  async updateRewardTransaction(id: number, data: Partial<schema.RewardTransaction>) {
    const [updatedReward] = await db.update(schema.rewardTransactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.rewardTransactions.id, id))
      .returning();
    
    return updatedReward;
  }
  
  async getUserRewardTransactions(userId: number) {
    return db.select().from(schema.rewardTransactions)
      .where(eq(schema.rewardTransactions.userId, userId))
      .orderBy(desc(schema.rewardTransactions.createdAt));
  }
  
  async getPendingRewardTransactions() {
    return db.select().from(schema.rewardTransactions)
      .where(eq(schema.rewardTransactions.status, 'pending'))
      .orderBy(desc(schema.rewardTransactions.createdAt));
  }
  
  async getTotalPendingRewards() {
    const [result] = await db.select({
      total: sum(schema.rewardTransactions.amount),
    })
    .from(schema.rewardTransactions)
    .where(eq(schema.rewardTransactions.status, 'pending'));
    
    return Number(result.total) || 0;
  }
  
  async getTotalDistributedRewards() {
    const [result] = await db.select({
      total: sum(schema.rewardTransactions.amount),
    })
    .from(schema.rewardTransactions)
    .where(eq(schema.rewardTransactions.status, 'completed'));
    
    return Number(result.total) || 0;
  }
  
  // Activity log methods
  async createActivityLog(logData: schema.InsertActivityLog) {
    const [log] = await db.insert(schema.activityLogs).values(logData).returning();
    return log;
  }
  
  async getUserActivityLogs(userId: number, type?: string) {
    let query = db.select().from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, userId))
      .orderBy(desc(schema.activityLogs.createdAt));
    
    if (type && type !== 'all') {
      query = db.select().from(schema.activityLogs)
        .where(
          and(
            eq(schema.activityLogs.userId, userId),
            eq(schema.activityLogs.type, type)
          )
        )
        .orderBy(desc(schema.activityLogs.createdAt));
    }
    
    return query;
  }
  
  async getRecentActivityLogs(limit: number = 10) {
    return db.query.activityLogs.findMany({
      with: {
        user: true,
      },
      orderBy: desc(schema.activityLogs.createdAt),
      limit,
    });
  }
  
  // System settings methods
  async getSystemSettings() {
    const settings = await db.query.systemSettings.findFirst();
    return settings;
  }
  
  async updateSystemSettings(data: Partial<schema.SystemSettings>) {
    // Get the current settings first
    const settings = await this.getSystemSettings();
    
    if (!settings) {
      // If no settings exist, create them
      const [newSettings] = await db.insert(schema.systemSettings).values({
        ...data,
        updatedAt: new Date(),
      }).returning();
      
      return newSettings;
    } else {
      // Update existing settings
      const [updatedSettings] = await db.update(schema.systemSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schema.systemSettings.id, settings.id))
        .returning();
      
      return updatedSettings;
    }
  }
  
  // Leaderboard methods
  async getLeaderboard(limit: number = 10, page: number = 1) {
    const offset = (page - 1) * limit;
    
    // Get users with ranks
    const users = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      telegramUsername: schema.users.telegramUsername,
      walletAddress: schema.users.walletAddress,
      lkmtBalance: schema.users.lkmtBalance,
      isVerified: sql<boolean>`CASE WHEN ${schema.users.walletAddress} IS NOT NULL THEN true ELSE false END`,
    })
    .from(schema.users)
    .where(ne(schema.users.isAdmin, true))
    .orderBy(desc(schema.users.lkmtBalance))
    .limit(limit)
    .offset(offset);
    
    // Count total number of non-admin users
    const [{ count: total }] = await db.select({ count: count() })
      .from(schema.users)
      .where(ne(schema.users.isAdmin, true));
    
    // Get tasks completed for each user
    const userIds = users.map(user => user.id);
    const userTaskCounts = await Promise.all(
      userIds.map(async userId => {
        const completedTasks = await this.countCompletedTasks(userId);
        const totalTasks = await this.countTotalTasks();
        return { userId, completedTasks, totalTasks };
      })
    );
    
    // Map ranks to users
    const entries = users.map((user, index) => {
      const taskCount = userTaskCounts.find(count => count.userId === user.id);
      return {
        rank: index + 1 + offset,
        userId: user.id,
        username: user.username,
        telegramUsername: user.telegramUsername,
        walletAddress: user.walletAddress,
        tasksCompleted: taskCount?.completedTasks || 0,
        totalTasks: taskCount?.totalTasks || 0,
        lkmtEarned: Number(user.lkmtBalance),
        isVerified: user.isVerified,
      };
    });
    
    return { entries, total: Number(total) };
  }
  
  // Stats methods
  async getUserGrowthByWeek() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const [{ count: currentCount }] = await db.select({ count: count() })
      .from(schema.users);
    
    const [{ count: previousCount }] = await db.select({ count: count() })
      .from(schema.users)
      .where(lt(schema.users.createdAt, oneWeekAgo));
    
    const currentUsers = Number(currentCount);
    const previousUsers = Number(previousCount);
    
    if (previousUsers === 0) return 100; // If there were no users before, it's 100% growth
    
    return ((currentUsers - previousUsers) / previousUsers) * 100;
  }
  
  async getStatsOverTime(days: number = 30) {
    const result = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count users registered on this day
      const [{ count: usersCount }] = await db.select({ count: count() })
        .from(schema.users)
        .where(
          and(
            gt(schema.users.createdAt, date),
            lt(schema.users.createdAt, nextDate)
          )
        );
      
      // Count tokens distributed on this day
      const [{ total }] = await db.select({
        total: sum(schema.rewardTransactions.amount),
      })
      .from(schema.rewardTransactions)
      .where(
        and(
          gt(schema.rewardTransactions.createdAt, date),
          lt(schema.rewardTransactions.createdAt, nextDate),
          eq(schema.rewardTransactions.status, 'completed')
        )
      );
      
      result.unshift({
        date: date.toISOString().split('T')[0],
        users: Number(usersCount),
        tokens: Number(total) || 0,
      });
    }
    
    return result;
  }
  
  async getUserStats(userId: number) {
    // Get user tasks
    const completedTasks = await this.countCompletedTasks(userId);
    const totalTasks = await this.countTotalTasks();
    
    // Get referrals count
    const referralsCount = await this.countUserReferrals(userId);
    
    // Get earnings by type
    const rewardTransactions = await this.getUserRewardTransactions(userId);
    
    const taskEarnings = rewardTransactions
      .filter(tx => tx.type === 'task')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    const spinEarnings = rewardTransactions
      .filter(tx => tx.type === 'spin')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    const quizEarnings = rewardTransactions
      .filter(tx => tx.type === 'quiz')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    const referralEarnings = rewardTransactions
      .filter(tx => tx.type === 'referral')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    // Get claim history
    const claimHistory = rewardTransactions
      .filter(tx => tx.type === 'manual')
      .map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        status: tx.status,
        timestamp: tx.createdAt,
        txHash: tx.txHash,
      }));
    
    return {
      completedTasks,
      totalTasks,
      referralsCount,
      taskEarnings,
      spinEarnings,
      quizEarnings,
      referralEarnings,
      claimHistory,
    };
  }
  
  async getLeaderboardStats() {
    // Get total participants
    const totalParticipants = await this.countUsers();
    
    // Get total distributed tokens
    const totalDistributed = await this.getTotalDistributedRewards();
    
    // Get total tasks completed
    const [{ count: totalTasksCompleted }] = await db.select({ count: count() })
      .from(schema.userTasks)
      .where(sql`${schema.userTasks.status} IN ('completed', 'verified')`);
    
    // Get top earner
    const topEarner = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      amount: schema.users.lkmtBalance,
    })
    .from(schema.users)
    .where(ne(schema.users.isAdmin, true))
    .orderBy(desc(schema.users.lkmtBalance))
    .limit(1);
    
    return {
      totalParticipants,
      totalDistributed,
      totalTasksCompleted: Number(totalTasksCompleted),
      topEarner: topEarner.length > 0 ? {
        username: topEarner[0].username,
        amount: Number(topEarner[0].amount),
      } : null,
    };
  }
}

export const storage = new StorageService();
