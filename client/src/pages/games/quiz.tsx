import React, { useEffect } from 'react';
import QuizGame from '@/components/games/QuizGame';
import { useTelegram } from '@/providers/TelegramProvider';
import { Link } from 'wouter';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import TelegramConnectCTA from '@/components/home/TelegramConnectCTA';

const QuizPage: React.FC = () => {
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
        <h1 className="font-bold text-2xl">Quiz Game</h1>
        <div className="ml-auto flex items-center">
          <div className="bg-secondary/10 text-secondary text-xs font-medium px-3 py-1.5 rounded-full">
            Beta
          </div>
        </div>
      </div>
      
      {/* Telegram Connect CTA */}
      {!telegramUser && <TelegramConnectCTA />}
      
      {/* Intro Card */}
      <div className="bg-card border border-white/5 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-secondary/10 rounded-full p-3">
            <BrainCircuit className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h2 className="font-bold text-2xl mb-2">Test Your Crypto Knowledge!</h2>
            <p className="text-foreground/70 mb-4">
              Answer crypto and blockchain questions correctly to earn $LKMT tokens! 
              Each question has a time limit, so think quickly but carefully.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="bg-background/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-foreground/60">Rewards:</span> <span className="font-medium">$LKMT Tokens</span>
              </div>
              <div className="bg-background/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-foreground/60">Difficulty:</span> <span className="font-medium">Mixed</span>
              </div>
              <div className="bg-background/40 rounded-lg px-3 py-2 text-sm">
                <span className="text-foreground/60">Time Limit:</span> <span className="font-medium">30 seconds per question</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quiz Game Component */}
      <QuizGame />
    </main>
  );
};

export default QuizPage;