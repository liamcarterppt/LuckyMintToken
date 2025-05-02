import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, CheckCircle, Lock, Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Achievement {
  id: number;
  title: string;
  description: string;
  type: string;
  requirement: number;
  reward: number;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  isRewarded?: boolean;
}

export function Achievements() {
  const { toast } = useToast();
  const { triggerHaptic } = useHapticFeedback();
  const queryClient = useQueryClient();
  
  // Get all achievements and user progress
  const { 
    data: achievementsData, 
    isLoading,
    isError,
    error 
  } = useQuery({
    queryKey: ['/api/achievements/user'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Claim achievement reward mutation
  const { mutate: claimReward, isPending } = useMutation({
    mutationFn: async (achievementId: number) => {
      const response = await fetch(`/api/achievements/${achievementId}/claim`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/activity'] });
      
      // Show success toast
      toast({
        title: 'Achievement Reward Claimed!',
        description: `You received ${data.reward} LKMT tokens for ${data.achievement}`,
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
  
  // Group achievements by type
  const groupedAchievements = achievementsData?.achievements?.reduce((groups: Record<string, Achievement[]>, achievement: Achievement) => {
    const type = achievement.type || 'general';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(achievement);
    return groups;
  }, {}) || {};
  
  // Get the achievement types for tabs
  const achievementTypes = Object.keys(groupedAchievements);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  // Error state - Not authenticated
  if (isError) {
    const errorMessage = (error as Error)?.message || 'Failed to load achievement information';
    if (errorMessage.includes('Authentication required')) {
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> Achievements
            </CardTitle>
            <CardDescription>Sign in to view and earn achievements</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>Sign in to start unlocking achievements!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete tasks and activities to earn rewards
            </p>
          </CardContent>
        </Card>
      );
    }
    
    // Other errors
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{errorMessage}</p>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (!achievementsData?.achievements || achievementsData.achievements.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" /> Achievements
          </CardTitle>
          <CardDescription>No achievements available yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Check back later for achievements to unlock!</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" /> Achievements
        </CardTitle>
        <CardDescription>
          Unlocked {achievementsData.unlockedCount} of {achievementsData.totalCount} achievements
        </CardDescription>
        <Progress 
          value={(achievementsData.unlockedCount / achievementsData.totalCount) * 100} 
          className="h-2 mt-2"
        />
      </CardHeader>
      <CardContent>
        {achievementTypes.length > 1 ? (
          <Tabs defaultValue={achievementTypes[0]} className="w-full">
            <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${achievementTypes.length}, 1fr)` }}>
              {achievementTypes.map(type => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
            {achievementTypes.map(type => (
              <TabsContent key={type} value={type} className="space-y-4 mt-4">
                {groupedAchievements[type].map((achievement) => (
                  <AchievementItem 
                    key={achievement.id} 
                    achievement={achievement}
                    onClaimReward={() => claimReward(achievement.id)}
                    isPending={isPending}
                  />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-4">
            {(achievementsData.achievements as Achievement[]).map((achievement) => (
              <AchievementItem 
                key={achievement.id} 
                achievement={achievement}
                onClaimReward={() => claimReward(achievement.id)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AchievementItemProps {
  achievement: Achievement;
  onClaimReward: () => void;
  isPending: boolean;
}

function AchievementItem({ achievement, onClaimReward, isPending }: AchievementItemProps) {
  const isUnlocked = achievement.unlocked;
  const isRewardClaimed = achievement.isRewarded;
  const canClaimReward = isUnlocked && !isRewardClaimed;
  
  return (
    <div className={`p-4 rounded-lg border flex justify-between items-center ${
      isUnlocked ? 'border-primary bg-primary/5' : 'border-muted bg-muted/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isUnlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {isUnlocked ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{achievement.title}</h4>
            <Badge variant={isUnlocked ? "default" : "outline"} className="capitalize ml-1">
              {achievement.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
          {isUnlocked && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="ml-4 text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 mb-2">
          <Gift className="h-4 w-4" />
          <span>{achievement.reward} LKMT</span>
        </div>
        {canClaimReward && (
          <Button 
            size="sm" 
            onClick={onClaimReward}
            disabled={isPending}
          >
            {isPending ? 'Claiming...' : 'Claim'}
          </Button>
        )}
        {isRewardClaimed && (
          <span className="text-xs text-muted-foreground">Claimed</span>
        )}
        {!isUnlocked && (
          <span className="text-xs text-muted-foreground">Locked</span>
        )}
      </div>
    </div>
  );
}