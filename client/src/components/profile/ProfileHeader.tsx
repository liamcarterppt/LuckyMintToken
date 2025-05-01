import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useTelegram } from '@/providers/TelegramProvider';
import { useWeb3 } from '@/providers/Web3Provider';

interface ProfileHeaderProps {
  profile?: any;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const { telegramUser } = useTelegram();
  const { web3State } = useWeb3();
  
  const username = telegramUser?.username || profile?.username || 'User';
  const avatarUrl = telegramUser?.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  
  // Determine rank based on LKMT balance
  const getRank = () => {
    const balance = profile?.lkmtBalance || 0;
    if (balance >= 1000) return { name: 'Diamond', color: 'bg-blue-500/20 text-blue-500' };
    if (balance >= 500) return { name: 'Platinum', color: 'bg-secondary/20 text-secondary' };
    if (balance >= 250) return { name: 'Gold', color: 'bg-yellow-500/20 text-yellow-500' };
    if (balance >= 100) return { name: 'Silver', color: 'bg-slate-400/20 text-slate-400' };
    return { name: 'Bronze', color: 'bg-primary/20 text-primary' };
  };
  
  const rank = getRank();

  return (
    <Card className="p-6 bg-gradient-to-r from-background/80 to-card/90 border border-white/10 rounded-xl">
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <Avatar className="h-24 w-24 border-4 border-primary/20">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback className="text-2xl">{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">
              {telegramUser?.first_name ? `${telegramUser.first_name} ${telegramUser.last_name || ''}` : username}
            </h1>
            <Badge variant="outline" className={`${rank.color} whitespace-nowrap`}>
              {rank.name} Rank
            </Badge>
            {profile?.isAdmin && (
              <Badge variant="outline" className="bg-primary/20 text-primary whitespace-nowrap">
                Admin
              </Badge>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            {telegramUser?.username && (
              <div className="text-sm text-foreground/70 flex items-center justify-center sm:justify-start gap-1">
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-4 w-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.77 7.67c-.12 1.23-.64 5.57-1.06 8.35-.15.82-.7 1.16-1.15 1.19-.98.06-1.73-.75-2.68-1.47-.93-.72-1.47-1.14-2.36-1.84-.98-.79-.35-1.21.21-1.91.15-.18 2.66-2.48 2.7-2.69.01-.05.01-.26-.1-.37-.11-.11-.32-.07-.46-.04-.2.05-3.31 2.07-4.7 3.05-.4.25-.78.37-1.12.37-.38 0-.75-.16-1.11-.31-.85-.35-1.64-.52-1.8-.55-.76-.11-.67-.95.32-1.44l7.17-3.14c.86-.38 3.88-1.62 4.05-1.68 1.2-.33 2.21.28 1.93 1.27l-.01.02z" />
                </svg>
                @{telegramUser.username}
              </div>
            )}
            
            {web3State.address && (
              <div className="text-sm text-foreground/70 flex items-center justify-center sm:justify-start gap-1">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.24 14.2c-1.74 4.66-6.67 7.08-11.3 5.4-4.65-1.67-7.04-6.78-5.32-11.38 1.73-4.6 6.69-7.07 11.31-5.39 3.55 1.29 5.99 4.5 6.15 8.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M21.78 9.28c.1-.78-.54-1.46-1.32-1.46h-1.88c-.56 0-1.03.41-1.12.96l-.21 1.31c-.1.56.32 1.06.90 1.06h1.91c.36 0 .67.28.7.64l.02-.01Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                {`${web3State.address.slice(0, 6)}...${web3State.address.slice(-4)}`}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center sm:justify-start gap-4">
            <div className="bg-background/40 rounded-lg px-4 py-2">
              <p className="text-sm text-foreground/70">Rank</p>
              <p className="font-bold">{profile?.globalRank || 'N/A'}</p>
            </div>
            
            <div className="bg-background/40 rounded-lg px-4 py-2">
              <p className="text-sm text-foreground/70">Balance</p>
              <p className="font-bold">{profile?.lkmtBalance?.toFixed(3) || "0.000"} $LKMT</p>
            </div>
            
            <div className="bg-background/40 rounded-lg px-4 py-2">
              <p className="text-sm text-foreground/70">Referrals</p>
              <p className="font-bold">{profile?.referralsCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileHeader;
