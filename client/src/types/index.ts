// User types
export interface User {
  id: number;
  username: string;
  telegramId?: string;
  walletAddress?: string;
  lkmtBalance: number;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Task types
export interface Task {
  id: number;
  title: string;
  description: string;
  reward: number;
  type: TaskType;
  requiredProof: string;
  isActive: boolean;
}

export type TaskType = 'social' | 'telegram' | 'referral' | 'quiz' | 'custom';

export interface UserTask {
  id: number;
  userId: number;
  taskId: number;
  status: TaskStatus;
  proof?: string;
  completedAt?: string;
}

export type TaskStatus = 'pending' | 'completed' | 'verified' | 'rejected';

// Game types
export interface SpinWheel {
  id: number;
  segmentCount: number;
  segments: SpinWheelSegment[];
  freeSpinsPerDay: number;
}

export interface SpinWheelSegment {
  id: number;
  position: number;
  text: string;
  reward: number;
  color: string;
}

export interface UserSpin {
  id: number;
  userId: number;
  result: number;
  reward: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  reward: number;
  timeLimit: number;
}

export interface UserQuizAnswer {
  id: number;
  userId: number;
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent: number;
  reward: number;
  createdAt: string;
}

// Reward types
export interface RewardTransaction {
  id: number;
  userId: number;
  amount: number;
  type: RewardType;
  referenceId?: number;
  status: RewardStatus;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export type RewardType = 'task' | 'spin' | 'quiz' | 'referral' | 'manual';
export type RewardStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Admin types
export interface SystemSettings {
  id: number;
  telegramAuthEnabled: boolean;
  telegramBotToken?: string;
  bnbRpcUrl: string;
  rewardsContractAddress?: string;
  tokenName: string;
  tokenSymbol: string;
  adminWalletAddress: string;
  updatedAt: string;
}

// Web3 types
export interface Web3State {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: any | null;
  connecting: boolean;
  error: string | null;
}

// Telegram types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}
