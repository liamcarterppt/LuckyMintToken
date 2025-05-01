import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const ActivityHistory: React.FC = () => {
  const [activityType, setActivityType] = useState<string>("all");
  
  // Fetch activity history
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/users/activity', activityType],
  });
  
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'spin':
        return (
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.0001 12C21.0001 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21.0001 12 21.0001C10.8181 21.0001 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 2.99995 13.1819 3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.5 7.5L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 3.5L10.5 7.5L14.5 9.5L18.5 7.5L16.5 3.5L12 2L8.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'quiz':
        return (
          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
            <svg className="h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.09009 9.00003C9.32519 8.33169 9.78924 7.76813 10.4 7.40915C11.0108 7.05018 11.729 6.91896 12.4273 7.03873C13.1255 7.15851 13.7589 7.52153 14.2151 8.06353C14.6713 8.60554 14.9211 9.29153 14.9201 10C14.9201 12 11.9201 13 11.9201 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'referral':
        return (
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
            <svg className="h-4 w-4 text-success" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'claim':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <svg className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 8H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 8H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 12H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
            <svg className="h-4 w-4 text-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-white/10">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">Activity History</CardTitle>
          <Select 
            value={activityType} 
            onValueChange={setActivityType}
          >
            <SelectTrigger className="w-[180px] bg-background/30 border-white/10">
              <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="spin">Spin Wheel</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="referral">Referrals</SelectItem>
              <SelectItem value="claim">Claims</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !activities?.length ? (
            <div className="text-center py-8 text-foreground/60">
              <p>No activity history available</p>
            </div>
          ) : (
            <div className="rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-background/20">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity: any) => (
                    <TableRow key={activity.id} className="border-b border-white/5 hover:bg-white/5">
                      <TableCell>{renderActivityIcon(activity.type)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-xs text-foreground/60 md:hidden">
                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.reward ? (
                          <span className={activity.reward > 0 ? 'text-success' : 'text-destructive'}>
                            {activity.reward > 0 ? '+' : ''}{activity.reward} $LKMT
                          </span>
                        ) : (
                          <span className="text-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={
                          activity.status === 'completed' ? 'bg-success/10 text-success' : 
                          activity.status === 'verified' ? 'bg-success/10 text-success' : 
                          activity.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                          activity.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 
                          'bg-foreground/10 text-foreground/70'
                        }>
                          {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground/70">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityHistory;
