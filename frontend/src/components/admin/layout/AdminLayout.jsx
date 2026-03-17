// frontend/src/components/admin/layout/AdminLayout.jsx
import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const adminData = user ? {
    firstName: user.name?.split(' ')[0] || '',
    lastName: user.name?.split(' ').slice(1).join(' ') || '',
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  } : null;

  return (
    <div className="min-h-screen bg-[#080a0e]">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <AdminHeader
          admin={adminData}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={logout}
        />
        <main className="p-4 md:p-6 max-w-[1600px]">{children}</main>
      </div>
    </div>
  );
}