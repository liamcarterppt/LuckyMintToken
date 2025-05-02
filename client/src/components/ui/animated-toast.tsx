import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Volume2,
  Volume1,
  VolumeX
} from 'lucide-react';
import { useSoundEffects } from '@/hooks/use-sound-effects';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface AnimatedToastProps {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
  showMuteToggle?: boolean;
}

const variantMap = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success',
    textColor: 'text-success-foreground',
    sound: 'success',
    haptic: 'success' as const
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-destructive',
    textColor: 'text-destructive-foreground',
    sound: 'error',
    haptic: 'error' as const
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warning',
    textColor: 'text-warning-foreground',
    sound: 'notification',
    haptic: 'warning' as const
  },
  info: {
    icon: Info,
    bgColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    sound: 'notification',
    haptic: 'short' as const
  }
};

const AnimatedToast: React.FC<AnimatedToastProps> = ({
  title,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
  action,
  showMuteToggle = false
}) => {
  const [visible, setVisible] = useState(true);
  const { play, muted, toggleMute } = useSoundEffects();
  const { triggerHaptic } = useHapticFeedback();
  
  const variantConfig = variantMap[variant];
  const Icon = variantConfig.icon;
  
  useEffect(() => {
    // Play sound and haptic feedback when toast appears
    play(variantConfig.sound as any);
    triggerHaptic(variantConfig.haptic as HapticFeedbackPattern);
    
    // Auto-dismiss toast after duration
    let timeoutId: NodeJS.Timeout | null = null;
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          onClose?.();
        }, 300); // Allow exit animation to complete
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Allow exit animation to complete
  };
  
  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-auto px-4 z-50 pointer-events-none`}
    >
      <div 
        className={`
          ${visible ? 'tg-toast-enter-active' : 'tg-toast-exit-active'}
          ${variantConfig.bgColor} ${variantConfig.textColor}
          rounded-lg shadow-lg p-4 pointer-events-auto
          transition-all duration-300 animate-slideUp
          flex items-start
        `}
      >
        <div className="flex-shrink-0 mr-3">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{title}</h4>
          {message && <p className="text-xs opacity-90 mt-1">{message}</p>}
          {action && <div className="mt-2">{action}</div>}
        </div>
        <div className="ml-3 flex items-center space-x-2">
          {showMuteToggle && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          )}
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedToast;