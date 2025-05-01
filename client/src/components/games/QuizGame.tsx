import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/providers/GameProvider';
import { CheckIcon, XIcon, ClockIcon, Brain, ZapIcon, SkipForward } from 'lucide-react';
import FloatingActionButton from '@/components/ui/floating-action-button';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import MessageBubble from '@/components/ui/message-bubble';

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
  
  // Handle refresh
  const handleRefresh = async () => {
    return loadQuizQuestions();
  };

  if (isQuizLoading) {
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-foreground/70">Loading quiz questions...</p>
      </div>
    );
  }
  
  if (!currentQuizQuestion) {
    return (
      <div className="bg-card rounded-xl p-6 border border-white/5 text-center">
        <div className="my-8">
          <Brain className="h-16 w-16 text-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-4">No Questions Available</h3>
          <p className="text-foreground/80 mb-6">There are no quiz questions available at the moment. Please check back later!</p>
          <Button 
            onClick={loadQuizQuestions}
            className="bg-accent hover:bg-accent/90 text-white"
          >
            Refresh
          </Button>
        </div>
        
        <MessageBubble 
          content="Quiz questions are refreshed daily. Complete other activities to earn more $LKMT tokens in the meantime!"
          type="system"
          variant="info"
          className="mt-6"
        />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="relative">
      <div className="bg-card rounded-xl p-6 border border-white/5">
        <div className="text-center mb-6">
          <h3 className="font-semibold text-xl mb-2">Test Your Crypto Knowledge</h3>
          <p className="text-foreground/70">Answer crypto questions correctly to earn $LKMT tokens!</p>
        </div>
        
        {/* Question Card with Telegram-style design */}
        <div className="bg-background/40 rounded-lg p-5 mb-6 relative overflow-hidden">
          {/* Top status indicators */}
          <div className="flex justify-between mb-4">
            <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center">
              <Brain className="h-3.5 w-3.5 mr-1" />
              Question {quizQuestions.indexOf(currentQuizQuestion) + 1}/{quizQuestions.length}
            </span>
            <span className="text-sm bg-secondary/10 text-secondary px-3 py-1 rounded-full flex items-center">
              <ZapIcon className="h-3.5 w-3.5 mr-1" />
              +{currentQuizQuestion.reward} $LKMT
            </span>
          </div>
          
          {/* Question with speech bubble styling */}
          <MessageBubble 
            content={<h4 className="font-medium text-lg">{currentQuizQuestion.question}</h4>}
            type="incoming"
            className="mb-5 transform transition-all duration-300"
          />
          
          {/* Answer options */}
          <div className="space-y-3">
            {currentQuizQuestion.options.map((option, index) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
              const isSelected = selectedOption === index;
              
              // Apply Telegram-style button classes
              let buttonStyle = "w-full text-left p-4 rounded-lg transition-all duration-200 border tg-ripple transform ";
              
              if (showResult) {
                if (index === currentQuizQuestion.correctAnswer) {
                  buttonStyle += "bg-success/10 border-success text-success translate-x-1";
                } else if (isSelected) {
                  buttonStyle += "bg-destructive/10 border-destructive text-destructive -translate-x-1";
                } else {
                  buttonStyle += "bg-card border-white/10 opacity-60";
                }
              } else {
                buttonStyle += isSelected 
                  ? "bg-primary/10 border-primary scale-[1.02]" 
                  : "bg-card hover:bg-card/90 border-white/10 hover:scale-[1.01] active:scale-[0.99]";
              }
              
              return (
                <button 
                  key={index}
                  className={buttonStyle}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isSubmitting || showResult}
                >
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/5 mr-2 text-sm">
                      {optionLetter}
                    </span> 
                    {option}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Result feedback */}
        {showResult && (
          <MessageBubble 
            content={
              isCorrect 
                ? "🎉 Correct! You earned tokens for this answer." 
                : "Sorry, that's incorrect. Try the next question!"
            }
            type="system"
            variant={isCorrect ? "success" : "error"}
            className="mb-4 animate-slideUp"
          />
        )}
        
        {/* Control buttons */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-foreground/70">Time Remaining</p>
            <p className="font-medium flex items-center">
              <ClockIcon className="h-4 w-4 mr-1 text-accent" />
              {Math.floor(quizTimeRemaining / 60)}:{(quizTimeRemaining % 60).toString().padStart(2, '0')}
            </p>
          </div>
          
          {showResult ? (
            <Button 
              onClick={handleNext}
              className="bg-accent hover:bg-accent/90 text-white tg-ripple"
            >
              Next Question
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="border-white/10 tg-ripple flex items-center"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={selectedOption === null || isSubmitting}
                className="bg-accent hover:bg-accent/90 text-white tg-ripple"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Quiz Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="bg-card rounded-lg p-4 flex items-center gap-3 border border-white/5 hover:bg-card/90 transition-all">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <CheckIcon className="text-success h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Correct Answers</p>
              <p className="font-medium">{correctAnswers}</p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 flex items-center gap-3 border border-white/5 hover:bg-card/90 transition-all">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <XIcon className="text-destructive h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Wrong Answers</p>
              <p className="font-medium">{wrongAnswers}</p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-4 flex items-center gap-3 border border-white/5 hover:bg-card/90 transition-all">
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
      
      {/* Floating action button for skipping */}
      {!showResult && (
        <FloatingActionButton
          icon={<SkipForward className="h-6 w-6" />}
          onClick={handleSkip}
          label="Skip Question"
          color="secondary"
        />
      )}
    </PullToRefresh>
  );
};

export default QuizGame;
