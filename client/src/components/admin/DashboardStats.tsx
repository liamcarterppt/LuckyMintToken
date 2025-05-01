import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Gift, ListTodo, TrendingUp } from 'lucide-react';

const DashboardStats: React.FC = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
  });
  
  // Stats cards data
  const statsData = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <Users className="h-6 w-6 text-primary" />,
      change: stats?.userChange || 0,
      subtext: 'from last week',
    },
    {
      title: 'Tokens Distributed',
      value: stats?.totalTokensDistributed || 0,
      icon: <Gift className="h-6 w-6 text-secondary" />,
      valueText: `${stats?.totalTokensDistributed || 0} LKMT`,
      subtext: 'total rewards',
    },
    {
      title: 'Active Tasks',
      value: stats?.activeTasks || 0,
      icon: <ListTodo className="h-6 w-6 text-accent" />,
      subtext: `out of ${stats?.totalTasks || 0} total`,
    },
    {
      title: 'Task Completion',
      value: stats?.taskCompletionRate || 0,
      icon: <TrendingUp className="h-6 w-6 text-success" />,
      valueText: `${stats?.taskCompletionRate || 0}%`,
      subtext: 'completion rate',
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="bg-card border-white/10">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      stat.valueText || stat.value
                    )}
                  </h3>
                  {stat.change !== undefined && (
                    <span className={`text-xs ${stat.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {stat.change > 0 && '+'}{stat.change}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
              <div className="p-2 rounded-md bg-foreground/5">{stat.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;