// // frontend/src/pages/admin/login.jsx
// import { useState } from 'react';
// import { useRouter } from 'next/router';
// import { FiFilm, FiMail, FiLock, FiKey, FiEye, FiEyeOff } from 'react-icons/fi';
// import { useAdminAuth } from '../../hooks/useAdminAuth';
// // import toast from 'react-hot-toast';

// export default function AdminLogin() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [twoFactorCode, setTwoFactorCode] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [requires2FA, setRequires2FA] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();
//   const { login } = useAdminAuth();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const result = await login(email, password, requires2FA ? twoFactorCode : undefined);
      
//       if (result.requiresTwoFactor) {
//         setRequires2FA(true);
//         toast.success('Enter your 2FA code');
//       } else if (result.success) {
//         toast.success('Login successful');
//         router.push('/admin');
//       }
//     } catch (err) {
//       toast.error(err.message || 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-xl mb-4">
//             <FiFilm size={32} className="text-white" />
//           </div>
//           <h1 className="text-2xl font-bold text-white">clipX Admin</h1>
//           <p className="text-gray-400 mt-2">Sign in to access the dashboard</p>
//         </div>

//         <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 border border-gray-700">
//           {!requires2FA ? (
//             <>
//               <div className="mb-4">
//                 <label className="block text-gray-400 mb-2 text-sm">Email</label>
//                 <div className="relative">
//                   <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                     className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
//                     placeholder="admin@clipX.com"
//                   />
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <label className="block text-gray-400 mb-2 text-sm">Password</label>
//                 <div className="relative">
//                   <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="w-full bg-gray-900 text-white pl-10 pr-12 py-3 rounded-lg border border-gray-700 focus:border-purple-500 outline-none"
//                     placeholder="••••••••"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
//                   >
//                     {showPassword ? <FiEyeOff /> : <FiEye />}
//                   </button>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className="mb-6">
//               <label className="block text-gray-400 mb-2 text-sm">Two-Factor Code</label>
//               <div className="relative">
//                 <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
//                 <input
//                   type="text"
//                   value={twoFactorCode}
//                   onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                   required
//                   maxLength={6}
//                   className="w-full bg-gray-900 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 outline-none text-center text-2xl tracking-widest"
//                   placeholder="000000"
//                   autoFocus
//                 />
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setRequires2FA(false)}
//                 className="text-purple-400 text-sm mt-2 hover:underline"
//               >
//                 ← Back to login
//               </button>
//             </div>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             {loading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                 </svg>
//                 Signing in...
//               </span>
//             ) : requires2FA ? 'Verify' : 'Sign In'}
//           </button>
//         </form>

//         <p className="text-center text-gray-500 text-sm mt-6">
//           Protected area. Unauthorized access is prohibited.
//         </p>
//       </div>
//     </div>
//   );
// }

// // Disable layout for login page
// AdminLogin.getLayout = (page) => page;