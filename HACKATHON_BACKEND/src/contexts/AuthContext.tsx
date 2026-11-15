import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { INITIAL_USER } from '../services/mockData';

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCustomer: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; isCustomer?: boolean }>;
  signup: (fullName: string, company: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsCustomer: (email?: string, name?: string) => void;
  loginAsAdmin: () => void;
  isDemoAuth: boolean;
}

const STORAGE_KEY = 'deskpilot_auth_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default to demo user for frictionless hackathon evaluation
    return INITIAL_USER;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; isCustomer?: boolean }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate brief network delay

    if (!email || !pass) {
      setIsLoading(false);
      return { success: false, error: 'Please provide both email and password.' };
    }

    if (!email.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (pass.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const isCust = email.toLowerCase().includes('customer') || email.toLowerCase().includes('rohan');
    const role = isCust ? 'customer' : 'Support Lead';

    const authenticatedUser: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName: isCust ? 'Rohan Mehta' : email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      companyName: isCust ? 'Customer Portal' : 'Acme SaaS Corp',
      role,
      avatar: isCust
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    };

    setUser(authenticatedUser);
    setIsLoading(false);
    return { success: true, isCustomer: isCust };
  };

  const loginAsCustomer = (email = 'rohan.mehta@customer.com', name = 'Rohan Mehta') => {
    const custUser: UserProfile = {
      id: 'usr-customer-rohan',
      fullName: name,
      email,
      companyName: 'Customer Account',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    };
    setUser(custUser);
  };

  const loginAsAdmin = () => {
    setUser(INITIAL_USER);
  };

  const signup = async (
    fullName: string,
    company: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    if (!fullName.trim()) {
      setIsLoading(false);
      return { success: false, error: 'Full name is required.' };
    }
    if (!company.trim()) {
      setIsLoading(false);
      return { success: false, error: 'Company name is required.' };
    }
    if (!email.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Valid email is required.' };
    }
    if (pass.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      companyName: company,
      role: 'Admin / Support Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    };

    setUser(newUser);
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const isCustomer = user?.role === 'customer';
  const isAdmin = !isCustomer;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isCustomer,
        isAdmin,
        login,
        signup,
        logout,
        loginAsCustomer,
        loginAsAdmin,
        isDemoAuth: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
