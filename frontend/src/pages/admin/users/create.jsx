// frontend/src/pages/admin/users/create.jsx
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/router';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiUserPlus, FiMail, FiLock, FiUser, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { gql } from '@apollo/client';

const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($email: String!, $password: String!, $name: String, $role: String) {
    register(email: $email, password: $password, name: $name) { success message }
  }
`;

export default function CreateUserPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '', name: '', role: 'user' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [createUser, { loading }] = useMutation(ADMIN_CREATE_USER);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!form.email || !form.password) {
            setError('Email and password are required');
            return;
        }
        try {
            const { data } = await createUser({
                variables: { email: form.email, password: form.password, name: form.name || undefined }
            });
            if (data?.register?.success) {
                setSuccess('User created successfully!');
                setForm({ email: '', password: '', name: '', role: 'user' });
            } else {
                setError(data?.register?.message || 'Failed to create user');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Create User</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manually create a new user account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                <FiAlertTriangle size={16} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
                                <FiCheck size={16} /> {success}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Full Name</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="John Doe"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Email *</label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="user@example.com"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Password *</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Min 8 characters"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiUserPlus size={16} />
                            )}
                            Create User
                        </button>
                    </form>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
