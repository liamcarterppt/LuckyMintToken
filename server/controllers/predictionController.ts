import { Request, Response } from 'express';
import { storage } from '../storage';

interface AuthRequest extends Request {
  user?: any;
}

const predictionController = {
  // Get active predictions
  getActivePredictions: async (_req: Request, res: Response) => {
    try {
      const predictions = await storage.getActivePredictions();
      
      // Remove correctOption from active predictions
      const safeData = predictions.map(prediction => ({
        ...prediction,
        correctOption: undefined
      }));
      
      return res.status(200).json(safeData);
    } catch (error) {
      console.error('Error getting active predictions:', error);
      return res.status(500).json({ message: 'Failed to get active predictions' });
    }
  },
  
  // Get historical predictions
  getPredictionHistory: async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      let predictions;
      
      if (status === 'resolved') {
        // Get only resolved predictions
        predictions = await storage.getPredictions();
        predictions = predictions.filter(p => p.status === 'resolved');
      } else if (status === 'all') {
        // Get all predictions
        predictions = await storage.getPredictions();
      } else {
        // Default to active predictions
        predictions = await storage.getActivePredictions();
      }
      
      return res.status(200).json(predictions);
    } catch (error) {
      console.error('Error getting prediction history:', error);
      return res.status(500).json({ message: 'Failed to get prediction history' });
    }
  },
  
  // Submit a prediction
  submitPrediction: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const { predictionId, selectedOption } = req.body;
      
      if (selectedOption === undefined || predictionId === undefined) {
        return res.status(400).json({ message: 'Prediction ID and selected option are required' });
      }
      
      // Get prediction
      const prediction = await storage.getPredictionById(predictionId);
      if (!prediction) {
        return res.status(404).json({ message: 'Prediction not found' });
      }
      
      // Check if prediction is still active
      if (prediction.status !== 'active') {
        return res.status(400).json({ message: 'This prediction is no longer active' });
      }
      
      // Check if end date has passed
      const now = new Date();
      const endDate = new Date(prediction.endDate);
      if (now > endDate) {
        return res.status(400).json({ message: 'The prediction period has ended' });
      }
      
      // Check if selected option is valid
      const options = prediction.options as string[];
      if (selectedOption < 0 || selectedOption >= options.length) {
        return res.status(400).json({ message: 'Invalid option selected' });
      }
      
      // Check if user has already submitted for this prediction
      const existingPrediction = await storage.getUserPrediction(userId, predictionId);
      if (existingPrediction) {
        return res.status(400).json({ message: 'You have already submitted a prediction for this event' });
      }
      
      // Create user prediction
      const userPrediction = await storage.createUserPrediction({
        userId,
        predictionId,
        selectedOption,
      });
      
      // Create activity log
      await storage.createActivityLog({
        userId,
        type: 'prediction',
        description: `Submitted prediction for: ${prediction.question}`,
        status: 'pending',
        referenceId: userPrediction.id,
      });
      
      // Award experience points for participation
      await storage.updateUserExperience(userId, 5); // 5 XP for submitting a prediction
      
      return res.status(201).json({
        success: true,
        prediction: {
          id: userPrediction.id,
          question: prediction.question,
          selectedOption,
          optionText: options[selectedOption],
        }
      });
    } catch (error) {
      console.error('Error submitting prediction:', error);
      return res.status(500).json({ message: 'Failed to submit prediction' });
    }
  },
  
  // Get user's predictions
  getUserPredictions: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const userPredictions = await storage.getUserPredictions(userId);
      
      // Format for client
      const formattedPredictions = userPredictions.map(up => {
        const options = up.prediction.options as string[];
        return {
          id: up.id,
          predictionId: up.predictionId,
          question: up.prediction.question,
          selectedOption: up.selectedOption,
          optionText: options[up.selectedOption],
          isCorrect: up.isCorrect,
          reward: up.reward ? Number(up.reward) : null,
          status: up.prediction.status,
          createdAt: up.createdAt,
        };
      });
      
      // Get stats
      const totalPredictions = formattedPredictions.length;
      const correctPredictions = formattedPredictions.filter(p => p.isCorrect === true).length;
      const pendingPredictions = formattedPredictions.filter(p => p.prediction?.status !== 'resolved').length;
      const totalEarned = formattedPredictions
        .filter(p => p.reward)
        .reduce((sum, p) => sum + Number(p.reward || 0), 0);
      
      return res.status(200).json({
        predictions: formattedPredictions,
        stats: {
          total: totalPredictions,
          correct: correctPredictions,
          pending: pendingPredictions,
          accuracy: totalPredictions > 0 ? (correctPredictions / (totalPredictions - pendingPredictions)) * 100 : 0,
          earned: totalEarned,
        }
      });
    } catch (error) {
      console.error('Error getting user predictions:', error);
      return res.status(500).json({ message: 'Failed to get user predictions' });
    }
  },
  
  // Admin endpoints for managing predictions
  createPrediction: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { question, description, options, startDate, endDate, reward } = req.body;
      
      if (!question || !options || !startDate || !endDate || !reward) {
        return res.status(400).json({ 
          message: 'Question, options, startDate, endDate, and reward are required' 
        });
      }
      
      // Validate dates
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      
      // Create prediction
      const newPrediction = await storage.createPrediction({
        question,
        description,
        options,
        startDate: start,
        endDate: end,
        status: start <= now ? 'active' : 'pending',
        reward,
        isActive: true,
      });
      
      // Broadcast update to all connected clients
      if ((global as any).broadcastPredictionUpdate) {
        await (global as any).broadcastPredictionUpdate();
      }
      
      return res.status(201).json(newPrediction);
    } catch (error) {
      console.error('Error creating prediction:', error);
      return res.status(500).json({ message: 'Failed to create prediction' });
    }
  },
  
  updatePrediction: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id } = req.params;
      const { question, description, status, isActive } = req.body;
      
      // Get prediction
      const prediction = await storage.getPredictionById(Number(id));
      if (!prediction) {
        return res.status(404).json({ message: 'Prediction not found' });
      }
      
      // Only allow updating certain fields if the prediction is not yet locked or resolved
      if (prediction.status === 'active' || prediction.status === 'pending') {
        const updatedPrediction = await storage.updatePrediction(Number(id), {
          question: question !== undefined ? question : undefined,
          description: description !== undefined ? description : undefined,
          status: status !== undefined ? status : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        });
        
        // Broadcast update to all connected clients
        if ((global as any).broadcastPredictionUpdate) {
          await (global as any).broadcastPredictionUpdate();
        }
        
        return res.status(200).json(updatedPrediction);
      } else {
        // For locked or resolved predictions, only allow updating isActive
        const updatedPrediction = await storage.updatePrediction(Number(id), {
          isActive: isActive !== undefined ? isActive : undefined,
        });
        
        return res.status(200).json(updatedPrediction);
      }
    } catch (error) {
      console.error('Error updating prediction:', error);
      return res.status(500).json({ message: 'Failed to update prediction' });
    }
  },
  
  // Resolve a prediction
  resolvePrediction: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id } = req.params;
      const { correctOption } = req.body;
      
      if (correctOption === undefined) {
        return res.status(400).json({ message: 'Correct option is required' });
      }
      
      // Get prediction
      const prediction = await storage.getPredictionById(Number(id));
      if (!prediction) {
        return res.status(404).json({ message: 'Prediction not found' });
      }
      
      // Check if prediction is already resolved
      if (prediction.status === 'resolved') {
        return res.status(400).json({ message: 'This prediction is already resolved' });
      }
      
      // Check if the option is valid
      const options = prediction.options as string[];
      if (correctOption < 0 || correctOption >= options.length) {
        return res.status(400).json({ message: 'Invalid correct option' });
      }
      
      // Resolve the prediction
      const resolvedPrediction = await storage.resolvePrediction(Number(id), correctOption);
      
      // Update user predictions and award rewards
      const updatedCount = await storage.updateUserPredictionResults(Number(id), correctOption);
      
      // Broadcast update to all connected clients
      if ((global as any).broadcastPredictionUpdate) {
        await (global as any).broadcastPredictionUpdate();
      }
      
      return res.status(200).json({
        success: true,
        prediction: resolvedPrediction,
        correctPredictions: updatedCount,
      });
    } catch (error) {
      console.error('Error resolving prediction:', error);
      return res.status(500).json({ message: 'Failed to resolve prediction' });
    }
  },
  
  // Cancel a prediction
  cancelPrediction: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: 'Admin privileges required' });
      }
      
      const { id } = req.params;
      
      // Get prediction
      const prediction = await storage.getPredictionById(Number(id));
      if (!prediction) {
        return res.status(404).json({ message: 'Prediction not found' });
      }
      
      // Check if prediction is already resolved
      if (prediction.status === 'resolved') {
        return res.status(400).json({ message: 'Cannot cancel a resolved prediction' });
      }
      
      // Cancel the prediction
      const cancelledPrediction = await storage.updatePrediction(Number(id), {
        status: 'cancelled',
        updatedAt: new Date(),
      });
      
      // Broadcast update to all connected clients
      if ((global as any).broadcastPredictionUpdate) {
        await (global as any).broadcastPredictionUpdate();
      }
      
      return res.status(200).json({
        success: true,
        prediction: cancelledPrediction,
      });
    } catch (error) {
      console.error('Error cancelling prediction:', error);
      return res.status(500).json({ message: 'Failed to cancel prediction' });
    }
  }
};

export default predictionController;