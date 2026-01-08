import { PostgrestError } from '@supabase/supabase-js';
import { errorResponse } from './response';

/**
 * Maps Supabase/PostgreSQL errors to user-friendly messages
 */
function mapDatabaseError(error: PostgrestError): { message: string; status: number } {
  const code = error.code;
  const message = error.message;

  // Handle common PostgreSQL error codes
  switch (code) {
    case '23505': // Unique violation
      return {
        message: 'A record with this value already exists',
        status: 409,
      };
    case '23503': // Foreign key violation
      return {
        message: 'Referenced record does not exist',
        status: 400,
      };
    case '23502': // Not null violation
      return {
        message: 'Required field is missing',
        status: 400,
      };
    case '23514': // Check constraint violation
      return {
        message: 'Data does not meet validation requirements',
        status: 400,
      };
    case 'PGRST116': // Not found
      return {
        message: 'Record not found',
        status: 404,
      };
    case '42P01': // Undefined table
      return {
        message: 'Database configuration error',
        status: 500,
      };
    default:
      // Log unexpected errors for debugging
      console.error('Unhandled database error:', {
        code,
        message,
        details: error.details,
        hint: error.hint,
      });
      return {
        message: 'A database error occurred',
        status: 500,
      };
  }
}

/**
 * Handles API errors and returns appropriate responses
 */
export function handleApiError(error: unknown): ReturnType<typeof errorResponse> {
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const dbError = error as PostgrestError;
    const { message, status } = mapDatabaseError(dbError);
    return errorResponse(message, status);
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const message = isDevelopment ? error.message : 'An unexpected error occurred';
    
    // Log full error for debugging
    console.error('API Error:', error);
    
    return errorResponse(message, 500);
  }

  // Handle unknown error types
  console.error('Unknown error type:', error);
  return errorResponse('An unexpected error occurred', 500);
}

/**
 * Wraps an async API handler with error handling
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

