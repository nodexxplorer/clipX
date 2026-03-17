// frontend/src/components/admin/layout/AdminSidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome, FiFilm, FiUsers, FiGrid, FiBarChart2,
  FiSettings, FiShield, FiActivity, FiX, FiBell, FiSend
} from 'react-icons/fi';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Movies', href: '/admin/movies', icon: FiFilm },
  { name: 'Users', href: '/admin/users', icon: FiUsers },
  { name: 'Notifications', href: '/admin/notifications', icon: FiSend },
  { name: 'Reports', href: '/admin/reports', icon: FiShield },
  { name: 'Genres', href: '/admin/genres', icon: FiGrid },
  { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
  { name: 'Logs', href: '/admin/logs', icon: FiActivity },
  { name: 'Settings', href: '/admin/settings', icon: FiSettings },
];

export default function AdminSidebar({ open, onClose }) {
  const router = useRouter();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-[#0f1117] to-[#0a0c10] border-r border-white/5 z-50 transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo — matches user-facing header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/admin">
            <span className="flex items-center gap-2 group cursor-pointer">
              <span className="text-2xl font-black text-primary-500 uppercase italic tracking-tighter group-hover:scale-110 transition-transform">
                clip<span className="text-white group-hover:text-primary-400 transition-colors text-2xl">X</span>
              </span>
              <span className="text-[10px] font-bold bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white">
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 mt-2 space-y-0.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href ||
              (item.href !== '/admin' && router.pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${isActive
                  ? 'bg-primary-500/15 text-primary-400 shadow-lg shadow-primary-500/5 border border-primary-500/20'
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                  }`}>
                  <item.icon size={18} className={isActive ? 'text-primary-400' : ''} />
                  {item.name}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <Link href="/">
            <span className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">
              ← Back to Site
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}