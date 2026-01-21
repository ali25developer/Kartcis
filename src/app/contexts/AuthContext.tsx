import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';

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

// Mock user database (in production, this would be on backend)
const MOCK_USERS = [
  {
    id: 1,
    email: 'demo@masup.id',
    password: 'demo123',
    name: 'Demo User',
    phone: '08123456789',
    role: 'user',
  },
  {
    id: 999,
    email: 'admin@kartcis.id',
    password: 'admin123',
    name: 'Admin KARTCIS',
    phone: '08111222333',
    role: 'admin',
  },
];

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
      const token = localStorage.getItem('auth_token');
      const tokenExpiry = localStorage.getItem('token_expiry');
      
      if (!token || !tokenExpiry) {
        logout();
        return;
      }

      // Check if token expired
      if (Date.now() > parseInt(tokenExpiry)) {
        logout();
        return;
      }

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

  const checkAuth = () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const userDataStr = localStorage.getItem('user_data');
      const tokenExpiry = localStorage.getItem('token_expiry');

      if (token && userDataStr && tokenExpiry) {
        // Check if token is still valid
        if (Date.now() < parseInt(tokenExpiry)) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
        } else {
          // Token expired, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          localStorage.removeItem('token_expiry');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate credentials (mock validation)
    const foundUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!foundUser) {
      throw new Error('Email atau password salah');
    }

    // Generate mock JWT token
    const mockToken = `mock_jwt_${Date.now()}_${Math.random().toString(36)}`;
    
    // Token expiry: 24 hours if remember me, 2 hours otherwise
    const expiryTime = rememberMe ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const tokenExpiry = Date.now() + expiryTime;

    const userData: User = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      phone: foundUser.phone,
      role: foundUser.role as 'user' | 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('token_expiry', tokenExpiry.toString());

    setUser(userData);
    setLastActivity(Date.now());
  };

  const loginWithGoogle = async () => {
    // Simulate Google OAuth (in production, this would open Google OAuth popup)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock Google user data with random name
    const mockToken = `mock_google_jwt_${Date.now()}_${Math.random().toString(36)}`;
    const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Generate random Indonesian name
    const firstNames = ['Budi', 'Andi', 'Siti', 'Rina', 'Dewi', 'Agus', 'Dian', 'Rudi', 'Fitri', 'Hendra'];
    const lastNames = ['Santoso', 'Wijaya', 'Pratama', 'Kusuma', 'Permata', 'Utomo', 'Setiawan', 'Lestari', 'Saputra', 'Anggraini'];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomName = `${randomFirstName} ${randomLastName}`;

    const userData: User = {
      id: Math.floor(Math.random() * 10000),
      name: randomName,
      email: `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}@gmail.com`,
      phone: '08123456789',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('token_expiry', tokenExpiry.toString());

    setUser(userData);
    setLastActivity(Date.now());
  };

  const register = async (name: string, phone: string, email: string, password: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if email already exists (mock validation)
    const existingUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      throw new Error('Email sudah terdaftar');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password minimal 6 karakter');
    }

    // Create new user (in production, this would be saved to backend)
    const newUser = {
      id: MOCK_USERS.length + 1,
      email,
      password,
      name,
      phone,
    };

    // Add to mock database
    MOCK_USERS.push(newUser);

    // Generate token and login
    const mockToken = `mock_jwt_${Date.now()}_${Math.random().toString(36)}`;
    const tokenExpiry = Date.now() + (2 * 60 * 60 * 1000); // 2 hours

    const userData: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('token_expiry', tokenExpiry.toString());

    setUser(userData);
    setLastActivity(Date.now());
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
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