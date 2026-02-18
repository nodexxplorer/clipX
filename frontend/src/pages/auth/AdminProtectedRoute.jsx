// components/auth/AdminProtectedRoute.jsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminProtectedRoute({ children }) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Not logged in - redirect to login with return URL
        router.push('/auth/login?redirect=/admin');
      } else if (user?.role !== 'admin') {
        // Logged in but not admin - redirect to user dashboard
        console.log('⚠️ User is not admin, redirecting to dashboard');
        router.push('/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if not authenticated or not admin (while redirecting)
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and is admin - show content
  return <>{children}</>;
}