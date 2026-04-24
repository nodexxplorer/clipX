// frontend/src/components/admin/movies/BulkImportModal.jsx
import { useState } from 'react';
import { FiUpload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function BulkImportModal({ open, onImport, onCancel, loading, result }) {
  const [source, setSource] = useState('tmdb');
  const [count, setCount] = useState(20);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onImport?.({ source, count: parseInt(count) });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#13151b] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-500/10">
              <FiUpload className="text-primary-400" size={16} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bulk Import</h2>
              <p className="text-xs text-gray-500">Import movies from external sources</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-600 hover:text-white transition-colors p-1">
            <FiX size={18} />
          </button>
        </div>

        {result ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <FiCheck className="text-green-400" size={24} />
            </div>
            <p className="text-white font-bold text-lg mb-1">Import Complete</p>
            <p className="text-gray-500 text-sm">{result} movies imported successfully</p>
            <button onClick={onCancel} className="mt-5 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Source</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'tmdb', label: 'TMDb', desc: 'Popular movies' },
                  { id: 'trending', label: 'Trending', desc: 'Currently trending' },
                ].map((s) => (
                  <button
                    key={s.id} type="button" onClick={() => setSource(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      source === s.id
                        ? 'border-primary-500/40 bg-primary-500/5'
                        : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    <p className={`text-sm font-bold ${source === s.id ? 'text-primary-400' : 'text-white'}`}>{s.label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Number of movies</label>
              <input
                type="number" value={count} onChange={(e) => setCount(e.target.value)}
                min={1} max={100}
                className="w-full bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 transition-colors"
              />
              <p className="text-[10px] text-gray-600 mt-1">Max 100 per import</p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onCancel} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
                {loading ? 'Importing...' : `Import ${count} Movies`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
