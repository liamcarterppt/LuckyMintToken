import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/providers/GameProvider';
import { CheckIcon, XIcon, ClockIcon } from 'lucide-react';

const QuizGame: React.FC = () => {
  const { 
    quizQuestions,
    currentQuizQuestion,
    userQuizAnswers,
    isQuizLoading,
    quizTimeRemaining,
    loadQuizQuestions,
    submitQuizAnswer,
    nextQuizQuestion
  } = useGame();
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  
  // Load quiz questions on component mount
  useEffect(() => {
    loadQuizQuestions();
  }, []);
  
  // Handle option selection
  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitting || showResult) return;
    setSelectedOption(optionIndex);
  };
  
  // Handle answer submission
  const handleSubmit = async () => {
    if (selectedOption === null || !currentQuizQuestion || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const result = await submitQuizAnswer(
      currentQuizQuestion.id,
      selectedOption
    );
    
    setIsCorrect(result);
    setShowResult(true);
    setIsSubmitting(false);
  };
  
  // Handle moving to the next question
  const handleNext = () => {
    setSelectedOption(null);
    setShowResult(false);
    nextQuizQuestion();
  };
  
  // Skip current question
  const handleSkip = () => {
    setSelectedOption(null);
    setShowResult(false);
    nextQuizQuestion();
  };
  
  // Calculate statistics
  const correctAnswers = userQuizAnswers?.filter(a => a.isCorrect).length || 0;
  const wrongAnswers = userQuizAnswers?.filter(a => !a.isCorrect).length || 0;
  const totalEarnings = userQuizAnswers?.reduce((sum, a) => sum + a.reward, 0) || 0;
  
  if (isQuizLoading) {
    return <div className="text-center py-6">Loading quiz questions...</div>;
  }
  
  if (!currentQuizQuestion) {
    return (
      <div className="bg-card rounded-xl p-6 border border-white/5 text-center">
        <h3 className="font-semibold text-xl mb-4">No Questions Available</h3>
        <p className="text-foreground/80 mb-6">There are no quiz questions available at the moment. Please check back later!</p>
        <Button 
          onClick={loadQuizQuestions}
          className="bg-accent hover:bg-accent/90 text-white"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-white/5">
      <div className="text-center mb-6">
        <h3 className="font-semibold text-xl mb-2">Test Your Crypto Knowledge</h3>
        <p className="text-foreground/70">Answer crypto questions correctly to earn $LKMT tokens!</p>
      </div>
      
      <div className="bg-background/40 rounded-lg p-5 mb-6">
        <div className="flex justify-between mb-4">
          <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
            Question {quizQuestions.indexOf(currentQuizQuestion) + 1}/{quizQuestions.length}
          </span>
          <span className="text-sm bg-secondary/10 text-secondary px-3 py-1 rounded-full">
            +{currentQuizQuestion.reward} $LKMT
          </span>
        </div>
        
        <h4 className="font-medium text-lg mb-5">{currentQuizQuestion.question}</h4>
        
        <div className="space-y-3">
          {currentQuizQuestion.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
            const isSelected = selectedOption === index;
            
            // Apply styles based on selection and result
            let buttonStyle = "w-full text-left p-4 rounded-lg transition-colors border ";
            
            if (showResult) {
              if (index === currentQuizQuestion.correctAnswer) {
                buttonStyle += "bg-success/10 border-success text-success";
              } else if (isSelected) {
                buttonStyle += "bg-destructive/10 border-destructive text-destructive";
              } else {
                buttonStyle += "bg-card border-white/10";
              }
            } else {
              buttonStyle += isSelected 
                ? "bg-primary/10 border-primary" 
                : "bg-card hover:bg-card/90 border-white/10";
            }
            
            return (
              <button 
                key={index}
                className={buttonStyle}
                onClick={() => handleOptionSelect(index)}
                disabled={isSubmitting || showResult}
              >
                <span>{optionLetter}.</span> {option}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-foreground/70">Time Remaining</p>
          <p className="font-medium flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {Math.floor(quizTimeRemaining / 60)}:{(quizTimeRemaining % 60).toString().padStart(2, '0')}
          </p>
        </div>
        
        {showResult ? (
          <Button 
            onClick={handleNext}
            className="bg-accent hover:bg-accent/90 text-white"
          >
            Next Question
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleSkip}
              variant="outline"
              className="border-white/10"
            >
              Skip Question
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={selectedOption === null || isSubmitting}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </div>
        )}
      </div>
      
      {/* Quiz Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <div className="bg-card rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <CheckIcon className="text-success h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-foreground/70">Correct Answers</p>
            <p className="font-medium">{correctAnswers}</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <XIcon className="text-destructive h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-foreground/70">Wrong Answers</p>
            <p className="font-medium">{wrongAnswers}</p>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 8L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 10L12 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-foreground/70">Total Earnings</p>
            <p className="font-medium">{totalEarnings} $LKMT</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGame;
