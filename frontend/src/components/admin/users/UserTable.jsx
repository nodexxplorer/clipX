// frontend/src/components/admin/users/UserTable.jsx
import Image from 'next/image';
import Link from 'next/link';
import StatusBadge from '../common/StatusBadge';
import { FiEye, FiSlash, FiCheck, FiMail } from 'react-icons/fi';

export default function UserTable({ users = [], onBan, onUnban, loading }) {
  if (loading) {
    return (
      <div className="divide-y divide-white/[0.03]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-48 bg-white/[0.03] rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-white/5 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500 text-sm">No users found</p>
      </div>
    );
  }

  const getStatus = (user) => {
    if (user.isBanned) return 'banned';
    if (!user.isActive) return 'inactive';
    return 'active';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-5 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <Image src={user.avatar} alt="" width={36} height={36} className="rounded-xl object-cover ring-1 ring-white/5" />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-xs font-bold text-white">
                      {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white">{user.name || 'Unnamed'}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 text-sm text-gray-400">{user.email}</td>
              <td className="px-5 py-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
                  {user.role || 'user'}
                </span>
              </td>
              <td className="px-5 py-3.5"><StatusBadge status={getStatus(user)} /></td>
              <td className="px-5 py-3.5 text-xs text-gray-500 tabular-nums">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/admin/users/${user.id}`}>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group" title="View">
                      <FiEye className="text-gray-500 group-hover:text-white" size={15} />
                    </button>
                  </Link>
                  <a href={`mailto:${user.email}`}>
                    <button className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group" title="Email">
                      <FiMail className="text-gray-500 group-hover:text-blue-400" size={15} />
                    </button>
                  </a>
                  {user.isBanned ? (
                    <button onClick={() => onUnban?.(user)} className="p-2 hover:bg-green-500/10 rounded-lg transition-colors group" title="Unban">
                      <FiCheck className="text-gray-500 group-hover:text-green-400" size={15} />
                    </button>
                  ) : (
                    <button onClick={() => onBan?.(user)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group" title="Ban">
                      <FiSlash className="text-gray-500 group-hover:text-red-400" size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
