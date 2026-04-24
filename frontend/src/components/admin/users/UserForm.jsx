// frontend/src/components/admin/users/UserForm.jsx
import { useState } from 'react';
import FormField from '../common/FormField';
import { FiSave, FiUserPlus } from 'react-icons/fi';

export default function UserForm({ onSubmit, loading, initialData = {}, isEdit = false }) {
  const [form, setForm] = useState({
    name: initialData.name || '',
    email: initialData.email || '',
    password: '',
    role: initialData.role || 'user',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!isEdit && !form.password) errs.password = 'Password is required';
    else if (form.password && form.password.length < 8) errs.password = 'Min 8 characters';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form };
    if (isEdit && !payload.password) delete payload.password;
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <FormField label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required error={errors.name} />
      <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="user@example.com" required error={errors.email} disabled={isEdit} />
      <FormField
        label={isEdit ? 'New Password (leave blank to keep)' : 'Password'}
        name="password" type="password" value={form.password} onChange={handleChange}
        placeholder={isEdit ? '••••••••' : 'Min 8 characters'} required={!isEdit} error={errors.password}
      />
      <FormField label="Role" name="role" type="select" value={form.role} onChange={handleChange}
        options={[
          { value: 'user', label: 'User' },
          { value: 'admin', label: 'Admin' },
          { value: 'superadmin', label: 'Super Admin' },
        ]}
      />

      <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20">
        {isEdit ? <FiSave size={15} /> : <FiUserPlus size={15} />}
        {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
      </button>
    </form>
  );
}
