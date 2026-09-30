/**
 * Utilities for formatting and parsing Vietnamese Dong (VNĐ) currencies.
 * Supports auto-formatting thousand separators (e.g., 13.250.000) and parsing to raw integers.
 */

/**
 * Format a number or string into Vietnamese currency representation with dot separators (e.g. 13.250.000).
 * Returns empty string if value is empty/null/undefined to allow seamless user typing and deletion.
 */
export function formatCurrencyVND(val: number | string | null | undefined): string {
  if (val === '' || val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (isNaN(val)) return '';
    return val.toLocaleString('vi-VN');
  }
  const clean = val.toString().replace(/\D/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
}

/**
 * Parse a formatted currency string (or number) into a pure integer number for database storage and calculations.
 * Strips all non-digit characters (dots, commas, symbols, spaces).
 */
export function parseCurrencyVND(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.round(val);
  }
  const clean = val.toString().replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}
