import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiDownload, FiX, FiCheck, FiFilm } from 'react-icons/fi';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DownloadModal({ isOpen, onClose, movie }) {
    const [downloadData, setDownloadData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen && movie?.id) {
            fetchDownloadLinks();
        }
    }, [isOpen, movie]);

    const fetchDownloadLinks = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`http://localhost:8000/api/movie/${movie.id}/download`);
            if (!res.ok) throw new Error('Failed to fetch download links');
            const data = await res.json();
            setDownloadData(data);
        } catch (err) {
            setErrorMsg(err.message);
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
                                        Downloads for {movie?.title}
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
                                        <p className="text-red-400 mb-4">{errorMsg}</p>
                                        <button onClick={fetchDownloadLinks} className="text-primary-400 hover:underline">Try Again</button>
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
                                                        className="flex items-center justify-between p-4 bg-gray-850 hover:bg-gray-800 border border-gray-700/50 rounded-xl transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                                                <FiFilm />
                                                            </div>
                                                            <div>
                                                                <p className="text-white font-medium">{link.quality}</p>
                                                                <p className="text-xs text-gray-500 uppercase">{link.ext} • {link.size_str}</p>
                                                            </div>
                                                        </div>
                                                        <FiDownload className="text-gray-500 group-hover:text-primary-500 transition-colors" />
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
                                                            rel="noopener noreferrer"
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

                                <div className="mt-8 pt-6 border-t border-gray-800">
                                    <p className="text-xs text-gray-500 text-center">
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
