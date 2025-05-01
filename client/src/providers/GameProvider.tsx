import React, { createContext, useState, useContext, useEffect } from 'react';
import { SpinWheel, QuizQuestion, UserSpin, UserQuizAnswer } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface GameContextProps {
  // Spin wheel
  spinWheel: SpinWheel | null;
  userSpins: UserSpin[];
  dailySpinsRemaining: number;
  isSpinning: boolean;
  loadSpinWheel: () => Promise<void>;
  performSpin: () => Promise<UserSpin | null>;
  
  // Quiz
  quizQuestions: QuizQuestion[];
  currentQuizQuestion: QuizQuestion | null;
  userQuizAnswers: UserQuizAnswer[];
  isQuizLoading: boolean;
  quizTimeRemaining: number;
  loadQuizQuestions: () => Promise<void>;
  submitQuizAnswer: (questionId: number, selectedOption: number) => Promise<boolean>;
  nextQuizQuestion: () => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Spin wheel state
  const [spinWheel, setSpinWheel] = useState<SpinWheel | null>(null);
  const [userSpins, setUserSpins] = useState<UserSpin[]>([]);
  const [dailySpinsRemaining, setDailySpinsRemaining] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [userQuizAnswers, setUserQuizAnswers] = useState<UserQuizAnswer[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState<boolean>(false);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState<number>(0);
  const [quizTimerId, setQuizTimerId] = useState<number | null>(null);
  
  const { toast } = useToast();

  // Load spin wheel configuration and user's spin history
  const loadSpinWheel = async () => {
    try {
      // Fetch spin wheel configuration
      const wheelResponse = await apiRequest('GET', '/api/games/spinwheel', undefined);
      const wheelData = await wheelResponse.json();
      setSpinWheel(wheelData.spinWheel);
      
      // Fetch user's spin history
      const spinsResponse = await apiRequest('GET', '/api/games/spinwheel/history', undefined);
      const spinsData = await spinsResponse.json();
      setUserSpins(spinsData.spins);
      setDailySpinsRemaining(spinsData.remaining);
    } catch (error) {
      console.error('Error loading spin wheel:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load spin wheel game data",
      });
    }
  };

  // Perform a spin
  const performSpin = async (): Promise<UserSpin | null> => {
    if (isSpinning || dailySpinsRemaining <= 0) {
      return null;
    }
    
    setIsSpinning(true);
    
    try {
      const response = await apiRequest('POST', '/api/games/spinwheel/spin', undefined);
      const data = await response.json();
      
      // Update state with new spin result
      setUserSpins((prev) => [data.spin, ...prev]);
      setDailySpinsRemaining((prev) => prev - 1);
      
      // Invalidate queries related to user balance
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      
      return data.spin;
    } catch (error) {
      console.error('Error performing spin:', error);
      toast({
        variant: "destructive",
        title: "Spin Failed",
        description: "An error occurred while spinning the wheel",
      });
      return null;
    } finally {
      setIsSpinning(false);
    }
  };

  // Load quiz questions
  const loadQuizQuestions = async () => {
    setIsQuizLoading(true);
    
    try {
      const response = await apiRequest('GET', '/api/games/quiz/questions', undefined);
      const data = await response.json();
      
      setQuizQuestions(data.questions);
      setCurrentQuizIndex(0);
      
      // Initialize timer for the first question if there are questions
      if (data.questions.length > 0) {
        startQuizTimer(data.questions[0].timeLimit);
      }
      
      // Fetch user's quiz history
      const historyResponse = await apiRequest('GET', '/api/games/quiz/history', undefined);
      const historyData = await historyResponse.json();
      setUserQuizAnswers(historyData.answers);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load quiz questions",
      });
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Submit quiz answer
  const submitQuizAnswer = async (questionId: number, selectedOption: number): Promise<boolean> => {
    clearQuizTimer();
    
    try {
      const response = await apiRequest('POST', '/api/games/quiz/answer', {
        questionId,
        selectedOption,
        timeSpent: currentQuizQuestion?.timeLimit ? currentQuizQuestion.timeLimit - quizTimeRemaining : 0,
      });
      
      const data = await response.json();
      
      // Update user's quiz answers
      setUserQuizAnswers((prev) => [data.answer, ...prev]);
      
      // Invalidate queries related to user balance
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      
      toast({
        title: data.answer.isCorrect ? "Correct!" : "Incorrect",
        description: data.answer.isCorrect 
          ? `You earned ${data.answer.reward} $LKMT tokens!` 
          : "Better luck next time!",
        variant: data.answer.isCorrect ? "default" : "destructive",
      });
      
      return data.answer.isCorrect;
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your answer",
      });
      return false;
    }
  };

  // Move to the next quiz question
  const nextQuizQuestion = () => {
    clearQuizTimer();
    
    if (currentQuizIndex < quizQuestions.length - 1) {
      const nextIndex = currentQuizIndex + 1;
      setCurrentQuizIndex(nextIndex);
      startQuizTimer(quizQuestions[nextIndex].timeLimit);
    }
  };

  // Helper functions for quiz timer
  const startQuizTimer = (timeLimit: number) => {
    clearQuizTimer();
    
    setQuizTimeRemaining(timeLimit);
    
    const timerId = window.setInterval(() => {
      setQuizTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearQuizTimer();
          // Auto-submit a timeout answer
          submitQuizAnswer(
            currentQuizQuestion?.id || 0,
            -1 // -1 indicates a timeout
          );
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setQuizTimerId(timerId);
  };

  const clearQuizTimer = () => {
    if (quizTimerId !== null) {
      clearInterval(quizTimerId);
      setQuizTimerId(null);
    }
  };

  // Compute the current quiz question
  const currentQuizQuestion = quizQuestions.length > 0 && currentQuizIndex < quizQuestions.length
    ? quizQuestions[currentQuizIndex]
    : null;

  // Cleanup
  useEffect(() => {
    return () => clearQuizTimer();
  }, []);

  return (
    <GameContext.Provider
      value={{
        // Spin wheel
        spinWheel,
        userSpins,
        dailySpinsRemaining,
        isSpinning,
        loadSpinWheel,
        performSpin,
        
        // Quiz
        quizQuestions,
        currentQuizQuestion,
        userQuizAnswers,
        isQuizLoading,
        quizTimeRemaining,
        loadQuizQuestions,
        submitQuizAnswer,
        nextQuizQuestion,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextProps => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
