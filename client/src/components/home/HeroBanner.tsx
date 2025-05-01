import React from 'react';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/providers/TelegramProvider';
import { useQuery } from '@tanstack/react-query';

const HeroBanner: React.FC = () => {
  const { telegramUser, connectTelegram } = useTelegram();
  
  // Fetch user profile to get LKMT balance
  const { data: userProfile } = useQuery({
    queryKey: ['/api/users/profile'],
  });
  
  // Fetch participant count
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });
  
  const participantCount = stats?.participantCount || 0;
  const lkmtBalance = userProfile?.lkmtBalance || 0;

  return (
    <section className="relative rounded-2xl overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-secondary/80 to-primary/80 p-6 md:p-10">
        <div className="max-w-xl">
          <h1 className="font-bold text-3xl md:text-4xl mb-3">Lucky Mint Token Airdrop</h1>
          <p className="text-lg mb-6">Complete tasks, play games, and earn $LKMT tokens!</p>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="bg-background/30 backdrop-blur-sm rounded-lg p-4 flex-1">
              <p className="text-sm text-foreground/70 mb-1">Your $LKMT Balance</p>
              <p className="font-bold text-2xl">{lkmtBalance.toFixed(3)} $LKMT</p>
            </div>
            <div className="bg-background/30 backdrop-blur-sm rounded-lg p-4 flex-1">
              <p className="text-sm text-foreground/70 mb-1">Airdrop Participants</p>
              <p className="font-bold text-2xl">{participantCount.toLocaleString()}</p>
            </div>
          </div>
          
          {!telegramUser && (
            <Button 
              onClick={connectTelegram}
              className="bg-accent hover:bg-accent/90 font-semibold text-white px-6 py-3 h-auto"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="h-5 w-5 mr-2 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.77 7.67c-.12 1.23-.64 5.57-1.06 8.35-.15.82-.7 1.16-1.15 1.19-.98.06-1.73-.75-2.68-1.47-.93-.72-1.47-1.14-2.36-1.84-.98-.79-.35-1.21.21-1.91.15-.18 2.66-2.48 2.7-2.69.01-.05.01-.26-.1-.37-.11-.11-.32-.07-.46-.04-.2.05-3.31 2.07-4.7 3.05-.4.25-.78.37-1.12.37-.38 0-.75-.16-1.11-.31-.85-.35-1.64-.52-1.8-.55-.76-.11-.67-.95.32-1.44l7.17-3.14c.86-.38 3.88-1.62 4.05-1.68 1.2-.33 2.21.28 1.93 1.27l-.01.02z" />
              </svg>
              Connect with Telegram
            </Button>
          )}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-primary/20 blur-2xl"></div>
      <div className="absolute -top-10 right-20 w-20 h-20 rounded-full bg-secondary/30 blur-xl"></div>
    </section>
  );
};

export default HeroBanner;
