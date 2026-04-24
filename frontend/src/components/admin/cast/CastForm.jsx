// frontend/src/components/admin/cast/CastForm.jsx
import { useState } from 'react';
import FormField from '../common/FormField';
import { FiSave, FiUserPlus } from 'react-icons/fi';

export default function CastForm({ onSubmit, loading, initialData = {}, isEdit = false }) {
  const [form, setForm] = useState({
    name: initialData.name || '',
    character: initialData.character || '',
    profileImage: initialData.profileImage || '',
    bio: initialData.bio || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Robert Downey Jr." required />
      <FormField label="Character / Role" name="character" value={form.character} onChange={handleChange} placeholder="e.g. Tony Stark / Iron Man" />
      <FormField label="Profile Image URL" name="profileImage" value={form.profileImage} onChange={handleChange} placeholder="https://..." />
      <FormField label="Biography" name="bio" type="textarea" value={form.bio} onChange={handleChange} placeholder="Short biography..." rows={4} />

      <button type="submit" disabled={loading || !form.name.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20">
        {isEdit ? <FiSave size={15} /> : <FiUserPlus size={15} />}
        {loading ? 'Saving...' : isEdit ? 'Update Cast' : 'Add Cast Member'}
      </button>
    </form>
  );
}
