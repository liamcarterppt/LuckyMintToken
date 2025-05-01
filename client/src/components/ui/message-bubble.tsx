import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCheck, AlertTriangle, Info } from 'lucide-react';

type MessageType = 'incoming' | 'outgoing' | 'system';
type MessageStatus = 'sent' | 'delivered' | 'read' | 'error';
type MessageVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface MessageBubbleProps {
  content: React.ReactNode;
  type?: MessageType;
  status?: MessageStatus;
  variant?: MessageVariant;
  sender?: string;
  timestamp?: string;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  type = 'incoming',
  status = 'sent',
  variant = 'default',
  sender,
  timestamp,
  className,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success/10 border-success/20 text-success';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'error':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'info':
        return 'bg-accent/10 border-accent/20 text-accent';
      default:
        return type === 'outgoing'
          ? 'bg-primary/10 border-primary/20 text-primary'
          : type === 'system'
          ? 'bg-background/80 border-border text-foreground/70'
          : 'bg-card border-white/5 text-foreground';
    }
  };

  const getPositionClasses = () => {
    switch (type) {
      case 'outgoing':
        return 'ml-auto rounded-2xl rounded-br-sm';
      case 'system':
        return 'mx-auto rounded-xl';
      default:
        return 'mr-auto rounded-2xl rounded-bl-sm';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
      case 'delivered':
        return <CheckCheck className="h-3.5 w-3.5 text-foreground/40" />;
      case 'error':
        return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  const getVariantIcon = () => {
    if (type !== 'system') return null;
    
    switch (variant) {
      case 'success':
        return <CheckCheck className="h-4 w-4 text-success mr-2" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning mr-2" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive mr-2" />;
      case 'info':
        return <Info className="h-4 w-4 text-accent mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'max-w-[80%] md:max-w-[70%] border px-4 py-2.5 shadow-sm',
        getVariantClasses(),
        getPositionClasses(),
        className
      )}
    >
      {sender && (
        <div className="font-medium text-xs mb-1">
          {type === 'outgoing' ? 'You' : sender}
        </div>
      )}
      
      <div className="flex items-start">
        {getVariantIcon()}
        <div className="flex-1 break-words">{content}</div>
      </div>
      
      {(timestamp || status !== 'sent') && (
        <div className="flex items-center justify-end gap-1 mt-1">
          {timestamp && (
            <div className="text-xs opacity-60">
              {timestamp}
            </div>
          )}
          {status !== 'sent' && (
            <div className="flex">{getStatusIcon()}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;