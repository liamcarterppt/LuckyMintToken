import { useState } from 'react';
import { usePredictions } from '@/hooks/use-predictions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Signal, AlertTriangle, CheckCircle, XCircle, Trophy, Clock } from 'lucide-react';

interface Prediction {
  id: number;
  question: string;
  description: string;
  options: string[];
  endDate: string;
  startDate: string;
  status: 'active' | 'pending' | 'resolved' | 'cancelled';
  reward: number;
}

interface UserPrediction {
  id: number;
  predictionId: number;
  question: string;
  selectedOption: number;
  optionText: string;
  isCorrect: boolean | null;
  reward: number | null;
  status: 'active' | 'pending' | 'resolved' | 'cancelled';
  createdAt: string;
}

export function Predictions() {
  const {
    activePredictions,
    isLoading,
    error,
    userPredictions,
    isLoadingUserPredictions,
    userPredictionsError,
    submitPrediction,
    isConnected,
  } = usePredictions();
  
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [submittingPrediction, setSubmittingPrediction] = useState<number | null>(null);
  
  // Handle option selection
  const handleOptionSelect = (predictionId: number, optionIndex: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [predictionId]: optionIndex,
    }));
  };
  
  // Handle prediction submission
  const handleSubmit = async (prediction: Prediction) => {
    const selectedOption = selectedOptions[prediction.id];
    
    if (selectedOption === undefined) {
      return; // No option selected
    }
    
    try {
      setSubmittingPrediction(prediction.id);
      await submitPrediction(prediction.id, selectedOption);
    } finally {
      setSubmittingPrediction(null);
    }
  };
  
  // Check if user has already submitted a prediction
  const hasUserSubmitted = (predictionId: number) => {
    if (!userPredictions?.predictions) return false;
    return userPredictions.predictions.some((p: UserPrediction) => p.predictionId === predictionId);
  };
  
  // Calculate time left for a prediction
  const getTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    
    if (end <= now) return 'Closed';
    
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="h-5 w-5" /> Predictions
          </CardTitle>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(error as Error).message || 'Failed to load predictions'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  if (!activePredictions || activePredictions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="h-5 w-5" /> Predictions
          </CardTitle>
          <CardDescription>No active predictions at the moment</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Signal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Check back later for prediction markets!</p>
        </CardContent>
      </Card>
    );
  }
  
  // User predictions stats
  const userStats = userPredictions?.stats || {
    total: 0,
    correct: 0,
    pending: 0,
    accuracy: 0,
    earned: 0,
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Signal className="h-5 w-5" /> Predictions
            </CardTitle>
            <CardDescription>
              Predict outcomes and earn rewards
              {isConnected && (
                <span className="ml-2 inline-flex items-center text-green-600 dark:text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 mr-1 animate-pulse"></span>
                  Live
                </span>
              )}
            </CardDescription>
          </div>
          {!userPredictionsError && userStats.total > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>Accuracy: {Math.round(userStats.accuracy)}%</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="active">Active Predictions</TabsTrigger>
            <TabsTrigger value="history" disabled={userPredictionsError !== null}>
              Your Predictions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {activePredictions.map((prediction: Prediction) => {
                  const userSubmitted = hasUserSubmitted(prediction.id);
                  const userPrediction = userPredictions?.predictions?.find(
                    (p: UserPrediction) => p.predictionId === prediction.id
                  );
                  
                  return (
                    <div 
                      key={prediction.id} 
                      className="p-4 rounded-lg border border-muted bg-card"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">{prediction.question}</h3>
                        <Badge variant={prediction.status === 'active' ? 'default' : 'outline'}>
                          {prediction.status}
                        </Badge>
                      </div>
                      
                      {prediction.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {prediction.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5" />
                          <span>Reward: {prediction.reward} LKMT</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{getTimeLeft(prediction.endDate)}</span>
                        </div>
                      </div>
                      
                      {userSubmitted ? (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-2">Your prediction:</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Option {userPrediction?.selectedOption + 1}
                            </Badge>
                            <span className="text-sm">{userPrediction?.optionText}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <RadioGroup
                            value={selectedOptions[prediction.id]?.toString()}
                            onValueChange={(value) => 
                              handleOptionSelect(prediction.id, parseInt(value))
                            }
                            className="mt-2"
                          >
                            {prediction.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem 
                                  value={index.toString()} 
                                  id={`option-${prediction.id}-${index}`}
                                />
                                <Label 
                                  htmlFor={`option-${prediction.id}-${index}`}
                                  className="cursor-pointer w-full"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          
                          <Button
                            className="w-full mt-2"
                            onClick={() => handleSubmit(prediction)}
                            disabled={
                              selectedOptions[prediction.id] === undefined || 
                              submittingPrediction === prediction.id
                            }
                          >
                            {submittingPrediction === prediction.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Prediction'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            {isLoadingUserPredictions ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userPredictions ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                    <div className="text-2xl font-semibold">
                      {Math.round(userStats.accuracy)}%
                    </div>
                    <Progress 
                      value={userStats.accuracy} 
                      className="h-2 mt-2"
                    />
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total Earned</div>
                    <div className="text-2xl font-semibold">
                      {userStats.earned} LKMT
                    </div>
                  </Card>
                </div>
                
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {userPredictions.predictions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        You haven't made any predictions yet
                      </p>
                    ) : (
                      userPredictions.predictions.map((prediction: UserPrediction) => (
                        <div 
                          key={prediction.id} 
                          className="p-3 rounded-lg border border-muted"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium">{prediction.question}</h4>
                            <Badge variant={
                              prediction.status === 'resolved' 
                                ? prediction.isCorrect === true
                                  ? 'success'
                                  : 'destructive'
                                : 'outline'
                            }>
                              {prediction.status === 'resolved'
                                ? prediction.isCorrect === true
                                  ? 'Correct'
                                  : 'Incorrect'
                                : prediction.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm">Your pick: {prediction.optionText}</div>
                            {prediction.isCorrect === true && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {prediction.isCorrect === false && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                            <span>
                              {new Date(prediction.createdAt).toLocaleDateString()}
                            </span>
                            
                            {prediction.reward > 0 && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <Trophy className="h-3.5 w-3.5" />
                                <span>+{prediction.reward} LKMT</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Sign in to view your predictions</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}