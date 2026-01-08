import { NextResponse } from 'next/server';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    count?: number;
    limit?: number;
    offset?: number;
    total?: number;
    [key: string]: unknown;
  };
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Creates an error API response
 */
export function errorResponse(
  error: string | Error,
  status: number = 500,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Creates a paginated API response
 */
export function paginatedResponse<T>(
  data: T[],
  options: {
    count: number;
    limit: number;
    offset: number;
    total?: number;
  },
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        count: options.count,
        limit: options.limit,
        offset: options.offset,
        total: options.total ?? options.count,
      },
    },
    { status }
  );
}

/**
 * Creates a created (201) response
 */
export function createdResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  return successResponse(data, 201, meta);
}

/**
 * Creates a not found (404) response
 */
export function notFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

/**
 * Creates a bad request (400) response
 */
export function badRequestResponse(
  message: string = 'Bad request'
): NextResponse<ApiResponse> {
  return errorResponse(message, 400);
}

/**
 * Creates an unauthorized (401) response
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

/**
 * Creates a forbidden (403) response
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

