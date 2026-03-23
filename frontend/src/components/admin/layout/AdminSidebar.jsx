// frontend/src/components/admin/layout/AdminSidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome, FiFilm, FiUsers, FiGrid, FiBarChart2,
  FiSettings, FiShield, FiActivity, FiX, FiBell, FiSend,
  FiDollarSign, FiMessageSquare, FiStar, FiLock, FiSliders
} from 'react-icons/fi';

const navSections = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: FiHome },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: FiUsers },
      { name: 'Content', href: '/admin/content', icon: FiFilm },
      { name: 'Genres', href: '/admin/genres', icon: FiGrid },
    ]
  },
  {
    title: 'Revenue',
    items: [
      { name: 'Revenue', href: '/admin/revenue', icon: FiDollarSign },
    ]
  },
  {
    title: 'Moderation',
    items: [
      { name: 'Chat', href: '/admin/moderation', icon: FiMessageSquare },
      { name: 'Reviews', href: '/admin/moderation/reviews', icon: FiStar },
      { name: 'Reports', href: '/admin/reports', icon: FiShield },
    ]
  },
  {
    title: 'Insights',
    items: [
      { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
      { name: 'Notifications', href: '/admin/notifications', icon: FiSend },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Security', href: '/admin/security', icon: FiLock },
      { name: 'Logs', href: '/admin/logs', icon: FiActivity },
      { name: 'Settings', href: '/admin/settings', icon: FiSliders },
    ]
  },
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
        {/* Logo */}
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
        <nav className="p-3 mt-1 flex-1 overflow-y-auto scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.title} className="mb-3">
              <p className="px-4 py-1 text-[10px] uppercase tracking-widest text-gray-600 font-bold">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = router.pathname === item.href ||
                    (item.href !== '/admin' && router.pathname.startsWith(item.href));
                  return (
                    <Link key={item.name} href={item.href}>
                      <span className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium ${isActive
                        ? 'bg-primary-500/15 text-primary-400 shadow-lg shadow-primary-500/5 border border-primary-500/20'
                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                        }`}>
                        <item.icon size={16} className={isActive ? 'text-primary-400' : ''} />
                        {item.name}
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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