// frontend/src/components/admin/users/UserFilters.jsx
import { FiSearch, FiFilter } from 'react-icons/fi';

export default function UserFilters({ search, onSearchChange, status, onStatusChange, role, onRoleChange }) {
  return (
    <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full bg-white/5 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/5 focus:border-primary-500/30 outline-none transition-colors placeholder-gray-600"
        />
      </div>
      <select
        value={status || 'all'}
        onChange={(e) => onStatusChange?.(e.target.value)}
        className="bg-white/5 text-sm text-gray-300 px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="banned">Banned</option>
      </select>
      <select
        value={role || 'all'}
        onChange={(e) => onRoleChange?.(e.target.value)}
        className="bg-white/5 text-sm text-gray-300 px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer"
      >
        <option value="all">All Roles</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="superadmin">Super Admin</option>
      </select>
    </div>
  );
}
