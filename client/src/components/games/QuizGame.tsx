import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/providers/GameProvider';
import { 
  CheckIcon, 
  XIcon, 
  ClockIcon, 
  Brain, 
  ZapIcon, 
  SkipForward, 
  Volume2, 
  VolumeX,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import FloatingActionButton from '@/components/ui/floating-action-button';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import MessageBubble from '@/components/ui/message-bubble';
import TelegramHeader from '@/components/layout/TelegramHeader';
import TypingIndicator from '@/components/ui/typing-indicator';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { useHapticFeedback, HapticFeedbackPattern } from '@/hooks/use-haptic-feedback';
import { useAntiCheat } from '@/hooks/use-anti-cheat';
import { useToast } from '@/hooks/use-toast';
import AnimatedToast from '@/components/ui/animated-toast';

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
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false);
  const [customToast, setCustomToast] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }>({ visible: false, title: '', variant: 'info' });
  
  // Initialize hooks
  const { play, muted, toggleMute } = useSoundEffects();
  const { triggerHaptic } = useHapticFeedback();
  const { toast } = useToast();
  const answerTimeRef = useRef<number | null>(null);
  
  // Anti-cheat system
  const { 
    trackInput, 
    startActivityTimer, 
    checkActivityTiming, 
    isPenaltyActive,
    logViolation 
  } = useAntiCheat({
    enableAll: true,
    trackFocusChange: true,
    trackDevTools: true,
    trackRapidInput: true,
    trackSuspiciousTimings: true,
    applyPenalties: true
  });
  
  // Load quiz questions on component mount
  useEffect(() => {
    loadQuizQuestions();
    
    // Show simulated typing when component mounts
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  }, []);
  
  // Handle option selection with sound and haptic feedback
  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitting || showResult) return;
    
    // Anti-cheat: Track input pattern for bots detection
    trackInput('option_select');
    
    // Sound & haptic feedback
    play('click');
    triggerHaptic('short');
    
    setSelectedOption(optionIndex);
  };
  
  // Start tracking question time when a new question is shown
  useEffect(() => {
    if (currentQuizQuestion && !showResult) {
      // Start tracking answer time
      answerTimeRef.current = Date.now();
      
      // Start anti-cheat activity timer
      startActivityTimer();
      
      // Show simulated typing effect
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
  }, [currentQuizQuestion, showResult, startActivityTimer]);
  
  // Handle answer submission with anti-cheat measures
  const handleSubmit = async () => {
    if (selectedOption === null || !currentQuizQuestion || isSubmitting) return;
    
    // Anti-cheat: Check for penalty
    if (isPenaltyActive()) {
      setCustomToast({
        visible: true,
        title: 'Account Restricted',
        message: 'Suspicious activity detected. Please try again later.',
        variant: 'error'
      });
      return;
    }
    
    // Anti-cheat: Check for suspiciously fast answers
    if (answerTimeRef.current) {
      const answerTime = Date.now() - answerTimeRef.current;
      // If answering too quickly (less than 1.5 seconds) - flag as suspicious
      if (answerTime < 1500) {
        logViolation('fast_answer', `Answered in ${answerTime}ms, minimum expected time is 1500ms`);
        
        // Show security warning
        setShowSecurityWarning(true);
        
        // Wait for 2 seconds before allowing submission
        await new Promise(resolve => setTimeout(resolve, 2000));
        setShowSecurityWarning(false);
      }
    }
    
    // Check activity timing from anti-cheat system
    if (checkActivityTiming(1500)) {
      setCustomToast({
        visible: true,
        title: 'Too Fast!',
        message: 'Please take time to read the question before answering.',
        variant: 'warning'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Sound & haptic feedback based on confidence
    if (selectedOption === currentQuizQuestion.correctAnswer) {
      // User selected correct answer, but they don't know yet
      play('notification');
      triggerHaptic('medium');
    } else {
      // User selected wrong answer, but they don't know yet
      play('click');
      triggerHaptic('short');
    }
    
    try {
      const result = await submitQuizAnswer(
        currentQuizQuestion.id,
        selectedOption
      );
      
      setIsCorrect(result);
      setShowResult(true);
      
      // Sound & haptic feedback for result
      if (result) {
        // Correct answer
        play('success');
        triggerHaptic('success');
        
        setCustomToast({
          visible: true,
          title: 'Correct Answer!',
          message: `You earned ${currentQuizQuestion.reward} $LKMT tokens!`,
          variant: 'success'
        });
      } else {
        // Wrong answer
        play('error');
        triggerHaptic('error');
      }
    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your answer. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle moving to the next question
  const handleNext = () => {
    // Reset state
    setSelectedOption(null);
    setShowResult(false);
    setIsTyping(true);
    
    // Sound & haptic feedback
    play('click');
    triggerHaptic('short');
    
    // Move to next question
    nextQuizQuestion();
    
    // Hide typing indicator after a delay
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };
  
  // Skip current question
  const handleSkip = () => {
    // Reset state
    setSelectedOption(null);
    setShowResult(false);
    setIsTyping(true);
    
    // Sound & haptic feedback
    play('click');
    triggerHaptic('short');
    
    // Move to next question
    nextQuizQuestion();
    
    // Hide typing indicator after a delay
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };
  
  // Custom toast close handler
  const handleCloseCustomToast = () => {
    setCustomToast(prev => ({ ...prev, visible: false }));
  };
  
  // Sound toggle handler
  const handleToggleSound = () => {
    toggleMute();
    toast({
      title: muted ? 'Sound Enabled' : 'Sound Disabled',
      description: muted ? 'Game sounds have been turned on.' : 'Game sounds have been muted.',
    });
  };
  
  // Calculate statistics
  const correctAnswers = userQuizAnswers?.filter(a => a.isCorrect).length || 0;
  const wrongAnswers = userQuizAnswers?.filter(a => !a.isCorrect).length || 0;
  const totalEarnings = userQuizAnswers?.reduce((sum, a) => sum + a.reward, 0) || 0;
  
  // Handle refresh
  const handleRefresh = async () => {
    play('notification');
    triggerHaptic('medium');
    setIsTyping(true);
    
    try {
      await loadQuizQuestions();
    } finally {
      setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
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
      {/* Telegram-style header */}
      <TelegramHeader 
        title="Quiz Game" 
        subtitle="Earn $LKMT by answering correctly"
        actions={
          <button 
            onClick={handleToggleSound}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors active:scale-95"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        }
      />

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
          
          {/* Typing indicator for realistic effect */}
          {isTyping && (
            <div className="mb-4 ml-2">
              <TypingIndicator text="Generating options..." />
            </div>
          )}
          
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
                  disabled={isSubmitting || showResult || isTyping}
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
        
        {/* Security warning for suspicious activity */}
        {showSecurityWarning && (
          <MessageBubble 
            content={
              <div className="flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2 text-warning" />
                <span>Security check: Please wait a moment before submitting.</span>
              </div>
            }
            type="system"
            variant="warning"
            className="mb-4 animate-pulse"
          />
        )}
        
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
              className="bg-accent hover:bg-accent/90 text-white tg-ripple transform transition-all hover:scale-105 active:scale-95"
            >
              Next Question
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleSkip}
                variant="outline"
                className="border-white/10 tg-ripple flex items-center transform transition-all hover:scale-105 active:scale-95"
                disabled={isTyping}
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={selectedOption === null || isSubmitting || isTyping}
                className="bg-accent hover:bg-accent/90 text-white tg-ripple transform transition-all hover:scale-105 active:scale-95"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Answer'}
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
      
      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30">
        {!showResult && !isTyping && (
          <FloatingActionButton
            icon={<SkipForward className="h-6 w-6" />}
            onClick={handleSkip}
            label="Skip Question"
            color="secondary"
          />
        )}
        <FloatingActionButton
          icon={muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          onClick={handleToggleSound}
          label={muted ? "Unmute" : "Mute Sounds"}
          color="primary"
        />
      </div>
      
      {/* Animated toast for success/error messages */}
      {customToast.visible && (
        <AnimatedToast
          title={customToast.title}
          message={customToast.message}
          variant={customToast.variant}
          onClose={handleCloseCustomToast}
          showMuteToggle={true}
        />
      )}
    </PullToRefresh>
  );
};

export default QuizGame;
