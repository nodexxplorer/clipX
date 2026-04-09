// frontend/src/pages/admin/content/announcements.jsx
import { useState } from 'react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiSend, FiBell, FiTrash2, FiEdit2, FiCheck, FiClock } from 'react-icons/fi';

export default function AnnouncementsPage() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [announcements, setAnnouncements] = useState([
        { id: 1, title: 'Platform Maintenance', body: 'Scheduled maintenance on April 10th, 2-4am WAT.', status: 'published', date: '2026-04-05' },
        { id: 2, title: 'New Content Added', body: 'Over 50 new movies and series added this week!', status: 'published', date: '2026-04-03' },
    ]);

    const handlePublish = () => {
        if (!title.trim() || !body.trim()) return;
        setAnnouncements(prev => [
            { id: Date.now(), title, body, status: 'published', date: new Date().toISOString().split('T')[0] },
            ...prev,
        ]);
        setTitle('');
        setBody('');
    };

    const handleDelete = (id) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-black text-white">Announcements</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Publish announcements to all users</p>
                    </div>

                    {/* New Announcement */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="text-white font-bold flex items-center gap-2"><FiBell size={16} /> New Announcement</h3>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Announcement title..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30"
                        />
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your announcement..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 outline-none focus:border-primary-500/30 resize-none"
                        />
                        <button
                            onClick={handlePublish}
                            disabled={!title.trim() || !body.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50"
                        >
                            <FiSend size={14} /> Publish
                        </button>
                    </div>

                    {/* Published */}
                    <div className="space-y-4">
                        {announcements.map((a) => (
                            <div key={a.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-white font-bold text-sm">{a.title}</p>
                                        <p className="text-gray-400 text-sm mt-1">{a.body}</p>
                                        <p className="text-xs text-gray-600 mt-2 flex items-center gap-1"><FiClock size={10} /> {a.date}</p>
                                    </div>
                                    <button onClick={() => handleDelete(a.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}
