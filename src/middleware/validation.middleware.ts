import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HttpException } from '../utils/error.utils';

// Middleware to validate request body against a DTO class
export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Convert plain object to class instance
    const dtoObj: Object = plainToInstance(dtoClass, req.body);

    // Validate the instance
    const errors: ValidationError[] = await validate(dtoObj, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    // If validation errors exist, throw exception
    if (errors.length > 0) {
      const validationErrors = errors.map((error: ValidationError) => {
        return {
          property: error.property,
          constraints: error.constraints,
        };
      });

      throw new HttpException(400, 'Validation failed: ' + JSON.stringify(validationErrors));
    }

    // Validation passed, proceed
    req.body = dtoObj;
    next();
  };
};

// Middleware to validate query parameters
export const validateQuery = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Convert query params to class instance
    const dtoObj: Object = plainToInstance(dtoClass, req.query);

    // Validate the instance
    const errors: ValidationError[] = await validate(dtoObj, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    // If validation errors exist, throw exception
    if (errors.length > 0) {
      const validationErrors = errors.map((error: ValidationError) => {
        return {
          property: error.property,
          constraints: error.constraints,
        };
      });

      throw new HttpException(400, 'Query validation failed: ' + JSON.stringify(validationErrors));
    }

    // Validation passed, proceed
    req.query = dtoObj as any;
    next();
  };
};

// Middleware to validate path parameters
export const validateParams = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Convert path params to class instance
    const dtoObj: Object = plainToInstance(dtoClass, req.params);

    // Validate the instance
    const errors: ValidationError[] = await validate(dtoObj, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    // If validation errors exist, throw exception
    if (errors.length > 0) {
      const validationErrors = errors.map((error: ValidationError) => {
        return {
          property: error.property,
          constraints: error.constraints,
        };
      });

      throw new HttpException(400, 'Parameter validation failed: ' + JSON.stringify(validationErrors));
    }

    // Validation passed, proceed
    req.params = dtoObj as any;
    next();
  };
};
