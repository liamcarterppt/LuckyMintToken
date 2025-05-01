import React, { useEffect } from 'react';
import SpinWheel from '@/components/games/SpinWheel';
import { useTelegram } from '@/providers/TelegramProvider';
import { Link } from 'wouter';
import { ArrowLeft, Gift } from 'lucide-react';
import TelegramConnectCTA from '@/components/home/TelegramConnectCTA';

const SpinWheelPage: React.FC = () => {
  const { telegramUser } = useTelegram();
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <main className="container mx-auto px-4 py-6 mb-20">
      {/* Header with navigation */}
      <div className="flex items-center mb-6">
        <Link href="/games">
          <a className="flex items-center mr-4 text-foreground/70 hover:text-foreground transition-colors tg-ripple p-2 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </a>
        </Link>
        <h1 className="font-bold text-2xl">Spin Wheel</h1>
        <div className="ml-auto flex items-center">
          <div className="bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
            Daily: <span className="font-bold">3 spins</span>
          </div>
        </div>
      </div>
      
      {/* Telegram Connect CTA */}
      {!telegramUser && <TelegramConnectCTA />}
      
      {/* Intro Card */}
      <div className="bg-card border border-white/5 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 rounded-full p-3">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-2xl mb-2">Spin The Wheel of Fortune!</h2>
            <p className="text-foreground/70 mb-4">
              Try your luck and win $LKMT tokens! You get one free spin every 24 hours.
              Each spin has a chance to win various amounts of tokens or no prize at all.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-background/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-foreground/60">Rewards:</span> <span className="font-medium">$LKMT Tokens</span>
              </div>
              <div className="bg-background/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-foreground/60">Frequency:</span> <span className="font-medium">Every 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spin Wheel Component */}
      <SpinWheel />
    </main>
  );
};

export default SpinWheelPage;