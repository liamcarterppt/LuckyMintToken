import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

interface AuthRequest extends Request {
  user?: any;
}

const authMiddleware = {
  // Middleware to require authentication
  required: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated via session
      if (req.session && req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        
        if (user) {
          // Check if user is banned
          if (user.isBanned) {
            return res.status(403).json({
              message: 'Your account has been suspended. Please contact support.'
            });
          }
          
          // Attach user to request
          req.user = user;
          return next();
        }
      }
      
      return res.status(401).json({ message: 'Authentication required' });
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  // Middleware that attaches user if authenticated, but doesn't require auth
  optional: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.session && req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        
        if (user && !user.isBanned) {
          req.user = user;
        }
      }
      
      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      next();
    }
  },
  
  // Middleware to require admin privileges
  adminRequired: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.session && req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        
        if (user && user.isAdmin) {
          req.user = user;
          return next();
        }
      }
      
      return res.status(403).json({ message: 'Admin privileges required' });
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export default authMiddleware;
