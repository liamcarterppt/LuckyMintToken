import React, { useState, useEffect } from 'react';
import SpinWheel from '@/components/games/SpinWheel';
import QuizGame from '@/components/games/QuizGame';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TelegramConnectCTA from '@/components/home/TelegramConnectCTA';

const Games: React.FC = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('spinwheel');
  
  useEffect(() => {
    // Parse game type from URL query parameter
    const params = new URLSearchParams(location.split('?')[1]);
    const gameType = params.get('type');
    
    if (gameType === 'quiz' || gameType === 'spinwheel') {
      setActiveTab(gameType);
    }
  }, [location]);
  
  return (
    <main className="container mx-auto px-4 py-6 mb-20">
      <h1 className="font-bold text-3xl mb-6">Games</h1>
      
      {/* Telegram Connect CTA */}
      <TelegramConnectCTA />
      
      {/* Game Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="spinwheel">Spin Wheel</TabsTrigger>
          <TabsTrigger value="quiz">Quiz Game</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spinwheel">
          <div className="mb-4">
            <h2 className="font-bold text-2xl mb-4">Spin Wheel</h2>
            <p className="text-foreground/70 mb-6">
              Spin the wheel and win $LKMT tokens! You get one free spin every 24 hours.
              Each spin has a chance to win various amounts of tokens or no prize at all.
            </p>
          </div>
          <SpinWheel />
        </TabsContent>
        
        <TabsContent value="quiz">
          <div className="mb-4">
            <h2 className="font-bold text-2xl mb-4">Quiz Game</h2>
            <p className="text-foreground/70 mb-6">
              Test your crypto knowledge with our quiz game! Answer questions correctly to earn
              $LKMT tokens. Be quick - each question has a time limit!
            </p>
          </div>
          <QuizGame />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Games;
