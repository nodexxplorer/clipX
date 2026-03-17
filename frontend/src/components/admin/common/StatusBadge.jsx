// frontend/src/components/admin/common/StatusBadge.jsx
const statusConfig = {
  active: { label: 'Active', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  inactive: { label: 'Inactive', bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-500' },
  banned: { label: 'Banned', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  pending: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  resolved: { label: 'Resolved', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  reviewed: { label: 'Reviewed', bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}