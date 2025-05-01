import React from 'react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'accent';
  label?: string;
  position?: 'bottom-right' | 'bottom-center';
  className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  color = 'primary',
  label,
  position = 'bottom-right',
  className,
}) => {
  // Determine color classes based on the color prop
  const colorClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
  };

  // Determine position classes
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {label && (
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background/90 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
          {label}
        </span>
      )}
      <button
        onClick={onClick}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-105 active:scale-95 tg-ripple',
          colorClasses[color],
          className
        )}
      >
        {icon}
      </button>
    </div>
  );
};

export default FloatingActionButton;