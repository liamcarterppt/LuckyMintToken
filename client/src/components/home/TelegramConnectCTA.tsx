import React from 'react';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/providers/TelegramProvider';
import { AlertTriangle } from 'lucide-react';

const TelegramConnectCTA: React.FC = () => {
  const { telegramUser, connectTelegram, telegramAuthEnabled } = useTelegram();
  
  // Don't show if Telegram auth is disabled or user is already connected
  if (!telegramAuthEnabled || telegramUser) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl p-5 mb-8 border border-yellow-500/20">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="bg-yellow-500/10 p-3 rounded-full">
          <AlertTriangle className="text-yellow-500 h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-lg mb-1">Connect your Telegram to start earning!</h3>
          <p className="text-foreground/70">You need to connect your Telegram account to participate in the airdrop games.</p>
        </div>
        <Button 
          onClick={connectTelegram} 
          className="bg-accent hover:bg-accent/90 text-white whitespace-nowrap"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="h-4 w-4 mr-2 fill-current"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.77 7.67c-.12 1.23-.64 5.57-1.06 8.35-.15.82-.7 1.16-1.15 1.19-.98.06-1.73-.75-2.68-1.47-.93-.72-1.47-1.14-2.36-1.84-.98-.79-.35-1.21.21-1.91.15-.18 2.66-2.48 2.7-2.69.01-.05.01-.26-.1-.37-.11-.11-.32-.07-.46-.04-.2.05-3.31 2.07-4.7 3.05-.4.25-.78.37-1.12.37-.38 0-.75-.16-1.11-.31-.85-.35-1.64-.52-1.8-.55-.76-.11-.67-.95.32-1.44l7.17-3.14c.86-.38 3.88-1.62 4.05-1.68 1.2-.33 2.21.28 1.93 1.27l-.01.02z" />
          </svg>
          Connect Now
        </Button>
      </div>
    </div>
  );
};

export default TelegramConnectCTA;
