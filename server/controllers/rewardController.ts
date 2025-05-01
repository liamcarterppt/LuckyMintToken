import { Request, Response } from 'express';
import { storage } from '../storage';
import { web3Service } from '../services/web3Service';

interface AuthRequest extends Request {
  user?: any;
}

const rewardController = {
  // Claim rewards
  claimRewards: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Check if user has a wallet connected
      if (!req.user.walletAddress) {
        return res.status(400).json({ message: 'Wallet must be connected to claim rewards' });
      }
      
      // Check if user has claimable rewards
      if (Number(req.user.claimableRewards) <= 0) {
        return res.status(400).json({ message: 'No claimable rewards available' });
      }
      
      // Create a reward transaction for the claim
      const reward = await storage.createRewardTransaction({
        userId: req.user.id,
        amount: req.user.claimableRewards,
        type: 'manual',
        status: 'pending',
      });
      
      // Reset user's claimable rewards
      await storage.updateUser(req.user.id, { claimableRewards: 0 });
      
      // Create activity log
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'claim',
        description: `Claimed ${req.user.claimableRewards} $LKMT tokens`,
        reward: Number(req.user.claimableRewards),
        status: 'pending',
        referenceId: reward.id,
      });
      
      return res.status(200).json({
        message: 'Rewards claim submitted',
        amount: Number(req.user.claimableRewards),
        status: 'pending',
        transactionId: reward.id,
      });
    } catch (error) {
      console.error('Claim rewards error:', error);
      return res.status(500).json({ message: 'Failed to claim rewards' });
    }
  },
  
  // Process pending rewards (internal method)
  processPendingRewards: async () => {
    try {
      // Get all pending reward transactions
      const pendingRewards = await storage.getPendingRewardTransactions();
      
      // Get system settings
      const settings = await storage.getSystemSettings();
      if (!settings || !settings.adminWalletAddress || !settings.rewardsContractAddress) {
        console.error('Missing system settings for reward processing');
        return;
      }
      
      // Process each pending reward
      for (const reward of pendingRewards) {
        try {
          // Get user
          const user = await storage.getUserById(reward.userId);
          if (!user || !user.walletAddress) {
            console.error(`User ${reward.userId} not found or has no wallet`);
            continue;
          }
          
          // Update reward status to processing
          await storage.updateRewardTransaction(reward.id, { status: 'processing' });
          
          // TODO: In a real implementation, this would use the web3Service to send tokens
          // For now, just simulate success
          // const txHash = await web3Service.sendTokens(
          //   privateKey, // Admin private key would be stored securely
          //   settings.rewardsContractAddress,
          //   user.walletAddress,
          //   reward.amount.toString()
          // );
          
          // Simulate a transaction hash
          const txHash = `0x${Array(64).fill(0).map(() => 
            Math.floor(Math.random() * 16).toString(16)).join('')}`;
          
          // Update reward with transaction hash and mark as completed
          await storage.updateRewardTransaction(reward.id, {
            status: 'completed',
            txHash,
          });
          
          // Create activity log
          await storage.createActivityLog({
            userId: user.id,
            type: 'claim',
            description: `Received ${reward.amount} $LKMT tokens to wallet`,
            reward: Number(reward.amount),
            status: 'completed',
            referenceId: reward.id,
          });
        } catch (error) {
          console.error(`Error processing reward ${reward.id}:`, error);
          
          // Mark reward as failed
          await storage.updateRewardTransaction(reward.id, { status: 'failed' });
          
          // Create activity log
          await storage.createActivityLog({
            userId: reward.userId,
            type: 'claim',
            description: `Failed to send ${reward.amount} $LKMT tokens to wallet`,
            reward: Number(reward.amount),
            status: 'failed',
            referenceId: reward.id,
          });
        }
      }
    } catch (error) {
      console.error('Process pending rewards error:', error);
    }
  },
};

export default rewardController;
