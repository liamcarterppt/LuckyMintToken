import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        [key: string]: any;
      };
    }
  }
}

interface RateLimitRecord {
  count: number;
  firstRequest: number;
  lastRequest: number;
  blocked: boolean;
  blockExpiry: number | null;
}

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  blockDuration: number;
}

// Store rate limit data - in a real production app, use Redis or similar cache
const ipLimits = new Map<string, RateLimitRecord>();
const userLimits = new Map<string, RateLimitRecord>();
const pathLimits = new Map<string, Map<string, RateLimitRecord>>();

// Create rate limit by IP
export const rateLimitByIp = (options: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 30,     // 30 requests per window
  blockDuration: 10 * 60 * 1000 // 10 minute block
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get existing record or create new one
    if (!ipLimits.has(ip)) {
      ipLimits.set(ip, {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        blocked: false,
        blockExpiry: null
      });
    }
    
    const record = ipLimits.get(ip)!;
    
    // Check if IP is blocked
    if (record.blocked) {
      if (record.blockExpiry && now > record.blockExpiry) {
        // Block expired, reset
        record.blocked = false;
        record.blockExpiry = null;
        record.count = 0;
        record.firstRequest = now;
      } else {
        // Still blocked
        return res.status(429).json({
          message: 'Too many requests, please try again later.',
          retryAfter: record.blockExpiry ? Math.ceil((record.blockExpiry - now) / 1000) : 600
        });
      }
    }
    
    // Check if we need to reset the counter (outside the window)
    if (now - record.firstRequest > options.windowMs) {
      record.count = 0;
      record.firstRequest = now;
    }
    
    // Increment counter
    record.count += 1;
    record.lastRequest = now;
    
    // Check if limit exceeded
    if (record.count > options.maxRequests) {
      record.blocked = true;
      record.blockExpiry = now + options.blockDuration;
      
      // Log suspicious activity
      storage.createActivityLog({
        userId: req.user?.id || null,
        type: 'security_warning',
        description: `IP ${ip} exceeded rate limit for ${req.path}`,
        status: 'active',
        ip: ip,
        createdAt: new Date()
      }).catch(console.error);
      
      return res.status(429).json({
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.blockDuration / 1000)
      });
    }
    
    next();
  };
};

// Rate limit by user ID (must be after auth middleware)
export const rateLimitByUser = (options: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 50,     // 50 requests per window for authenticated users
  blockDuration: 5 * 60 * 1000 // 5 minute block
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return next(); // Skip for unauthenticated users
    }
    
    const userId = req.user.id.toString();
    const now = Date.now();
    
    // Get existing record or create new one
    if (!userLimits.has(userId)) {
      userLimits.set(userId, {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        blocked: false,
        blockExpiry: null
      });
    }
    
    const record = userLimits.get(userId)!;
    
    // Check if user is blocked
    if (record.blocked) {
      if (record.blockExpiry && now > record.blockExpiry) {
        // Block expired, reset
        record.blocked = false;
        record.blockExpiry = null;
        record.count = 0;
        record.firstRequest = now;
      } else {
        // Still blocked
        return res.status(429).json({
          message: 'Account temporarily restricted due to unusual activity.',
          retryAfter: record.blockExpiry ? Math.ceil((record.blockExpiry - now) / 1000) : 300
        });
      }
    }
    
    // Check if we need to reset the counter (outside the window)
    if (now - record.firstRequest > options.windowMs) {
      record.count = 0;
      record.firstRequest = now;
    }
    
    // Increment counter
    record.count += 1;
    record.lastRequest = now;
    
    // Check if limit exceeded
    if (record.count > options.maxRequests) {
      record.blocked = true;
      record.blockExpiry = now + options.blockDuration;
      
      // Log suspicious activity
      storage.createActivityLog({
        userId: req.user.id,
        type: 'security_warning',
        description: `User ID ${userId} exceeded rate limit for ${req.path}`,
        status: 'active',
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        createdAt: new Date()
      }).catch(console.error);
      
      return res.status(429).json({
        message: 'Account temporarily restricted due to unusual activity.',
        retryAfter: Math.ceil(options.blockDuration / 1000)
      });
    }
    
    next();
  };
};

// Rate limit specific paths/endpoints
export const rateLimitPath = (path: string, options: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10,     // 10 requests per window for specific endpoints
  blockDuration: 15 * 60 * 1000 // 15 minute block
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.includes(path)) {
      return next(); // Skip for other paths
    }
    
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Initialize path map if it doesn't exist
    if (!pathLimits.has(path)) {
      pathLimits.set(path, new Map());
    }
    
    const pathMap = pathLimits.get(path)!;
    
    // Get existing record or create new one
    if (!pathMap.has(ip)) {
      pathMap.set(ip, {
        count: 0,
        firstRequest: now,
        lastRequest: now,
        blocked: false,
        blockExpiry: null
      });
    }
    
    const record = pathMap.get(ip)!;
    
    // Check if IP is blocked for this path
    if (record.blocked) {
      if (record.blockExpiry && now > record.blockExpiry) {
        // Block expired, reset
        record.blocked = false;
        record.blockExpiry = null;
        record.count = 0;
        record.firstRequest = now;
      } else {
        // Still blocked
        return res.status(429).json({
          message: 'Too many attempts, please try again later.',
          retryAfter: record.blockExpiry ? Math.ceil((record.blockExpiry - now) / 1000) : 900
        });
      }
    }
    
    // Check if we need to reset the counter (outside the window)
    if (now - record.firstRequest > options.windowMs) {
      record.count = 0;
      record.firstRequest = now;
    }
    
    // Increment counter
    record.count += 1;
    record.lastRequest = now;
    
    // Check if limit exceeded
    if (record.count > options.maxRequests) {
      record.blocked = true;
      record.blockExpiry = now + options.blockDuration;
      
      // Log suspicious activity
      storage.createActivityLog({
        userId: req.user?.id || null,
        type: 'security_warning',
        action: 'path_rate_limit_exceeded',
        details: `IP ${ip} exceeded rate limit for specific path: ${path}`,
        ip: ip,
        createdAt: new Date()
      }).catch(console.error);
      
      return res.status(429).json({
        message: 'Too many attempts, please try again later.',
        retryAfter: Math.ceil(options.blockDuration / 1000)
      });
    }
    
    next();
  };
};

// Rate limit with exponential backoff for specific actions (like failed logins)
export const incrementalRateLimit = (key: string, maxAttempts: number = 5, baseBlockMs: number = 5000) => {
  const attemptMap = new Map<string, { 
    count: number, 
    lastAttempt: number, 
    blockUntil: number 
  }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recordKey = `${key}:${identifier}`;
    
    // Get existing record or create new one
    if (!attemptMap.has(recordKey)) {
      attemptMap.set(recordKey, {
        count: 0,
        lastAttempt: now,
        blockUntil: 0
      });
    }
    
    const record = attemptMap.get(recordKey)!;
    
    // Check if currently blocked
    if (now < record.blockUntil) {
      const waitSeconds = Math.ceil((record.blockUntil - now) / 1000);
      return res.status(429).json({
        message: 'Too many failed attempts, please try again later.',
        retryAfter: waitSeconds
      });
    }
    
    // Reset count after 24 hours
    if (now - record.lastAttempt > 24 * 60 * 60 * 1000) {
      record.count = 0;
    }
    
    // Increment attempt counter
    record.count += 1;
    record.lastAttempt = now;
    
    // If exceeded, apply exponential backoff
    if (record.count > maxAttempts) {
      // Calculate exponential backoff: 2^(attempts-maxAttempts) * baseBlockMs
      const factor = Math.pow(2, record.count - maxAttempts);
      const blockDuration = Math.min(factor * baseBlockMs, 24 * 60 * 60 * 1000); // Cap at 24 hours
      record.blockUntil = now + blockDuration;
      
      // Log security event
      storage.createActivityLog({
        userId: req.user?.id || null,
        type: 'security_warning',
        action: `${key}_attempt_blocked`,
        details: `IP ${identifier} blocked due to too many failed ${key} attempts`,
        ip: identifier,
        createdAt: new Date()
      }).catch(console.error);
      
      return res.status(429).json({
        message: 'Too many failed attempts, please try again later.',
        retryAfter: Math.ceil(blockDuration / 1000)
      });
    }
    
    // Function to reset attempts on success
    const resetAttempts = () => {
      if (attemptMap.has(recordKey)) {
        attemptMap.delete(recordKey);
      }
    };
    
    // Attach reset function to request object
    (req as any).resetRateLimitAttempts = resetAttempts;
    
    next();
  };
};