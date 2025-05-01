import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, CheckSquare, GamepadIcon, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';

const BottomNavigation: React.FC = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  
  // Hide on desktop
  if (!isMobile) {
    return null;
  }
  
  // Navigation items
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/games', icon: GamepadIcon, label: 'Games' },
    { path: '/leaderboard', icon: Trophy, label: 'Ranks' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-white/10 py-3 z-40">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const IconComponent = item.icon;
          
          return (
            <Link href={item.path} key={item.path}>
              <div className={cn(
                "flex flex-col items-center cursor-pointer",
                isActive ? "text-primary" : "text-foreground/60 hover:text-foreground"
              )}>
                <IconComponent className={cn(
                  "h-5 w-5",
                  isActive && "text-primary"
                )} />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
