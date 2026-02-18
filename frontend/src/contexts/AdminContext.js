
// frontend/src/contexts/AdminContext.js
import { createContext, useContext } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useAdmin } from '../hooks/useAdmin';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const auth = useAdminAuth();
  const admin = useAdmin();

  return (
    <AdminContext.Provider value={{ ...auth, ...admin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
}