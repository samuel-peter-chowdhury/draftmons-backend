import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseService } from './base.service';
import { HttpException } from '../utils/error.utils';
import { GoogleUserDto, UpdateUserDto } from '../dtos/user.dto';
import { Service, Inject } from 'typedi';

@Service()
export class UserService extends BaseService<User> {
  constructor(
    @Inject('UserRepository')
    private userRepository: Repository<User>
  ) {
    super(userRepository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async findOrCreateGoogleUser(googleUserDto: GoogleUserDto): Promise<User> {
    // Check if user already exists with this Google ID
    let user = await this.findByGoogleId(googleUserDto.googleId);

    if (user) {
      // Update user info if needed
      const needsUpdate =
        user.firstName !== googleUserDto.firstName ||
        user.lastName !== googleUserDto.lastName ||
        user.email !== googleUserDto.email;

      if (needsUpdate) {
        user = await this.update(user.id, {
          firstName: googleUserDto.firstName,
          lastName: googleUserDto.lastName,
          email: googleUserDto.email,
        });
      }

      return user;
    }

    // Check if user exists with same email
    user = await this.findByEmail(googleUserDto.email);

    if (user) {
      // Link existing account with Google
      return this.update(user.id, {
        googleId: googleUserDto.googleId,
        firstName: user.firstName || googleUserDto.firstName,
        lastName: user.lastName || googleUserDto.lastName,
      });
    }

    // Create new user
    return this.create({
      googleId: googleUserDto.googleId,
      firstName: googleUserDto.firstName,
      lastName: googleUserDto.lastName,
      email: googleUserDto.email,
      isAdmin: false,
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if email is being updated and ensure it's not already taken
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);

      if (existingUser && existingUser.id !== id) {
        throw new HttpException(400, 'Email is already in use');
      }
    }

    return this.update(id, updateUserDto);
  }

  async promoteToAdmin(id: number): Promise<User> {
    return this.update(id, { isAdmin: true });
  }

  async demoteFromAdmin(id: number): Promise<User> {
    return this.update(id, { isAdmin: false });
  }
}
