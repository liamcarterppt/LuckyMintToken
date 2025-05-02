import { useState, useCallback, useEffect } from 'react';

type VibrationPattern = 'short' | 'medium' | 'long' | 'success' | 'error' | 'warning';

const patterns: Record<VibrationPattern, number | number[]> = {
  short: 10,
  medium: 50,
  long: 100,
  success: [50, 30, 100],
  error: [100, 30, 100, 30, 100],
  warning: [30, 20, 30, 20, 30]
};

export function useHapticFeedback() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    // Try to load preference from localStorage
    const savedPreference = localStorage.getItem('hapticFeedbackEnabled');
    return savedPreference ? savedPreference === 'true' : true;
  });
  
  const [isSupported, setIsSupported] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if vibration is supported
    setIsSupported('vibrate' in navigator);
    
    // Save enabled preference when it changes
    localStorage.setItem('hapticFeedbackEnabled', enabled.toString());
  }, [enabled]);
  
  const trigger = useCallback((pattern: VibrationPattern = 'short') => {
    if (!enabled || !isSupported) return;
    
    try {
      navigator.vibrate(patterns[pattern]);
    } catch (error) {
      console.warn('Failed to trigger haptic feedback:', error);
    }
  }, [enabled, isSupported]);
  
  const toggleEnabled = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);
  
  return { trigger, enabled, toggleEnabled, isSupported };
}

// To use this hook:
// const { trigger, enabled, toggleEnabled, isSupported } = useHapticFeedback();
// trigger('success'); // To trigger haptic feedback
// <button onClick={toggleEnabled} disabled={!isSupported}>{enabled ? 'Disable' : 'Enable'} haptics</button>