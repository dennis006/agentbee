import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DiscordUser } from '../types/discord';

interface AuthState {
  user: DiscordUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (user: DiscordUser, isAdmin: boolean) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    isLoading: true,
  });

  // Beim App-Start: Prüfe localStorage für bestehende Auth
  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = () => {
    try {
      const storedAuth = localStorage.getItem('dashboard_auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        
        // Prüfe ob Auth nicht zu alt ist (24 Stunden)
        const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden
        const age = Date.now() - authData.timestamp;
        
        if (age < maxAge && authData.isAdmin && authData.user) {
          setAuthState({
            user: authData.user,
            isAdmin: authData.isAdmin,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          logout();
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      logout();
    }
  };

  const login = (user: DiscordUser, isAdmin: boolean) => {
    const authData = {
      user,
      isAdmin,
      timestamp: Date.now()
    };
    
    localStorage.setItem('dashboard_auth', JSON.stringify(authData));
    
    setAuthState({
      user,
      isAdmin,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('dashboard_auth');
    
    setAuthState({
      user: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const checkAuth = (): boolean => {
    return authState.isAuthenticated && authState.isAdmin;
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 