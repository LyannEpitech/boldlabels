import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export class ValidationException extends Error {
  constructor(
    public errors: ValidationError[],
    public statusCode: number = 400
  ) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

/**
 * Middleware to validate request body against a Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          value: req.body,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'The request body contains invalid data',
          details: errors,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        });
      }
      
      // Store validated data
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate request params against a Zod schema
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          value: req.params,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'The URL parameters contain invalid data',
          details: errors,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        });
      }
      
      req.params = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to validate request query against a Zod schema
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors: ValidationError[] = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
          value: req.query,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'The query parameters contain invalid data',
          details: errors,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
        });
      }
      
      req.query = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);
  
  // Validation errors from our middleware
  if (err instanceof ValidationException) {
    return res.status(err.statusCode).json({
      error: 'Validation failed',
      message: err.message,
      details: err.errors,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    });
  }
  
  // Zod validation errors
  if (err instanceof z.ZodError) {
    const errors: ValidationError[] = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      message: 'The request data contains invalid values',
      details: errors,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    });
  }
  
  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found',
        code: prismaError.code,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A resource with this identifier already exists',
        code: prismaError.code,
        meta: prismaError.meta,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }
    
    // Foreign key constraint
    if (prismaError.code === 'P2003') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'The referenced resource does not exist',
        code: prismaError.code,
        meta: prismaError.meta,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      });
    }
  }
  
  // Default error response
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
}
