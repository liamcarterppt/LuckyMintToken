import { ethers } from 'ethers';
import { storage } from '../storage';

class Web3Service {
  private provider: ethers.JsonRpcProvider | null = null;
  private initialized: boolean = false;
  
  async initialize() {
    try {
      const settings = await storage.getSystemSettings();
      if (settings && settings.bnbRpcUrl) {
        this.provider = new ethers.JsonRpcProvider(settings.bnbRpcUrl);
        
        // Test the provider
        const network = await this.provider.getNetwork();
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        
        this.initialized = true;
      } else {
        console.warn('No BNB RPC URL configured');
      }
    } catch (error) {
      console.error('Failed to initialize Web3Service:', error);
      this.provider = null;
    }
  }
  
  isInitialized(): boolean {
    return this.initialized && this.provider !== null;
  }
  
  async getProvider(): Promise<ethers.JsonRpcProvider> {
    if (!this.provider) {
      await this.initialize();
      
      if (!this.provider) {
        throw new Error('Web3 provider not initialized');
      }
    }
    
    return this.provider;
  }
  
  // Validate a wallet address
  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
  
  // Get BNB balance for an address
  async getBalance(address: string): Promise<string> {
    try {
      const provider = await this.getProvider();
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }
  
  // Send tokens to an address (requires private key)
  async sendTokens(
    privateKey: string,
    contractAddress: string,
    recipientAddress: string,
    amount: string
  ): Promise<string> {
    try {
      const provider = await this.getProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Minimal ERC20 ABI for the transfer function
      const abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
      ];
      
      const contract = new ethers.Contract(contractAddress, abi, wallet);
      
      // Get token decimals
      const decimals = await contract.decimals();
      
      // Format the amount with the correct decimal places
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      // Send transaction
      const tx = await contract.transfer(recipientAddress, amountInWei);
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error) {
      console.error('Error sending tokens:', error);
      throw error;
    }
  }
  
  // Get transaction receipt
  async getTransactionReceipt(txHash: string) {
    try {
      const provider = await this.getProvider();
      return provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error getting transaction receipt:', error);
      throw error;
    }
  }
}

export const web3Service = new Web3Service();
