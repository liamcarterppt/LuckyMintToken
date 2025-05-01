import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Users, Award, Wallet, ArrowUpRight, Clock, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardStats: React.FC = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-card border-white/10">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <Card className="bg-card border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground/70">
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {stats?.totalUsers?.toLocaleString() || 0}
            </div>
            <Users className="h-5 w-5 text-primary" />
          </div>
          {stats?.userGrowth !== undefined && (
            <div className="flex items-center mt-2 text-xs">
              <ArrowUpRight className="h-3 w-3 mr-1 text-success" />
              <span className="text-success">{stats.userGrowth}%</span>
              <span className="text-foreground/70 ml-1">from last week</span>
            </div>
          )}
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
            <Award className="h-5 w-5 text-secondary" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground/70">
            Pending Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {stats?.pendingRewards?.toLocaleString() || 0}
            </div>
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground/70">
            Active Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {stats?.activeTasks || 0}/{stats?.totalTasks || 0}
            </div>
            <CheckSquareIcon className="h-5 w-5 text-accent" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground/70">
            Task Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {stats?.taskCompletionRate?.toFixed(1) || 0}%
            </div>
            <RefreshCw className="h-5 w-5 text-success" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground/70">
            Wallet Connected Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {stats?.walletConnectedUsers?.toLocaleString() || 0}
            </div>
            <Wallet className="h-5 w-5 text-blue-500" />
          </div>
          {stats?.walletConnectedPercentage !== undefined && (
            <div className="text-xs text-foreground/70 mt-2">
              {stats.walletConnectedPercentage}% of total users
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Custom CheckSquare icon with gradient
const CheckSquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

export default DashboardStats;
