// Admin Content Scheduling Page (Section 15)
import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CONTENT_SCHEDULE, SCHEDULE_CONTENT } from '@/graphql/queries/adminQueries';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiCalendar, FiPlus, FiClock, FiCheck, FiX, FiFilm } from 'react-icons/fi';

export default function ContentSchedulingPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ movieboxId: '', title: '', publishAt: '' });
    const [toast, setToast] = useState('');

    const { data, loading, refetch } = useQuery(GET_CONTENT_SCHEDULE, { variables: { limit: 50 } });
    const [scheduleContent, { loading: scheduling }] = useMutation(SCHEDULE_CONTENT);

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            const res = await scheduleContent({ variables: form });
            if (res.data?.scheduleContent?.success) {
                setToast('Content scheduled successfully');
                setShowCreate(false);
                setForm({ movieboxId: '', title: '', publishAt: '' });
                refetch();
            }
        } catch (err) {
            setToast('Failed to schedule content');
        }
        setTimeout(() => setToast(''), 3000);
    };

    const entries = data?.contentSchedule || [];
    const statusColors = { scheduled: '#3b82f6', published: '#22c55e', cancelled: '#ef4444' };
    const statusIcons = { scheduled: FiClock, published: FiCheck, cancelled: FiX };

    return (
        <>
            <Head><title>Content Scheduling — Admin | clipX</title></Head>
            <AdminLayout>
                <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiCalendar style={{ color: '#fff', fontSize: '20px' }} />
                                </div>
                                Content Scheduling
                            </h1>
                            <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>{entries.length} scheduled items</p>
                        </div>
                        <button
                            onClick={() => setShowCreate(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
                        >
                            <FiPlus /> Schedule Content
                        </button>
                    </div>

                    {/* Schedule List */}
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {loading && <p style={{ color: '#9ca3af' }}>Loading schedule...</p>}
                        {entries.map((entry) => {
                            const StatusIcon = statusIcons[entry.status] || FiClock;
                            return (
                                <div key={entry.id} style={{
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px'
                                }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FiFilm style={{ color: '#9ca3af', fontSize: '18px' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>{entry.title}</h3>
                                        <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>ID: {entry.movieboxId}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusColors[entry.status] || '#9ca3af', fontSize: '13px', fontWeight: 600 }}>
                                            <StatusIcon style={{ fontSize: '14px' }} />
                                            {entry.status}
                                        </div>
                                        <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                                            {new Date(entry.publishAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {!loading && entries.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
                                <FiCalendar style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }} />
                                <p>No scheduled content yet</p>
                            </div>
                        )}
                    </div>

                    {/* Create Modal */}
                    {showCreate && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(8px)' }}>
                            <form onSubmit={handleSchedule} style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
                                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>Schedule Content</h2>
                                <div style={{ display: 'grid', gap: '14px' }}>
                                    <input value={form.movieboxId} onChange={(e) => setForm({ ...form, movieboxId: e.target.value })} placeholder="Moviebox ID" required
                                        style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Content Title" required
                                        style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                                    <input type="datetime-local" value={form.publishAt} onChange={(e) => setForm({ ...form, publishAt: e.target.value })} required
                                        style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" disabled={scheduling} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, opacity: scheduling ? 0.5 : 1 }}>
                                        {scheduling ? 'Scheduling...' : 'Schedule'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Toast */}
                    {toast && (
                        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
                            {toast}
                        </div>
                    )}
                </div>
            </AdminLayout>
        </>
    );
}
