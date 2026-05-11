import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
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
        .then(res => {
          setUser(res.data);
          setSubscription(res.data.subscription || { tier: 'free', status: 'active' });
        })
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
    
    const tokenData = res.data.token;
    setToken(tokenData);
    setUser(res.data.user);
    setSubscription(res.data.user?.subscription || { tier: 'free', status: 'active' });
    
    try {
      localStorage.setItem('token', tokenData);
    } catch {}
    
    return res.data;
  };

  const login = async (email, password) => {
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      email,
      password,
    });
    
    const tokenData = res.data.token;
    setToken(tokenData);
    setUser(res.data.user);
    setSubscription(res.data.user?.subscription || { tier: 'free', status: 'active' });
    
    try {
      localStorage.setItem('token', tokenData);
    } catch {}
    
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSubscription(null);
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
        subscription,
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