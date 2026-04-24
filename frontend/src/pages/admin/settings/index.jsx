// frontend/src/pages/admin/settings/index.jsx
import Image from 'next/image';
import { useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { FiSettings, FiUser, FiShield, FiDatabase, FiGlobe, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'account', label: 'Account', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'api', label: 'API & Data', icon: FiDatabase },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage platform configuration</p>
        </div>

        <div className="flex gap-2 border-b border-white/5 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all ${activeTab === tab.id
                ? 'text-primary-400 bg-white/[0.03] border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl border border-white/5 p-6">
          {activeTab === 'general' && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">General Settings</h2>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Site Name</label>
                <input defaultValue="clipX" className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Site Description</label>
                <textarea defaultValue="Stream smarter with clipX — your ultimate movie destination." rows={2}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Default Language</label>
                <select className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none cursor-pointer">
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <button onClick={() => toast.success('Settings saved')} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors">
                <FiSave size={15} /> Save Changes
              </button>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Admin Account</h2>
              <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                {user?.avatar ? (
                  <Image src={user.avatar || '/images/placeholder.jpg'} alt="" width={56} height={56} className="rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">{user?.name || 'Admin'}</p>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                  <p className="text-primary-400 text-xs font-bold uppercase mt-1">{user?.role}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Display Name</label>
                <input defaultValue={user?.name || ''} className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30" />
              </div>
              <button onClick={() => toast.success('Profile updated')} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors">
                <FiSave size={15} /> Update Profile
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Security</h2>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-1">Change Password</h3>
                <p className="text-xs text-gray-500 mb-4">Update your admin password</p>
                <div className="space-y-3">
                  <input type="password" placeholder="Current password" className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 placeholder-gray-600" />
                  <input type="password" placeholder="New password" className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 placeholder-gray-600" />
                  <input type="password" placeholder="Confirm new password" className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 placeholder-gray-600" />
                </div>
                <button onClick={() => toast.success('Password updated')} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-colors">
                  <FiShield size={15} /> Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">API & Data</h2>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-1">GraphQL Endpoint</h3>
                <code className="text-xs text-primary-400 bg-primary-500/5 px-3 py-1 rounded-lg">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql'}</code>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-1">Database</h3>
                <p className="text-xs text-gray-500">PostgreSQL — running</p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}