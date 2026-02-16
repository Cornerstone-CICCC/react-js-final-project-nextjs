import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, clearTokens } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // On page refresh, accessToken (in memory) is lost.
      // Try to restore session using refreshToken from localStorage.
      const hasRefreshToken = !!localStorage.getItem('refreshToken');
      if (hasRefreshToken) {
        await api.refreshToken();
      }

      const response = await api.getCurrentUser();
      setUser(response.user);
    } catch {
      // Not authenticated or token expired
      setUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.login(email, password);
    setUser(response.user);
  }

  async function signup(email: string, password: string, name: string) {
    const response = await api.signup(email, password, name);
    setUser(response.user);
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // Even if server logout fails, clear local state
    }
    clearTokens();
    setUser(null);
  }

  async function refreshUser() {
    await checkAuth();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
