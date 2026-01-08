import { format as dateFnsFormat, formatDistance, formatRelative } from 'date-fns';

/**
 * Formats a date string to a readable format
 */
export function formatDate(date: string | Date, format: string = 'PP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateFnsFormat(dateObj, format);
}

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Formats a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formats a number with thousand separators
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a decimal number as percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats GPS coordinates
 */
export function formatCoordinates(
  lat: number | null,
  lng: number | null,
  decimals: number = 6
): string {
  if (lat === null || lng === null) {
    return '-';
  }
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}

