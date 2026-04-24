// Admin SEO Metadata Editor Page (Section 15)
import { useState } from 'react';
import Head from 'next/head';
import { useMutation } from '@apollo/client/react';
import { UPDATE_SEO_METADATA } from '@/graphql/queries/adminQueries';
import AdminLayout from '@/components/admin/AdminLayout';
import { FiSearch, FiSave, FiImage, FiType, FiFileText, FiTag, FiGlobe } from 'react-icons/fi';

export default function SeoEditorPage() {
    const [movieboxId, setMovieboxId] = useState('');
    const [form, setForm] = useState({ title: '', description: '', ogImage: '', keywords: '' });
    const [toast, setToast] = useState('');

    const [updateSeo, { loading }] = useMutation(UPDATE_SEO_METADATA);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!movieboxId) return;
        try {
            const res = await updateSeo({
                variables: { movieboxId, ...form },
            });
            if (res.data?.updateSeoMetadata?.success) {
                setToast('SEO metadata updated successfully');
            } else {
                setToast(res.data?.updateSeoMetadata?.message || 'Failed to update');
            }
        } catch (err) {
            setToast('Error updating metadata');
        }
        setTimeout(() => setToast(''), 3000);
    };

    const fields = [
        { key: 'title', label: 'SEO Title', icon: FiType, placeholder: 'Override title for search engines', maxLen: 60 },
        { key: 'description', label: 'Meta Description', icon: FiFileText, placeholder: 'Compelling description for search results', maxLen: 160, textarea: true },
        { key: 'ogImage', label: 'OG Image URL', icon: FiImage, placeholder: 'https://cdn.clipx.app/og/...' },
        { key: 'keywords', label: 'Keywords', icon: FiTag, placeholder: 'action, thriller, 2024, streaming' },
    ];

    return (
        <>
            <Head><title>SEO Metadata Editor — Admin | clipX</title></Head>
            <AdminLayout>
                <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
                    {/* Header */}
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiGlobe style={{ color: '#fff', fontSize: '20px' }} />
                        </div>
                        SEO Metadata Editor
                    </h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>Override default SEO metadata for individual content pages</p>

                    {/* Content Selector */}
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Content ID</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: '16px' }} />
                                <input
                                    value={movieboxId}
                                    onChange={(e) => setMovieboxId(e.target.value)}
                                    placeholder="Enter Moviebox ID to edit SEO..."
                                    style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEO Fields */}
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {fields.map((field) => (
                                <div key={field.key}>
                                    <label style={{ color: '#d1d5db', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <field.icon style={{ fontSize: '14px', color: '#6b7280' }} />
                                        {field.label}
                                        {field.maxLen && (
                                            <span style={{ marginLeft: 'auto', color: (form[field.key]?.length || 0) > field.maxLen ? '#ef4444' : '#4b5563', fontSize: '11px' }}>
                                                {form[field.key]?.length || 0}/{field.maxLen}
                                            </span>
                                        )}
                                    </label>
                                    {field.textarea ? (
                                        <textarea
                                            value={form[field.key]}
                                            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                            placeholder={field.placeholder}
                                            rows={3}
                                            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                                        />
                                    ) : (
                                        <input
                                            value={form[field.key]}
                                            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                            placeholder={field.placeholder}
                                            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Preview Card */}
                        {(form.title || form.description) && (
                            <div style={{ marginTop: '28px', padding: '20px', background: '#fff', borderRadius: '12px' }}>
                                <p style={{ color: '#1a0dab', fontSize: '18px', fontWeight: 400, margin: 0, lineHeight: 1.3 }}>
                                    {form.title || 'Page Title — clipX'}
                                </p>
                                <p style={{ color: '#006621', fontSize: '13px', margin: '4px 0' }}>clipx.app › watch › {movieboxId || '...'}</p>
                                <p style={{ color: '#545454', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                                    {form.description || 'No description provided. A default will be generated from the content synopsis.'}
                                </p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !movieboxId}
                            style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: !movieboxId ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: movieboxId ? 'pointer' : 'not-allowed', fontSize: '14px', opacity: loading ? 0.5 : 1 }}
                        >
                            <FiSave /> {loading ? 'Saving...' : 'Save SEO Metadata'}
                        </button>
                    </form>

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
