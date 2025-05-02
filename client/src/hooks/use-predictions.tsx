import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';

/**
 * Custom hook for managing predictions with WebSocket real-time updates
 */
export function usePredictions() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const { triggerHaptic } = useHapticFeedback();
  const queryClient = useQueryClient();
  
  // Query for active predictions
  const { data: activePredictions, isLoading, error } = useQuery({
    queryKey: ['/api/predictions/active'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Setup WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Create new WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        
        // Send a ping message every 30 seconds to keep the connection alive
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        // Clean up interval on close
        socket.onclose = () => {
          console.log('WebSocket connection closed');
          setIsConnected(false);
          clearInterval(pingInterval);
          
          // Try to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'predictions') {
            // Update the query cache with new predictions data
            queryClient.setQueryData(['/api/predictions/active'], message.data);
            
            // Notify user about updates
            toast({
              title: 'Predictions Updated',
              description: 'New prediction data is available',
              variant: 'default',
            });
            
            // Trigger haptic feedback for update
            triggerHaptic('success');
          } else if (message.type === 'pong') {
            // Just a pong response, no action needed
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      socketRef.current = socket;
    };
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [queryClient, toast, triggerHaptic]);
  
  // Function to submit a prediction
  const submitPrediction = useCallback(async (predictionId: number, selectedOption: number) => {
    try {
      const response = await fetch('/api/predictions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictionId,
          selectedOption,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit prediction');
      }
      
      const result = await response.json();
      
      // Update user predictions cache
      queryClient.invalidateQueries({
        queryKey: ['/api/predictions/user'],
      });
      
      // Success feedback
      toast({
        title: 'Prediction Submitted',
        description: `You selected option ${selectedOption + 1}`,
        variant: 'success',
      });
      
      triggerHaptic('success');
      return result;
    } catch (error: any) {
      // Error feedback
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit prediction',
        variant: 'destructive',
      });
      
      triggerHaptic('error');
      throw error;
    }
  }, [queryClient, toast, triggerHaptic]);
  
  // Query for user predictions (only runs when user is authenticated)
  const {
    data: userPredictions,
    isLoading: isLoadingUserPredictions,
    error: userPredictionsError,
  } = useQuery({
    queryKey: ['/api/predictions/user'],
    retry: false,
    // This query will fail for non-authenticated users, which is expected
  });
  
  return {
    activePredictions,
    isLoading,
    error,
    userPredictions,
    isLoadingUserPredictions,
    userPredictionsError,
    submitPrediction,
    isConnected,
  };
}