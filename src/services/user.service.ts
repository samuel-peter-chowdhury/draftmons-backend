import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseService } from './base.service';
import { Service, Inject } from 'typedi';
import { UserInputDto } from '../dtos/user.dto';

@Service()
export class UserService extends BaseService<User, UserInputDto> {
  constructor(
    @Inject('UserRepository')
    private userRepository: Repository<User>,
  ) {
    super(userRepository, 'User');
  }
}
