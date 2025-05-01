import { Request, Response } from 'express';
import { storage } from '../storage';

interface AuthRequest extends Request {
  user?: any;
}

const taskController = {
  // Get all active tasks
  getAllTasks: async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getAllTasks();
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Get tasks error:', error);
      return res.status(500).json({ message: 'Failed to get tasks' });
    }
  },
  
  // Complete a task
  completeTask: async (req: AuthRequest, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const { proof } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Get the task
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Check if task is active
      if (!task.isActive) {
        return res.status(400).json({ message: 'This task is no longer active' });
      }
      
      // Check if user has already completed this task
      const existingUserTask = await storage.getUserTask(req.user.id, taskId);
      if (existingUserTask) {
        return res.status(400).json({
          message: 'Task already completed',
          status: existingUserTask.status,
        });
      }
      
      // Handle task completion based on task type
      let taskStatus = 'completed';
      let requiresVerification = false;
      
      switch (task.type) {
        case 'social':
        case 'telegram':
          // Social and Telegram tasks require proof and admin verification
          if (task.requiredProof && !proof) {
            return res.status(400).json({ message: 'Proof is required for this task' });
          }
          taskStatus = 'pending';
          requiresVerification = true;
          break;
        
        case 'referral':
          // Referral tasks require verification when referrals sign up
          taskStatus = 'pending';
          requiresVerification = true;
          break;
        
        case 'quiz':
          // Quiz tasks are verified through quiz game play
          taskStatus = 'pending';
          requiresVerification = true;
          break;
        
        case 'custom':
          // Custom tasks may or may not require verification
          if (task.requiredProof && !proof) {
            return res.status(400).json({ message: 'Proof is required for this task' });
          }
          if (task.requiredProof) {
            taskStatus = 'pending';
            requiresVerification = true;
          }
          break;
      }
      
      // Create user task entry
      const userTask = await storage.createUserTask({
        userId: req.user.id,
        taskId,
        proof: proof || undefined,
        status: taskStatus,
        completedAt: new Date(),
      });
      
      // If task doesn't require verification, add reward immediately
      if (!requiresVerification) {
        // Create reward transaction
        await storage.createRewardTransaction({
          userId: req.user.id,
          amount: task.reward,
          type: 'task',
          referenceId: taskId,
          status: 'completed',
        });
        
        // Update user balance
        await storage.updateUserLkmtBalance(req.user.id, Number(task.reward));
        
        // Create activity log
        await storage.createActivityLog({
          userId: req.user.id,
          type: 'task',
          description: `Completed task: ${task.title}`,
          reward: Number(task.reward),
          status: 'completed',
          referenceId: taskId,
        });
      } else {
        // Create activity log for pending task
        await storage.createActivityLog({
          userId: req.user.id,
          type: 'task',
          description: `Submitted task: ${task.title}`,
          status: 'pending',
          referenceId: taskId,
        });
      }
      
      return res.status(200).json({
        message: requiresVerification
          ? 'Task submitted and awaiting verification'
          : 'Task completed successfully',
        reward: requiresVerification ? 0 : Number(task.reward),
        status: taskStatus,
        userTask,
      });
    } catch (error) {
      console.error('Complete task error:', error);
      return res.status(500).json({ message: 'Failed to complete task' });
    }
  },
};

export default taskController;
