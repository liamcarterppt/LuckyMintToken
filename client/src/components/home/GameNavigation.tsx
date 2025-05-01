import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

const GameNavigation: React.FC = () => {
  const [location] = useLocation();
  
  const navItems = [
    { path: '/', label: 'All Games' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/games?type=spinwheel', label: 'Spin Wheel' },
    { path: '/games?type=quiz', label: 'Quiz' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="flex overflow-x-auto pb-2 mb-6">
      <div className="flex gap-2">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path.startsWith('/games') && location.startsWith('/games'));
          
          return (
            <Link 
              key={item.path}
              href={item.path}
            >
              <div className={cn(
                "whitespace-nowrap px-5 py-2 rounded-full bg-card text-foreground font-medium cursor-pointer",
                isActive 
                  ? "border-2 border-primary" 
                  : "hover:bg-card/70 border-2 border-transparent"
              )}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default GameNavigation;
