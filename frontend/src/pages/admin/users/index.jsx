// frontend/src/pages/admin/users/index.jsx
import Image from 'next/image';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/layout/AdminLayout';
import DataTable from '../../../components/admin/common/DataTable';
import StatusBadge from '../../../components/admin/common/StatusBadge';
import { FiEye, FiSlash, FiCheck, FiMail, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { GET_ADMIN_USERS } from '../../../graphql/queries/adminQueries';
import { ADMIN_BAN_USER, ADMIN_UNBAN_USER } from '../../../graphql/mutations/adminMutations';
import { useAdmin } from '../../../hooks/useAdmin';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [banModal, setBanModal] = useState({ open: false, user: null });
  const [banReason, setBanReason] = useState('');
  const limit = 20;
  const { hasPermission } = useAdmin();

  const { data, loading, refetch } = useQuery(GET_ADMIN_USERS, {
    variables: {
      limit,
      offset: (page - 1) * limit,
      search,
      status: statusFilter !== 'all' ? statusFilter : undefined
    },
  });

  const [banUser, { loading: banning }] = useMutation(ADMIN_BAN_USER, {
    onCompleted: () => {
      toast.success('User banned');
      refetch();
      setBanModal({ open: false, user: null });
      setBanReason('');
    },
    onError: (err) => toast.error(err.message)
  });

  const [unbanUser] = useMutation(ADMIN_UNBAN_USER, {
    onCompleted: () => {
      toast.success('User unbanned');
      refetch();
    },
    onError: (err) => toast.error(err.message)
  });

  const getStatus = (user) => {
    if (user.isBanned) return 'banned';
    if (!user.isActive) return 'inactive';
    return 'active';
  };

  const columns = [
    {
      header: 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar ? (
            <Image src={row.avatar || '/images/placeholder.jpg'} alt="" width={36} height={36} className="rounded-xl object-cover ring-1 ring-white/5" />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/5">
              {(row.firstName?.[0] || row.email?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">{row.firstName} {row.lastName}</p>
            <p className="text-gray-500 text-xs">{row.username ? `@${row.username}` : row.email}</p>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email', cell: (row) => <span className="text-gray-400 text-sm">{row.email}</span> },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={getStatus(row)} />
    },
    {
      header: 'Activity',
      cell: (row) => (
        <div className="text-sm">
          <span className="text-gray-400 tabular-nums">{row.watchlistCount || 0}</span>
          <span className="text-gray-600 text-xs ml-1">saves</span>
          <span className="text-gray-700 mx-1.5">·</span>
          <span className="text-gray-400 tabular-nums">{row.downloadCount || 0}</span>
          <span className="text-gray-600 text-xs ml-1">downloads</span>
        </div>
      )
    },
    {
      header: 'Joined',
      cell: (row) => (
        <span className="text-gray-500 text-xs tabular-nums">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/users/${row.id}`}>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group" title="View">
              <FiEye className="text-gray-500 group-hover:text-white" size={15} />
            </button>
          </Link>
          <a href={`mailto:${row.email}`}>
            <button className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group" title="Email">
              <FiMail className="text-gray-500 group-hover:text-blue-400" size={15} />
            </button>
          </a>
          {hasPermission('moderation', 'action') && (
            row.isBanned ? (
              <button
                onClick={() => unbanUser({ variables: { id: row.id } })}
                className="p-2 hover:bg-green-500/10 rounded-lg transition-colors group"
                title="Unban"
              >
                <FiCheck className="text-gray-500 group-hover:text-green-400" size={15} />
              </button>
            ) : (
              <button
                onClick={() => setBanModal({ open: true, user: row })}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                title="Ban"
              >
                <FiSlash className="text-gray-500 group-hover:text-red-400" size={15} />
              </button>
            )
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">{data?.adminUsers?.totalCount?.toLocaleString() || 0} total users</p>
          </div>
          <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-white/5 focus:border-primary-500/30 outline-none transition-colors placeholder-gray-600"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 text-sm text-gray-300 px-4 py-2.5 rounded-xl border border-white/5 outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            data={data?.adminUsers?.users || []}
            loading={loading}
            pagination={{
              page,
              totalPages: Math.ceil((data?.adminUsers?.totalCount || 0) / limit),
              onPageChange: setPage
            }}
          />
        </div>
      </div>

      {/* Ban User Modal */}
      {banModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13151b] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Ban User</h2>
            <p className="text-sm text-gray-500 mb-5">
              Ban <strong className="text-white">{banModal.user?.email}</strong>?
            </p>
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-red-500/30 transition-colors resize-none text-sm"
                placeholder="Enter ban reason..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setBanModal({ open: false, user: null }); setBanReason(''); }}
                className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => banUser({ variables: { id: banModal.user.id, reason: banReason } })}
                disabled={!banReason || banning}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                {banning ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}