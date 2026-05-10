import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../services/api';

const TOKEN_KEY = 'makale-ozeti-token';
const USER_KEY = 'makale-ozeti-user';
const SUBSCRIPTION_KEY = 'makale-ozeti-subscription';

const AuthContext = createContext(null);

function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => readStorage(USER_KEY));
  const [subscription, setSubscription] = useState(() => readStorage(SUBSCRIPTION_KEY));
  const [isInitializing, setIsInitializing] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const persistSession = useCallback(
    ({ token: nextToken, user: nextUser, subscription: nextSubscription }) => {
      localStorage.setItem(TOKEN_KEY, nextToken);
      writeStorage(USER_KEY, nextUser);
      writeStorage(SUBSCRIPTION_KEY, nextSubscription);
      setToken(nextToken);
      setUser(nextUser);
      setSubscription(nextSubscription);
    },
    []
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
    setToken('');
    setUser(null);
    setSubscription(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setIsInitializing(false);
      return;
    }

    try {
      const response = await api.post('/auth/profile');
      setUser(response.data.user);
      setSubscription(response.data.subscription);
      writeStorage(USER_KEY, response.data.user);
      writeStorage(SUBSCRIPTION_KEY, response.data.subscription);
    } catch (error) {
      clearSession();
    } finally {
      setIsInitializing(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    persistSession(response.data);
    return response.data;
  }, [persistSession]);

  const register = useCallback(async (payload) => {
    const response = await api.post('/auth/register', payload);
    persistSession(response.data);
    return response.data;
  }, [persistSession]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      logout,
      refreshProfile,
      register,
      subscription,
      token,
      user,
    }),
    [isInitializing, login, logout, refreshProfile, register, subscription, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
