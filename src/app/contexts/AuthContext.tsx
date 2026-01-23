import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../services/authApi';
import { toast } from '@/app/utils/toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Track user activity and auto-logout on inactivity
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Listen to user activity
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Check for inactivity every minute
    const interval = setInterval(() => {
      // Check for inactivity
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        logout();
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [user, lastActivity]);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await authApi.getMe();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          // Token invalid or expired
          logout();
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { user: userData, token, expires_in } = response.data;
      
      localStorage.setItem('auth_token', token);
      // expiry is in seconds from now
      const tokenExpiry = Date.now() + (expires_in * 1000); 
      localStorage.setItem('token_expiry', tokenExpiry.toString());
      
      setUser(userData);
      setLastActivity(Date.now());
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    // For Google Login, usually we redirect to backend endpoint
    // window.location.href = `${API_BASE_URL}/auth/google`;
    
    // For now, let's keep it as TODO since it requires full oauth flow
    toast.info('Fitur Google Login memerlukan konfigurasi Backend yang aktif.');
  };

  const register = async (name: string, phone: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(name, email, phone, password);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      const { user: userData, token, expires_in } = response.data;
      
      localStorage.setItem('auth_token', token);
      const tokenExpiry = Date.now() + (expires_in * 1000); 
      localStorage.setItem('token_expiry', tokenExpiry.toString());

      setUser(userData);
      setLastActivity(Date.now());
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Call API logout but don't wait for it
    authApi.logout(); 
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token_expiry');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        checkAuth,
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