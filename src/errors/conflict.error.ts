import { BaseError } from './base.error';

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class StructuredConflictError extends BaseError {
  public readonly detail: unknown;

  constructor(message: string, detail: unknown) {
    super(message, 409, 'CONFLICT');
    this.detail = detail;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      detail: this.detail,
    };
  }
}
