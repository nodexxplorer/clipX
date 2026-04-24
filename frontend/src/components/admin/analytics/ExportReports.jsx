// frontend/src/components/admin/analytics/ExportReports.jsx
import { useState } from 'react';
import { FiDownload, FiFileText, FiUsers, FiDollarSign, FiLoader } from 'react-icons/fi';

const EXPORT_TYPES = [
  { id: 'revenue', label: 'Revenue Report', desc: 'Payment history, plans, and totals', icon: FiDollarSign, color: 'text-green-400', bg: 'bg-green-500/10', endpoint: '/api/admin/export/revenue' },
  { id: 'users', label: 'User Report', desc: 'All users with activity data', icon: FiUsers, color: 'text-blue-400', bg: 'bg-blue-500/10', endpoint: '/api/admin/export/users' },
  { id: 'content', label: 'Content Report', desc: 'Movies, genres, and metadata', icon: FiFileText, color: 'text-purple-400', bg: 'bg-purple-500/10', endpoint: '/api/admin/export/content' },
];

export default function ExportReports({ apiBase }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    setExporting(type.id);
    try {
      const base = apiBase || process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${base}${type.endpoint}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type.id}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Export Data</h3>
        <p className="text-xs text-gray-500 mt-1">Download CSV reports for analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EXPORT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => handleExport(type)}
            disabled={exporting === type.id}
            className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-5 text-left hover:border-white/10 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${type.bg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <type.icon className={type.color} size={18} />
              </div>
              {exporting === type.id ? (
                <FiLoader className="text-gray-500 animate-spin" size={16} />
              ) : (
                <FiDownload className="text-gray-600 group-hover:text-white transition-colors" size={16} />
              )}
            </div>
            <p className="text-sm font-bold text-white">{type.label}</p>
            <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
