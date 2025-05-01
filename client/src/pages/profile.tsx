import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ActivityHistory from '@/components/profile/ActivityHistory';
import { apiRequest } from '@/lib/queryClient';
import { useWeb3 } from '@/providers/Web3Provider';
import { useTelegram } from '@/providers/TelegramProvider';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle, Wallet, Award, Clock } from 'lucide-react';

const Profile: React.FC = () => {
  const { web3State, connectWallet } = useWeb3();
  const { telegramUser, connectTelegram } = useTelegram();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/users/profile'],
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['/api/users/stats'],
  });

  // Handle referral link copy
  const handleCopyReferral = () => {
    if (!profile?.referralCode) return;

    const referralLink = `${window.location.origin}/?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    
    toast({
      title: "Referral link copied!",
      description: "Share it with your friends to earn rewards.",
    });
    
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Handle reward claim
  const handleClaimRewards = async () => {
    try {
      if (!web3State.isConnected) {
        toast({
          variant: "destructive",
          title: "Wallet not connected",
          description: "Please connect your wallet to claim rewards",
        });
        return;
      }

      const response = await apiRequest('POST', '/api/rewards/claim', {});
      const data = await response.json();
      
      toast({
        title: "Rewards claimed!",
        description: `${data.amount} $LKMT has been sent to your wallet.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to claim rewards",
        description: error.message || "An error occurred while claiming rewards",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 mb-20">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 mb-20">
      <ProfileHeader profile={profile} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/70">
                  Tasks Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {stats?.completedTasks || 0}/{stats?.totalTasks || 0}
                  </div>
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/70">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {profile?.lkmtBalance?.toFixed(3) || "0.000"} $LKMT
                  </div>
                  <Award className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground/70">
                  Member Since
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                  <Clock className="h-5 w-5 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Telegram Account</CardTitle>
              </CardHeader>
              <CardContent>
                {telegramUser ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={telegramUser.photo_url} alt={telegramUser.first_name} />
                      <AvatarFallback>{telegramUser.first_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{telegramUser.first_name} {telegramUser.last_name}</p>
                      {telegramUser.username && <p className="text-sm text-foreground/70">@{telegramUser.username}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-foreground/70">Connect your Telegram account to participate in tasks and earn rewards.</p>
                    <Button onClick={connectTelegram} className="w-fit">
                      <svg 
                        viewBox="0 0 24 24" 
                        className="h-4 w-4 mr-2 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.77 7.67c-.12 1.23-.64 5.57-1.06 8.35-.15.82-.7 1.16-1.15 1.19-.98.06-1.73-.75-2.68-1.47-.93-.72-1.47-1.14-2.36-1.84-.98-.79-.35-1.21.21-1.91.15-.18 2.66-2.48 2.7-2.69.01-.05.01-.26-.1-.37-.11-.11-.32-.07-.46-.04-.2.05-3.31 2.07-4.7 3.05-.4.25-.78.37-1.12.37-.38 0-.75-.16-1.11-.31-.85-.35-1.64-.52-1.8-.55-.76-.11-.67-.95.32-1.44l7.17-3.14c.86-.38 3.88-1.62 4.05-1.68 1.2-.33 2.21.28 1.93 1.27l-.01.02z" />
                      </svg>
                      Connect Telegram
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                {web3State.isConnected && web3State.address ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      <p className="font-mono">
                        {`${web3State.address.slice(0, 8)}...${web3State.address.slice(-6)}`}
                      </p>
                    </div>
                    <p className="text-sm text-foreground/70">
                      Network: {web3State.chainId === 56 ? 'BNB Smart Chain' : 
                                web3State.chainId === 97 ? 'BNB Testnet' : 
                                'Unknown Network'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-foreground/70">Connect your wallet to claim $LKMT tokens.</p>
                    <Button onClick={connectWallet} className="w-fit">
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Referral Section */}
          <Card className="bg-card border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Referral Program</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-foreground/70">
                Invite your friends to join Lucky Mint Token airdrop and earn {profile?.referralReward || 75} $LKMT for each successful referral!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 p-3 border border-white/10 rounded-lg bg-background/20 font-mono text-sm truncate">
                  {profile?.referralCode ? 
                    `${window.location.origin}/?ref=${profile.referralCode}` : 
                    "Connect your account to get a referral link"}
                </div>
                <Button 
                  onClick={handleCopyReferral} 
                  disabled={!profile?.referralCode}
                  className="whitespace-nowrap"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-background/20 rounded-lg">
                  <p className="text-sm text-foreground/70">Referrals</p>
                  <p className="text-xl font-bold">{stats?.referralsCount || 0}</p>
                </div>
                <div className="p-4 bg-background/20 rounded-lg">
                  <p className="text-sm text-foreground/70">Referral Earnings</p>
                  <p className="text-xl font-bold">{stats?.referralEarnings || 0} $LKMT</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rewards">
          <Card className="bg-card border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">$LKMT Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1 p-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
                  <div className="mb-4">
                    <p className="text-sm text-foreground/70">Available Balance</p>
                    <p className="text-3xl font-bold">{profile?.lkmtBalance?.toFixed(3) || "0.000"} $LKMT</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-foreground/70">Claimable Rewards</p>
                    <p className="text-xl font-bold">{profile?.claimableRewards?.toFixed(3) || "0.000"} $LKMT</p>
                  </div>
                  
                  <Button 
                    onClick={handleClaimRewards}
                    disabled={!web3State.isConnected || !(profile?.claimableRewards > 0)}
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                  >
                    Claim Rewards
                  </Button>
                </div>
                
                <div className="flex-1 p-6 bg-background/30 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Reward Breakdown</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-primary" />
                        </div>
                        <span>Tasks</span>
                      </div>
                      <span className="font-medium">{stats?.taskEarnings || 0} $LKMT</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14.12 7.50001L12 12.84L9.88 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7.5 9.88L12.84 12L7.5 14.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9.88 16.5L12 11.16L14.12 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16.5 14.12L11.16 12L16.5 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Spin Wheel</span>
                      </div>
                      <span className="font-medium">{stats?.spinEarnings || 0} $LKMT</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-secondary" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.5 14.5L5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M15.5 14.5L19 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 14L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 7.8L11.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M15 7.8L12.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 4L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Quiz</span>
                      </div>
                      <span className="font-medium">{stats?.quizEarnings || 0} $LKMT</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-success" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 22L8 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 17L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8C17 10.0503 15.7659 11.8124 14 12.584" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 8L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Referrals</span>
                      </div>
                      <span className="font-medium">{stats?.referralEarnings || 0} $LKMT</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-background/20 rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h4 className="font-medium mb-1">About $LKMT Tokens</h4>
                  <p className="text-sm text-foreground/70">
                    $LKMT tokens are distributed as rewards for completing tasks, playing games, and referring friends.
                    Once claimed, tokens will be sent to your connected BNB wallet.
                  </p>
                </div>
                <Button 
                  variant="link" 
                  className="text-accent self-end"
                  asChild
                >
                  <a href="https://bscscan.com/" target="_blank" rel="noopener noreferrer">
                    View on BSCScan
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Claim History */}
          <Card className="bg-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Claim History</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.claimHistory && stats.claimHistory.length > 0 ? (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {stats.claimHistory.map((claim: any) => (
                    <div key={claim.id} className="flex justify-between items-center p-3 bg-background/30 rounded-lg">
                      <div>
                        <p className="font-medium">{claim.amount} $LKMT</p>
                        <p className="text-xs text-foreground/70">
                          {new Date(claim.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        claim.status === 'completed' 
                          ? 'bg-success/10 text-success' 
                          : claim.status === 'processing'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </div>
                      {claim.txHash && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-primary"
                          asChild
                        >
                          <a 
                            href={`https://bscscan.com/tx/${claim.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View Tx
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-foreground/60">
                  <p>No claim history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <ActivityHistory />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Profile;
