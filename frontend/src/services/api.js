import { safeLocalStorage } from '../utils/safeFormats';

const defaultBackend = (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
  ? 'https://quantengine-backend.onrender.com'
  : 'http://localhost:8000';

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultBackend;



/**
 * Resilient API client for making backend REST requests with automatic error normalization,
 * authentication headers, and network failure safeguards.
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const isAuthRoute = endpoint.includes('/api/auth/');
  
  const token = safeLocalStorage.getItem('access_token');
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  // Only attach Bearer token to non-auth routes
  if (token && !isAuthRoute && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    
    // Attempt parsing JSON
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { response: text, message: text };
      }
    }

    if (!res.ok) {
      if (res.status === 401 && !isAuthRoute) {
        // Clear stale token if unauthorized on protected route
        safeLocalStorage.removeItem('access_token');
        safeLocalStorage.removeItem('username');
      }
      const errorMsg = data?.error || data?.detail || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[API Network Error] Unable to connect to ${url}`);
      err.isNetworkError = true;
      err.message = 'Unable to connect to QuantEngine backend server. Please check server connection.';
    }
    throw err;
  }
}

