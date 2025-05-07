export abstract class BaseError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      timestamp: new Date().toISOString()
    };
  }
} 