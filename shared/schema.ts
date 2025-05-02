import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  telegramId: text("telegram_id").unique(),
  telegramUsername: text("telegram_username"),
  telegramFirstName: text("telegram_first_name"),
  telegramLastName: text("telegram_last_name"),
  telegramPhotoUrl: text("telegram_photo_url"),
  walletAddress: text("wallet_address").unique(),
  lkmtBalance: decimal("lkmt_balance", { precision: 15, scale: 3 }).default("0").notNull(),
  claimableRewards: decimal("claimable_rewards", { precision: 15, scale: 3 }).default("0").notNull(),
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by").references(() => users.id),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  level: integer("level").default(1).notNull(),
  experience: integer("experience").default(0).notNull(),
  consecutiveLogins: integer("consecutive_logins").default(0).notNull(),
  lastLoginDate: timestamp("last_login_date"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // social, telegram, referral, quiz, custom
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  requiredProof: text("required_proof"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User tasks table (for tracking user task completion)
export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  proof: text("proof"),
  status: text("status").notNull(), // pending, completed, verified, rejected
  completedAt: timestamp("completed_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Spin wheel configuration
export const spinWheels = pgTable("spin_wheels", {
  id: serial("id").primaryKey(),
  segmentCount: integer("segment_count").notNull(),
  freeSpinsPerDay: integer("free_spins_per_day").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Spin wheel segments
export const spinWheelSegments = pgTable("spin_wheel_segments", {
  id: serial("id").primaryKey(),
  wheelId: integer("wheel_id").notNull().references(() => spinWheels.id),
  position: integer("position").notNull(),
  text: text("text").notNull(),
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User spins (history of user's spin wheel attempts)
export const userSpins = pgTable("user_spins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  wheelId: integer("wheel_id").notNull().references(() => spinWheels.id),
  segmentId: integer("segment_id").notNull().references(() => spinWheelSegments.id),
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz questions
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of string options
  correctAnswer: integer("correct_answer").notNull(), // Index of the correct option
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  timeLimit: integer("time_limit").notNull(), // In seconds
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User quiz answers (history of user's quiz attempts)
export const userQuizAnswers = pgTable("user_quiz_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => quizQuestions.id),
  selectedOption: integer("selected_option").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  timeSpent: integer("time_spent").notNull(), // In seconds
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reward transactions
export const rewardTransactions = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 15, scale: 3 }).notNull(),
  type: text("type").notNull(), // task, spin, quiz, referral, manual
  referenceId: integer("reference_id"), // ID of the related record (task ID, spin ID, etc.)
  status: text("status").notNull(), // pending, processing, completed, failed
  txHash: text("tx_hash"), // Transaction hash on blockchain (if applicable)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System settings
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  telegramAuthEnabled: boolean("telegram_auth_enabled").default(true).notNull(),
  telegramBotToken: text("telegram_bot_token"),
  bnbRpcUrl: text("bnb_rpc_url").default("https://bsc-dataseed.binance.org/").notNull(),
  rewardsContractAddress: text("rewards_contract_address"),
  tokenName: text("token_name").default("Lucky Mint Token").notNull(),
  tokenSymbol: text("token_symbol").default("LKMT").notNull(),
  adminWalletAddress: text("admin_wallet_address"),
  referralReward: decimal("referral_reward", { precision: 15, scale: 3 }).default("75").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Achievements
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // login, task, spin, quiz, referral, level
  requirement: integer("requirement").notNull(), // Number of actions required
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  icon: text("icon"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  isRewarded: boolean("is_rewarded").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily login rewards
export const dailyRewards = pgTable("daily_rewards", {
  id: serial("id").primaryKey(),
  day: integer("day").notNull(), // Day in streak (1-30)
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User daily logins
export const userDailyLogins = pgTable("user_daily_logins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  loginDate: timestamp("login_date").defaultNow().notNull(),
  day: integer("day").notNull(), // Current day in streak
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  isRewarded: boolean("is_rewarded").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prediction game
export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  description: text("description"),
  options: jsonb("options").notNull(), // Array of options
  correctOption: integer("correct_option"), // Set after the event happens
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  resolveDate: timestamp("resolve_date"),
  status: text("status").notNull(), // active, locked, resolved, cancelled
  reward: decimal("reward", { precision: 15, scale: 3 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User predictions
export const userPredictions = pgTable("user_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  predictionId: integer("prediction_id").notNull().references(() => predictions.id),
  selectedOption: integer("selected_option").notNull(),
  isCorrect: boolean("is_correct"),
  reward: decimal("reward", { precision: 15, scale: 3 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity log
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // task, spin, quiz, referral, claim, security_warning, login, achievement, prediction
  description: text("description").notNull(),
  reward: decimal("reward", { precision: 15, scale: 3 }),
  status: text("status").notNull(),
  referenceId: integer("reference_id"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  tasks: many(userTasks),
  spins: many(userSpins),
  quizAnswers: many(userQuizAnswers),
  rewardTransactions: many(rewardTransactions),
  activityLogs: many(activityLogs),
  achievements: many(userAchievements),
  dailyLogins: many(userDailyLogins),
  predictions: many(userPredictions),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ many }) => ({
  userTasks: many(userTasks),
}));

export const userTasksRelations = relations(userTasks, ({ one }) => ({
  user: one(users, {
    fields: [userTasks.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [userTasks.taskId],
    references: [tasks.id],
  }),
}));

export const spinWheelsRelations = relations(spinWheels, ({ many }) => ({
  segments: many(spinWheelSegments),
  spins: many(userSpins),
}));

export const spinWheelSegmentsRelations = relations(spinWheelSegments, ({ one, many }) => ({
  wheel: one(spinWheels, {
    fields: [spinWheelSegments.wheelId],
    references: [spinWheels.id],
  }),
  spins: many(userSpins),
}));

export const userSpinsRelations = relations(userSpins, ({ one }) => ({
  user: one(users, {
    fields: [userSpins.userId],
    references: [users.id],
  }),
  wheel: one(spinWheels, {
    fields: [userSpins.wheelId],
    references: [spinWheels.id],
  }),
  segment: one(spinWheelSegments, {
    fields: [userSpins.segmentId],
    references: [spinWheelSegments.id],
  }),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ many }) => ({
  answers: many(userQuizAnswers),
}));

export const userQuizAnswersRelations = relations(userQuizAnswers, ({ one }) => ({
  user: one(users, {
    fields: [userQuizAnswers.userId],
    references: [users.id],
  }),
  question: one(quizQuestions, {
    fields: [userQuizAnswers.questionId],
    references: [quizQuestions.id],
  }),
}));

export const rewardTransactionsRelations = relations(rewardTransactions, ({ one }) => ({
  user: one(users, {
    fields: [rewardTransactions.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertTaskSchema = createInsertSchema(tasks, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  type: (schema) => schema.refine(val => ['social', 'telegram', 'referral', 'quiz', 'custom'].includes(val), 
    "Type must be one of: social, telegram, referral, quiz, custom"),
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const insertUserTaskSchema = createInsertSchema(userTasks, {
  status: (schema) => schema.refine((val: string) => ['pending', 'completed', 'verified', 'rejected'].includes(val), 
    "Status must be one of: pending, completed, verified, rejected"),
});
export type InsertUserTask = z.infer<typeof insertUserTaskSchema>;
export type UserTask = typeof userTasks.$inferSelect;

export const insertSpinWheelSchema = createInsertSchema(spinWheels);
export type InsertSpinWheel = z.infer<typeof insertSpinWheelSchema>;
export type SpinWheel = typeof spinWheels.$inferSelect;

export const insertSpinWheelSegmentSchema = createInsertSchema(spinWheelSegments);
export type InsertSpinWheelSegment = z.infer<typeof insertSpinWheelSegmentSchema>;
export type SpinWheelSegment = typeof spinWheelSegments.$inferSelect;

export const insertUserSpinSchema = createInsertSchema(userSpins);
export type InsertUserSpin = z.infer<typeof insertUserSpinSchema>;
export type UserSpin = typeof userSpins.$inferSelect;

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions);
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

export const insertUserQuizAnswerSchema = createInsertSchema(userQuizAnswers);
export type InsertUserQuizAnswer = z.infer<typeof insertUserQuizAnswerSchema>;
export type UserQuizAnswer = typeof userQuizAnswers.$inferSelect;

export const insertRewardTransactionSchema = createInsertSchema(rewardTransactions, {
  type: (schema) => schema.refine((val: string) => ['task', 'spin', 'quiz', 'referral', 'manual'].includes(val),
    "Type must be one of: task, spin, quiz, referral, manual"),
  status: (schema) => schema.refine((val: string) => ['pending', 'processing', 'completed', 'failed'].includes(val),
    "Status must be one of: pending, processing, completed, failed"),
});
export type InsertRewardTransaction = z.infer<typeof insertRewardTransactionSchema>;
export type RewardTransaction = typeof rewardTransactions.$inferSelect;

export const insertSystemSettingsSchema = createInsertSchema(systemSettings);
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;

export const insertActivityLogSchema = createInsertSchema(activityLogs, {
  type: (schema) => schema.refine((val: string) => ['task', 'spin', 'quiz', 'referral', 'claim', 'security_warning'].includes(val),
    "Type must be one of: task, spin, quiz, referral, claim, security_warning"),
});
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
