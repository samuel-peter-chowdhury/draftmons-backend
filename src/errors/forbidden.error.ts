import { BaseError } from './base.error';

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}
