import { BaseError } from './base.error';

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
