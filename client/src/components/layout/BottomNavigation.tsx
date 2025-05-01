import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, ListTodo, GamepadIcon, Trophy, User } from 'lucide-react';
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
    { 
      path: '/', 
      icon: Home, 
      label: 'Home',
      isActive: location === '/',
      notification: false
    },
    { 
      path: '/tasks', 
      icon: ListTodo, 
      label: 'Tasks',
      isActive: location === '/tasks',
      notification: true // Badge indicator example for tasks page
    },
    { 
      path: '/games', 
      icon: GamepadIcon, 
      label: 'Games',
      isActive: location.startsWith('/games'),
      notification: false
    },
    { 
      path: '/leaderboard', 
      icon: Trophy, 
      label: 'Ranks',
      isActive: location === '/leaderboard',
      notification: false
    },
    { 
      path: '/profile', 
      icon: User, 
      label: 'Profile',
      isActive: location === '/profile',
      notification: false
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-white/10 py-3 z-40">
      <div className="flex justify-around max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          
          return (
            <Link href={item.path} key={item.path}>
              <div className={cn(
                "flex flex-col items-center cursor-pointer relative",
                item.isActive ? "text-primary" : "text-foreground/60 hover:text-foreground/80"
              )}>
                <div className={cn(
                  "p-2 rounded-full tg-ripple",
                  item.isActive ? "bg-primary/10" : "hover:bg-white/5"
                )}>
                  <IconComponent className={cn(
                    "h-5 w-5",
                  )} />
                  
                  {/* Notification badge */}
                  {item.notification && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary badge-pulse"></span>
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-1",
                  item.isActive ? "font-medium" : ""
                )}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
