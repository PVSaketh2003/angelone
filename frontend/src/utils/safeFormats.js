/**
 * Defensive Data Formatter Utilities
 * Prevents runtime TypeErrors and crash exceptions when dealing with null, undefined, or NaN inputs.
 */

export function safeFixed(value, decimals = 2, fallback = '0.00') {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  if (isNaN(num)) return fallback;
  return num.toFixed(decimals);
}

export function safeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function safePercent(value, decimals = 2, fallback = '0.00%') {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  if (isNaN(num)) return fallback;
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(decimals)}%`;
}

export function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function formatIndianNumber(num) {
  const n = safeNumber(num, 0);
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return (n / 100000).toFixed(2) + ' L';
  return n.toLocaleString('en-IN');
}

/**
 * Safe localStorage wrapper handling incognito mode & storage restriction DOMExceptions
 */
export const safeLocalStorage = {
  getItem: (key, fallback = null) => {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch (e) {
      console.warn(`[Storage Warning] Failed to read '${key}' from localStorage:`, e);
      return fallback;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[Storage Warning] Failed to write '${key}' to localStorage:`, e);
      return false;
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[Storage Warning] Failed to remove '${key}' from localStorage:`, e);
      return false;
    }
  }
};
