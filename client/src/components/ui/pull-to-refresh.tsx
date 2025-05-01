import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  pullDistance?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  pullDistance = 80,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    // Only allow pull to refresh when at the top of the page
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    setIsPulling(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return;
    
    currentY.current = e.touches[0].clientY;
    const pullDistance = Math.max(0, currentY.current - startY.current);
    
    // Add resistance to the pull, so it gets harder the further you pull
    const newPullY = Math.min(pullDistance * 0.4, pullDistance);
    setPullY(newPullY);
    
    // Prevent default when pulling down to avoid page scroll
    if (pullDistance > 10 && window.scrollY === 0) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    if (pullY > pullDistance) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullY(pullDistance / 2); // Show a bit of the refreshing indicator
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
        setPullY(0);
      }
    } else {
      // Reset pull without refreshing
      setPullY(0);
    }
    
    setIsPulling(false);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-all overflow-hidden z-10 top-0"
        style={{
          height: `${pullY}px`,
          opacity: pullY / pullDistance,
        }}
      >
        <div className="flex items-center space-x-2">
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-foreground">{refreshingText}</span>
            </>
          ) : (
            <>
              <div
                className="h-4 w-4 text-primary transition-transform"
                style={{
                  transform: `rotate(${Math.min(180, (pullY / pullDistance) * 180)}deg)`,
                }}
              >
                ↓
              </div>
              <span className="text-sm text-foreground">
                {pullY > pullDistance ? releaseText : pullText}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullY}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;