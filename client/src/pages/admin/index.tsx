import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardStats from '@/components/admin/DashboardStats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('overview');
  
  // Fetch recent activities
  const { data: recentActivities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ['/api/admin/activities/recent'],
  });
  
  // Fetch recent users
  const { data: recentUsers, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/admin/users/recent'],
  });
  
  // Fetch stats over time for chart
  const { data: statsOverTime, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/admin/stats/chart'],
  });
  
  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <DashboardStats />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Number of users and token distribution over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isStatsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart
                      data={statsOverTime?.chart || []}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(255,255,255,0.5)"
                        tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30,30,30,0.9)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: 'white'
                        }} 
                        labelFormatter={(value) => format(new Date(value), 'PPP')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--primary))" 
                        name="Users"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tokens" 
                        stroke="hsl(var(--secondary))" 
                        name="$LKMT Distributed"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Newly registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {isUsersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : !recentUsers?.length ? (
                  <div className="text-center py-8 text-foreground/60">
                    <p>No recent users</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} 
                            alt={user.username} 
                          />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.telegramUsername ? `@${user.telegramUsername}` : user.username}
                          </p>
                          <p className="text-xs text-foreground/60 truncate">
                            {user.walletAddress ? 
                              `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 
                              'No wallet connected'}
                          </p>
                        </div>
                        <div className="text-xs text-foreground/60">
                          {format(new Date(user.createdAt), 'MMM d, p')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card className="bg-card border-white/10">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest activities across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {isActivitiesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : !recentActivities?.length ? (
                <div className="text-center py-8 text-foreground/60">
                  <p>No recent activities</p>
                </div>
              ) : (
                <div className="rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-background/20">
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentActivities.map((activity: any) => (
                        <TableRow key={activity.id} className="border-b border-white/5 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={activity.user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${activity.user.username}`} 
                                  alt={activity.user.username} 
                                />
                                <AvatarFallback>{activity.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium truncate max-w-[100px]">
                                {activity.user.telegramUsername ? `@${activity.user.telegramUsername}` : activity.user.username}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="line-clamp-1">{activity.description}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              activity.type === 'task' ? 'bg-primary/10 text-primary' : 
                              activity.type === 'spin' ? 'bg-accent/10 text-accent' : 
                              activity.type === 'quiz' ? 'bg-secondary/10 text-secondary' : 
                              activity.type === 'referral' ? 'bg-success/10 text-success' : 
                              activity.type === 'claim' ? 'bg-yellow-500/10 text-yellow-500' : 
                              'bg-foreground/10 text-foreground/70'
                            }>
                              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                            </Badge>
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
                          <TableCell>
                            <span className="text-sm text-foreground/70">
                              {format(new Date(activity.timestamp), 'MMM d, p')}
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
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminDashboard;
