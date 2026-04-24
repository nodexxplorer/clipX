// frontend/src/components/admin/settings/EmailSettings.jsx
import { useState } from 'react';
import FormField from '../common/FormField';
import { FiMail, FiSave, FiSend } from 'react-icons/fi';

export default function EmailSettings({ settings = {}, onSave, onTestEmail, loading }) {
  const [form, setForm] = useState({
    smtpHost: settings.smtpHost || 'smtp.gmail.com',
    smtpPort: settings.smtpPort || '587',
    smtpUser: settings.smtpUser || '',
    smtpPassword: settings.smtpPassword || '',
    fromEmail: settings.fromEmail || '',
    fromName: settings.fromName || 'clipX',
  });
  const [testEmail, setTestEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <FiMail size={15} className="text-primary-400" /> Email Configuration
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="SMTP Host" name="smtpHost" value={form.smtpHost} onChange={handleChange} placeholder="smtp.gmail.com" />
          <FormField label="SMTP Port" name="smtpPort" type="number" value={form.smtpPort} onChange={handleChange} placeholder="587" />
        </div>
        <FormField label="SMTP Username" name="smtpUser" value={form.smtpUser} onChange={handleChange} placeholder="user@gmail.com" />
        <FormField label="SMTP Password" name="smtpPassword" type="password" value={form.smtpPassword} onChange={handleChange} placeholder="••••••••" />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="From Email" name="fromEmail" value={form.fromEmail} onChange={handleChange} placeholder="noreply@clipx.com" />
          <FormField label="From Name" name="fromName" value={form.fromName} onChange={handleChange} placeholder="clipX" />
        </div>
      </div>

      <button onClick={() => onSave?.(form)} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors">
        <FiSave size={15} /> {loading ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Test email */}
      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 mt-6">
        <h3 className="text-sm font-semibold text-white mb-3">Send Test Email</h3>
        <div className="flex gap-2">
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            type="email"
            className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-primary-500/30 placeholder-gray-600"
          />
          <button
            onClick={() => onTestEmail?.(testEmail)}
            disabled={!testEmail}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-xl disabled:opacity-30 transition-colors border border-white/5"
          >
            <FiSend size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
