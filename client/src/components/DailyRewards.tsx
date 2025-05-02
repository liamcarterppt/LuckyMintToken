import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Gift, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { Skeleton } from '@/components/ui/skeleton';

export function DailyRewards() {
  const { toast } = useToast();
  const { triggerHaptic } = useHapticFeedback();
  const queryClient = useQueryClient();
  const [nextRewardTime, setNextRewardTime] = useState<string | null>(null);

  // Get all daily rewards
  const { data: dailyRewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ['/api/daily-rewards'],
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Get user streak information
  const { 
    data: userStreak, 
    isLoading: isLoadingStreak,
    isError: isStreakError,
    error: streakError 
  } = useQuery({
    queryKey: ['/api/daily-rewards/streak'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Claim daily reward mutation
  const { mutate: claimReward, isPending: isClaimingReward } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/daily-rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to claim reward');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/daily-rewards/streak'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/activity'] });
      
      // Show success toast
      toast({
        title: 'Daily Reward Claimed!',
        description: `You received ${data.reward} LKMT tokens (Day ${data.day})`,
        variant: 'success',
      });
      
      // Trigger haptic feedback
      triggerHaptic('success');
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: 'Failed to claim reward',
        description: error.message,
        variant: 'destructive',
      });
      
      // Trigger haptic feedback
      triggerHaptic('error');
    },
  });

  // Update next reward time countdown
  useEffect(() => {
    if (!userStreak || !userStreak.history || userStreak.history.length === 0) {
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const lastLogin = new Date(userStreak.history[0].loginDate);
      
      // Set to midnight of the next day
      const nextReward = new Date(lastLogin);
      nextReward.setDate(nextReward.getDate() + 1);
      nextReward.setHours(0, 0, 0, 0);
      
      if (nextReward > now) {
        setNextRewardTime(formatDistanceToNow(nextReward, { addSuffix: true }));
      } else {
        setNextRewardTime('Available now!');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [userStreak]);

  // Determine if reward is available to claim
  const isRewardAvailable = userStreak && userStreak.history?.length > 0 
    ? new Date(userStreak.history[0].loginDate).getDate() !== new Date().getDate()
    : true;

  // Loading state
  if (isLoadingRewards || isLoadingStreak) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // Error state - Not authenticated
  if (isStreakError) {
    const errorMessage = (streakError as Error)?.message || 'Failed to load streak information';
    if (errorMessage.includes('Authentication required')) {
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Daily Rewards
            </CardTitle>
            <CardDescription>Sign in to claim your daily rewards and build a streak</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>Sign in to start earning daily rewards!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Claim rewards every day to build your streak and earn bonus tokens.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    // Other errors
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Rewards</CardTitle>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Daily Rewards
        </CardTitle>
        <CardDescription>
          {userStreak?.isActive
            ? `You have a ${userStreak.streak} day streak!`
            : 'Claim your daily reward'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">Current streak: {userStreak?.streak || 0} days</span>
          </div>
          {nextRewardTime && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Next reward: {nextRewardTime}</span>
            </div>
          )}
        </div>
        
        {/* Streak visualization */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, index) => {
            const day = index + 1;
            const isActive = (userStreak?.streak || 0) >= day;
            const isCurrent = (userStreak?.streak || 0) === day;
            
            return (
              <div
                key={`day-${day}`}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-center p-1 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-muted'
                }`}
              >
                <span className="text-xs font-medium">Day {day}</span>
                <span className="text-xs">
                  {dailyRewards?.[day - 1]?.reward || '10'} LKMT
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!isRewardAvailable || isClaimingReward}
          onClick={() => claimReward()}
        >
          {isClaimingReward ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Claiming...
            </>
          ) : isRewardAvailable ? (
            <>
              <Gift className="mr-2 h-4 w-4" /> Claim Today's Reward
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Already Claimed Today
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}