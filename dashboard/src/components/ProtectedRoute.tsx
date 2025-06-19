import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Zeige Loading-Screen während Auth-Check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-primary/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-4"></div>
          <div className="flex items-center gap-2 text-dark-text">
            <Shield className="w-5 h-5 text-neon-purple animate-pulse" />
            <span>Überprüfe Authentifizierung...</span>
          </div>
        </div>
      </div>
    );
  }

  // Leite nicht-authentifizierte User zur Login-Seite weiter
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User ist authentifiziert und Admin - zeige geschützte Inhalte
  return <>{children}</>;
};

export default ProtectedRoute; 