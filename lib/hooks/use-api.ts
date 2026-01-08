'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/lib/api/response';

/**
 * Options for useQuery hook
 */
export interface UseQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
}

/**
 * Result from useQuery hook
 */
export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching data from API
 */
export function useQuery<T = unknown>(
  url: string,
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const { enabled = true, refetchOnMount = true, refetchInterval } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled && refetchOnMount);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      const result: ApiResponse<T> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }

    let intervalId: NodeJS.Timeout | undefined;
    if (refetchInterval && refetchInterval > 0) {
      intervalId = setInterval(fetchData, refetchInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchData, refetchOnMount, refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Options for usePaginatedQuery hook
 */
export interface UsePaginatedQueryOptions extends UseQueryOptions {
  pageSize?: number;
  initialPage?: number;
}

/**
 * Result from usePaginatedQuery hook
 */
export interface UsePaginatedQueryResult<T> extends UseQueryResult<T[]> {
  page: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
}

/**
 * Hook for fetching paginated data from API
 */
export function usePaginatedQuery<T = unknown>(
  baseUrl: string,
  options: UsePaginatedQueryOptions = {}
): UsePaginatedQueryResult<T> {
  const { pageSize = 50, initialPage = 0 } = options;
  const [page, setPage] = useState(initialPage);

  const url = `${baseUrl}?limit=${pageSize}&offset=${page * pageSize}`;
  const query = useQuery<T[]>(url, options);

  const totalCount = (query.data?.length ?? 0);
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages - 1;
  const hasPreviousPage = page > 0;

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(p => p + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(p => p - 1);
    }
  }, [hasPreviousPage]);

  return {
    ...query,
    page,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
  };
}

/**
 * Options for useMutation hook
 */
export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: string) => void;
}

/**
 * Result from useMutation hook
 */
export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for mutations (POST, PATCH, DELETE)
 */
export function useMutation<TData = unknown, TVariables = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
      });

      const result: ApiResponse<TData> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Mutation failed');
      }

      if (onSuccess) {
        onSuccess(result.data as TData);
      }

      return result.data ?? null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [url, method, onSuccess, onError]);

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    const result = await mutate(variables);
    if (result === null) {
      throw new Error(error || 'Mutation failed');
    }
    return result;
  }, [mutate, error]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    loading,
    error,
    reset,
  };
}

