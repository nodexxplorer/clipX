// frontend/src/components/admin/settings/GeneralSettings.jsx
import { useState } from 'react';
import FormField from '../common/FormField';
import { FiSave, FiGlobe } from 'react-icons/fi';

export default function GeneralSettings({ settings = {}, onSave, loading }) {
  const [form, setForm] = useState({
    siteName: settings.siteName || 'clipX',
    siteDescription: settings.siteDescription || 'Stream smarter with clipX — your ultimate movie destination.',
    defaultLanguage: settings.defaultLanguage || 'en',
    maintenanceMode: settings.maintenanceMode || false,
    registrationEnabled: settings.registrationEnabled !== false,
    maxUploadSize: settings.maxUploadSize || 10,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <FiGlobe size={15} className="text-primary-400" /> General Settings
      </h2>

      <FormField label="Site Name" name="siteName" value={form.siteName} onChange={handleChange} />
      <FormField label="Site Description" name="siteDescription" type="textarea" value={form.siteDescription} onChange={handleChange} rows={2} />
      <FormField label="Default Language" name="defaultLanguage" type="select" value={form.defaultLanguage} onChange={handleChange}
        options={[
          { value: 'en', label: 'English' },
          { value: 'fr', label: 'French' },
          { value: 'es', label: 'Spanish' },
          { value: 'pt', label: 'Portuguese' },
        ]}
      />
      <FormField label="Max Upload Size (MB)" name="maxUploadSize" type="number" value={form.maxUploadSize} onChange={handleChange} />

      {/* Toggle switches */}
      <div className="space-y-3">
        <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-all">
          <div>
            <p className="text-sm font-medium text-white">User Registration</p>
            <p className="text-[11px] text-gray-500">Allow new users to sign up</p>
          </div>
          <input type="checkbox" name="registrationEnabled" checked={form.registrationEnabled} onChange={handleChange}
            className="w-10 h-6 rounded-full appearance-none bg-white/10 checked:bg-primary-500 transition-colors cursor-pointer relative
            before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-1 before:left-1
            checked:before:translate-x-4 before:transition-transform" />
        </label>
        <label className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-all">
          <div>
            <p className="text-sm font-medium text-white">Maintenance Mode</p>
            <p className="text-[11px] text-gray-500">Show maintenance page to non-admin users</p>
          </div>
          <input type="checkbox" name="maintenanceMode" checked={form.maintenanceMode} onChange={handleChange}
            className="w-10 h-6 rounded-full appearance-none bg-white/10 checked:bg-amber-500 transition-colors cursor-pointer relative
            before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-1 before:left-1
            checked:before:translate-x-4 before:transition-transform" />
        </label>
      </div>

      <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
        <FiSave size={15} /> {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
