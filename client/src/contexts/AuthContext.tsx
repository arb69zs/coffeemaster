import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, AuthState, UserRole } from '../types';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string, role: UserRole) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Check if user is authenticated on initial load
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }
      
      try {
        const { user } = await authAPI.getProfile();
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
          error: null
        });
      } catch (error) {
        localStorage.removeItem('token');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: 'Authentication failed. Please login again.'
        });
      }
    };
    
    loadUser();
  }, []);

  // Login user
  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { token, user } = await authAPI.login(username, password);
      
      localStorage.setItem('token', token);
      
      setAuthState({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Invalid credentials. Please try again.'
      }));
      throw error;
    }
  };

  // Register user (admin only)
  const register = async (username: string, password: string, role: UserRole) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      await authAPI.register(username, password, role);
      
      setAuthState(prev => ({
        ...prev,
        loading: false
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Registration failed. Please try again.'
      }));
      throw error;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      await authAPI.changePassword(currentPassword, newPassword);
      
      setAuthState(prev => ({
        ...prev,
        loading: false
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to change password. Please try again.'
      }));
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 