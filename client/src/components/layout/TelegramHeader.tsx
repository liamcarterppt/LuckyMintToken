import React from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, Search, MoreVertical } from 'lucide-react';

interface TelegramHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
  avatar?: React.ReactNode;
}

const TelegramHeader: React.FC<TelegramHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  onBackClick,
  actions,
  avatar
}) => {
  const [location, navigate] = useLocation();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      // Default behavior: go back to the previous route
      window.history.back();
    }
  };

  return (
    <div className="bg-primary text-primary-foreground sticky top-0 z-40 h-14 flex items-center px-3 shadow-md">
      <div className="flex items-center w-full">
        {showBackButton && (
          <button 
            onClick={handleBackClick}
            className="mr-2 p-1.5 rounded-full hover:bg-white/10 transition-colors tg-ripple active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        
        {avatar && (
          <div className="mr-3">
            {avatar}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-base truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs opacity-80 truncate">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {actions || (
            <>
              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors tg-ripple active:scale-95">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors tg-ripple active:scale-95">
                <MoreVertical className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramHeader;