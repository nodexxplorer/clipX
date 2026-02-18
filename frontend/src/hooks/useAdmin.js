// hooks/useAdmin.js (OPTIONAL - Simplified version)
// Only create this if you need the permission helper functions

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export function useAdmin() {
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Permission checker (simplified - everyone has all permissions for now)
  const hasPermission = useCallback((resource, action) => {
    if (!user || user.role !== 'admin') return false;
    // For now, all admins have all permissions
    // Later you can add role-based permissions here
    return true;
  }, [user]);

  // Wrapper to check permission before executing callback
  const withPermission = useCallback((resource, action, callback) => {
    return (...args) => {
      if (!hasPermission(resource, action)) {
        toast.error(`Permission denied: ${resource}.${action}`);
        return;
      }
      return callback(...args);
    };
  }, [hasPermission]);

  return {
    admin: user,           // Alias for consistency
    user,                  // Same as admin
    isAdmin,               // true if role === 'admin'
    hasPermission,         // Check permissions
    withPermission,        // Wrap functions with permission check
  };
}
