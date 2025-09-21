import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../errors';
import { LeagueUser } from '../entities/league-user.entity';

// Interface for authenticated request with user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Check if user is authenticated
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return next();
  }

  throw new UnauthorizedError('Please log in to access this resource');
};

// Check if user is admin
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }

  throw new ForbiddenError('Admin access required');
};

// Check if user is league moderator
export const isLeagueModerator = (leagueIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      throw new UnauthorizedError('Please log in to access this resource');
    }

    const leagueId = parseInt(req.params[leagueIdParam]);

    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid league ID');
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // Check if user is a moderator of the league
    const isModerator = req.user?.leagueUsers?.some(
      (leagueUser: LeagueUser) => leagueUser.leagueId === leagueId && leagueUser.isModerator
    );

    if (isModerator) {
      return next();
    }

    throw new ForbiddenError('League moderator access required');
  };
};

// Check if user is a member of the specified league
export const isLeagueMember = (leagueIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      throw new UnauthorizedError('Please log in to access this resource');
    }

    const leagueId = parseInt(req.params[leagueIdParam]);

    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid league ID');
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // Check if user is a member of the league
    const isMember = req.user?.leagueUsers?.some(
      (leagueUser: LeagueUser) => leagueUser.leagueId === leagueId
    );

    if (isMember) {
      return next();
    }

    throw new ForbiddenError('League membership required');
  };
};
