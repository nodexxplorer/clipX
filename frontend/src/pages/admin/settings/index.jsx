// frontend/src/pages/admin/settings/index.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminLayout from '../../../components/admin/layout/AdminLayout';
import { FiSave, FiRefreshCw, FiDatabase, FiCpu, FiMail, FiGlobe, FiShield } from 'react-icons/fi';
import { GET_SETTINGS } from '../../../graphql/queries/adminQueries';
import { UPDATE_SETTINGS, CLEAR_CACHE, TRIGGER_ML_TRAINING } from '../../../graphql/mutations/adminMutations';
import { useAdmin } from '../../../hooks/useAdmin';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'general', name: 'General', icon: FiGlobe },
  { id: 'api', name: 'API Keys', icon: FiShield },
  { id: 'email', name: 'Email', icon: FiMail },
  { id: 'cache', name: 'Cache', icon: FiDatabase },
  { id: 'ml', name: 'ML Settings', icon: FiCpu }
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const { hasPermission, authContext } = useAdmin();

  const { data, loading, refetch } = useQuery(GET_SETTINGS, {
    variables: { category: activeTab },
    ...authContext
  });

  const [updateSettings, { loading: saving }] = useMutation(UPDATE_SETTINGS, {
    ...authContext,
    onCompleted: () => { toast.success('Settings saved'); refetch(); },
    onError: (err) => toast.error(err.message)
  });

  const [clearCache, { loading: clearing }] = useMutation(CLEAR_CACHE, {
    ...authContext,
    onCompleted: () => toast.success('Cache cleared'),
    onError: (err) => toast.error(err.message)
  });

  const [triggerTraining, { loading: training }] = useMutation(TRIGGER_ML_TRAINING, {
    ...authContext,
    onCompleted: () => toast.success('ML training started'),
    onError: (err) => toast.error(err.message)
  });

  const [formData, setFormData] = useState({});

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const inputs = Object.entries(formData).map(([key, value]) => ({ key, value }));
    if (inputs.length > 0) {
      updateSettings({ variables: { inputs } });
    }
  };

  if (!hasPermission('settings', 'read')) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-400">You don't have permission to view settings.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          {hasPermission('settings', 'write') && (
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(formData).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
            >
              <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-48 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setFormData({}); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 mx-auto" />
              </div>
            ) : activeTab === 'cache' ? (
              <CacheSettings onClear={clearCache} clearing={clearing} hasWrite={hasPermission('settings', 'write')} />
            ) : activeTab === 'ml' ? (
              <MLSettings onTrain={triggerTraining} training={training} hasWrite={hasPermission('settings', 'write')} />
            ) : (
              <SettingsForm 
                settings={data?.settings || []} 
                onChange={handleChange}
                formData={formData}
                readOnly={!hasPermission('settings', 'write')}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SettingsForm({ settings, onChange, formData, readOnly }) {
  if (settings.length === 0) {
    return <p className="text-gray-400 text-center py-8">No settings found for this category.</p>;
  }

  return (
    <div className="space-y-6">
      {settings.map((setting) => (
        <div key={setting.key}>
          <label className="block text-white font-medium mb-2">{setting.key.replace(/_/g, ' ')}</label>
          {setting.description && <p className="text-gray-500 text-sm mb-2">{setting.description}</p>}
          {typeof setting.value === 'boolean' ? (
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData[setting.key] ?? setting.value}
                onChange={(e) => onChange(setting.key, e.target.checked)}
                disabled={readOnly}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">Enabled</span>
            </label>
          ) : typeof setting.value === 'number' ? (
            <input
              type="number"
              value={formData[setting.key] ?? setting.value}
              onChange={(e) => onChange(setting.key, parseFloat(e.target.value))}
              disabled={readOnly}
              className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 disabled:opacity-50"
            />
          ) : (
            <input
              type="text"
              value={formData[setting.key] ?? (typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value)}
              onChange={(e) => onChange(setting.key, e.target.value)}
              disabled={readOnly}
              className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 disabled:opacity-50"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CacheSettings({ onClear, clearing, hasWrite }) {
  const [pattern, setPattern] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Cache Management</h3>
        <p className="text-gray-400 mb-4">Clear cached data to refresh content across the application.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onClear({ variables: { pattern: 'movie:*' } })}
          disabled={clearing || !hasWrite}
          className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left disabled:opacity-50"
        >
          <p className="text-white font-medium">Movie Cache</p>
          <p className="text-gray-400 text-sm">Clear all movie data</p>
        </button>
        <button
          onClick={() => onClear({ variables: { pattern: 'user:*' } })}
          disabled={clearing || !hasWrite}
          className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left disabled:opacity-50"
        >
          <p className="text-white font-medium">User Cache</p>
          <p className="text-gray-400 text-sm">Clear user data</p>
        </button>
        <button
          onClick={() => onClear({ variables: { pattern: 'recommendation:*' } })}
          disabled={clearing || !hasWrite}
          className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left disabled:opacity-50"
        >
          <p className="text-white font-medium">Recommendations</p>
          <p className="text-gray-400 text-sm">Clear recommendation cache</p>
        </button>
        <button
          onClick={() => onClear({ variables: { pattern: null } })}
          disabled={clearing || !hasWrite}
          className="p-4 bg-red-900 hover:bg-red-800 rounded-lg text-left disabled:opacity-50"
        >
          <p className="text-white font-medium">Clear All</p>
          <p className="text-red-300 text-sm">Flush entire cache</p>
        </button>
      </div>
    </div>
  );
}

function MLSettings({ onTrain, training, hasWrite }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">ML Model Management</h3>
        <p className="text-gray-400 mb-4">Manage the machine learning recommendation models.</p>
      </div>

      <div className="p-4 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Retrain Models</p>
            <p className="text-gray-400 text-sm">Trigger model retraining with latest data</p>
          </div>
          <button
            onClick={onTrain}
            disabled={training || !hasWrite}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
          >
            <FiRefreshCw className={training ? 'animate-spin' : ''} />
            {training ? 'Training...' : 'Start Training'}
          </button>
        </div>
      </div>
    </div>
  );
}