import React from 'react';
import { useWeb3 } from '@/providers/Web3Provider';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define wallet types with their info
const wallets = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://cryptologos.cc/logos/metamask-mm-logo.png',
    description: 'Connect to your MetaMask wallet',
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    icon: 'https://cryptologos.cc/logos/trust-wallet-token-twt-logo.png',
    description: 'Connect to your Trust Wallet',
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    description: 'Connect to your Binance Wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'https://cryptologos.cc/logos/walletconnect-wc-logo.png',
    description: 'Connect with WalletConnect',
  },
];

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { web3State, connectWallet } = useWeb3();
  
  if (!isOpen) {
    return null;
  }
  
  const handleConnect = async () => {
    await connectWallet();
    onClose();
  };
  
  // If already connected, show wallet info
  if (web3State.isConnected && web3State.address) {
    const formattedAddress = `${web3State.address.slice(0, 10)}...${web3State.address.slice(-10)}`;
    const networkName = web3State.chainId === 56 
      ? 'BNB Smart Chain' 
      : web3State.chainId === 97 
        ? 'BNB Testnet' 
        : 'Unknown Network';
    
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-background/80 flex justify-center items-center p-4 backdrop-blur-sm">
        <div className="bg-card rounded-xl p-6 max-w-md w-full border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-xl">Wallet Connected</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-foreground/70 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-lg border border-white/10 bg-background/50">
              <p className="text-sm text-foreground/70 mb-1">Address</p>
              <p className="font-mono">{formattedAddress}</p>
            </div>
            
            <div className="p-4 rounded-lg border border-white/10 bg-background/50">
              <p className="text-sm text-foreground/70 mb-1">Network</p>
              <div className="flex items-center gap-2">
                <div className={web3State.chainId === 56 || web3State.chainId === 97 
                  ? "text-success" 
                  : "text-yellow-500"
                }>
                  <span className="inline-block w-2 h-2 rounded-full bg-current mr-2"></span>
                </div>
                <p>{networkName}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background/80 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-card rounded-xl p-6 max-w-md w-full border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-xl">Connect Wallet</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-foreground/70 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4 mb-6">
          {wallets.map((wallet) => (
            <button 
              key={wallet.id}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-left"
              onClick={handleConnect}
            >
              <img 
                src={wallet.icon} 
                alt={wallet.name} 
                className="w-8 h-8" 
              />
              <span className="font-medium">{wallet.name}</span>
            </button>
          ))}
        </div>
        
        <p className="text-center text-sm text-foreground/70">
          By connecting your wallet, you agree to our{' '}
          <a href="#" className="text-accent">Terms of Service</a> and{' '}
          <a href="#" className="text-accent">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default WalletConnectModal;
