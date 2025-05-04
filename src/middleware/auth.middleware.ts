import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../utils/error.utils';

// Interface for authenticated request with user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Check if user is authenticated
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return next();
  }

  throw new HttpException(401, 'Unauthorized: Please log in to access this resource');
};

// Check if user is admin
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }

  throw new HttpException(403, 'Forbidden: Admin access required');
};

// Check if user is league moderator
export const isLeagueModerator = (leagueIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      throw new HttpException(401, 'Unauthorized: Please log in to access this resource');
    }

    const leagueId = parseInt(req.params[leagueIdParam]);

    if (isNaN(leagueId)) {
      throw new HttpException(400, 'Invalid league ID');
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // Check if user is a moderator of the league
    const isModerator = req.user?.leagueUsers?.some(
      (leagueUser: any) => leagueUser.leagueId === leagueId && leagueUser.isModerator
    );

    if (isModerator) {
      return next();
    }

    throw new HttpException(403, 'Forbidden: League moderator access required');
  };
};

// Check if user is a member of the specified league
export const isLeagueMember = (leagueIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      throw new HttpException(401, 'Unauthorized: Please log in to access this resource');
    }

    const leagueId = parseInt(req.params[leagueIdParam]);

    if (isNaN(leagueId)) {
      throw new HttpException(400, 'Invalid league ID');
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // Check if user is a member of the league
    const isMember = req.user?.leagueUsers?.some(
      (leagueUser: any) => leagueUser.leagueId === leagueId
    );

    if (isMember) {
      return next();
    }

    throw new HttpException(403, 'Forbidden: League membership required');
  };
};

// Check if user owns the resource
export const isResourceOwner = (resourceIdParam: string, userIdField: string = 'userId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      throw new HttpException(401, 'Unauthorized: Please log in to access this resource');
    }

    const resourceId = parseInt(req.params[resourceIdParam]);

    if (isNaN(resourceId)) {
      throw new HttpException(400, 'Invalid resource ID');
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // Get the resource from request
    const resource = res.locals.resource;

    if (!resource) {
      throw new HttpException(404, 'Resource not found');
    }

    // Check if user owns the resource
    if (resource[userIdField] === req.user.id) {
      return next();
    }

    throw new HttpException(403, 'Forbidden: You do not have permission to access this resource');
  };
};
