// frontend/src/components/admin/layout/AdminHeader.jsx
import { useState, useRef, useEffect } from 'react';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';

export default function AdminHeader({ admin, onMenuClick, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onMenuClick} className="text-gray-400 hover:text-white">
          <FiMenu size={24} />
        </button>
        
        <div className="flex items-center gap-4">
          <button className="relative text-gray-400 hover:text-white">
            <FiBell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              3
            </span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 text-gray-300 hover:text-white"
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                {admin?.firstName?.[0]}{admin?.lastName?.[0]}
              </div>
              <span className="hidden md:block">{admin?.firstName} {admin?.lastName}</span>
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-2">
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm text-white">{admin?.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{admin?.role?.replace('_', ' ')}</p>
                </div>
                <a href="/admin/settings" className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700">
                  <FiSettings size={16} /> Settings
                </a>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700 w-full"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}