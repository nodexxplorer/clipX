// frontend/src/components/admin/common/DataTable.jsx
import { FiChevronLeft, FiChevronRight, FiInbox } from 'react-icons/fi';

export default function DataTable({ columns, data, loading, pagination, onRowClick }) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm text-gray-500">Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col, i) => (
                <th key={i} className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center">
                  <FiInbox className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No data found</p>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-white/[0.02] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-5 py-3.5 text-gray-300 text-sm">
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
          <span className="text-xs text-gray-500 font-medium">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              <FiChevronLeft className="text-gray-400" size={16} />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
            >
              <FiChevronRight className="text-gray-400" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}