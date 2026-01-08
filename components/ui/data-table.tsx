'use client';

import { ReactNode } from 'react';
import { Button } from './button';
import { usePaginatedQuery } from '@/lib/hooks/use-api';

/**
 * Column definition for DataTable
 */
export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

/**
 * Props for DataTable component
 */
export interface DataTableProps<T> {
  url: string;
  columns: DataTableColumn<T>[];
  searchParams?: Record<string, string>;
  pageSize?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  rowKey?: (item: T) => string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => ReactNode;
}

/**
 * Generic DataTable component with pagination
 */
export function DataTable<T extends Record<string, unknown>>({
  url,
  columns,
  searchParams = {},
  pageSize = 50,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  rowKey = (item) => (item.id as string) || String(item),
  onRowClick,
  actions,
}: DataTableProps<T>) {
  // Build URL with search params
  const searchParamsString = new URLSearchParams(searchParams).toString();
  const fullUrl = searchParamsString ? `${url}?${searchParamsString}` : url;

  const {
    data,
    loading,
    error,
    page,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  } = usePaginatedQuery<T>(fullUrl, { pageSize });

  if (loading) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
            {actions && <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={rowKey(item)}
              className={`border-b transition-colors hover:bg-muted/50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={column.key} className="p-4 align-middle">
                  {column.render ? column.render(item) : (item[column.key] as ReactNode)}
                </td>
              ))}
              {actions && (
                <td className="p-4 align-middle" onClick={(e) => e.stopPropagation()}>
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={previousPage}
            disabled={!hasPreviousPage}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={nextPage}
            disabled={!hasNextPage}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

