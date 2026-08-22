import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeLocalStorage } from '../utils/safeFormats';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Check if user is logged in
      const token = safeLocalStorage.getItem('access_token');
      const username = safeLocalStorage.getItem('username');
      if (token && username) {
        setUser({ username });
      }
    } catch (e) {
      console.warn("Auth initialization error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (tokens, username) => {
    try {
      if (tokens?.access) safeLocalStorage.setItem('access_token', tokens.access);
      if (tokens?.refresh) safeLocalStorage.setItem('refresh_token', tokens.refresh);
      if (username) safeLocalStorage.setItem('username', username);
      setUser({ username });
      navigate('/');
    } catch (e) {
      console.error("Error setting auth session:", e);
    }
  };

  const logout = () => {
    try {
      safeLocalStorage.removeItem('access_token');
      safeLocalStorage.removeItem('refresh_token');
      safeLocalStorage.removeItem('username');
    } catch (e) {
      console.warn("Error during logout cleanup:", e);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

