import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import backend from '~backend/client';
import type { User } from '~backend/force/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthenticatedBackend: () => typeof backend;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const isAuthenticated = !!user && !!token;

  // Get authenticated backend client
  const getAuthenticatedBackend = () => {
    if (!token) return backend;
    return backend.with({
      auth: () => Promise.resolve({ session: token })
    });
  };

  // Load user from session on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if we have a session cookie
        const sessionToken = getCookie('session');
        if (!sessionToken) {
          setIsLoading(false);
          return;
        }

        setToken(sessionToken);
        
        // Try to get current user
        const authenticatedBackend = backend.with({
          auth: () => Promise.resolve({ session: sessionToken })
        });
        
        const currentUser = await authenticatedBackend.force.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear invalid session
        clearCookie('session');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (sessionToken: string) => {
    try {
      setToken(sessionToken);
      
      // Get user data
      const authenticatedBackend = backend.with({
        auth: () => Promise.resolve({ session: sessionToken })
      });
      
      const currentUser = await authenticatedBackend.force.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Login failed:', error);
      setToken(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        const authenticatedBackend = backend.with({
          auth: () => Promise.resolve({ session: token })
        });
        await authenticatedBackend.auth.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      clearCookie('session');
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getAuthenticatedBackend
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper functions for cookie management
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
