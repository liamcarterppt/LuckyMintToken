import React from 'react';
import HeroBanner from '@/components/home/HeroBanner';
import GameNavigation from '@/components/home/GameNavigation';
import TelegramConnectCTA from '@/components/home/TelegramConnectCTA';
import TasksList from '@/components/tasks/TasksList';
import SpinWheel from '@/components/games/SpinWheel';
import QuizGame from '@/components/games/QuizGame';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';

const Home: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-6 mb-20">
      {/* Hero Banner */}
      <HeroBanner />
      
      {/* Game Navigation Tabs */}
      <GameNavigation />
      
      {/* Telegram Connect CTA - only shown if not connected */}
      <TelegramConnectCTA />
      
      {/* Tasks Section */}
      <section className="mb-10">
        <h2 className="font-bold text-2xl mb-5">Complete Tasks</h2>
        <TasksList />
      </section>
      
      {/* Spin Wheel Game */}
      <section className="mb-10">
        <h2 className="font-bold text-2xl mb-5">Spin Wheel</h2>
        <SpinWheel />
      </section>
      
      {/* Quiz Game */}
      <section className="mb-10">
        <h2 className="font-bold text-2xl mb-5">Quiz Game</h2>
        <QuizGame />
      </section>
      
      {/* Leaderboard Section */}
      <section>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-2xl">Leaderboard</h2>
        </div>
        <LeaderboardTable limit={5} showViewAll={true} />
      </section>
    </main>
  );
};

export default Home;
