import React from 'react';
import TasksList from '@/components/tasks/TasksList';
import TelegramConnectCTA from '@/components/home/TelegramConnectCTA';
import { useQuery } from '@tanstack/react-query';

const Tasks: React.FC = () => {
  // Fetch user stats for tasks
  const { data: stats } = useQuery({
    queryKey: ['/api/users/stats'],
  });
  
  const completedTasks = stats?.completedTasks || 0;
  const totalTasks = stats?.totalTasks || 0;
  const taskEarnings = stats?.taskEarnings || 0;

  return (
    <main className="container mx-auto px-4 py-6 mb-20">
      <h1 className="font-bold text-3xl mb-6">Tasks</h1>
      
      {/* Telegram Connect CTA */}
      <TelegramConnectCTA />
      
      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg p-4 flex flex-col">
          <span className="text-sm text-foreground/70 mb-1">Completed Tasks</span>
          <div className="flex items-center mt-1">
            <span className="text-2xl font-bold">{completedTasks}</span>
            <span className="text-sm text-foreground/70 ml-1">/ {totalTasks}</span>
          </div>
          <div className="mt-2 bg-background h-2 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full" 
              style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }} 
            />
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 flex flex-col">
          <span className="text-sm text-foreground/70 mb-1">Total Earnings</span>
          <span className="text-2xl font-bold">{taskEarnings} $LKMT</span>
          <span className="text-sm text-foreground/70 mt-1">From tasks</span>
        </div>
        
        <div className="bg-card rounded-lg p-4 flex flex-col">
          <span className="text-sm text-foreground/70 mb-1">Task Completion</span>
          <span className="text-2xl font-bold">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </span>
          <span className="text-sm text-foreground/70 mt-1">Progress</span>
        </div>
      </div>
      
      {/* Task List */}
      <section>
        <h2 className="font-bold text-2xl mb-5">Available Tasks</h2>
        <TasksList />
      </section>
    </main>
  );
};

export default Tasks;
