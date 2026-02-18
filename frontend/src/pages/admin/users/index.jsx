// frontend/src/pages/admin/users/index.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/layout/AdminLayout';
import DataTable from '../../../components/admin/common/DataTable';
import ConfirmModal from '../../../components/admin/common/ConfirmModal';
import StatusBadge from '../../../components/admin/common/StatusBadge';
import { FiEye, FiEdit2, FiSlash, FiCheck, FiMail } from 'react-icons/fi';
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
  const { hasPermission, authContext } = useAdmin();

  const { data, loading, refetch } = useQuery(GET_ADMIN_USERS, {
    variables: { 
      limit, 
      offset: (page - 1) * limit, 
      search,
      status: statusFilter !== 'all' ? statusFilter : undefined
    },
    ...authContext
  });

  const [banUser, { loading: banning }] = useMutation(ADMIN_BAN_USER, {
    ...authContext,
    onCompleted: () => {
      toast.success('User banned');
      refetch();
      setBanModal({ open: false, user: null });
      setBanReason('');
    },
    onError: (err) => toast.error(err.message)
  });

  const [unbanUser] = useMutation(ADMIN_UNBAN_USER, {
    ...authContext,
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
          <img 
            src={row.avatar || `https://ui-avatars.com/api/?name=${row.firstName}+${row.lastName}&background=8b5cf6&color=fff`} 
            alt="" 
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="text-white font-medium">{row.firstName} {row.lastName}</p>
            <p className="text-gray-400 text-xs">@{row.username}</p>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={getStatus(row)} />
    },
    {
      header: 'Activity',
      cell: (row) => (
        <div className="text-sm">
          <p className="text-gray-300">{row.watchlistCount} watchlist</p>
          <p className="text-gray-500 text-xs">{row.downloadCount} downloads</p>
        </div>
      )
    },
    {
      header: 'Last Active',
      cell: (row) => (
        <span className="text-gray-400 text-sm">
          {row.lastActive ? new Date(row.lastActive).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      header: 'Joined',
      cell: (row) => (
        <span className="text-gray-400 text-sm">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/users/${row.id}`}>
            <button className="p-2 hover:bg-gray-700 rounded" title="View">
              <FiEye className="text-gray-400" />
            </button>
          </Link>
          <a href={`mailto:${row.email}`}>
            <button className="p-2 hover:bg-gray-700 rounded" title="Email">
              <FiMail className="text-blue-400" />
            </button>
          </a>
          {hasPermission('moderation', 'action') && (
            row.isBanned ? (
              <button 
                onClick={() => unbanUser({ variables: { id: row.id } })}
                className="p-2 hover:bg-gray-700 rounded" 
                title="Unban"
              >
                <FiCheck className="text-green-400" />
              </button>
            ) : (
              <button 
                onClick={() => setBanModal({ open: true, user: row })}
                className="p-2 hover:bg-gray-700 rounded" 
                title="Ban"
              >
                <FiSlash className="text-red-400" />
              </button>
            )
          )}
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <div className="text-gray-400 text-sm">
            {data?.adminUsers?.totalCount?.toLocaleString()} total users
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Ban User</h2>
            <p className="text-gray-400 mb-4">
              Ban <strong className="text-white">{banModal.user?.email}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2 text-sm">Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
                rows={3}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700"
                placeholder="Enter ban reason..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setBanModal({ open: false, user: null }); setBanReason(''); }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={() => banUser({ variables: { id: banModal.user.id, reason: banReason } })}
                disabled={!banReason || banning}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
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