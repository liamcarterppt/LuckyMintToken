import React, { createContext, useState, useEffect, useContext } from 'react';
import { Web3State } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Web3ContextProps {
  web3State: Web3State;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  getBalance: () => Promise<string | null>;
}

const initialWeb3State: Web3State = {
  isConnected: false,
  address: null,
  chainId: null,
  provider: null,
  connecting: false,
  error: null,
};

const Web3Context = createContext<Web3ContextProps | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [web3State, setWeb3State] = useState<Web3State>(initialWeb3State);
  const { toast } = useToast();

  // Check if the browser has ethereum provider (MetaMask, etc.)
  const checkIfWalletIsConnected = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Get connected accounts
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setWeb3State({
            isConnected: true,
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            provider: window.ethereum,
            connecting: false,
            error: null,
          });
          
          // Register user's wallet on the server
          try {
            await apiRequest('POST', '/api/users/wallet', { address: accounts[0] });
          } catch (error) {
            console.error('Failed to register wallet with server:', error);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        setWeb3State({
          ...initialWeb3State,
          error: 'Failed to connect to wallet',
        });
      }
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      setWeb3State((prev) => ({ ...prev, connecting: true }));
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // Check if connected to BNB Chain (56) or BNB Testnet (97)
        const connectedChainId = parseInt(chainId, 16);
        
        if (connectedChainId !== 56 && connectedChainId !== 97) {
          // Switch to BNB Chain
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x38' }], // BNB Chain (56)
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x38', // BNB Chain (56)
                    chainName: 'BNB Smart Chain',
                    nativeCurrency: {
                      name: 'BNB',
                      symbol: 'BNB',
                      decimals: 18,
                    },
                    rpcUrls: ['https://bsc-dataseed.binance.org/'],
                    blockExplorerUrls: ['https://bscscan.com/'],
                  },
                ],
              });
            } else {
              throw switchError;
            }
          }
        }
        
        const updatedChainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        setWeb3State({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(updatedChainId, 16),
          provider: window.ethereum,
          connecting: false,
          error: null,
        });
        
        // Register user's wallet on the server
        await apiRequest('POST', '/api/users/wallet', { address: accounts[0] });
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      } catch (error: any) {
        console.error('Error connecting wallet:', error);
        setWeb3State({
          ...initialWeb3State,
          error: error.message || 'Failed to connect wallet',
        });
        
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: error.message || 'Failed to connect wallet',
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Ethereum wallet",
      });
      
      setWeb3State({
        ...initialWeb3State,
        error: 'No Ethereum wallet found',
      });
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWeb3State(initialWeb3State);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  // Get native token balance
  const getBalance = async (): Promise<string | null> => {
    if (!web3State.isConnected || !web3State.address || !web3State.provider) {
      return null;
    }
    
    try {
      const balance = await web3State.provider.request({
        method: 'eth_getBalance',
        params: [web3State.address, 'latest'],
      });
      
      // Convert wei to ether
      const balanceInEther = parseInt(balance, 16) / 1e18;
      return balanceInEther.toFixed(4);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    
    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else {
          setWeb3State((prev) => ({
            ...prev,
            address: accounts[0],
          }));
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        setWeb3State((prev) => ({
          ...prev,
          chainId: parseInt(chainId, 16),
        }));
      });
    }
    
    return () => {
      // Clean up listeners
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{ web3State, connectWallet, disconnectWallet, getBalance }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = (): Web3ContextProps => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
