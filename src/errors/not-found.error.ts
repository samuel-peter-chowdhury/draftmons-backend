import { BaseError } from './base.error';

export class NotFoundError extends BaseError {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} with identifier ${identifier} not found`, 404, 'NOT_FOUND');
  }
}
