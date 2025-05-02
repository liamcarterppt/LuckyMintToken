import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';

// Server salt for HMAC validation (should be stored securely in env variables)
const SERVER_SALT = process.env.SERVER_SALT || crypto.randomBytes(32).toString('hex');

// Store used nonces to prevent replay attacks
const usedNonces = new Set<string>();

// Clean up old nonces (older than 24 hours)
setInterval(() => {
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  
  // In production, this would use a Redis store with TTL
  // For simplicity, we're just using a Set here
  usedNonces.clear();
}, 60 * 60 * 1000); // Run every hour

interface ValidationPayload {
  nonce: string;
  timestamp: number;
  fingerprint: string;
  action: string;
  signature: string;
}

// Validation middleware for secure endpoints
export const validateSecureRequest = (requiredAction?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip validation for non-sensitive endpoints if desired
    // if (NON_SECURE_PATHS.includes(req.path)) return next();
    
    try {
      // Extract validation data
      const validation = req.body?._validation as ValidationPayload | undefined;
      
      // If no validation data, reject
      if (!validation) {
        return res.status(401).json({ message: 'Missing security validation' });
      }
      
      const { nonce, timestamp, fingerprint, action, signature } = validation;
      
      // 1. Check if the action matches the required action (if specified)
      if (requiredAction && action !== requiredAction) {
        await logSecurityEvent(req, 'action_mismatch', 
          `Expected action ${requiredAction}, got ${action}`);
        return res.status(403).json({ message: 'Invalid action' });
      }
      
      // 2. Check for replay attacks using nonce
      if (usedNonces.has(nonce)) {
        await logSecurityEvent(req, 'nonce_reuse', 'Nonce already used');
        return res.status(403).json({ message: 'Invalid request signature' });
      }
      
      // 3. Check timestamp (prevent requests older than 5 minutes)
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      if (timestamp < fiveMinutesAgo) {
        await logSecurityEvent(req, 'expired_request', 
          `Request expired: ${new Date(timestamp).toISOString()}`);
        return res.status(403).json({ message: 'Request expired' });
      }
      
      // 4. Verify the signature
      const payload = JSON.stringify({
        action,
        nonce,
        timestamp,
        fingerprint,
        data: { ...req.body, _validation: undefined }
      });
      
      const expectedSignature = crypto
        .createHmac('sha256', SERVER_SALT)
        .update(payload)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        await logSecurityEvent(req, 'invalid_signature', 'Signature validation failed');
        return res.status(403).json({ message: 'Invalid request signature' });
      }
      
      // Mark nonce as used to prevent replay attacks
      usedNonces.add(nonce);
      
      // Add fingerprint to request for later use
      (req as any).deviceFingerprint = fingerprint;
      
      // Add the action to the request
      (req as any).securityAction = action;
      
      next();
    } catch (error) {
      console.error('Security validation error:', error);
      res.status(500).json({ message: 'Security validation failed' });
    }
  };
};

// Generate salt for client
export const generateClientSalt = (req: Request, res: Response) => {
  res.json({ salt: SERVER_SALT });
};

// Log security events
async function logSecurityEvent(req: Request, type: string, details: string) {
  try {
    // Get user if authenticated
    const userId = req.user?.id || null;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    await storage.createActivityLog({
      userId: userId,
      type: 'security_warning',
      description: `${type}: ${details}`,
      status: 'active',
      ip,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Handle reported security violations from client
export const handleSecurityReport = async (req: Request, res: Response) => {
  try {
    const { type, details, fingerprint, violations } = req.body;
    
    // Get user if authenticated
    const userId = req.user?.id || null;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Log the violation
    await storage.createActivityLog({
      userId: userId,
      type: 'security_warning',
      description: `Client reported ${type}: ${details || 'No details provided'}`,
      status: 'active',
      ip,
      createdAt: new Date()
    });
    
    // Store fingerprint for potential blacklisting
    console.log(`Security violation from fingerprint: ${fingerprint}`);
    
    // Additional security measures could be implemented here:
    // - Blocking fingerprints after multiple violations
    // - Rate limiting based on fingerprint
    // - Alerting administrators
    
    res.status(200).json({ message: 'Security report received' });
  } catch (error) {
    console.error('Failed to process security report:', error);
    res.status(500).json({ message: 'Failed to process security report' });
  }
};

// Return server time for VPN detection
export const getServerTime = (req: Request, res: Response) => {
  res.json({ serverTime: new Date().toISOString() });
};