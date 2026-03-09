// frontend/src/components/admin/layout/AdminSidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  FiHome, FiFilm, FiUsers, FiGrid, FiBarChart2,
  FiSettings, FiShield, FiImage, FiActivity, FiLogOut
} from 'react-icons/fi';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Movies', href: '/admin/movies', icon: FiFilm },
  { name: 'Users', href: '/admin/users', icon: FiUsers },
  { name: 'Reports', href: '/admin/reports', icon: FiShield },
  { name: 'Genres', href: '/admin/genres', icon: FiGrid },
  { name: 'Cast', href: '/admin/cast', icon: FiUsers },
  { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
  { name: 'Content', href: '/admin/content/featured', icon: FiImage },
  { name: 'Logs', href: '/admin/logs', icon: FiActivity },
  { name: 'Settings', href: '/admin/settings', icon: FiSettings },
];

export default function AdminSidebar({ open }) {
  const router = useRouter();

  if (!open) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-40">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-primary-500">🎬 clipX</span> Admin
        </h1>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href ||
            router.pathname.startsWith(item.href + '/');
          return (
            <Link key={item.name} href={item.href}>
              <span className={`flex mb-3 items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                <item.icon size={20} />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}