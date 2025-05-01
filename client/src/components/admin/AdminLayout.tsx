import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Gift, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const isMobile = useMobile();
  const { toast } = useToast();
  
  // Fetch admin info
  const { data: adminInfo, isLoading } = useQuery({
    queryKey: ['/api/admin/info'],
    retry: false,
  });
  
  const menuItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: 'Dashboard',
      path: '/admin',
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Users',
      path: '/admin/users',
    },
    {
      icon: <CheckSquare className="h-5 w-5" />,
      label: 'Tasks',
      path: '/admin/tasks',
    },
    {
      icon: <Gift className="h-5 w-5" />,
      label: 'Rewards',
      path: '/admin/rewards',
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'Settings',
      path: '/admin/settings',
    },
  ];
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', undefined);
      
      // Invalidate user data
      queryClient.invalidateQueries();
      
      // Redirect to home
      window.location.href = '/';
      
      toast({
        title: "Logged out",
        description: "You have been logged out of the admin panel.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred while logging out.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-64 flex-shrink-0">
            <Card className="bg-sidebar p-4 border-white/10 sticky top-20">
              {isLoading ? (
                <div className="space-y-2 mb-6">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="font-medium text-foreground">Admin Panel</h3>
                  <p className="text-sm text-foreground/70">{adminInfo?.username || 'Administrator'}</p>
                </div>
              )}
              
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = location === item.path;
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      <div
                        className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-sidebar-accent/10 text-sidebar-foreground/90"
                        }`}
                      >
                        {item.icon}
                        <span className="ml-3">{item.label}</span>
                        {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                      </div>
                    </Link>
                  );
                })}
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </Button>
              </nav>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="bg-sidebar-accent/10 rounded-md p-3">
                  <h4 className="font-medium text-sm mb-1">Admin Version</h4>
                  <p className="text-xs text-foreground/70">v1.0.0</p>
                </div>
              </div>
            </Card>
          </aside>
          
          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
