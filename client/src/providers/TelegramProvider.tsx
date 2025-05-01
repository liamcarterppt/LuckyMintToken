import React, { createContext, useState, useEffect, useContext } from 'react';
import { TelegramUser } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TelegramContextProps {
  telegramUser: TelegramUser | null;
  telegramAuthEnabled: boolean;
  isTelegramInitialized: boolean;
  connectTelegram: () => void;
  disconnectTelegram: () => void;
}

const TelegramContext = createContext<TelegramContextProps | undefined>(undefined);

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        onEvent: (eventType: string, eventHandler: (event: any) => void) => void;
        offEvent: (eventType: string, eventHandler: (event: any) => void) => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string) => Promise<boolean>;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramUser) => void;
    };
  }
}

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [telegramAuthEnabled, setTelegramAuthEnabled] = useState<boolean>(true);
  const [isTelegramInitialized, setIsTelegramInitialized] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize Telegram login
  useEffect(() => {
    // Check if the user is already authenticated with Telegram
    const checkTelegramAuth = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/telegram/status', undefined);
        const data = await response.json();
        
        if (data.authenticated) {
          setTelegramUser(data.user);
        }
        
        // Check if Telegram auth is enabled in system settings
        setTelegramAuthEnabled(data.telegramAuthEnabled);
        setIsTelegramInitialized(true);
      } catch (error) {
        console.error('Error checking Telegram auth status:', error);
        setIsTelegramInitialized(true);
      }
    };

    checkTelegramAuth();
  }, []);

  // Helper function to load the Telegram Login script
  const loadTelegramLoginScript = (callback: () => void) => {
    if (document.getElementById('telegram-login-script')) {
      callback();
      return;
    }

    const script = document.createElement('script');
    script.id = 'telegram-login-script';
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'LuckyMintTokenBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    script.async = true;

    script.onload = callback;
    document.body.appendChild(script);
  };

  // Connect to Telegram
  const connectTelegram = () => {
    // If Telegram Web App is available, use it
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      
      // Use the Telegram WebApp data if available
      if (window.Telegram.WebApp.initData) {
        submitTelegramData(window.Telegram.WebApp.initData);
        return;
      }
    }
    
    // Otherwise, use the Telegram Login Widget
    window.TelegramLoginWidget = {
      dataOnauth: (user: TelegramUser) => {
        handleTelegramAuth(user);
      }
    };

    // Show Telegram login popup or redirect
    loadTelegramLoginScript(() => {
      const loginContainer = document.getElementById('telegram-login-container');
      if (loginContainer) {
        loginContainer.style.display = 'block';
      }
    });
  };

  // Handle Telegram auth data
  const handleTelegramAuth = async (user: TelegramUser) => {
    try {
      // Verify and save the Telegram user data on the server
      const response = await apiRequest('POST', '/api/auth/telegram', user);
      const data = await response.json();
      
      if (data.success) {
        setTelegramUser(user);
        
        toast({
          title: "Telegram Connected",
          description: `Welcome, ${user.first_name}!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: data.message || "Failed to authenticate with Telegram",
        });
      }
    } catch (error) {
      console.error('Error authenticating with Telegram:', error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "An error occurred while authenticating with Telegram",
      });
    }
    
    // Hide the login container
    const loginContainer = document.getElementById('telegram-login-container');
    if (loginContainer) {
      loginContainer.style.display = 'none';
    }
  };

  // Submit Telegram Web App data to the server
  const submitTelegramData = async (initData: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/telegram/webapp', { initData });
      const data = await response.json();
      
      if (data.success) {
        setTelegramUser(data.user);
        
        toast({
          title: "Telegram Connected",
          description: `Welcome, ${data.user.first_name}!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: data.message || "Failed to authenticate with Telegram",
        });
      }
    } catch (error) {
      console.error('Error authenticating with Telegram WebApp:', error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "An error occurred while authenticating with Telegram",
      });
    }
  };

  // Disconnect from Telegram
  const disconnectTelegram = async () => {
    try {
      await apiRequest('POST', '/api/auth/telegram/logout', undefined);
      setTelegramUser(null);
      
      toast({
        title: "Telegram Disconnected",
        description: "Your Telegram account has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out from Telegram",
      });
    }
  };

  return (
    <TelegramContext.Provider 
      value={{ 
        telegramUser, 
        telegramAuthEnabled, 
        isTelegramInitialized, 
        connectTelegram, 
        disconnectTelegram 
      }}
    >
      {children}
      {/* Hidden container for Telegram Login Widget */}
      <div 
        id="telegram-login-container" 
        style={{ display: 'none', position: 'fixed', zIndex: 9999 }}
      ></div>
    </TelegramContext.Provider>
  );
};

export const useTelegram = (): TelegramContextProps => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};
