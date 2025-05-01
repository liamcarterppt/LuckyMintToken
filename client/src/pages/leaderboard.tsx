import React from 'react';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, Users, Award, Trophy } from 'lucide-react';

const Leaderboard: React.FC = () => {
  // Fetch leaderboard stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats/leaderboard'],
  });
  
  return (
    <main className="container mx-auto px-4 py-6 mb-20">
      <h1 className="font-bold text-3xl mb-6">Leaderboard</h1>
      
      {/* Leaderboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground/70">
              Total Participants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {stats?.totalParticipants?.toLocaleString() || 0}
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground/70">
              Total $LKMT Distributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {stats?.totalDistributed?.toLocaleString() || 0}
              </div>
              <ArrowUp className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground/70">
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {stats?.totalTasksCompleted?.toLocaleString() || 0}
              </div>
              <Award className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground/70">
              Top Earner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold truncate">
                {stats?.topEarner?.username ? `@${stats.topEarner.username}` : 'N/A'}
              </div>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            {stats?.topEarner?.amount && (
              <div className="text-sm text-foreground/70 mt-1">
                {stats.topEarner.amount} $LKMT
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Leaderboard Table */}
      <section>
        <h2 className="font-bold text-2xl mb-5">Top Players</h2>
        <LeaderboardTable limit={20} />
      </section>
    </main>
  );
};

export default Leaderboard;
