// frontend/src/components/admin/common/SearchInput.jsx
import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export default function SearchInput({ value, onChange, placeholder = 'Search...', debounce = 300 }) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounce);
    return () => clearTimeout(timer);
  }, [local]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 text-white pl-10 pr-10 py-2 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
      />
      {local && (
        <button onClick={() => { setLocal(''); onChange(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
          <FiX />
        </button>
      )}
    </div>
  );
}
