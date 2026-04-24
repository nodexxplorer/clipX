// frontend/src/components/admin/genres/GenreForm.jsx
import { useState } from 'react';
import FormField from '../common/FormField';
import { FiSave, FiPlus } from 'react-icons/fi';

export default function GenreForm({ onSubmit, loading, initialData = {}, isEdit = false }) {
  const [form, setForm] = useState({
    name: initialData.name || '',
    slug: initialData.slug || '',
    description: initialData.description || '',
    emoji: initialData.emoji || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from name
      if (name === 'name' && !isEdit) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <FormField label="Genre Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Science Fiction" required />
      <FormField label="Slug" name="slug" value={form.slug} onChange={handleChange} placeholder="sci-fi" hint="URL-friendly identifier" disabled={isEdit} />
      <FormField label="Emoji Icon" name="emoji" value={form.emoji} onChange={handleChange} placeholder="🎬" hint="Optional emoji for display" />
      <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} placeholder="Brief description of this genre..." rows={3} />

      <button type="submit" disabled={loading || !form.name.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20">
        {isEdit ? <FiSave size={15} /> : <FiPlus size={15} />}
        {loading ? 'Saving...' : isEdit ? 'Update Genre' : 'Create Genre'}
      </button>
    </form>
  );
}
