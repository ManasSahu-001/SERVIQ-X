import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'customer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isCustomer, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-[#FFB33F]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB33F]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Customer trying to access Admin dashboard / backend routes
  if (requiredRole === 'admin' && isCustomer) {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
};
