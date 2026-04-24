// frontend/src/pages/admin/movies/index.jsx
import Image from 'next/image';
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/layout/AdminLayout';
import DataTable from '../../../components/admin/common/DataTable';
import ConfirmModal from '../../../components/admin/common/ConfirmModal';
import { FiPlus, FiUpload, FiEdit2, FiTrash2, FiEye, FiRefreshCw, FiStar, FiFilm } from 'react-icons/fi';
import { GET_ADMIN_MOVIES } from '../../../graphql/queries/adminQueries';
import { ADMIN_DELETE_MOVIE, ADMIN_BULK_IMPORT } from '../../../graphql/mutations/adminMutations';
import toast from 'react-hot-toast';

export default function AdminMovies() {
  const [deleteModal, setDeleteModal] = useState({ open: false, movie: null });
  const [importModal, setImportModal] = useState(false);
  const limit = 30;

  const { data, loading, refetch } = useQuery(GET_ADMIN_MOVIES, {
    variables: { limit }
  });

  const [deleteMovie] = useMutation(ADMIN_DELETE_MOVIE, {
    onCompleted: () => {
      toast.success('Movie deleted');
      refetch();
      setDeleteModal({ open: false, movie: null });
    },
    onError: (err) => toast.error(err.message)
  });

  const [bulkImport, { loading: importing }] = useMutation(ADMIN_BULK_IMPORT, {
    onCompleted: (data) => {
      toast.success(`Imported ${data.adminBulkImportMovies} movies`);
      refetch();
      setImportModal(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const columns = [
    {
      header: 'Movie',
      accessor: 'title',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-14"><Image src={row.posterUrl || '/images/placeholder.jpg'} alt="" fill className="object-cover rounded-lg ring-1 ring-white/5" /></div>
          <div>
            <p className="text-white font-semibold text-sm">{row.title}</p>
            <p className="text-gray-500 text-xs">{row.year || '—'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      cell: (row) => (
        <span className="flex items-center gap-1 text-sm">
          <FiStar className="text-yellow-400 fill-yellow-400" size={12} />
          <span className="text-yellow-400 font-bold tabular-nums">{row.rating?.toFixed(1) || '—'}</span>
        </span>
      )
    },
    {
      header: 'Genres',
      accessor: 'genres',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.genres?.slice(0, 2).map(g => (
            <span key={g.id} className="text-[10px] font-medium bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">{g.name}</span>
          ))}
          {row.genres?.length > 2 && (
            <span className="text-[10px] text-gray-600">+{row.genres.length - 2}</span>
          )}
        </div>
      )
    },
    {
      header: 'Downloads',
      accessor: 'downloadCount',
      cell: (row) => <span className="text-sm text-gray-400 tabular-nums">{(row.downloadCount || 0).toLocaleString()}</span>
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/movies/${row.id}`}>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
              <FiEye className="text-gray-500 group-hover:text-white" size={15} />
            </button>
          </Link>
          <Link href={`/admin/movies/${row.id}/edit`}>
            <button className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors group">
              <FiEdit2 className="text-gray-500 group-hover:text-blue-400" size={15} />
            </button>
          </Link>
          <button onClick={() => setDeleteModal({ open: true, movie: row })} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group">
            <FiTrash2 className="text-gray-500 group-hover:text-red-400" size={15} />
          </button>
        </div>
      )
    }
  ];

  const movies = data?.trending || [];

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Movies</h1>
            <p className="text-sm text-gray-500 mt-0.5">{movies.length} movies in library</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setImportModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] text-gray-300 text-sm font-medium rounded-xl transition-all">
              <FiUpload size={15} /> Import
            </button>
            <Link href="/admin/movies/create">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-primary-500/20">
                <FiPlus size={15} /> Add Movie
              </button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/5 overflow-hidden">
          <DataTable
            columns={columns}
            data={movies}
            loading={loading}
          />
        </div>
      </div>

      <ConfirmModal
        open={deleteModal.open}
        title="Delete Movie"
        message={`Are you sure you want to delete "${deleteModal.movie?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteMovie({ variables: { id: deleteModal.movie?.id } })}
        onCancel={() => setDeleteModal({ open: false, movie: null })}
      />

      {importModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#13151b] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Import from TMDb</h2>
            <p className="text-sm text-gray-500 mb-5">Auto-import popular movies from TMDb</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              bulkImport({ variables: { source: 'tmdb', count: parseInt(fd.get('count')) } });
            }}>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Number of movies</label>
                <input type="number" name="count" defaultValue={20} min={1} max={100}
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 transition-colors" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setImportModal(false)} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={importing} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}