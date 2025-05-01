import React from 'react';
import { useLocation } from 'wouter';
import { 
  CircleDollarSign, 
  Gift, 
  BrainCircuit, 
  PanelRight, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import TelegramConnectCTA from '@/components/home/TelegramConnectCTA';

const Games: React.FC = () => {
  const [_, setLocation] = useLocation();
  
  // Game menu items
  const gameItems = [
    {
      id: 'spinwheel',
      title: 'Spin Wheel',
      description: 'Spin the wheel to win $LKMT tokens!',
      icon: <Gift className="h-8 w-8 text-primary" />,
      colorClass: 'bg-primary/10',
      path: '/games/spinwheel',
      available: true
    },
    {
      id: 'quiz',
      title: 'Crypto Quiz',
      description: 'Test your crypto knowledge and earn rewards',
      icon: <BrainCircuit className="h-8 w-8 text-secondary" />,
      colorClass: 'bg-secondary/10',
      path: '/games/quiz',
      available: true
    },
    {
      id: 'lottery',
      title: 'Token Lottery',
      description: 'Weekly lottery with $LKMT prize pool',
      icon: <CircleDollarSign className="h-8 w-8 text-accent" />,
      colorClass: 'bg-accent/10',
      path: '/games/lottery',
      available: false,
      comingSoon: true
    },
    {
      id: 'prediction',
      title: 'Price Prediction',
      description: 'Predict crypto prices and win tokens',
      icon: <PanelRight className="h-8 w-8 text-foreground" />,
      colorClass: 'bg-foreground/10',
      path: '/games/prediction',
      available: false,
      comingSoon: true
    }
  ];
  
  return (
    <main className="container mx-auto px-4 py-6 mb-20">
      <h1 className="font-bold text-3xl mb-6">Games</h1>
      
      {/* Telegram Connect CTA */}
      <TelegramConnectCTA />
      
      {/* Game Menu */}
      <div className="grid gap-4 mb-6">
        {gameItems.map((game) => (
          <div 
            key={game.id}
            className={`game-card tg-ripple bg-card border border-white/5 rounded-xl overflow-hidden ${game.available ? 'cursor-pointer' : 'opacity-80'}`}
            onClick={() => game.available && setLocation(game.path)}
          >
            <div className="flex items-center p-4">
              <div className={`${game.colorClass} p-3 rounded-xl mr-4`}>
                {game.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <h3 className="font-bold text-lg">{game.title}</h3>
                  {game.comingSoon && (
                    <div className="ml-2 px-2 py-1 bg-background rounded-full flex items-center">
                      <Sparkles className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="text-xs font-medium">Coming Soon</span>
                    </div>
                  )}
                </div>
                <p className="text-foreground/60 text-sm line-clamp-2">{game.description}</p>
              </div>
              {game.available && (
                <ChevronRight className="h-5 w-5 text-foreground/40 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Info Card */}
      <div className="bg-background/50 rounded-xl p-4 text-sm text-foreground/70">
        <p className="mb-2">
          <span className="font-medium text-foreground">Play games to earn $LKMT tokens!</span> Each game has different
          rewards and mechanics.
        </p>
        <p>Complete tasks, invite friends, and play games regularly to maximize your earnings.</p>
      </div>
    </main>
  );
};

export default Games;
