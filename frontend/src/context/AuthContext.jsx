import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'makale-ozeti-token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return typeof window !== 'undefined'
        ? localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token')
        : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    api
      .get('/auth/profile')
      .then((res) => {
        if (isMounted) {
          setUser(res.data);
        }
      })
      .catch(() => {
        try {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem('token');
        } catch {}
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const register = async (email, password, name = 'User') => {
    const res = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    setToken(res.data.token);
    setUser(res.data.user);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
      localStorage.removeItem('token');
    } catch {}
    return res.data;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });
    setToken(res.data.token);
    setUser(res.data.user);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
      localStorage.removeItem('token');
    } catch {}
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem('token');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        isInitializing: loading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
