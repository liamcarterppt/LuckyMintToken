import React from 'react';

interface TypingIndicatorProps {
  className?: string;
  text?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  className = '', 
  text
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {text && <span className="text-xs text-muted-foreground mr-2">{text}</span>}
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default TypingIndicator;