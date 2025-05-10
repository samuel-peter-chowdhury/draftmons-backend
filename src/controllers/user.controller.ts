import { Request, Response, Router } from 'express';
import { UserService } from '../services/user.service';
import { BaseController } from './base.controller';
import { User } from '../entities/user.entity';
import { UserDto, CreateUserDto, UpdateUserDto, AdminUpdateUserDto } from '../dtos/user.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ValidationError, UnauthorizedError } from '../errors';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';

export class UserController extends BaseController<User, UserDto> {
  public router = Router();

  constructor(private userService: UserService) {
    super(userService, UserDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Authenticated routes
    this.router.get('/me', isAuthenticated, this.getCurrentUser);
    this.router.put('/me', isAuthenticated, validateDto(UpdateUserDto), this.updateCurrentUser);
    this.router.delete('/me', isAuthenticated, this.deleteCurrentUser);

    // Admin routes
    this.router.get('/', isAuthenticated, isAdmin, this.getAll);
    this.router.post('/', isAuthenticated, isAdmin, validateDto(CreateUserDto), this.create);
    this.router.put('/:id', isAuthenticated, isAdmin, validateDto(AdminUpdateUserDto), this.update);
    this.router.delete('/:id', isAuthenticated, isAdmin, this.delete);
    this.router.post('/:id/promote', isAuthenticated, isAdmin, this.promoteToAdmin);
    this.router.post('/:id/demote', isAuthenticated, isAdmin, this.demoteFromAdmin);

    // Public routes
    this.router.get('/:id', this.getById);
  }

  getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await this.userService.findOne(req.user.id);
    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  updateCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const user = await this.userService.update(req.user.id, req.body);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
      })
    );
  });

  deleteCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    await this.userService.delete(req.user.id);

    res.status(204).send();
  });

  promoteToAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid User ID format');
    }

    const user = await this.userService.promoteToAdmin(id);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
        groups: ['user.admin'],
      })
    );
  });

  demoteFromAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid User ID format');
    }

    const user = await this.userService.demoteFromAdmin(id);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
        groups: ['user.admin'],
      })
    );
  });

  protected getFullTransformGroup(): string[] {
    return ['user.full'];
  }
}
