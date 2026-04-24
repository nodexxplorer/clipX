// frontend/src/components/admin/settings/ApiSettings.jsx
import { useState } from 'react';
import { FiDatabase, FiCopy, FiCheck, FiRefreshCw } from 'react-icons/fi';

export default function ApiSettings({ settings = {} }) {
  const [copied, setCopied] = useState(null);

  const endpoints = [
    { label: 'GraphQL Endpoint', value: settings.graphqlUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql' },
    { label: 'REST API Base', value: settings.restUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api' },
    { label: 'WebSocket URL', value: settings.wsUrl || 'ws://localhost:8000/ws' },
  ];

  const handleCopy = (val, idx) => {
    navigator.clipboard.writeText(val);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <FiDatabase size={15} className="text-primary-400" /> API & Data
      </h2>

      {/* Endpoints */}
      <div className="space-y-3">
        {endpoints.map((ep, i) => (
          <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{ep.label}</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-primary-400 bg-primary-500/5 px-3 py-2 rounded-lg font-mono truncate">{ep.value}</code>
              <button onClick={() => handleCopy(ep.value, i)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                {copied === i ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} className="text-gray-500" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Database status */}
      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-1">Database</h3>
        <p className="text-xs text-gray-500">PostgreSQL</p>
        <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
        </span>
      </div>

      {/* Redis status */}
      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
        <h3 className="text-sm font-semibold text-white mb-1">Redis Cache</h3>
        <p className="text-xs text-gray-500">Rate limiting & session storage</p>
        <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
        </span>
      </div>
    </div>
  );
}
