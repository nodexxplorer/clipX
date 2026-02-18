import { motion } from 'framer-motion';
import { FiDownload, FiExternalLink, FiServer, FiVideo, FiMonitor, FiCheck } from 'react-icons/fi';
import {  gql } from '@apollo/client';
import {useMutation} from '@apollo/client/react';
import { useState } from 'react';

const IMPORT_AND_LOG = gql`
  mutation ImportAndLogDownload($title: String!, $provider: String!, $link: String, $quality: String) {
    importAndLogDownload(title: $title, provider: $provider, link: $link, quality: $quality) {
      id
      status
    }
  }
`;

const UnifiedResultCard = ({ result }) => {
    const { title, provider, quality, size, link, type } = result;
    const [importDownload] = useMutation(IMPORT_AND_LOG);
    const [downloaded, setDownloaded] = useState(false);

    const handleDownload = async (e) => {
        //e.preventDefault(); // Don't prevent default, we want to open the link
        // But we also want to log it.

        // Fire and forget log
        try {
            await importDownload({
                variables: {
                    title,
                    provider: provider || 'Unified',
                    link,
                    quality: quality || 'Unknown'
                }
            });
            setDownloaded(true);
        } catch (err) {
            console.error("Failed to log download:", err);
        }

        // The link <a> will handle opening the url
    };

    const getProviderIcon = (providerName) => {
        switch (providerName?.toLowerCase()) {
            case 'moviebox': return <FiVideo className="text-blue-400" />;
            case 'anime-dl': return <FiMonitor className="text-pink-400" />;
            case 'lulacloud': return <FiServer className="text-green-400" />;
            default: return <FiDownload className="text-gray-400" />;
        }
    };

    const getProviderColor = (providerName) => {
        switch (providerName?.toLowerCase()) {
            case 'moviebox': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'anime-dl': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
            case 'lulacloud': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-gray-700 text-gray-300 border-gray-600';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-100 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${getProviderColor(provider)}`}>
                            {getProviderIcon(provider)}
                            {provider}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{type}</span>
                    </div>

                    <h3 className="font-semibold text-white/90 truncate mb-1" title={title}>
                        {title}
                    </h3>

                    <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="bg-dark-200 px-1.5 py-0.5 rounded text-xs">{quality || 'Unknown'}</span>
                        <span>•</span>
                        <span>{size || 'Unknown Size'}</span>
                    </div>
                </div>

                <div className="flex-shrink-0 flex flex-col gap-2">
                    {link ? (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleDownload}
                            className={`p-2 rounded-lg transition-colors flex items-center justify-center group ${downloaded ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-primary-600 hover:bg-primary-500 text-white'}`}
                            title="Download / Watch"
                        >
                            {downloaded ? <FiCheck size={18} /> : <FiDownload size={18} className="group-hover:-translate-y-0.5 transition-transform" />}
                        </a>
                    ) : (
                        <button disabled className="p-2 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed">
                            <FiDownload size={18} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default UnifiedResultCard;
