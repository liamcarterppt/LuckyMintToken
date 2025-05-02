import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface AntiCheatOptions {
  // Enable all anti-cheat features
  enableAll?: boolean;
  // Track if user tabs out during game sessions
  trackFocusChange?: boolean;
  // Track if user opens dev tools
  trackDevTools?: boolean;
  // Track rapid clicking or automatic input
  trackRapidInput?: boolean;
  // Track too quick quiz completions (suspiciously fast answers)
  trackSuspiciousTimings?: boolean;
  // Track VPN/proxy detection
  trackVPN?: boolean;
  // Apply penalties for detected cheating
  applyPenalties?: boolean;
}

interface AntiCheatState {
  violations: Array<{
    type: string;
    timestamp: number;
    details?: string;
  }>;
  isFlagged: boolean;
  suspiciousActivity: boolean;
  penaltyActive: boolean;
  penaltyEndTime: number | null;
}

export function useAntiCheat(options: AntiCheatOptions = {}) {
  const {
    enableAll = true,
    trackFocusChange = true,
    trackDevTools = true,
    trackRapidInput = true,
    trackSuspiciousTimings = true,
    trackVPN = false, // Disabled by default as it may require external API
    applyPenalties = true
  } = options;
  
  const [state, setState] = useState<AntiCheatState>({
    violations: [],
    isFlagged: false,
    suspiciousActivity: false,
    penaltyActive: false,
    penaltyEndTime: null
  });
  
  const { toast } = useToast();
  
  // Reference for tracking rapid input
  const inputTimestamps = useRef<number[]>([]);
  const devToolsOpenRef = useRef<boolean>(false);
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to log a violation
  const logViolation = useCallback((type: string, details?: string) => {
    setState(prev => {
      const newViolations = [
        ...prev.violations,
        { type, timestamp: Date.now(), details }
      ];
      
      // Consider account flagged after 3 violations
      const shouldFlag = newViolations.length >= 3;
      
      // Apply penalties if enabled
      const penaltyActive = applyPenalties && shouldFlag;
      const penaltyEndTime = penaltyActive ? Date.now() + 30 * 60 * 1000 : null; // 30 minutes
      
      if (penaltyActive && !prev.penaltyActive) {
        toast({
          title: "Suspicious Activity Detected",
          description: "Due to suspicious activity, your account has been temporarily restricted.",
          variant: "destructive"
        });
      }
      
      return {
        ...prev,
        violations: newViolations,
        isFlagged: shouldFlag,
        suspiciousActivity: true,
        penaltyActive,
        penaltyEndTime
      };
    });
  }, [applyPenalties, toast]);

  // Track focus changes (tab switching)
  useEffect(() => {
    if (!enableAll || !trackFocusChange) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('focus_loss', 'User tabbed away during game session');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableAll, trackFocusChange, logViolation]);

  // Track dev tools open
  useEffect(() => {
    if (!enableAll || !trackDevTools) return;
    
    const checkDevTools = () => {
      const threshold = 160; // threshold in pixels
      const isDevToolsOpen = 
        window.outerWidth - window.innerWidth > threshold || 
        window.outerHeight - window.innerHeight > threshold;
      
      if (isDevToolsOpen && !devToolsOpenRef.current) {
        devToolsOpenRef.current = true;
        logViolation('dev_tools', 'Developer tools opened during game');
      } else if (!isDevToolsOpen) {
        devToolsOpenRef.current = false;
      }
    };
    
    const intervalId = setInterval(checkDevTools, 1000);
    
    // Also detect console.log overrides
    const originalLog = console.log;
    console.log = function(...args) {
      if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('cheat') || arg.includes('hack')))) {
        logViolation('console_manipulation', 'Suspicious console activity detected');
      }
      originalLog.apply(console, args);
    };
    
    return () => {
      clearInterval(intervalId);
      console.log = originalLog;
    };
  }, [enableAll, trackDevTools, logViolation]);

  // Track rapid input (detect auto-clickers)
  const trackInput = useCallback((type: string) => {
    if (!enableAll || !trackRapidInput) return;
    
    const now = Date.now();
    inputTimestamps.current.push(now);
    
    // Only keep the last 10 seconds of inputs
    inputTimestamps.current = inputTimestamps.current.filter(t => now - t < 10000);
    
    // Check for suspicious patterns
    if (inputTimestamps.current.length >= 10) {
      // Calculate time differences between consecutive clicks
      const intervals = [];
      for (let i = 1; i < inputTimestamps.current.length; i++) {
        intervals.push(inputTimestamps.current[i] - inputTimestamps.current[i - 1]);
      }
      
      // Check if intervals are too regular (bot-like)
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const stdDev = Math.sqrt(
        intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length
      );
      
      // Very low standard deviation indicates too regular clicking
      // Also flag if clicks are happening too rapidly
      if (stdDev < 15 || avgInterval < 50) {
        logViolation('rapid_input', `Suspicious input pattern of type: ${type}`);
        inputTimestamps.current = []; // Reset after flagging
      }
    }
  }, [enableAll, trackRapidInput, logViolation]);

  // Track suspiciously fast quiz completions
  const startActivityTimer = useCallback(() => {
    if (!enableAll || !trackSuspiciousTimings) return;
    
    // Clear any existing timer
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    
    activityTimerRef.current = setTimeout(() => {
      activityTimerRef.current = null;
    }, 500); // 500ms minimum expected time for human response
    
  }, [enableAll, trackSuspiciousTimings]);

  const checkActivityTiming = useCallback((minExpectedTime: number = 500) => {
    if (!enableAll || !trackSuspiciousTimings) return false;
    
    if (activityTimerRef.current) {
      // Timer still running, action performed too quickly
      logViolation('suspicious_timing', `Action completed too quickly: ${minExpectedTime}ms expected`);
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
      return true;
    }
    
    return false;
  }, [enableAll, trackSuspiciousTimings, logViolation]);
  
  // Check if user is currently under penalty
  const isPenaltyActive = useCallback(() => {
    if (state.penaltyActive && state.penaltyEndTime) {
      const now = Date.now();
      if (now < state.penaltyEndTime) {
        return true;
      } else {
        // Penalty has expired
        setState(prev => ({
          ...prev,
          penaltyActive: false,
          penaltyEndTime: null
        }));
        return false;
      }
    }
    return false;
  }, [state.penaltyActive, state.penaltyEndTime]);

  // Reset suspicious activity state
  const resetSuspiciousActivity = useCallback(() => {
    setState(prev => ({
      ...prev,
      suspiciousActivity: false
    }));
  }, []);

  return {
    state,
    trackInput,
    startActivityTimer,
    checkActivityTiming,
    isPenaltyActive,
    resetSuspiciousActivity,
    logViolation
  };
}

// Usage example:
// const { 
//   trackInput, 
//   startActivityTimer, 
//   checkActivityTiming, 
//   isPenaltyActive 
// } = useAntiCheat();
// 
// // When user clicks a game button
// const handleClick = () => {
//   trackInput('click');
//   if (isPenaltyActive()) {
//     toast({ title: "Action restricted", description: "Please try again later" });
//     return;
//   }
//   // Normal click handling...
// };
// 
// // When starting a quiz question
// const startQuestion = () => {
//   startActivityTimer();
//   // Show question...
// };
// 
// // When submitting an answer
// const submitAnswer = () => {
//   if (checkActivityTiming(2000)) { // Expect at least 2 seconds to read and answer
//     toast({ title: "Too fast!", description: "Please take time to read the question" });
//     return;
//   }
//   // Process answer normally...
// };