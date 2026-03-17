// frontend/src/components/admin/layout/AdminHeader.jsx
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings, FiSearch, FiChevronDown } from 'react-icons/fi';

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

  const initials = `${admin?.firstName?.[0] || ''}${admin?.lastName?.[0] || ''}`.toUpperCase() || 'A';

  return (
    <header className="sticky top-0 z-30 bg-[#0a0c10]/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
            <FiMenu size={20} />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <FiBell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0a0c10]" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary-500/20">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white leading-tight">{admin?.firstName} {admin?.lastName}</p>
                <p className="text-[10px] text-gray-500 capitalize">{admin?.role?.replace('_', ' ') || 'Admin'}</p>
              </div>
              <FiChevronDown className={`text-gray-500 transition-transform duration-200 hidden md:block ${dropdownOpen ? 'rotate-180' : ''}`} size={14} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#13151b] border border-white/10 rounded-xl shadow-2xl shadow-black/50 py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white">{admin?.firstName} {admin?.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                </div>
                <Link href="/admin/settings">
                  <span className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                    <FiSettings size={15} /> Settings
                  </span>
                </Link>
                <Link href="/dashboard">
                  <span className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                    <FiUser size={15} /> My Profile
                  </span>
                </Link>
                <div className="border-t border-white/5 mt-1">
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
                  >
                    <FiLogOut size={15} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}