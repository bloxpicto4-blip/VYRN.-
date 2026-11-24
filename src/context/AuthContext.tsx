import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  currentUser: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<UserProfile>;
  register: (data: { username: string; email: string; password: string; displayName?: string }) => Promise<UserProfile>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  mustChangePassword: boolean;
  setMustChangePassword: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vyrn_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('vyrn_token');
    if (!storedToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const user = await api.getMe();
      setCurrentUser(user);
      if (user.mustChangePassword) {
        setMustChangePassword(true);
      }
    } catch {
      localStorage.removeItem('vyrn_token');
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string): Promise<UserProfile> => {
    const res = await api.login(identifier, password);
    localStorage.setItem('vyrn_token', res.token);
    setToken(res.token);
    setCurrentUser(res.user);
    if (res.user.mustChangePassword) {
      setMustChangePassword(true);
    }
    return res.user;
  };

  const register = async (data: { username: string; email: string; password: string; displayName?: string }): Promise<UserProfile> => {
    const res = await api.register(data);
    localStorage.setItem('vyrn_token', res.token);
    setToken(res.token);
    setCurrentUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('vyrn_token');
    setToken(null);
    setCurrentUser(null);
    setMustChangePassword(false);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await api.changePassword(currentPassword, newPassword);
    setCurrentUser(res.user);
    setMustChangePassword(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const updated = await api.updateProfile(data);
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        login,
        register,
        logout,
        changePassword,
        updateProfile,
        refreshUser,
        mustChangePassword,
        setMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
