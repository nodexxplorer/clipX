// frontend/src/components/admin/common/ConfirmModal.jsx
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function ConfirmModal({ 
  open, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
  confirmVariant = 'primary', onConfirm, onCancel, loading 
}) {
  if (!open) return null;

  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${confirmVariant === 'danger' ? 'bg-red-900' : 'bg-purple-900'}`}>
              <FiAlertTriangle className={confirmVariant === 'danger' ? 'text-red-400' : 'text-purple-400'} />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <FiX size={20} />
          </button>
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
            {cancelText}
          </button>
          <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 ${variants[confirmVariant]} text-white rounded-lg disabled:opacity-50`}>
            {loading ? 'Loading...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}