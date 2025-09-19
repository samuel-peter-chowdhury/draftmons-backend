import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationError as AppValidationError } from '../errors';

// Helper function to format validation errors
export const formatValidationErrors = (errors: ValidationError[]): string => {
  return errors.map((error: ValidationError) => {
    const constraints = error.constraints ? Object.values(error.constraints).join(', ') : 'Invalid value';
    return `${error.property}: ${constraints}`;
  }).join('; ');
};

// Middleware to validate request body against a DTO class
export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Convert plain object to class instance
      const dtoObj: Object = plainToInstance(dtoClass, req.body);

      // Validate the instance
      const errors: ValidationError[] = await validate(dtoObj, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      // If validation errors exist, throw exception
      if (errors.length > 0) {
        throw new AppValidationError(formatValidationErrors(errors));
      }

      // Validation passed, proceed
      req.body = dtoObj;
      next();
    } catch (error) {
      if (error instanceof AppValidationError) {
        throw error;
      }
      throw new AppValidationError('Invalid request body format');
    }
  };
};

export const validatePartialDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Convert plain object to class instance
      const dtoObj: Object = plainToInstance(dtoClass, req.body);

      // Validation passed, proceed
      req.body = dtoObj;
      next();
    } catch (error) {
      if (error instanceof AppValidationError) {
        throw error;
      }
      throw new AppValidationError('Invalid request body format');
    }
  };
};

// Middleware to validate query parameters
export const validateQuery = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Convert query params to class instance
      const dtoObj: Object = plainToInstance(dtoClass, req.query);

      // Validate the instance
      const errors: ValidationError[] = await validate(dtoObj, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      // If validation errors exist, throw exception
      if (errors.length > 0) {
        throw new AppValidationError(formatValidationErrors(errors));
      }

      // Validation passed, proceed
      req.query = dtoObj as any;
      next();
    } catch (error) {
      if (error instanceof AppValidationError) {
        throw error;
      }
      throw new AppValidationError('Invalid query parameters format');
    }
  };
};

// Middleware to validate path parameters
export const validateParams = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Convert path params to class instance
      const dtoObj: Object = plainToInstance(dtoClass, req.params);

      // Validate the instance
      const errors: ValidationError[] = await validate(dtoObj, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      // If validation errors exist, throw exception
      if (errors.length > 0) {
        throw new AppValidationError(formatValidationErrors(errors));
      }

      // Validation passed, proceed
      req.params = dtoObj as any;
      next();
    } catch (error) {
      if (error instanceof AppValidationError) {
        throw error;
      }
      throw new AppValidationError('Invalid path parameters format');
    }
  };
};
