import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '../errors';
import { LeagueUser } from '../entities/league-user.entity';
import AppDataSource from '../config/database.config';
import { TeamBuild } from '../entities/team-build.entity';
import { TeamBuildSet } from '../entities/team-build-set.entity';

// Interface for authenticated request with user
export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Check if user is authenticated
export const isAuthenticated = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  return next(new UnauthorizedError('Please log in to access this resource'));
};

// Check if user is admin
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() && req.user?.isAdmin) {
    return next();
  }
  return next(new ForbiddenError('Admin access required'));
};

// Check if user is authenticated for read or is admin for write
export const isAuthReadAdminWrite = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (req.method === 'GET') {
    if (req.isAuthenticated()) {
      return next();
    }
    return next(new UnauthorizedError('Please log in to access this resource'));
  } else {
    if (req.isAuthenticated() && req.user?.isAdmin) {
      return next();
    }
    return next(new ForbiddenError('Admin access required'));
  }
};

// Check if user is admin or is updating their own resource
export const isAdminOrUser = (userIdParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = parseInt(req.params[userIdParam]);

    if (isNaN(userId)) {
      return next(new ValidationError('Invalid user ID'));
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // If user is updating their own resource, allow access
    if (req.user?.id === userId) {
      return next();
    }

    return next(new ForbiddenError('You can only update your own profile'));
  };
};

// Check if user is authenticated for read or is league mod for write
export const isAuthReadLeagueModWrite = (leagueIdParam: string = 'leagueId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (req.method === 'GET') {
      if (req.isAuthenticated()) {
        return next();
      }
      return next(new UnauthorizedError('Please log in to access this resource'));
    } else {
      if (!req.isAuthenticated()) {
        return next(new UnauthorizedError('Please log in to access this resource'));
      }

      const leagueId = parseInt(req.params[leagueIdParam]);

      if (isNaN(leagueId)) {
        return next(new ValidationError('Invalid league ID'));
      }

      // If user is admin, allow access
      if (req.user?.isAdmin) {
        return next();
      }

      // Check if user is a moderator of the league
      const isModerator = req.user?.leagueUsers?.some(
        (leagueUser: LeagueUser) => leagueUser.leagueId === leagueId && leagueUser.isModerator,
      );

      if (isModerator) {
        return next();
      }

      return next(new ForbiddenError('League moderator access required'));
    }
  };
};

// Check if user is league moderator
export const isLeagueModerator = (leagueIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      return next(new UnauthorizedError('Please log in to access this resource'));
    }

    const leagueId = parseInt(req.params[leagueIdParam]);

    if (isNaN(leagueId)) {
      return next(new ValidationError('Invalid league ID'));
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // Check if user is a moderator of the league
    const isModerator = req.user?.leagueUsers?.some(
      (leagueUser: LeagueUser) => leagueUser.leagueId === leagueId && leagueUser.isModerator,
    );

    if (isModerator) {
      return next();
    }

    return next(new ForbiddenError('League moderator access required'));
  };
};

// Check if user is a member of the specified league
export const isLeagueMember = (leagueIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      return next(new UnauthorizedError('Please log in to access this resource'));
    }

    const leagueId = parseInt(req.params[leagueIdParam]);

    if (isNaN(leagueId)) {
      return next(new ValidationError('Invalid league ID'));
    }

    // If user is admin, allow access
    if (req.user?.isAdmin) {
      return next();
    }

    // Check if user is a member of the league
    const isMember = req.user?.leagueUsers?.some(
      (leagueUser: LeagueUser) => leagueUser.leagueId === leagueId,
    );

    if (isMember) {
      return next();
    }

    return next(new ForbiddenError('League membership required'));
  };
};

// Check if user owns the referenced TeamBuild (or is admin). TeamBuilds are
// private to their owner; global admins may still read/write any build.
export const isTeamBuildOwner = (idParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      return next(new UnauthorizedError('Please log in to access this resource'));
    }

    const id = parseInt(req.params[idParam]);
    if (isNaN(id)) {
      return next(new ValidationError('Invalid team build ID'));
    }

    const teamBuild = await AppDataSource.getRepository(TeamBuild).findOne({ where: { id } });
    if (!teamBuild) {
      return next(new NotFoundError('TeamBuild', id));
    }

    if (req.user?.isAdmin || teamBuild.userId === req.user?.id) {
      return next();
    }

    return next(new ForbiddenError('You do not have access to this team build'));
  };
};

// Check if user owns the TeamBuild referenced in the request body (or is admin).
// Used for TeamBuildSet creation, where ownership derives from body.teamBuildId.
export const isTeamBuildBodyOwner = (bodyParam: string = 'teamBuildId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      return next(new UnauthorizedError('Please log in to access this resource'));
    }

    const teamBuildId = parseInt(req.body?.[bodyParam]);
    if (isNaN(teamBuildId)) {
      return next(new ValidationError('Invalid team build ID'));
    }

    const teamBuild = await AppDataSource.getRepository(TeamBuild).findOne({
      where: { id: teamBuildId },
    });
    if (!teamBuild) {
      return next(new NotFoundError('TeamBuild', teamBuildId));
    }

    if (req.user?.isAdmin || teamBuild.userId === req.user?.id) {
      return next();
    }

    return next(new ForbiddenError('You do not have access to this team build'));
  };
};

// Check if user owns the referenced TeamBuildSet's parent TeamBuild (or is admin).
export const isTeamBuildSetOwner = (idParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated()) {
      return next(new UnauthorizedError('Please log in to access this resource'));
    }

    const id = parseInt(req.params[idParam]);
    if (isNaN(id)) {
      return next(new ValidationError('Invalid team build set ID'));
    }

    const teamBuildSet = await AppDataSource.getRepository(TeamBuildSet).findOne({
      where: { id },
      relations: { teamBuild: true },
    });
    if (!teamBuildSet) {
      return next(new NotFoundError('TeamBuildSet', id));
    }

    if (req.user?.isAdmin || teamBuildSet.teamBuild?.userId === req.user?.id) {
      return next();
    }

    return next(new ForbiddenError('You do not have access to this team build set'));
  };
};
