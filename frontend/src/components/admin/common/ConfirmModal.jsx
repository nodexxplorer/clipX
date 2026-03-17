// frontend/src/components/admin/common/ConfirmModal.jsx
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function ConfirmModal({
  open, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  confirmVariant = 'primary', onConfirm, onCancel, loading
}) {
  if (!open) return null;

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-500',
    danger: 'bg-red-600 hover:bg-red-500',
    warning: 'bg-amber-600 hover:bg-amber-500'
  };

  const iconBg = {
    primary: 'bg-primary-500/10',
    danger: 'bg-red-500/10',
    warning: 'bg-amber-500/10'
  };

  const iconColor = {
    primary: 'text-primary-400',
    danger: 'text-red-400',
    warning: 'text-amber-400'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#13151b] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${iconBg[confirmVariant]}`}>
              <FiAlertTriangle className={iconColor[confirmVariant]} size={18} />
            </div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-gray-600 hover:text-white transition-colors p-1">
            <FiX size={18} />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-5 py-2.5 ${variants[confirmVariant]} text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors`}>
            {loading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}