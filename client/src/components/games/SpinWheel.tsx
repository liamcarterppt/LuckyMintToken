import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGame } from '@/providers/GameProvider';
import { UserSpin } from '@/types';
import { 
  Gift as GiftIcon, 
  XIcon, 
  RefreshCcw, 
  Clock, 
  History, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import FloatingActionButton from '@/components/ui/floating-action-button';
import PullToRefresh from '@/components/ui/pull-to-refresh';
import MessageBubble from '@/components/ui/message-bubble';

const SpinWheel: React.FC = () => {
  const { 
    spinWheel, 
    userSpins, 
    dailySpinsRemaining, 
    isSpinning,
    loadSpinWheel, 
    performSpin
  } = useGame();
  
  const { toast } = useToast();
  const wheelRef = useRef<SVGSVGElement>(null);
  const [result, setResult] = useState<UserSpin | null>(null);
  const [nextSpinTime, setNextSpinTime] = useState<string>('');
  
  // Load spin wheel data on component mount
  useEffect(() => {
    loadSpinWheel();
  }, []);
  
  // Update next spin time countdown
  useEffect(() => {
    if (dailySpinsRemaining === 0 && userSpins.length > 0) {
      const lastSpin = new Date(userSpins[0].createdAt);
      const nextAvailable = new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000);
      
      const updateCountdown = () => {
        const now = new Date();
        const diff = nextAvailable.getTime() - now.getTime();
        
        if (diff <= 0) {
          loadSpinWheel(); // Reload to get new spin availability
          clearInterval(intervalId);
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setNextSpinTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      };
      
      updateCountdown();
      const intervalId = setInterval(updateCountdown, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [dailySpinsRemaining, userSpins]);
  
  // Handle spin action
  const handleSpin = async () => {
    if (!spinWheel || dailySpinsRemaining <= 0 || isSpinning) {
      return;
    }
    
    // Perform spin and get result
    const spinResult = await performSpin();
    
    if (spinResult && wheelRef.current) {
      // Calculate rotation to land on the winning segment
      const segmentAngle = 360 / spinWheel.segmentCount;
      const segmentPosition = spinWheel.segments.find(s => s.id === spinResult.result)?.position || 0;
      const randomOffset = Math.random() * (segmentAngle * 0.7);
      const destinationAngle = 360 - (segmentPosition * segmentAngle + randomOffset) + 360 * 5; // 5 full rotations + destination
      
      // Apply rotation to the wheel
      wheelRef.current.style.transform = `rotate(${destinationAngle}deg)`;
      
      // Show result after animation completes
      setTimeout(() => {
        setResult(spinResult);
      }, 5000); // Match the CSS transition duration
    }
  };
  
  // Reset the wheel after showing the result
  const resetWheel = () => {
    setResult(null);
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'rotate(0deg)';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'p, MMM d');
  };
  
  // Handle refresh action
  const handleRefresh = async () => {
    return loadSpinWheel();
  };

  if (!spinWheel) {
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-foreground/70">Loading spin wheel...</p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="relative">
      <div className="bg-card rounded-xl p-6 border border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wheel section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-full max-w-xs mx-auto">
              {/* Telegram-style info message */}
              <MessageBubble 
                content={
                  dailySpinsRemaining > 0 
                    ? "Spin the wheel to win $LKMT tokens. Good luck!"
                    : `You've used your daily spin. Next spin in ${nextSpinTime}.`
                }
                type="system"
                variant={dailySpinsRemaining > 0 ? "info" : "warning"}
                className="mb-6 animate-fadeIn"
              />
            
              {/* Wheel container with enhanced styling */}
              <div className="aspect-square relative transition-all duration-500 hover:scale-[1.02] transform">
                {/* Sparkle animations for the wheel */}
                {!isSpinning && dailySpinsRemaining > 0 && (
                  <>
                    <Sparkles className="absolute -top-3 -right-3 text-primary h-10 w-10 animate-pulse" />
                    <Sparkles className="absolute -bottom-3 -left-3 text-accent h-10 w-10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
                
                <svg 
                  viewBox="0 0 100 100" 
                  className="spin-wheel w-full drop-shadow-lg"
                  ref={wheelRef}
                >
                  {/* Wheel segments */}
                  {spinWheel.segments.map((segment, index) => {
                    // Calculate SVG path for each segment
                    const angle = 360 / spinWheel.segmentCount;
                    const startAngle = index * angle;
                    const endAngle = (index + 1) * angle;
                    
                    // Convert angles to radians
                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = (endAngle - 90) * Math.PI / 180;
                    
                    // Calculate path coordinates
                    const x1 = 50 + 45 * Math.cos(startRad);
                    const y1 = 50 + 45 * Math.sin(startRad);
                    const x2 = 50 + 45 * Math.cos(endRad);
                    const y2 = 50 + 45 * Math.sin(endRad);
                    
                    // Create SVG path
                    const path = `M50,50 L${x1},${y1} A45,45 0 0,1 ${x2},${y2} z`;
                    
                    // Text position calculation
                    const textAngle = startAngle + angle / 2;
                    const textRad = (textAngle - 90) * Math.PI / 180;
                    const textX = 50 + 30 * Math.cos(textRad);
                    const textY = 50 + 30 * Math.sin(textRad);
                    
                    return (
                      <g key={segment.id}>
                        <path d={path} fill={segment.color} />
                        <text 
                          x={textX} 
                          y={textY} 
                          fontSize="4" 
                          fill="white" 
                          textAnchor="middle"
                          transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                        >
                          {segment.text}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Center pin with enhanced styling */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full z-10 shadow-lg"></div>
                
                {/* Improved spinner arrow */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-accent shadow-md"></div>
              </div>

              <Button 
                id="spinButton" 
                className="mt-8 bg-accent hover:bg-accent/90 text-white font-medium w-full tg-ripple transition-all transform hover:scale-105 active:scale-95"
                onClick={handleSpin}
                disabled={dailySpinsRemaining <= 0 || isSpinning}
              >
                {isSpinning ? (
                  <span className="flex items-center justify-center">
                    <RefreshCcw className="h-5 w-5 mr-2 animate-spin" /> 
                    SPINNING...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Sparkles className="h-5 w-5 mr-2" /> 
                    SPIN NOW
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Info section with Telegram styling */}
          <div>
            <h3 className="font-semibold text-xl mb-4">Spin The Wheel Of Fortune!</h3>
            <p className="text-foreground/80 mb-6">Try your luck and win $LKMT tokens! You get 1 free spin every 24 hours.</p>
            
            <div className="bg-background/50 rounded-lg p-4 mb-6 border border-white/5 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  Available Spins
                </span>
                <span className="font-medium">{dailySpinsRemaining} / 1</span>
              </div>
              <Progress 
                value={dailySpinsRemaining * 100} 
                className="h-2 bg-background"
              />
              {dailySpinsRemaining === 0 && (
                <p className="text-xs text-foreground/50 mt-2 flex items-center justify-end">
                  <Clock className="h-3 w-3 mr-1 text-foreground/50" />
                  Next free spin available in {nextSpinTime}
                </p>
              )}
            </div>
            
            <div className="bg-background/50 rounded-lg p-4 border border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center">
                  <History className="h-4 w-4 mr-2 text-primary" />
                  Prize History
                </h4>
                {userSpins.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {userSpins.length} {userSpins.length === 1 ? 'spin' : 'spins'}
                  </span>
                )}
              </div>
              
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1 -mr-1">
                {userSpins.length === 0 ? (
                  <MessageBubble
                    content="No spins yet. Try your luck by spinning the wheel!"
                    type="system"
                    variant="info"
                    className="my-2"
                  />
                ) : (
                  userSpins.map((spin) => {
                    const segment = spinWheel.segments.find(s => s.id === spin.result);
                    const isWin = spin.reward > 0;
                    
                    return (
                      <div key={spin.id} className="flex items-center justify-between bg-card/50 rounded-lg p-3 hover:bg-card/80 transition-colors tg-ripple">
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 ${isWin ? 'bg-success/10' : 'bg-destructive/10'} rounded-full flex items-center justify-center`}>
                            {isWin ? (
                              <GiftIcon className="text-success h-5 w-5" />
                            ) : (
                              <XIcon className="text-destructive h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{segment?.text || 'Unknown'}</p>
                            <p className="text-xs text-foreground/50">{formatDate(spin.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`text-xs ${isWin ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'} px-2 py-1 rounded-full`}>
                            {isWin ? `+${spin.reward} $LKMT` : 'No Prize'}
                          </span>
                          <ChevronRight className="h-4 w-4 text-foreground/30 ml-1" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating action button to trigger spin */}
        {dailySpinsRemaining > 0 && !isSpinning && !result && (
          <FloatingActionButton
            icon={<Sparkles className="h-6 w-6" />}
            onClick={handleSpin}
            label="Spin the Wheel"
            color="primary"
          />
        )}
      </div>
      
      {/* Result modal with enhanced Telegram-style UI */}
      {result && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card rounded-xl p-6 max-w-md w-full text-center border border-white/10 shadow-xl">
            <div className="mb-6">
              {result.reward > 0 ? (
                <>
                  <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-slideUp">
                    <GiftIcon className="h-12 w-12 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Congratulations!</h3>
                  <p className="text-lg">You won <span className="text-primary font-bold">{result.reward} $LKMT</span> tokens!</p>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-slideUp">
                    <XIcon className="h-12 w-12 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Better Luck Next Time!</h3>
                  <p className="text-lg">Try again after 24 hours for another chance to win!</p>
                </>
              )}
              
              <MessageBubble 
                content={
                  result.reward > 0 
                    ? "Your reward has been added to your balance automatically!" 
                    : "Spin again tomorrow for another chance to win rewards!"
                }
                type="system"
                variant={result.reward > 0 ? "success" : "info"}
                className="my-4"
              />
            </div>
            <Button 
              className="bg-accent hover:bg-accent/90 text-white tg-ripple transition-all transform hover:scale-105 active:scale-95"
              onClick={resetWheel}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </PullToRefresh>
  );
};

export default SpinWheel;
