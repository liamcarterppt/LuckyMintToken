import crypto from 'crypto';
import { storage } from '../storage';

class TelegramService {
  private botToken: string | null = null;
  
  async initialize() {
    const settings = await storage.getSystemSettings();
    if (settings) {
      this.botToken = settings.telegramBotToken || null;
    }
  }
  
  // Check if Telegram authentication is enabled
  async isAuthEnabled() {
    const settings = await storage.getSystemSettings();
    return settings ? settings.telegramAuthEnabled : true;
  }
  
  // Validate Telegram authentication data
  validateAuthData(authData: any): boolean {
    if (!authData || !authData.hash) {
      return false;
    }
    
    // Telegram auth data contains auth_date (when the user authenticated)
    // Check if the auth data is not too old (within 24 hours)
    const authTimestamp = parseInt(authData.auth_date, 10) * 1000;
    const currentTime = Date.now();
    const maxAge = 86400 * 1000; // 24 hours in milliseconds
    
    if (currentTime - authTimestamp > maxAge) {
      return false;
    }
    
    // No token, can't validate
    if (!this.botToken) {
      console.warn('No Telegram bot token configured, skipping validation');
      return true;
    }
    
    // Create data check string by alphabetically sorting the data fields
    const { hash, ...data } = authData;
    const dataCheckString = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('\n');
    
    // Generate the secret key using SHA-256 over the bot token
    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();
    
    // Calculate the hash using HMAC-SHA-256
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Compare the calculated hash with the provided hash
    return calculatedHash === hash;
  }
  
  // Validate Telegram Web App data
  validateWebAppData(initData: string): any {
    if (!initData) {
      return null;
    }
    
    // Parse the init data
    const params = new URLSearchParams(initData);
    const dataString = params.get('data');
    const authDate = params.get('auth_date');
    const hash = params.get('hash');
    
    if (!dataString || !authDate || !hash) {
      return null;
    }
    
    // No token, can't validate
    if (!this.botToken) {
      console.warn('No Telegram bot token configured, skipping validation');
      return JSON.parse(dataString);
    }
    
    // Create data check string
    const dataCheckString = `auth_date=${authDate}\ndata=${dataString}`;
    
    // Generate the secret key using SHA-256 over the bot token
    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();
    
    // Calculate the hash using HMAC-SHA-256
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Compare the calculated hash with the provided hash
    if (calculatedHash !== hash) {
      return null;
    }
    
    // Parse and return the user data
    try {
      return JSON.parse(dataString);
    } catch (error) {
      return null;
    }
  }
}

export const telegramService = new TelegramService();
