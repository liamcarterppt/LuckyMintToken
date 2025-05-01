import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useWeb3 } from '@/providers/Web3Provider';
import { useTelegram } from '@/providers/TelegramProvider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import WalletConnectModal from '@/components/wallet/WalletConnectModal';
import { Wallet, LogOut, User, Settings, Trophy } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

const Header: React.FC = () => {
  const [location] = useLocation();
  const { web3State, connectWallet, disconnectWallet } = useWeb3();
  const { telegramUser, connectTelegram, disconnectTelegram } = useTelegram();
  const isMobile = useMobile();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  // Fetch user profile to get LKMT balance
  const { data: userProfile } = useQuery({
    queryKey: ['/api/users/profile'],
    enabled: !!web3State.isConnected || !!telegramUser,
  });
  
  // Format wallet address for display
  const formattedAddress = web3State.address 
    ? `${web3State.address.slice(0, 6)}...${web3State.address.slice(-4)}`
    : '';

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">$</span>
            </div>
            <div className="font-bold text-xl text-foreground">
              Lucky<span className="text-primary">Mint</span>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          {/* Connect Wallet Button - Hide on mobile */}
          {!isMobile && !web3State.isConnected && (
            <Button 
              onClick={() => setIsWalletModalOpen(true)}
              variant="outline"
              className="bg-gradient-to-r from-primary to-secondary text-white border-0"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
          
          {/* Connected Wallet Info - Hide on mobile */}
          {!isMobile && web3State.isConnected && (
            <Button 
              variant="outline" 
              className="bg-card text-foreground border-white/10"
              onClick={() => setIsWalletModalOpen(true)}
            >
              <Wallet className="mr-2 h-4 w-4 text-primary" />
              {formattedAddress}
            </Button>
          )}
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-card border-white/10 p-2 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={telegramUser?.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${web3State.address || 'lucky'}`} 
                    alt="Profile" 
                  />
                  <AvatarFallback className="bg-secondary/10 text-secondary">
                    {telegramUser?.first_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {!isMobile && telegramUser?.username && (
                  <span className="ml-2">@{telegramUser.username}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-white/10">
              <DropdownMenuLabel>
                {telegramUser 
                  ? `Hi, ${telegramUser.first_name}` 
                  : 'My Account'}
              </DropdownMenuLabel>
              
              {userProfile && (
                <DropdownMenuItem className="flex justify-between">
                  <span>Balance</span>
                  <span className="font-bold text-primary">
                    {userProfile.lkmtBalance?.toFixed(3) || '0.000'} $LKMT
                  </span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              <Link href="/profile">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>
              
              <Link href="/leaderboard">
                <DropdownMenuItem className="cursor-pointer">
                  <Trophy className="mr-2 h-4 w-4" />
                  Leaderboard
                </DropdownMenuItem>
              </Link>
              
              {userProfile?.isAdmin && (
                <Link href="/admin">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                </Link>
              )}
              
              <DropdownMenuSeparator className="bg-white/10" />
              
              {!telegramUser ? (
                <DropdownMenuItem onClick={connectTelegram} className="cursor-pointer">
                  <svg 
                    viewBox="0 0 24 24" 
                    className="h-4 w-4 mr-2 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.77 7.67c-.12 1.23-.64 5.57-1.06 8.35-.15.82-.7 1.16-1.15 1.19-.98.06-1.73-.75-2.68-1.47-.93-.72-1.47-1.14-2.36-1.84-.98-.79-.35-1.21.21-1.91.15-.18 2.66-2.48 2.7-2.69.01-.05.01-.26-.1-.37-.11-.11-.32-.07-.46-.04-.2.05-3.31 2.07-4.7 3.05-.4.25-.78.37-1.12.37-.38 0-.75-.16-1.11-.31-.85-.35-1.64-.52-1.8-.55-.76-.11-.67-.95.32-1.44l7.17-3.14c.86-.38 3.88-1.62 4.05-1.68 1.2-.33 2.21.28 1.93 1.27l-.01.02z" />
                  </svg>
                  Connect Telegram
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={disconnectTelegram} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect Telegram
                </DropdownMenuItem>
              )}
              
              {web3State.isConnected && (
                <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-destructive">
                  <Wallet className="mr-2 h-4 w-4" />
                  Disconnect Wallet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)}
      />
    </header>
  );
};

export default Header;
