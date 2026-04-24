// frontend/src/pages/admin/movies/[id]/edit.jsx
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client/react';
import AdminProtectedRoute from '@/pages/auth/AdminProtectedRoute';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { FiArrowLeft, FiSave, FiFilm, FiClock, FiType } from 'react-icons/fi';
import { GET_ADMIN_MOVIE } from '@/graphql/queries/adminQueries';
import { ADMIN_SET_MOVIE_TIMESTAMPS } from '@/graphql/mutations/adminMutations';
import { gql } from '@apollo/client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const UPLOAD_SUBTITLE = gql`
  mutation UploadSubtitle($movieboxId: String!, $fileUrl: String!, $language: String!, $label: String!, $format: String!, $contentType: String, $season: Int, $episode: Int) {
    uploadSubtitle(movieboxId: $movieboxId, fileUrl: $fileUrl, language: $language, label: $label, format: $format, contentType: $contentType, season: $season, episode: $episode) {
      id
      language
      label
    }
  }
`;

export default function EditMoviePage() {
    const router = useRouter();
    const { id } = router.query;
    const { data, loading } = useQuery(GET_ADMIN_MOVIE, { variables: { id }, skip: !id, fetchPolicy: 'cache-and-network' });
    const [setTimestamps, { loading: saving }] = useMutation(ADMIN_SET_MOVIE_TIMESTAMPS);
    const [uploadSub, { loading: uploadingSub }] = useMutation(UPLOAD_SUBTITLE);

    const movie = data?.movie;
    const [form, setForm] = useState({ title: '', overview: '', tagline: '' });
    const [timestamps, setTimestampsForm] = useState({ introStart: '', introEnd: '', creditsStart: '', recapEnd: '' });
    const [saveMsg, setSaveMsg] = useState('');
    const [subForm, setSubForm] = useState({ fileUrl: '', language: 'en', label: 'English', format: 'vtt' });
    const [subMsg, setSubMsg] = useState('');

    useEffect(() => {
        if (movie) {
            setForm({ title: movie.title || '', overview: movie.overview || '', tagline: movie.tagline || '' });
            setTimestampsForm({
                introStart: movie.introStart ?? '',
                introEnd: movie.introEnd ?? '',
                creditsStart: movie.creditsStart ?? '',
                recapEnd: movie.recapEnd ?? '',
            });
        }
    }, [movie]);

    const handleSaveTimestamps = async () => {
        try {
            await setTimestamps({
                variables: {
                    movieId: id,
                    introStart: timestamps.introStart !== '' ? parseFloat(timestamps.introStart) : null,
                    introEnd: timestamps.introEnd !== '' ? parseFloat(timestamps.introEnd) : null,
                    creditsStart: timestamps.creditsStart !== '' ? parseFloat(timestamps.creditsStart) : null,
                    recapEnd: timestamps.recapEnd !== '' ? parseFloat(timestamps.recapEnd) : null,
                },
            });
            setSaveMsg('Timestamps saved!');
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err) {
            setSaveMsg('Error: ' + (err.message || 'Failed to save'));
        }
    };

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="max-w-2xl space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/content" className="p-2 rounded-xl border border-white/5 text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                            <FiArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-white">Edit Movie</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Modify metadata for this content</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white/[0.02] rounded-2xl p-8 animate-pulse h-64 border border-white/5" />
                    ) : !movie ? (
                        <div className="text-center py-12 text-gray-500">
                            <FiFilm className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Movie not found</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                                <div className="flex items-center gap-4 mb-4">
                                    {movie.posterUrl && <div className="relative w-16 h-24"><Image src={movie.posterUrl} alt="" fill className="object-cover rounded-xl ring-1 ring-white/10" /></div>}
                                    <div>
                                        <p className="text-white font-bold text-lg">{movie.title}</p>
                                        <p className="text-gray-500 text-xs">{movie.year} • {movie.runtime}min • Rating: {movie.rating}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Title</label>
                                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Tagline</label>
                                    <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Overview</label>
                                    <textarea value={form.overview} onChange={e => setForm(f => ({ ...f, overview: e.target.value }))} rows={5} className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30 resize-none" />
                                </div>

                                <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors">
                                    <FiSave size={16} /> Save Changes
                                </button>
                            </div>

                            {/* Timestamps for Skip Intro / Credits / Recap */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiClock className="w-5 h-5 text-primary-400" />
                                    <h3 className="text-white font-bold text-lg">Playback Timestamps</h3>
                                </div>
                                <p className="text-gray-500 text-xs -mt-3 mb-4">Set timestamps (in seconds) for skip intro, credits, and recap detection.</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Intro Start (s)</label>
                                        <input type="number" step="0.1" value={timestamps.introStart} onChange={e => setTimestampsForm(t => ({ ...t, introStart: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" placeholder="e.g. 5" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Intro End (s)</label>
                                        <input type="number" step="0.1" value={timestamps.introEnd} onChange={e => setTimestampsForm(t => ({ ...t, introEnd: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" placeholder="e.g. 90" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Credits Start (s)</label>
                                        <input type="number" step="0.1" value={timestamps.creditsStart} onChange={e => setTimestampsForm(t => ({ ...t, creditsStart: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" placeholder="e.g. 5400" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Recap End (s)</label>
                                        <input type="number" step="0.1" value={timestamps.recapEnd} onChange={e => setTimestampsForm(t => ({ ...t, recapEnd: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" placeholder="e.g. 30" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={handleSaveTimestamps} disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50">
                                        <FiSave size={16} /> {saving ? 'Saving...' : 'Save Timestamps'}
                                    </button>
                                    {saveMsg && <span className={`text-xs font-bold ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{saveMsg}</span>}
                                </div>
                            </div>

                            {/* Subtitle Upload */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiType className="w-5 h-5 text-primary-400" />
                                    <h3 className="text-white font-bold text-lg">Subtitles</h3>
                                </div>
                                <p className="text-gray-500 text-xs -mt-3 mb-4">Register a subtitle file (.srt or .vtt) hosted on your CDN.</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">File URL</label>
                                        <input value={subForm.fileUrl} onChange={e => setSubForm(f => ({ ...f, fileUrl: e.target.value }))}
                                            placeholder="https://cdn.example.com/subs/movie-en.vtt"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Language Code</label>
                                        <input value={subForm.language} onChange={e => setSubForm(f => ({ ...f, language: e.target.value }))}
                                            placeholder="en" maxLength={10}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Label</label>
                                        <input value={subForm.label} onChange={e => setSubForm(f => ({ ...f, label: e.target.value }))}
                                            placeholder="English"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Format</label>
                                        <select value={subForm.format} onChange={e => setSubForm(f => ({ ...f, format: e.target.value }))}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm outline-none focus:border-primary-500/30">
                                            <option value="vtt">VTT</option>
                                            <option value="srt">SRT</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={async () => {
                                        if (!subForm.fileUrl.trim()) return;
                                        try {
                                            await uploadSub({ variables: { movieboxId: id, ...subForm, contentType: 'movie' } });
                                            setSubMsg('Subtitle registered!');
                                            setSubForm(f => ({ ...f, fileUrl: '' }));
                                            setTimeout(() => setSubMsg(''), 3000);
                                        } catch (err) {
                                            setSubMsg('Error: ' + (err.message || 'Failed'));
                                        }
                                    }} disabled={uploadingSub || !subForm.fileUrl.trim()}
                                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-50">
                                        <FiSave size={16} /> {uploadingSub ? 'Uploading...' : 'Register Subtitle'}
                                    </button>
                                    {subMsg && <span className={`text-xs font-bold ${subMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{subMsg}</span>}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
}