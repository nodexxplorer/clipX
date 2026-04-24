// frontend/src/components/admin/layout/AdminBreadcrumb.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiChevronRight, FiHome } from 'react-icons/fi';

const ROUTE_LABELS = {
  admin: 'Dashboard',
  users: 'Users',
  movies: 'Movies',
  genres: 'Genres',
  cast: 'Cast & Crew',
  analytics: 'Analytics',
  settings: 'Settings',
  reports: 'Reports',
  moderation: 'Moderation',
  content: 'Content',
  revenue: 'Revenue',
  security: 'Security',
  logs: 'Logs',
  notifications: 'Notifications',
  create: 'Create',
  edit: 'Edit',
  import: 'Import',
};

export default function AdminBreadcrumb({ items }) {
  const router = useRouter();

  // Auto-generate from route if no items provided
  const crumbs = items || (() => {
    const parts = router.asPath.split('?')[0].split('/').filter(Boolean);
    return parts.map((part, i) => {
      const href = '/' + parts.slice(0, i + 1).join('/');
      // Skip dynamic segments like [id] — use a generic label
      const label = part.startsWith('[') ? 'Details' : (ROUTE_LABELS[part] || part);
      return { label, href };
    });
  })();

  if (!crumbs || crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-5">
      <Link href="/admin" className="text-gray-500 hover:text-white transition-colors p-1">
        <FiHome size={14} />
      </Link>
      {crumbs.slice(1).map((crumb, i) => {
        const isLast = i === crumbs.length - 2;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <FiChevronRight size={12} className="text-gray-700" />
            {isLast ? (
              <span className="text-white font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-gray-500 hover:text-white transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
