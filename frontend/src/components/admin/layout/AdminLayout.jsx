// frontend/src/components/admin/layout/AdminLayout.jsx
import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  // Don't do auth checks here - let AdminProtectedRoute handle it!
  // This component should only render the layout

  // Format user data to match admin structure expected by header
  const adminData = user ? {
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email,
    role: user.role,
  } : null;

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <AdminHeader 
          admin={adminData} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}