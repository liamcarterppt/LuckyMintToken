import { useState, useEffect, useRef, useCallback } from 'react';
import useDeviceFingerprint from './use-device-fingerprint';

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

// Helper to detect VPN or proxy usage (simplified version)
const detectVPN = async (): Promise<boolean> => {
  try {
    // Check if client and server time significantly differ
    const startTime = Date.now();
    const response = await fetch('/api/stats/time');
    const endTime = Date.now();
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const serverTime = new Date(data.serverTime).getTime();
    const clientTime = new Date().getTime();
    const networkLatency = endTime - startTime;
    
    // If time difference is more than 5 minutes (accounting for network latency)
    // it might indicate time manipulation or VPN usage
    return Math.abs(serverTime - clientTime) > (5 * 60 * 1000 + networkLatency);
  } catch (error) {
    console.warn('VPN detection error:', error);
    return false;
  }
};

export function useAntiCheat(options: AntiCheatOptions = {}) {
  // Merge default options
  const mergedOptions = {
    enableAll: false,
    trackFocusChange: false,
    trackDevTools: false,
    trackRapidInput: false,
    trackSuspiciousTimings: false,
    trackVPN: false,
    applyPenalties: false,
    ...options,
    // Override with enableAll if it's true
    ...(options.enableAll ? {
      trackFocusChange: true,
      trackDevTools: true,
      trackRapidInput: true,
      trackSuspiciousTimings: true,
      trackVPN: true,
      applyPenalties: true
    } : {})
  };
  
  // Device fingerprinting
  const { fingerprint, isLoading } = useDeviceFingerprint();
  
  // State to track anti-cheat violations
  const [state, setState] = useState<AntiCheatState>({
    violations: [],
    isFlagged: false,
    suspiciousActivity: false,
    penaltyActive: false,
    penaltyEndTime: null
  });
  
  // Refs to track user behavior
  const inputEvents = useRef<Array<{ type: string, timestamp: number }>>([]);
  const focusState = useRef<{ focused: boolean, lastChange: number }>({
    focused: true,
    lastChange: Date.now()
  });
  const activityTimer = useRef<{ startTime: number | null, category: string | null }>({
    startTime: null,
    category: null
  });
  
  // Log a new violation
  const logViolation = useCallback((type: string, details?: string) => {
    setState(prev => {
      const newViolations = [...prev.violations, {
        type,
        timestamp: Date.now(),
        details
      }];
      
      // Check if we should flag the account
      const isCriticalViolation = type === 'devtools_open' || 
                                type === 'vpn_detected' || 
                                type === 'multiple_tabs';
      
      // Flag if critical violation or 3+ violations in last 5 minutes
      const recentViolations = newViolations.filter(v => 
        v.timestamp > Date.now() - 5 * 60 * 1000
      );
      
      const shouldFlag = isCriticalViolation || recentViolations.length >= 3;
      let newPenaltyActive = prev.penaltyActive;
      let newPenaltyEndTime = prev.penaltyEndTime;
      
      // Apply penalty if needed
      if (shouldFlag && mergedOptions.applyPenalties && !prev.penaltyActive) {
        newPenaltyActive = true;
        // Penalty for 10 minutes
        newPenaltyEndTime = Date.now() + 10 * 60 * 1000;
        
        // Send violation to server for tracking
        try {
          fetch('/api/security/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              details,
              fingerprint,
              violations: newViolations
            })
          }).catch(console.error);
        } catch (error) {
          console.warn('Failed to report violation:', error);
        }
      }
      
      return {
        ...prev,
        violations: newViolations,
        isFlagged: shouldFlag,
        suspiciousActivity: recentViolations.length > 0,
        penaltyActive: newPenaltyActive,
        penaltyEndTime: newPenaltyEndTime
      };
    });
  }, [fingerprint, mergedOptions.applyPenalties]);
  
  // Track input events to detect bots or auto-clickers
  const trackInput = useCallback((eventType: string) => {
    if (!mergedOptions.trackRapidInput) return;
    
    const now = Date.now();
    inputEvents.current.push({ type: eventType, timestamp: now });
    
    // Keep only last 30 events
    if (inputEvents.current.length > 30) {
      inputEvents.current = inputEvents.current.slice(-30);
    }
    
    // Check for rapid/automated input patterns
    if (inputEvents.current.length >= 10) {
      const last10 = inputEvents.current.slice(-10);
      const intervals: number[] = [];
      
      for (let i = 1; i < last10.length; i++) {
        intervals.push(last10[i].timestamp - last10[i-1].timestamp);
      }
      
      // Check for unusually consistent timing (bot behavior)
      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const deviations = intervals.map(i => Math.abs(i - averageInterval));
      const averageDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
      
      // If average deviation is very low, input might be automated
      if (averageDeviation < 15 && averageInterval < 300) {
        logViolation('automated_input', `Suspiciously regular input detected (avg: ${averageInterval.toFixed(2)}ms, dev: ${averageDeviation.toFixed(2)}ms)`);
      }
      
      // Check for extremely rapid input (auto-clicker)
      if (averageInterval < 50) {
        logViolation('rapid_input', `Extremely rapid input detected (avg: ${averageInterval.toFixed(2)}ms)`);
      }
    }
  }, [logViolation, mergedOptions.trackRapidInput]);
  
  // Start timing an activity for suspiciously fast completion
  const startActivityTimer = useCallback((category: string = 'default') => {
    if (!mergedOptions.trackSuspiciousTimings) return;
    
    activityTimer.current = {
      startTime: Date.now(),
      category
    };
  }, [mergedOptions.trackSuspiciousTimings]);
  
  // Check if activity was completed suspiciously quickly
  const checkActivityTiming = useCallback((minimumExpectedMs: number): boolean => {
    if (!mergedOptions.trackSuspiciousTimings || !activityTimer.current.startTime) {
      return false;
    }
    
    const elapsed = Date.now() - activityTimer.current.startTime;
    const isSuspicious = elapsed < minimumExpectedMs;
    
    if (isSuspicious) {
      logViolation('suspicious_timing', 
        `Activity '${activityTimer.current.category}' completed too quickly: ${elapsed}ms < ${minimumExpectedMs}ms`
      );
    }
    
    return isSuspicious;
  }, [logViolation, mergedOptions.trackSuspiciousTimings]);
  
  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    activityTimer.current = {
      startTime: null,
      category: null
    };
  }, []);
  
  // Check if penalty is currently active
  const isPenaltyActive = useCallback((): boolean => {
    if (!mergedOptions.applyPenalties) return false;
    
    // If penalty has expired, clear it
    if (state.penaltyActive && state.penaltyEndTime && Date.now() > state.penaltyEndTime) {
      setState(prev => ({
        ...prev,
        penaltyActive: false,
        penaltyEndTime: null
      }));
      return false;
    }
    
    return state.penaltyActive;
  }, [state.penaltyActive, state.penaltyEndTime, mergedOptions.applyPenalties]);
  
  // Track tab focus changes
  useEffect(() => {
    if (!mergedOptions.trackFocusChange) return;
    
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();
      const timeSinceLastChange = now - focusState.current.lastChange;
      
      // Update focus state
      focusState.current = {
        focused: isVisible,
        lastChange: now
      };
      
      // If rapidly switching focus, might be using multiple tabs/automation
      if (timeSinceLastChange < 1000) {
        logViolation('rapid_focus_change', `Rapid tab switching detected: ${timeSinceLastChange}ms`);
      }
      
      // If game is being played but tab is not focused, log it
      if (!isVisible && activityTimer.current.startTime) {
        logViolation('background_activity', 'Tab was put in background during active gameplay');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', () => {
      focusState.current = { focused: false, lastChange: Date.now() };
    });
    window.addEventListener('focus', () => {
      focusState.current = { focused: true, lastChange: Date.now() };
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', () => {});
      window.removeEventListener('focus', () => {});
    };
  }, [logViolation, mergedOptions.trackFocusChange]);
  
  // DevTools detection
  useEffect(() => {
    if (!mergedOptions.trackDevTools) return;
    
    const detectDevTools = () => {
      // Method 1: Check for developer tools via console.log
      const startTime = performance.now();
      console.log('%c', 'font-size:0;display:block;height:0');
      const endTime = performance.now();
      
      // If dev tools is open, console.log can take significantly longer
      if (endTime - startTime > 100) {
        logViolation('devtools_open', `Console log took ${endTime - startTime}ms (threshold: 100ms)`);
        return;
      }
      
      // Method 2: Check window.outerWidth/Height vs innerWidth/Height
      // When dev tools are open in certain browsers, there's a significant difference
      const widthDifference = Math.abs(window.outerWidth - window.innerWidth);
      const heightDifference = Math.abs(window.outerHeight - window.innerHeight);
      
      if (widthDifference > 200 || heightDifference > 300) {
        logViolation('devtools_open', `Window size difference suggests dev tools: width=${widthDifference}, height=${heightDifference}`);
      }
    };
    
    // Run detection initially
    detectDevTools();
    
    // Set interval for continuous detection
    const interval = setInterval(detectDevTools, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [logViolation, mergedOptions.trackDevTools]);
  
  // VPN detection
  useEffect(() => {
    if (!mergedOptions.trackVPN) return;
    
    const checkVPN = async () => {
      const isVPN = await detectVPN();
      if (isVPN) {
        logViolation('vpn_detected', 'Possible VPN or proxy detected based on time discrepancy');
      }
    };
    
    // Run detection after fingerprint is loaded
    if (!isLoading) {
      checkVPN();
    }
  }, [isLoading, logViolation, mergedOptions.trackVPN]);
  
  // Check for expired penalties periodically
  useEffect(() => {
    if (!mergedOptions.applyPenalties) return;
    
    const checkPenalties = () => {
      if (state.penaltyActive && state.penaltyEndTime && Date.now() > state.penaltyEndTime) {
        setState(prev => ({
          ...prev,
          penaltyActive: false,
          penaltyEndTime: null
        }));
      }
    };
    
    const interval = setInterval(checkPenalties, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [state.penaltyActive, state.penaltyEndTime, mergedOptions.applyPenalties]);
  
  // Track suspicious activity
  const trackSuspiciousActivity = useCallback((type: string, details: Record<string, any> = {}) => {
    logViolation(type, `${type}: ${JSON.stringify(details)}`);
    
    // Report to server
    try {
      fetch('/api/security/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          details: JSON.stringify(details),
          fingerprint,
          violations: state.violations
        })
      }).catch(console.error);
    } catch (error) {
      console.warn('Failed to report suspicious activity:', error);
    }
  }, [fingerprint, logViolation, state.violations]);

  return {
    // State
    violations: state.violations,
    isFlagged: state.isFlagged,
    suspiciousActivity: state.suspiciousActivity,
    penaltyActive: state.penaltyActive,
    fingerprint,
    
    // Actions
    trackInput,
    startActivityTimer,
    checkActivityTiming,
    resetActivityTimer,
    logViolation,
    trackSuspiciousActivity,
    isPenaltyActive
  };
}

export default useAntiCheat;