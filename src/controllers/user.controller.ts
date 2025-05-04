import { Request, Response, Router } from 'express';
import { UserService } from '../services/user.service';
import { BaseController } from './base.controller';
import { User } from '../entities/user.entity';
import { UserDto, CreateUserDto, UpdateUserDto, AdminUpdateUserDto } from '../dtos/user.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAdmin, isAuthenticated, AuthenticatedRequest } from '../middleware/auth.middleware';
import { HttpException, asyncHandler } from '../utils/error.utils';
import { plainToInstance } from 'class-transformer';

export class UserController extends BaseController<User, UserDto, UpdateUserDto> {
  public router = Router();

  constructor(private userService: UserService) {
    super(userService, UserDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes

    // Protected routes
    this.router.get('/me', isAuthenticated, this.getCurrentUser);
    this.router.put('/me', isAuthenticated, validateDto(UpdateUserDto), this.updateCurrentUser);

    // Admin routes
    this.router.get('/', isAdmin, this.getAll);
    this.router.get('/:id', isAdmin, this.getById);
    this.router.post('/', isAdmin, validateDto(CreateUserDto), this.create);
    this.router.put('/:id', isAdmin, validateDto(AdminUpdateUserDto), this.adminUpdate);
    this.router.delete('/:id', isAdmin, this.delete);
    this.router.post('/:id/promote', isAdmin, this.promoteToAdmin);
    this.router.post('/:id/demote', isAdmin, this.demoteFromAdmin);
  }

  getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpException(401, 'Unauthorized');
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
      throw new HttpException(401, 'Unauthorized');
    }

    const user = await this.userService.updateUser(req.user.id, req.body);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
      })
    );
  });

  adminUpdate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const user = await this.userService.update(id, req.body as AdminUpdateUserDto);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
        groups: ['user.admin'],
      })
    );
  });

  promoteToAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
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
