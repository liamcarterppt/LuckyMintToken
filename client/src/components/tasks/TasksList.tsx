import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Task, UserTask } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTelegram } from '@/providers/TelegramProvider';
import { useWeb3 } from '@/providers/Web3Provider';
import { 
  Layers, 
  TwitterIcon, 
  UsersIcon, 
  GithubIcon, 
  LinkIcon,
  CheckCircle2
} from 'lucide-react';

const TasksList: React.FC = () => {
  const { toast } = useToast();
  const { telegramUser } = useTelegram();
  const { web3State } = useWeb3();
  
  // Fetch all available tasks
  const { data: tasks, isLoading: isTasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });
  
  // Fetch user's completed tasks
  const { data: userTasks, isLoading: isUserTasksLoading } = useQuery<UserTask[]>({
    queryKey: ['/api/users/tasks'],
    enabled: !!telegramUser || !!web3State.isConnected,
  });
  
  // Track which task is currently being completed
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  
  // Check if a task is completed by the user
  const isTaskCompleted = (taskId: number) => {
    return userTasks?.some(ut => ut.taskId === taskId && 
      (ut.status === 'completed' || ut.status === 'verified'));
  };
  
  // Task completion handler
  const handleCompleteTask = async (task: Task) => {
    if (!telegramUser && !web3State.isConnected) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Telegram account or wallet to complete tasks",
        variant: "destructive"
      });
      return;
    }
    
    setCompletingTaskId(task.id);
    
    try {
      await apiRequest('POST', `/api/tasks/${task.id}/complete`, {});
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/users/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      
      toast({
        title: "Task Completed",
        description: `You've earned ${task.reward} $LKMT tokens!`,
      });
    } catch (error: any) {
      toast({
        title: "Task Completion Failed",
        description: error.message || "Failed to complete the task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompletingTaskId(null);
    }
  };
  
  // Get the appropriate icon for a task
  const getTaskIcon = (task: Task) => {
    switch (task.type) {
      case 'telegram':
        return <Layers className="text-primary" />;
      case 'social':
        return <TwitterIcon className="text-secondary" />;
      case 'referral':
        return <UsersIcon className="text-accent" />;
      case 'quiz':
        return <GithubIcon className="text-[#22C55E]" />;
      default:
        return <LinkIcon className="text-[#F59E0B]" />;
    }
  };
  
  if (isTasksLoading) {
    return <div className="text-center py-6">Loading tasks...</div>;
  }
  
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <p>No tasks available at the moment. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => {
        const completed = isTaskCompleted(task.id);
        
        return (
          <div key={task.id} className="game-card bg-card rounded-xl overflow-hidden border border-white/5">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  {getTaskIcon(task)}
                </div>
                <span className="bg-success/10 text-success text-xs font-medium px-3 py-1 rounded-full">
                  +{task.reward} $LKMT
                </span>
              </div>
              
              <h3 className="font-medium text-lg mb-2">{task.title}</h3>
              <p className="text-sm text-foreground/70 mb-4">{task.description}</p>
              
              <Button
                variant="outline"
                className={`w-full ${
                  completed
                    ? "bg-success/10 text-success border-success"
                    : "bg-card border-primary text-primary hover:bg-primary/10"
                }`}
                onClick={() => !completed && handleCompleteTask(task)}
                disabled={completingTaskId === task.id || completed}
              >
                {completingTaskId === task.id ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : completed ? (
                  <span className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Completed
                  </span>
                ) : (
                  "Complete Task"
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TasksList;
