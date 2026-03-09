// src/pages/admin/login.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiFilm, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result && result.success) {
        router.push('/admin');
      } else {
        setError((result && result.error) || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Admin Login - clipX</title></Head>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4 shadow-lg shadow-primary-500/20">
              <FiFilm size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white"><span className="text-primary-500">🎬 clipX</span> Admin</h1>
            <p className="text-gray-400 mt-2">Sign in to access the dashboard</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 border border-gray-700 space-y-4">
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-primary-500 outline-none"
                  placeholder="admin@clipx.app" />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-gray-900 text-white pl-10 pr-12 py-3 rounded-lg border border-gray-700 focus:border-primary-500 outline-none"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 transition-colors">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-gray-500 text-sm mt-6">Protected area. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </>
  );
}

AdminLogin.getLayout = (page) => page;