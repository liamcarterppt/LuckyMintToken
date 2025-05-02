import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAntiCheat } from '@/hooks/use-anti-cheat';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

interface CaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  className?: string;
}

// A custom CAPTCHA component that implements different verification methods
export const Captcha = ({ onVerify, onExpire, difficulty = 'medium', className }: CaptchaProps) => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [captchaType, setCaptchaType] = useState<'slider' | 'puzzle' | 'math'>('slider');
  const [token, setToken] = useState<string | null>(null);
  const [puzzleRotation, setPuzzleRotation] = useState(0);
  const [targetRotation, setTargetRotation] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderTarget, setSliderTarget] = useState(0);
  const [math, setMath] = useState({ question: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const captchaRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();
  const { trackSuspiciousActivity } = useAntiCheat();
  
  // Generate a random token on successful verification
  const generateToken = useCallback(() => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }, []);
  
  // Initialize the CAPTCHA on mount
  useEffect(() => {
    const initCaptcha = () => {
      setLoading(true);
      
      // Choose a random CAPTCHA type based on difficulty
      const types: ('slider' | 'puzzle' | 'math')[] = ['slider'];
      if (difficulty === 'medium' || difficulty === 'hard') {
        types.push('puzzle');
      }
      if (difficulty === 'hard') {
        types.push('math');
      }
      
      const randomType = types[Math.floor(Math.random() * types.length)];
      setCaptchaType(randomType);
      
      // Set up the chosen CAPTCHA type
      if (randomType === 'slider') {
        // Random target between 60% and 90%
        const target = Math.floor(Math.random() * 30) + 60;
        setSliderTarget(target);
      } else if (randomType === 'puzzle') {
        // Random rotation to solve
        const randomRotation = Math.floor(Math.random() * 360);
        const targetRot = randomRotation - (randomRotation % 90); // Normalize to 90 degrees increments
        setPuzzleRotation(randomRotation);
        setTargetRotation(targetRot);
      } else if (randomType === 'math') {
        // Generate simple math question
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        
        if (operation === '-') {
          // Ensure a is greater than b for subtraction
          if (a < b) [a, b] = [b, a];
        }
        
        let answer;
        switch(operation) {
          case '+': answer = a + b; break;
          case '-': answer = a - b; break;
          case '*': answer = a * b; break;
          default: answer = a + b;
        }
        
        setMath({
          question: `${a} ${operation} ${b} = ?`,
          answer
        });
      }
      
      setLoading(false);
    };
    
    initCaptcha();
    
    // Set up expiration timer (2 minutes)
    const expireTimer = setTimeout(() => {
      if (!verified && onExpire) {
        onExpire();
      }
    }, 2 * 60 * 1000);
    
    return () => clearTimeout(expireTimer);
  }, [difficulty, onExpire, verified]);
  
  // Handle verification
  const handleVerify = useCallback(() => {
    let isValid = false;
    
    if (captchaType === 'slider') {
      // Check if slider value is within 2% of target
      const tolerance = 2;
      isValid = Math.abs(sliderValue - sliderTarget) <= tolerance;
    } else if (captchaType === 'puzzle') {
      // Check if puzzle is correctly rotated
      isValid = puzzleRotation % 360 === targetRotation % 360;
    } else if (captchaType === 'math') {
      // Check if math answer is correct
      isValid = parseInt(userAnswer, 10) === math.answer;
    }
    
    if (isValid) {
      triggerHaptic('success');
      setVerified(true);
      const newToken = generateToken();
      setToken(newToken);
      onVerify(newToken);
    } else {
      triggerHaptic('error');
      setAttempts(prev => prev + 1);
      
      if (attempts >= 2) {
        // Report suspicious activity after 3 failed attempts
        trackSuspiciousActivity('captcha_failures', {
          attempts: attempts + 1,
          captchaType
        });
      }
    }
  }, [
    captchaType, sliderValue, sliderTarget, puzzleRotation, 
    targetRotation, userAnswer, math.answer, attempts, 
    generateToken, onVerify, trackSuspiciousActivity, triggerHaptic
  ]);
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0]);
  };
  
  // Handle puzzle rotation
  const handleRotate = () => {
    setPuzzleRotation(prev => (prev + 90) % 360);
  };
  
  // Reset the CAPTCHA
  const handleReset = () => {
    setVerified(false);
    setToken(null);
    setSliderValue(0);
    setUserAnswer('');
    setAttempts(0);
    
    const initCaptcha = () => {
      setLoading(true);
      
      // Choose a random CAPTCHA type based on difficulty
      const types: ('slider' | 'puzzle' | 'math')[] = ['slider'];
      if (difficulty === 'medium' || difficulty === 'hard') {
        types.push('puzzle');
      }
      if (difficulty === 'hard') {
        types.push('math');
      }
      
      const randomType = types[Math.floor(Math.random() * types.length)];
      setCaptchaType(randomType);
      
      // Set up the chosen CAPTCHA type
      if (randomType === 'slider') {
        // Random target between 60% and 90%
        const target = Math.floor(Math.random() * 30) + 60;
        setSliderTarget(target);
      } else if (randomType === 'puzzle') {
        // Random rotation to solve
        const randomRotation = Math.floor(Math.random() * 360);
        const targetRot = randomRotation - (randomRotation % 90); // Normalize to 90 degrees increments
        setPuzzleRotation(randomRotation);
        setTargetRotation(targetRot);
      } else if (randomType === 'math') {
        // Generate simple math question
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        
        if (operation === '-') {
          // Ensure a is greater than b for subtraction
          if (a < b) [a, b] = [b, a];
        }
        
        let answer;
        switch(operation) {
          case '+': answer = a + b; break;
          case '-': answer = a - b; break;
          case '*': answer = a * b; break;
          default: answer = a + b;
        }
        
        setMath({
          question: `${a} ${operation} ${b} = ?`,
          answer
        });
      }
      
      setLoading(false);
    };
    
    initCaptcha();
  };
  
  return (
    <Card className={cn("w-full max-w-sm mx-auto", className)} ref={captchaRef}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Verification Check</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleReset} 
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : verified ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <div className="rounded-full bg-green-500/20 p-2">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">Verification successful</p>
          </div>
        ) : (
          <div className="space-y-6">
            {captchaType === 'slider' && (
              <div className="space-y-4">
                <p className="text-sm text-center">Move the slider to {sliderTarget}%</p>
                <Slider
                  defaultValue={[0]}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange}
                  className="my-6"
                />
                <p className="text-xs text-right text-muted-foreground">
                  Current: {Math.round(sliderValue)}%
                </p>
              </div>
            )}
            
            {captchaType === 'puzzle' && (
              <div className="space-y-4 flex flex-col items-center">
                <p className="text-sm text-center">Rotate the puzzle to the correct position</p>
                <div 
                  className="h-32 w-32 bg-primary/20 rounded-lg cursor-pointer flex items-center justify-center"
                  onClick={handleRotate}
                  style={{ transform: `rotate(${puzzleRotation}deg)`, transition: 'transform 0.3s ease' }}
                >
                  <div className="w-3/4 h-1/2 bg-primary/40 rounded"></div>
                </div>
              </div>
            )}
            
            {captchaType === 'math' && (
              <div className="space-y-4">
                <p className="text-lg font-medium text-center">{math.question}</p>
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="border border-input rounded-md px-3 py-2 w-full text-center"
                  placeholder="Enter your answer"
                />
              </div>
            )}
            
            <Button 
              onClick={handleVerify}
              className="w-full mt-4"
              disabled={
                (captchaType === 'slider' && sliderValue === 0) ||
                (captchaType === 'math' && !userAnswer)
              }
            >
              Verify
            </Button>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Security check to protect our platform
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Captcha;