import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/db/client';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
} from './response';
import { handleApiError } from './error-handler';
import {
  getQueryOptionsFromSearchParams,
  applyFilters,
  applySorting,
  applyPagination,
} from '@/lib/db/query-builder';

/**
 * Options for list handler
 */
export interface ListHandlerOptions {
  table: string;
  select?: string;
  allowedFilters?: string[];
  defaultLimit?: number;
  transform?: (data: unknown[]) => unknown[];
  defaultSort?: {
    column: string;
    ascending?: boolean;
  };
}

/**
 * Generic list handler for GET requests with pagination and filtering
 */
export async function listHandler<T = unknown>(
  request: NextRequest,
  options: ListHandlerOptions
) {
  try {
    const supabase = getSupabaseServiceClient();
    const searchParams = request.nextUrl.searchParams;

    const queryOptions = getQueryOptionsFromSearchParams(searchParams, {
      defaultLimit: options.defaultLimit,
      allowedFilters: options.allowedFilters,
    });

    const selectString = options.select || '*';
    let query = supabase
      .from(options.table)
      .select(selectString, { count: 'exact' });

    // Apply filters
    if (queryOptions.filters && Object.keys(queryOptions.filters).length > 0) {
      for (const [key, value] of Object.entries(queryOptions.filters)) {
        if (value === null || value === undefined || value === '') {
          continue;
        }
        if (typeof value === 'string') {
          query = query.ilike(key, `%${value}%`);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          query = query.eq(key, value);
        }
      }
    }

    // Apply sorting
    if (queryOptions.sort) {
      query = query.order(queryOptions.sort.column, { 
        ascending: queryOptions.sort.ascending ?? false 
      });
    } else if (options.defaultSort) {
      query = query.order(options.defaultSort.column, { 
        ascending: options.defaultSort.ascending ?? false 
      });
    }
    // If no sort specified, don't apply any ordering

    // Apply pagination
    const limit = queryOptions.limit ?? options.defaultLimit ?? 100;
    const offset = queryOptions.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return handleApiError(error);
    }

    let resultData = (data || []) as T[];

    if (options.transform) {
      resultData = options.transform(resultData) as T[];
    }

    return paginatedResponse(resultData, {
      count: resultData.length,
      limit: queryOptions.limit ?? options.defaultLimit ?? 100,
      offset: queryOptions.offset ?? 0,
      total: count ?? resultData.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Options for read handler
 */
export interface ReadHandlerOptions {
  table: string;
  select?: string;
  idField?: string;
}

/**
 * Generic read handler for GET /[id] requests
 */
export async function readHandler<T = unknown>(
  request: NextRequest,
  params: { id: string },
  options: ReadHandlerOptions
) {
  try {
    const supabase = getSupabaseServiceClient();
    const idField = options.idField || 'id';

    let query = supabase
      .from(options.table)
      .select(options.select || '*')
      .eq(idField, params.id)
      .single();

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Resource not found');
      }
      return handleApiError(error);
    }

    return successResponse<T>(data as T);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Options for create handler
 */
export interface CreateHandlerOptions<T> {
  table: string;
  schema: z.ZodSchema<T>;
  select?: string;
  transform?: (data: T) => Record<string, unknown>;
  afterCreate?: (data: unknown, supabase: ReturnType<typeof getSupabaseServiceClient>) => Promise<void>;
}

/**
 * Generic create handler for POST requests
 */
export async function createHandler<T = unknown>(
  request: NextRequest,
  options: CreateHandlerOptions<T>
) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = options.schema.safeParse(body);
    if (!validationResult.success) {
      return badRequestResponse(
        validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const supabase = getSupabaseServiceClient();
    const validatedData = validationResult.data;

    let insertData: Record<string, unknown> = validatedData as Record<string, unknown>;
    if (options.transform) {
      insertData = options.transform(validatedData);
    }

    let query = supabase
      .from(options.table)
      .insert(insertData);

    if (options.select) {
      query = query.select(options.select) as typeof query;
    } else {
      query = query.select() as typeof query;
    }

    const { data, error } = await query.single();

    if (error) {
      return handleApiError(error);
    }

    // Run afterCreate hook if provided
    if (options.afterCreate && data) {
      try {
        await options.afterCreate(data, supabase);
      } catch (hookError) {
        console.error('Error in afterCreate hook:', hookError);
        // Don't fail the request if hook fails, but log it
      }
    }

    return createdResponse<T>(data as T);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Options for update handler
 */
export interface UpdateHandlerOptions<T> {
  table: string;
  schema: z.ZodSchema<T>;
  select?: string;
  idField?: string;
  transform?: (data: Partial<T>) => Record<string, unknown>;
  afterUpdate?: (data: unknown, supabase: ReturnType<typeof getSupabaseServiceClient>) => Promise<void>;
}

/**
 * Generic update handler for PATCH requests
 */
export async function updateHandler<T = unknown>(
  request: NextRequest,
  params: { id: string },
  options: UpdateHandlerOptions<T>
) {
  try {
    const body = await request.json();
    
    // Validate input (partial schema)
    const partialSchema = options.schema.partial();
    const validationResult = partialSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequestResponse(
        validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      );
    }

    const supabase = getSupabaseServiceClient();
    const idField = options.idField || 'id';
    const validatedData = validationResult.data;

    let updateData: Record<string, unknown> = validatedData as Record<string, unknown>;
    if (options.transform) {
      updateData = options.transform(validatedData);
    }

    let query = supabase
      .from(options.table)
      .update(updateData)
      .eq(idField, params.id);

    if (options.select) {
      query = query.select(options.select) as typeof query;
    } else {
      query = query.select() as typeof query;
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundResponse('Resource not found');
      }
      return handleApiError(error);
    }

    // Run afterUpdate hook if provided
    if (options.afterUpdate && data) {
      try {
        await options.afterUpdate(data, supabase);
      } catch (hookError) {
        console.error('Error in afterUpdate hook:', hookError);
        // Don't fail the request if hook fails, but log it
      }
    }

    return successResponse<T>(data as T);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Options for delete handler
 */
export interface DeleteHandlerOptions {
  table: string;
  idField?: string;
  beforeDelete?: (id: string, supabase: ReturnType<typeof getSupabaseServiceClient>) => Promise<void>;
}

/**
 * Generic delete handler for DELETE requests
 */
export async function deleteHandler(
  request: NextRequest,
  params: { id: string },
  options: DeleteHandlerOptions
) {
  try {
    const supabase = getSupabaseServiceClient();
    const idField = options.idField || 'id';

    // Run beforeDelete hook if provided
    if (options.beforeDelete) {
      try {
        await options.beforeDelete(params.id, supabase);
      } catch (hookError) {
        console.error('Error in beforeDelete hook:', hookError);
        // Don't fail the request if hook fails, but log it
      }
    }

    const { error } = await supabase
      .from(options.table)
      .delete()
      .eq(idField, params.id);

    if (error) {
      return handleApiError(error);
    }

    return successResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

