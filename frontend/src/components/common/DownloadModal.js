import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiDownload, FiX, FiCheck, FiFilm, FiAlertCircle, FiRefreshCw, FiStar } from 'react-icons/fi';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const PREF_KEY = 'clipx_preferred_quality';

export default function DownloadModal({ isOpen, onClose, movie, season, episode }) {
    const [downloadData, setDownloadData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [preferredQuality, setPreferredQuality] = useState(null);

    // Restore preferred quality
    useEffect(() => {
        try { setPreferredQuality(localStorage.getItem(PREF_KEY)); } catch { }
    }, []);

    useEffect(() => {
        if (isOpen && movie?.id) {
            fetchDownloadLinks();
        }
    }, [isOpen, movie, season, episode]);

    const savePreferredQuality = (q) => {
        setPreferredQuality(q);
        try { localStorage.setItem(PREF_KEY, q); } catch { }
    };

    const fetchDownloadLinks = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:8000';
            const res = await fetch(`${baseUrl}/api/movie/${movie.id}/download?season=${season || 0}&episode=${episode || 1}`);
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setDownloadData(data);

            // Auto-select preferred quality if available
            const pref = localStorage.getItem(PREF_KEY);
            if (pref && data?.links?.length) {
                const match = data.links.find(l => l.quality === pref);
                if (match) {
                    // Preferred quality exists — could auto-download or highlight
                }
            }
        } catch (err) {
            setErrorMsg(err.message || 'Failed to fetch download links');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-800">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-xl font-bold text-white flex items-center gap-2">
                                        <FiDownload className="text-primary-500" />
                                        Downloads for {movie?.title} {season > 0 && `(S${season} E${episode})`}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                        <FiX className="w-6 h-6" />
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <LoadingSpinner size="lg" />
                                        <p className="mt-4 text-gray-400">Fetching high-quality links from MovieBox...</p>
                                    </div>
                                ) : errorMsg ? (
                                    <div className="py-8 text-center">
                                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                            <FiAlertCircle className="w-7 h-7 text-red-400" />
                                        </div>
                                        <p className="text-red-400 mb-1 font-semibold">Download links unavailable</p>
                                        <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
                                        <button
                                            onClick={fetchDownloadLinks}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-lg transition-colors"
                                        >
                                            <FiRefreshCw className="w-4 h-4" /> Try Again
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Video Links */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Video Files</h4>
                                            <div className="grid gap-3">
                                                {downloadData?.links?.map((link, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => savePreferredQuality(link.quality)}
                                                        className={`flex items-center justify-between p-4 hover:bg-gray-800 border rounded-xl transition-all group ${preferredQuality === link.quality ? 'bg-primary-500/5 border-primary-500/30' : 'bg-gray-850 border-gray-700/50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${preferredQuality === link.quality ? 'bg-primary-500/20 text-primary-400 group-hover:bg-primary-500 group-hover:text-white' : 'bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-white'}`}>
                                                                <FiFilm />
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-medium flex items-center gap-2">
                                                                    {link.quality}
                                                                    {preferredQuality === link.quality && (
                                                                        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Preferred</span>
                                                                    )}
                                                                </p>
                                                                <p className="text-xs text-gray-500 uppercase">{link.ext} • {link.size_str}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    navigator.clipboard.writeText(link.url);
                                                                    setCopiedIdx(idx);
                                                                    setTimeout(() => setCopiedIdx(null), 2000);
                                                                }}
                                                                className="flex items-center gap-1 p-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
                                                                title="Copy Link"
                                                            >
                                                                {copiedIdx === idx ? (
                                                                    <span className="text-green-500">Copied!</span>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                            <a
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                referrerPolicy="no-referrer"
                                                                download
                                                                className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
                                                            >
                                                                <FiDownload />
                                                            </a>
                                                        </div>
                                                    </a>
                                                ))}
                                                {(!downloadData?.links || downloadData.links.length === 0) && (
                                                    <p className="text-gray-500 text-center py-4 italic">No download links available for this title.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subtitles */}
                                        {downloadData?.subtitles?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Subtitles</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {downloadData.subtitles.map((sub, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={sub.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            referrerPolicy="no-referrer"
                                                            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700"
                                                        >
                                                            {sub.lang}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                                    <p className="text-xs text-blue-400 mb-2 font-medium">
                                        Tip: If "Access Denied" appears, click the Copy button next to the download icon and paste the link in a new tab.
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        All content is provided by third-party mirrors. clipX does not host any files.
                                    </p>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
