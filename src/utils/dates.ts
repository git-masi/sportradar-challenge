import { format } from 'date-fns';

/**
 * A simple abstraction for getting the current date as a formatted string.
 * @returns - The current date in yyyy-MM-dd, ISO 8601, or custom format.
 */
export function getCurrentDate(options?: { iso?: boolean; format?: string }) {
  return options && options?.iso
    ? new Date().toISOString()
    : format(new Date(), options?.format ?? 'yyyy-MM-dd');
}
