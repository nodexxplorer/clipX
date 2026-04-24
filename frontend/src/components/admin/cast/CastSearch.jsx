// frontend/src/components/admin/cast/CastSearch.jsx
import { FiSearch, FiX } from 'react-icons/fi';

export default function CastSearch({ value, onChange, onClear, placeholder = 'Search cast members...' }) {
  return (
    <div className="relative">
      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={15} />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.03] text-white text-sm pl-10 pr-10 py-2.5 rounded-xl border border-white/5 focus:border-primary-500/30 outline-none transition-colors placeholder-gray-600"
      />
      {value && (
        <button
          onClick={() => { onChange?.(''); onClear?.(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
        >
          <FiX size={15} />
        </button>
      )}
    </div>
  );
}
