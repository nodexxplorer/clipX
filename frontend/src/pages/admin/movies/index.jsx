// frontend/src/pages/admin/movies/index.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/layout/AdminLayout';
import DataTable from '../../../components/admin/common/DataTable';
import ConfirmModal from '../../../components/admin/common/ConfirmModal';
import { FiPlus, FiUpload, FiEdit2, FiTrash2, FiEye, FiRefreshCw } from 'react-icons/fi';
import { GET_ADMIN_MOVIES } from '../../../graphql/queries/adminQueries';
import { ADMIN_DELETE_MOVIE, ADMIN_BULK_IMPORT } from '../../../graphql/mutations/adminMutations';
import toast from 'react-hot-toast';

export default function AdminMovies() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, movie: null });
  const [importModal, setImportModal] = useState(false);
  const limit = 20;

  const { data, loading, refetch } = useQuery(GET_ADMIN_MOVIES, {
    variables: { limit, offset: (page - 1) * limit, search }
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
          <img src={row.posterUrl || '/placeholder.jpg'} alt="" className="w-10 h-14 object-cover rounded" />
          <div>
            <p className="text-white font-medium">{row.title}</p>
            <p className="text-gray-400 text-xs">{row.releaseYear}</p>
          </div>
        </div>
      )
    },
    { header: 'Rating', accessor: 'rating', cell: (row) => <span className="text-yellow-400">★ {row.rating?.toFixed(1)}</span> },
    { header: 'Genres', accessor: 'genres', cell: (row) => row.genres?.map(g => g.name).join(', ') },
    { header: 'Views', accessor: 'viewCount' },
    { header: 'Downloads', accessor: 'downloadCount' },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/movies/${row.id}`}>
            <button className="p-2 hover:bg-gray-700 rounded"><FiEye className="text-gray-400" /></button>
          </Link>
          <Link href={`/admin/movies/${row.id}/edit`}>
            <button className="p-2 hover:bg-gray-700 rounded"><FiEdit2 className="text-blue-400" /></button>
          </Link>
          <button onClick={() => setDeleteModal({ open: true, movie: row })} className="p-2 hover:bg-gray-700 rounded">
            <FiTrash2 className="text-red-400" />
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Movies</h1>
          <div className="flex gap-3">
            <button onClick={() => setImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
              <FiUpload /> Import from TMDb
            </button>
            <Link href="/admin/movies/create">
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
                <FiPlus /> Add Movie
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center gap-4">
            <input
              type="text"
              placeholder="Search movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
            />
            <button onClick={() => refetch()} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">
              <FiRefreshCw className="text-gray-400" />
            </button>
          </div>

          <DataTable
            columns={columns}
            data={data?.adminMovies?.movies || []}
            loading={loading}
            pagination={{
              page,
              totalPages: Math.ceil((data?.adminMovies?.totalCount || 0) / limit),
              onPageChange: setPage
            }}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Import from TMDb</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              bulkImport({ variables: { source: 'tmdb', count: parseInt(fd.get('count')) } });
            }}>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Number of movies</label>
                <input type="number" name="count" defaultValue={20} min={1} max={100}
                  className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setImportModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancel</button>
                <button type="submit" disabled={importing} className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">
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