import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check } from 'lucide-react';

interface CaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  className?: string;
}

const Captcha: React.FC<CaptchaProps> = ({
  onVerify,
  onExpire,
  difficulty = 'medium',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [verified, setVerified] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Generate a random token after verification
  const generateToken = (): string => {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  // Generate captcha text based on difficulty
  const generateCaptchaText = (): string => {
    const length = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    let chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O which can be confusing
    
    // Add numbers and special chars based on difficulty
    if (difficulty === 'medium' || difficulty === 'hard') {
      chars += '23456789'; // Exclude 0, 1 which can be confusing
    }
    
    if (difficulty === 'hard') {
      chars += '@#$%&';
    }
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };

  // Draw captcha on canvas
  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Draw captcha text
    const textColors = ['#3498db', '#2c3e50', '#e74c3c', '#27ae60', '#8e44ad'];
    const fontSize = difficulty === 'easy' ? 28 : difficulty === 'medium' ? 26 : 24;
    const fontFamilies = ['Arial', 'Verdana', 'Courier New', 'Georgia', 'monospace'];

    // Draw text with distortion
    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText.charAt(i);
      
      // Randomize appearance
      const angle = difficulty === 'easy' ? 0 : Math.random() * 0.4 - 0.2;
      const x = (i + 1) * (width / (captchaText.length + 1));
      const y = height / 2 + (difficulty === 'easy' ? 0 : Math.random() * 10 - 5);
      const color = textColors[Math.floor(Math.random() * textColors.length)];
      const fontFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.fillText(char, -fontSize / 3, fontSize / 3);
      
      ctx.restore();
    }
    
    // Add noise/lines (for medium/hard difficulty)
    if (difficulty !== 'easy') {
      // Add noise dots
      const noiseCount = difficulty === 'medium' ? 100 : 200;
      for (let i = 0; i < noiseCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        const color = textColors[Math.floor(Math.random() * textColors.length)];
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
      }
      
      // Add lines
      const lineCount = difficulty === 'medium' ? 3 : 6;
      for (let i = 0; i < lineCount; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;
        const color = textColors[Math.floor(Math.random() * textColors.length)];
        
        ctx.strokeStyle = color;
        ctx.lineWidth = difficulty === 'medium' ? 1 : 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  };

  // Initialize and refresh captcha
  const refreshCaptcha = () => {
    setUserInput('');
    setVerified(false);
    const newText = generateCaptchaText();
    setCaptchaText(newText);
  };

  // Verify user input
  const verifyCaptcha = () => {
    setLoading(true);
    
    // Simulate network delay for more natural feel
    setTimeout(() => {
      const isMatch = userInput.trim().toUpperCase() === captchaText;
      
      if (isMatch) {
        setVerified(true);
        // Generate a verification token
        const token = generateToken();
        onVerify(token);
      } else {
        // Increment attempts counter
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        // If too many attempts, reset and make harder
        if (newAttempts >= 3) {
          refreshCaptcha();
          if (onExpire) {
            onExpire();
          }
        } else {
          setUserInput('');
        }
      }
      
      setLoading(false);
    }, 500);
  };

  // Initialize on mount
  useEffect(() => {
    refreshCaptcha();
  }, [difficulty]);

  // Redraw captcha when text changes
  useEffect(() => {
    if (captchaText) {
      drawCaptcha();
    }
  }, [captchaText]);

  return (
    <div className={`border rounded-lg p-4 bg-card ${className}`}>
      <div className="text-center mb-2 text-sm font-medium">
        {verified ? 'Verification Successful' : 'Please verify you are human'}
      </div>
      
      <div className="flex flex-col items-center">
        <canvas 
          ref={canvasRef} 
          width={250} 
          height={80}
          className="mb-3 border rounded"
        />
        
        {!verified ? (
          <>
            <div className="flex items-center w-full gap-2 mb-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter the text above"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={captchaText.length}
                autoComplete="off"
                disabled={loading || verified}
              />
              
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={refreshCaptcha}
                disabled={loading || verified}
                className="h-10 w-10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={verifyCaptcha}
              disabled={!userInput.trim() || loading || verified}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 text-success font-medium">
            <Check className="h-5 w-5" />
            <span>Verified</span>
          </div>
        )}
        
        {attempts > 0 && !verified && (
          <p className="text-destructive text-xs mt-2">
            {`Failed attempt${attempts > 1 ? 's' : ''}. Please try again. (${3 - attempts} ${attempts === 2 ? 'try' : 'tries'} left)`}
          </p>
        )}
      </div>
    </div>
  );
};

export default Captcha;