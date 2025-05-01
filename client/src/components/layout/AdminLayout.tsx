import React from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Home, 
  Users, 
  ListTodo, 
  Gift, 
  Settings, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { apiRequest } from '@/lib/queryClient';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon, isActive }) => {
  return (
    <Link href={href}>
      <a className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-primary/10 text-primary'
          : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
      }`}>
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  // Fetch admin info
  const { data: adminInfo } = useQuery({
    queryKey: ['/api/admin/info'],
    queryFn: async () => {
      return apiRequest('/api/admin/info');
    },
  });
  
  const handleLogout = () => {
    // Handle admin logout
    apiRequest('/api/auth/logout', { method: 'POST' })
      .then(() => {
        window.location.href = '/';
      });
  };
  
  // Navigation items
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { href: '/admin/tasks', label: 'Tasks', icon: <ListTodo size={18} /> },
    { href: '/admin/rewards', label: 'Rewards', icon: <Gift size={18} /> },
    { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
            LM
          </div>
          <div className="font-bold text-xl">Lucky Mint</div>
        </div>
        
        <div className="p-4 flex-grow">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={location === item.href}
              />
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${adminInfo?.adminUser?.username || 'admin'}`} 
                alt="Admin" 
              />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{adminInfo?.adminUser?.username || 'Admin'}</p>
              <p className="text-xs text-foreground/60">Administrator</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="flex flex-col flex-1">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              LM
            </div>
            <div className="font-bold text-xl">Lucky Mint</div>
          </div>
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0">
              <div className="p-6 flex items-center gap-3 border-b">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  LM
                </div>
                <div className="font-bold text-xl">Lucky Mint</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X size={18} />
                </Button>
              </div>
              
              <div className="py-4 px-2">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={location === item.href}
                    />
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${adminInfo?.adminUser?.username || 'admin'}`} 
                      alt="Admin" 
                    />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{adminInfo?.adminUser?.username || 'Admin'}</p>
                    <p className="text-xs text-foreground/60">Administrator</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;