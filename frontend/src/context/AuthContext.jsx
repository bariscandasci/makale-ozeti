import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios
        .get('http://localhost:3001/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => setUser(res.data))
        .catch(() => {
          try {
            localStorage.removeItem('token');
          } catch {}
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const register = async (email, password, name = 'User') => {
    const res = await axios.post('http://localhost:3001/api/auth/register', {
      email,
      password,
      name,
    });
    setToken(res.data.token);
    setUser(res.data.user);
    try {
      localStorage.setItem('token', res.data.token);
    } catch {}
    return res.data;
  };

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      email,
      password,
    });
    setToken(res.data.token);
    setUser(res.data.user);
    try {
      localStorage.setItem('token', res.data.token);
    } catch {}
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
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