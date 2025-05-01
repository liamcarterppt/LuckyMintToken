import { Request, Response } from 'express';
import { storage } from '../storage';

interface AuthRequest extends Request {
  user?: any;
}

const gameController = {
  // Get active spin wheel configuration
  getSpinWheel: async (_req: Request, res: Response) => {
    try {
      const spinWheel = await storage.getActiveSpinWheel();
      
      if (!spinWheel) {
        return res.status(404).json({ message: 'No active spin wheel found' });
      }
      
      return res.status(200).json({ spinWheel });
    } catch (error) {
      console.error('Get spin wheel error:', error);
      return res.status(500).json({ message: 'Failed to get spin wheel' });
    }
  },
  
  // Get user's spin history
  getSpinHistory: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const spins = await storage.getUserSpins(req.user.id);
      
      // Get the active spin wheel settings
      const spinWheel = await storage.getActiveSpinWheel();
      if (!spinWheel) {
        return res.status(404).json({ message: 'No active spin wheel found' });
      }
      
      // Check how many spins the user has done today
      const spinsToday = await storage.getUserSpinsToday(req.user.id);
      const remaining = Math.max(0, spinWheel.freeSpinsPerDay - spinsToday.length);
      
      return res.status(200).json({
        spins,
        remaining,
        freeSpinsPerDay: spinWheel.freeSpinsPerDay,
      });
    } catch (error) {
      console.error('Get spin history error:', error);
      return res.status(500).json({ message: 'Failed to get spin history' });
    }
  },
  
  // Perform a spin
  performSpin: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Get the active spin wheel
      const spinWheel = await storage.getActiveSpinWheel();
      if (!spinWheel) {
        return res.status(404).json({ message: 'No active spin wheel found' });
      }
      
      // Check if user has any free spins remaining today
      const spinsToday = await storage.getUserSpinsToday(req.user.id);
      if (spinsToday.length >= spinWheel.freeSpinsPerDay) {
        return res.status(400).json({
          message: 'No free spins remaining today',
          remaining: 0,
        });
      }
      
      // Randomly select a segment
      const randomSegmentIndex = Math.floor(Math.random() * spinWheel.segments.length);
      const segment = spinWheel.segments[randomSegmentIndex];
      
      // Create user spin record
      const spin = await storage.createUserSpin({
        userId: req.user.id,
        wheelId: spinWheel.id,
        segmentId: segment.id,
        reward: segment.reward,
      });
      
      // Create reward transaction if there's a reward
      if (Number(segment.reward) > 0) {
        await storage.createRewardTransaction({
          userId: req.user.id,
          amount: segment.reward,
          type: 'spin',
          referenceId: spin.id,
          status: 'completed',
        });
        
        // Update user balance
        await storage.updateUserLkmtBalance(req.user.id, Number(segment.reward));
      }
      
      // Create activity log
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'spin',
        description: `Spin result: ${segment.text}`,
        reward: Number(segment.reward),
        status: 'completed',
        referenceId: spin.id,
      });
      
      return res.status(200).json({
        message: Number(segment.reward) > 0
          ? `Congratulations! You won ${segment.reward} $LKMT tokens!`
          : 'Better luck next time!',
        spin: {
          id: spin.id,
          userId: spin.userId,
          result: segment.id,
          reward: Number(segment.reward),
          createdAt: spin.createdAt,
        },
        remaining: spinWheel.freeSpinsPerDay - spinsToday.length - 1,
      });
    } catch (error) {
      console.error('Perform spin error:', error);
      return res.status(500).json({ message: 'Failed to perform spin' });
    }
  },
  
  // Get quiz questions
  getQuizQuestions: async (_req: Request, res: Response) => {
    try {
      const questions = await storage.getActiveQuizQuestions();
      
      // Map questions to include only necessary fields for the client
      const mappedQuestions = questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        reward: Number(q.reward),
        timeLimit: q.timeLimit,
      }));
      
      return res.status(200).json({ questions: mappedQuestions });
    } catch (error) {
      console.error('Get quiz questions error:', error);
      return res.status(500).json({ message: 'Failed to get quiz questions' });
    }
  },
  
  // Get user's quiz history
  getQuizHistory: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const answers = await storage.getUserQuizAnswers(req.user.id);
      
      return res.status(200).json({ answers });
    } catch (error) {
      console.error('Get quiz history error:', error);
      return res.status(500).json({ message: 'Failed to get quiz history' });
    }
  },
  
  // Submit quiz answer
  submitQuizAnswer: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { questionId, selectedOption, timeSpent } = req.body;
      
      if (
        questionId === undefined ||
        selectedOption === undefined ||
        timeSpent === undefined
      ) {
        return res.status(400).json({
          message: 'Question ID, selected option, and time spent are required',
        });
      }
      
      // Get the question
      const question = await storage.getQuizQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Check if question is active
      if (!question.isActive) {
        return res.status(400).json({ message: 'This question is no longer active' });
      }
      
      // Check if time limit was exceeded
      if (timeSpent > question.timeLimit) {
        // Create a timeout answer
        const answer = await storage.createUserQuizAnswer({
          userId: req.user.id,
          questionId,
          selectedOption: -1, // -1 indicates timeout
          isCorrect: false,
          timeSpent: question.timeLimit,
          reward: 0,
        });
        
        // Create activity log
        await storage.createActivityLog({
          userId: req.user.id,
          type: 'quiz',
          description: `Quiz answer timeout: ${question.question}`,
          reward: 0,
          status: 'completed',
          referenceId: answer.id,
        });
        
        return res.status(200).json({
          message: 'Time limit exceeded',
          answer: {
            id: answer.id,
            userId: answer.userId,
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent,
            reward: Number(answer.reward),
            createdAt: answer.createdAt,
          },
        });
      }
      
      // Determine if the answer is correct
      const isCorrect = selectedOption === question.correctAnswer;
      
      // Set reward based on correctness
      const reward = isCorrect ? question.reward : 0;
      
      // Create user answer record
      const answer = await storage.createUserQuizAnswer({
        userId: req.user.id,
        questionId,
        selectedOption,
        isCorrect,
        timeSpent,
        reward,
      });
      
      // If answer is correct, create reward transaction and update user balance
      if (isCorrect) {
        await storage.createRewardTransaction({
          userId: req.user.id,
          amount: reward,
          type: 'quiz',
          referenceId: answer.id,
          status: 'completed',
        });
        
        // Update user balance
        await storage.updateUserLkmtBalance(req.user.id, Number(reward));
      }
      
      // Create activity log
      await storage.createActivityLog({
        userId: req.user.id,
        type: 'quiz',
        description: `Quiz answer ${isCorrect ? 'correct' : 'wrong'}: ${question.question}`,
        reward: Number(reward),
        status: 'completed',
        referenceId: answer.id,
      });
      
      // Check if the "complete quiz" task should be marked as completed
      const correctAnswers = await storage.countCorrectQuizAnswers(req.user.id);
      if (correctAnswers >= 3) {
        const quizTask = (await storage.getAllTasks()).find(
          task => task.type === 'quiz' && task.title.toLowerCase().includes('quiz')
        );
        
        if (quizTask) {
          // Check if the user has already completed this task
          const existingUserTask = await storage.getUserTask(req.user.id, quizTask.id);
          
          if (existingUserTask && existingUserTask.status === 'pending') {
            // Update the task to completed
            await storage.updateUserTask(existingUserTask.id, {
              status: 'completed',
              completedAt: new Date(),
            });
            
            // Create reward transaction
            await storage.createRewardTransaction({
              userId: req.user.id,
              amount: quizTask.reward,
              type: 'task',
              referenceId: quizTask.id,
              status: 'completed',
            });
            
            // Update user balance
            await storage.updateUserLkmtBalance(req.user.id, Number(quizTask.reward));
            
            // Create activity log
            await storage.createActivityLog({
              userId: req.user.id,
              type: 'task',
              description: `Completed task: ${quizTask.title}`,
              reward: Number(quizTask.reward),
              status: 'completed',
              referenceId: quizTask.id,
            });
          }
        }
      }
      
      return res.status(200).json({
        message: isCorrect
          ? `Correct! You earned ${reward} $LKMT tokens.`
          : 'Incorrect answer',
        answer: {
          id: answer.id,
          userId: answer.userId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect: answer.isCorrect,
          timeSpent: answer.timeSpent,
          reward: Number(answer.reward),
          createdAt: answer.createdAt,
        },
      });
    } catch (error) {
      console.error('Submit quiz answer error:', error);
      return res.status(500).json({ message: 'Failed to submit quiz answer' });
    }
  },
};

export default gameController;
