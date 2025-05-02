import { useCallback, useState, useEffect } from 'react';
import { useMobile } from './use-mobile';

type HapticFeedbackPattern = 'success' | 'error' | 'warning' | 'selection';

/**
 * Hook for providing haptic feedback on mobile devices
 * Falls back gracefully on desktop browsers
 */
export function useHapticFeedback() {
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const { isMobile } = useMobile();

  useEffect(() => {
    // Check if vibration API is supported
    if ('vibrate' in navigator) {
      setVibrationSupported(true);
    }
  }, []);

  /**
   * Trigger haptic feedback with different patterns
   */
  const triggerHaptic = useCallback((pattern: HapticFeedbackPattern = 'selection') => {
    if (!vibrationSupported || !isMobile) return;

    // Different patterns for different feedback types
    switch (pattern) {
      case 'success':
        navigator.vibrate([50, 50, 100]); // Short-pause-longer
        break;
      case 'error':
        navigator.vibrate([100, 50, 100, 50, 100]); // Three pulses
        break;
      case 'warning':
        navigator.vibrate([70, 50, 70]); // Two medium pulses
        break;
      case 'selection':
      default:
        navigator.vibrate(15); // Very brief pulse
        break;
    }
  }, [vibrationSupported, isMobile]);

  return {
    triggerHaptic,
    isSupported: vibrationSupported && isMobile
  };
}

export default useHapticFeedback;