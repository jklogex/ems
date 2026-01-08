import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  defaultLimit?: number;
}

/**
 * Filter options for queries
 */
export interface FilterOptions {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Sorting options
 */
export interface SortOptions {
  column: string;
  ascending?: boolean;
}

/**
 * Query options combining pagination, filtering, and sorting
 */
export interface QueryOptions extends PaginationOptions {
  filters?: FilterOptions;
  sort?: SortOptions;
  select?: string;
}

/**
 * Applies pagination to a Supabase query
 */
export function applyPagination<T>(
  query: ReturnType<SupabaseClient<T>['from']>,
  options: PaginationOptions
) {
  const limit = options.limit ?? options.defaultLimit ?? 100;
  const offset = options.offset ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (query as any).range(offset, offset + limit - 1);
}

/**
 * Applies filters to a Supabase query
 */
export function applyFilters<T>(
  query: ReturnType<SupabaseClient<T>['from']>,
  filters: FilterOptions
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let filteredQuery: any = query;

  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Handle different filter types
    if (typeof value === 'string') {
      // Use ilike for string searches (case-insensitive partial match)
      filteredQuery = filteredQuery.ilike(key, `%${value}%`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // Use eq for exact matches
      filteredQuery = filteredQuery.eq(key, value);
    }
  }

  return filteredQuery;
}

/**
 * Applies sorting to a Supabase query
 */
export function applySorting<T>(
  query: ReturnType<SupabaseClient<T>['from']>,
  sort?: SortOptions
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryAny = query as any;
  
  if (!sort) {
    return queryAny.order('created_at', { ascending: false });
  }

  return queryAny.order(sort.column, { ascending: sort.ascending ?? false });
}

/**
 * Builds a complete query with pagination, filters, and sorting
 */
export function buildQuery<T>(
  query: ReturnType<SupabaseClient<T>['from']>,
  options: QueryOptions = {}
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let builtQuery: any = query;

  // Apply select if specified
  if (options.select) {
    builtQuery = builtQuery.select(options.select);
  }

  // Apply filters
  if (options.filters) {
    builtQuery = applyFilters(builtQuery, options.filters);
  }

  // Apply sorting
  builtQuery = applySorting(builtQuery, options.sort);

  // Apply pagination
  builtQuery = applyPagination(builtQuery, options);

  return builtQuery;
}

/**
 * Extracts pagination parameters from URL search params
 */
export function getPaginationFromSearchParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 100
): PaginationOptions {
  const limit = parseInt(searchParams.get('limit') || defaultLimit.toString(), 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  return {
    limit: isNaN(limit) ? defaultLimit : limit,
    offset: isNaN(offset) ? 0 : offset,
  };
}

/**
 * Extracts filter parameters from URL search params
 */
export function getFiltersFromSearchParams(
  searchParams: URLSearchParams,
  allowedFilters: string[] = []
): FilterOptions {
  const filters: FilterOptions = {};

  if (allowedFilters.length === 0) {
    // If no allowed filters specified, include all non-pagination params
    for (const [key, value] of searchParams.entries()) {
      if (!['limit', 'offset', 'sort', 'order'].includes(key)) {
        filters[key] = value;
      }
    }
  } else {
    // Only include allowed filters
    for (const key of allowedFilters) {
      const value = searchParams.get(key);
      if (value !== null) {
        filters[key] = value;
      }
    }
  }

  return filters;
}

/**
 * Extracts sort options from URL search params
 */
export function getSortFromSearchParams(
  searchParams: URLSearchParams
): SortOptions | undefined {
  const sortColumn = searchParams.get('sort') || searchParams.get('order');
  const ascending = searchParams.get('asc') === 'true' || searchParams.get('ascending') === 'true';

  if (!sortColumn) {
    return undefined;
  }

  return {
    column: sortColumn,
    ascending,
  };
}

/**
 * Gets all query options from URL search params
 */
export function getQueryOptionsFromSearchParams(
  searchParams: URLSearchParams,
  options: {
    defaultLimit?: number;
    allowedFilters?: string[];
  } = {}
): QueryOptions {
  return {
    ...getPaginationFromSearchParams(searchParams, options.defaultLimit),
    filters: getFiltersFromSearchParams(searchParams, options.allowedFilters),
    sort: getSortFromSearchParams(searchParams),
  };
}

