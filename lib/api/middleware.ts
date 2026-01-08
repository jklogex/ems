import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { unauthorizedResponse, forbiddenResponse, badRequestResponse } from './response';
import type { UserRole } from '@/lib/db/types';

/**
 * Session with user information
 */
export interface ApiSession {
  user: {
    id: string;
    email: string;
    role: UserRole;
    region: string | null;
  };
}

/**
 * Gets the current session for API routes
 */
export async function getApiSession(): Promise<ApiSession | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  return {
    user: {
      id: session.user.id || '',
      email: session.user.email || '',
      role: session.user.role,
      region: session.user.region,
    },
  };
}

/**
 * Wraps an API handler with authentication check
 */
export function withAuth<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, ...args: Parameters<T> extends [NextRequest, ...infer Rest] ? Rest : []) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const session = await getApiSession();
    
    if (!session) {
      return unauthorizedResponse('Authentication required');
    }

    // Add session to request context (pass as first argument after request)
    return (handler as any)(request, session, ...args);
  };
}

/**
 * Wraps an API handler with role-based access control
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (request: NextRequest, session: ApiSession, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, session: ApiSession, ...args: any[]): Promise<NextResponse> => {
    if (!allowedRoles.includes(session.user.role)) {
      return forbiddenResponse(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    return handler(request, session, ...args);
  };
}

/**
 * Wraps an API handler with input validation
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (
    request: NextRequest,
    validatedData: z.infer<T>,
    ...args: any[]
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validationResult = schema.safeParse(body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return badRequestResponse(`Validation error: ${errors}`);
      }

      return handler(request, validationResult.data, ...args);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return badRequestResponse('Invalid JSON in request body');
      }
      return badRequestResponse('Failed to parse request body');
    }
  };
}

/**
 * Wraps an API handler with query parameter validation
 */
export function withQueryValidation<T extends z.ZodType>(
  schema: T,
  handler: (
    request: NextRequest,
    validatedQuery: z.infer<T>,
    ...args: any[]
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const searchParams = request.nextUrl.searchParams;
    const queryObject = Object.fromEntries(searchParams.entries());
    
    const validationResult = schema.safeParse(queryObject);

    if (!validationResult.success) {
      const errors = validationResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return badRequestResponse(`Query validation error: ${errors}`);
    }

    return handler(request, validationResult.data, ...args);
  };
}

/**
 * Combines multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return <T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler) as T;
  };
}

/**
 * Common middleware combinations
 */
export const withAuthAndRole = (allowedRoles: UserRole[]) => {
  return composeMiddleware(
    withAuth,
    (handler: any) => withRole(allowedRoles, handler)
  );
};

export const withAuthAndValidation = <T extends z.ZodType>(schema: T) => {
  return composeMiddleware(
    withAuth,
    (handler: any) => withValidation(schema, handler)
  );
};

export const withAuthRoleAndValidation = <T extends z.ZodType>(
  allowedRoles: UserRole[],
  schema: T
) => {
  return composeMiddleware(
    withAuth,
    (handler: any) => withRole(allowedRoles, handler),
    (handler: any) => withValidation(schema, handler)
  );
};

