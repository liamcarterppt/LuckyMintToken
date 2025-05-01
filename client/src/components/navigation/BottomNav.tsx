import React from 'react';
import { Home, GamepadIcon, Award, User, ListTodo } from 'lucide-react';
import { useLocation, Link } from 'wouter';

const BottomNav: React.FC = () => {
  const [location] = useLocation();

  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: <Home className="h-6 w-6" />,
      active: location === '/' 
    },
    { 
      path: '/games', 
      label: 'Games', 
      icon: <GamepadIcon className="h-6 w-6" />,
      active: location.startsWith('/games') 
    },
    { 
      path: '/tasks', 
      label: 'Tasks', 
      icon: <ListTodo className="h-6 w-6" />,
      active: location === '/tasks' 
    },
    { 
      path: '/leaderboard', 
      label: 'Leaderboard', 
      icon: <Award className="h-6 w-6" />,
      active: location === '/leaderboard' 
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: <User className="h-6 w-6" />,
      active: location === '/profile' 
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-white/5 py-2 px-4 z-10">
      <div className="flex items-center justify-between max-w-screen-lg mx-auto">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex flex-col items-center p-1 transition-colors ${
              item.active 
                ? 'text-primary' 
                : 'text-foreground/50 hover:text-foreground/80'
            }`}
          >
            <div className={`p-2 rounded-full ${item.active ? 'bg-primary/10' : 'hover:bg-white/5'} tg-ripple`}>
              {item.icon}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;