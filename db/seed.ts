import { db } from "./index";
import * as schema from "@shared/schema";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Add system settings if they don't exist
    const existingSettings = await db.query.systemSettings.findFirst();
    if (!existingSettings) {
      await db.insert(schema.systemSettings).values({
        telegramAuthEnabled: true,
        bnbRpcUrl: "https://bsc-dataseed.binance.org/",
        tokenName: "Lucky Mint Token",
        tokenSymbol: "LKMT",
        referralReward: 75,
      });
      console.log("System settings created.");
    }
    
    // Add admin user if it doesn't exist
    const adminUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("adminpassword", 10);
      await db.insert(schema.users).values({
        username: "admin",
        password: hashedPassword,
        referralCode: nanoid(8),
        isAdmin: true,
        lkmtBalance: 1000,
        claimableRewards: 0,
      });
      console.log("Admin user created.");
    }
    
    // Create spin wheel if it doesn't exist
    const existingWheel = await db.query.spinWheels.findFirst();
    if (!existingWheel) {
      const [spinWheel] = await db.insert(schema.spinWheels).values({
        segmentCount: 6,
        freeSpinsPerDay: 1,
        isActive: true,
      }).returning();
      
      // Add wheel segments
      await db.insert(schema.spinWheelSegments).values([
        {
          wheelId: spinWheel.id,
          position: 0,
          text: "100 $LKMT",
          reward: 100,
          color: "#FF9500",
        },
        {
          wheelId: spinWheel.id,
          position: 1,
          text: "50 $LKMT",
          reward: 50,
          color: "#5D3FD3",
        },
        {
          wheelId: spinWheel.id,
          position: 2,
          text: "25 $LKMT",
          reward: 25,
          color: "#00C4FF",
        },
        {
          wheelId: spinWheel.id,
          position: 3,
          text: "10 $LKMT",
          reward: 10,
          color: "#EF4444",
        },
        {
          wheelId: spinWheel.id,
          position: 4,
          text: "Try Again",
          reward: 0,
          color: "#22C55E",
        },
        {
          wheelId: spinWheel.id,
          position: 5,
          text: "75 $LKMT",
          reward: 75,
          color: "#F59E0B",
        },
      ]);
      console.log("Spin wheel and segments created.");
    }
    
    // Create quiz questions if they don't exist
    const existingQuestions = await db.query.quizQuestions.findFirst();
    if (!existingQuestions) {
      await db.insert(schema.quizQuestions).values([
        {
          question: "What does BNB stand for in the context of Binance's native token?",
          options: ['Binance Network Blockchain', 'Binance Coin', 'Blockchain Native Binary', 'Buy and Build'],
          correctAnswer: 1, // Index of "Binance Coin"
          reward: 25,
          timeLimit: 60, // 60 seconds
          isActive: true,
        },
        {
          question: "Which consensus mechanism does BNB Smart Chain use?",
          options: ['Proof of Work', 'Proof of Stake', 'Proof of Authority', 'Delegated Proof of Stake'],
          correctAnswer: 2, // Index of "Proof of Authority"
          reward: 25,
          timeLimit: 60,
          isActive: true,
        },
        {
          question: "What is a blockchain airdrop?",
          options: ['A new blockchain network launch', 'Free distribution of tokens to wallet addresses', 'A type of NFT', 'A blockchain security feature'],
          correctAnswer: 1, // Index of "Free distribution of tokens to wallet addresses"
          reward: 25,
          timeLimit: 45,
          isActive: true,
        },
        {
          question: "Which of these is NOT a feature of the BNB Smart Chain?",
          options: ['Cross-chain compatibility', 'Smart contracts', 'Proof of Work mining', 'Low transaction fees'],
          correctAnswer: 2, // Index of "Proof of Work mining"
          reward: 25,
          timeLimit: 45,
          isActive: true,
        },
        {
          question: "What programming language is primarily used for BNB Smart Chain smart contracts?",
          options: ['Python', 'Solidity', 'JavaScript', 'Rust'],
          correctAnswer: 1, // Index of "Solidity"
          reward: 25,
          timeLimit: 30,
          isActive: true,
        },
      ]);
      console.log("Quiz questions created.");
    }
    
    // Create sample tasks if they don't exist
    const existingTasks = await db.query.tasks.findFirst();
    if (!existingTasks) {
      await db.insert(schema.tasks).values([
        {
          title: "Join Telegram Group",
          description: "Join our official Telegram group and stay for at least 48 hours.",
          type: "telegram",
          reward: 50,
          requiredProof: "Telegram username",
          isActive: true,
        },
        {
          title: "Follow Twitter & Retweet",
          description: "Follow our Twitter account and retweet our pinned post.",
          type: "social",
          reward: 100,
          requiredProof: "Twitter username and tweet link",
          isActive: true,
        },
        {
          title: "Refer Friends",
          description: "Invite friends to join the airdrop. Earn 75 $LKMT per referral.",
          type: "referral",
          reward: 75,
          requiredProof: "Automatic verification",
          isActive: true,
        },
        {
          title: "Connect Wallet",
          description: "Connect your BNB wallet to the platform.",
          type: "custom",
          reward: 25,
          requiredProof: "Automatic verification",
          isActive: true,
        },
        {
          title: "Complete Quiz Game",
          description: "Answer at least 3 questions correctly in the quiz game.",
          type: "quiz",
          reward: 50,
          requiredProof: "Automatic verification",
          isActive: true,
        },
      ]);
      console.log("Sample tasks created.");
    }
    
    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

seed();
