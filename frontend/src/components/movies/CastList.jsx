// src/components/movies/CastList.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiUser } from 'react-icons/fi';

const CastMember = ({ member, index }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group"
    >
      <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-dark-100">
        {member.profileImage && !imageError ? (
          <Image
            src={member.profileImage}
            alt={member.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <FiUser size={48} />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="text-center">
        <p className="font-semibold text-white text-sm mb-1 line-clamp-1">
          {member.name}
        </p>
        {member.character && (
          <p className="text-xs text-gray-400 line-clamp-1">
            {member.character}
          </p>
        )}
      </div>
    </motion.div>
  );
};

const CastList = ({ cast = [], limit = 12, title = 'Cast' }) => {
  const [showAll, setShowAll] = useState(false);
  
  const displayedCast = showAll ? cast : cast.slice(0, limit);
  const hasMore = cast.length > limit;

  if (!cast || cast.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-primary-500 hover:text-primary-400 font-semibold text-sm"
          >
              {showAll ? 'Show Less' : `View All (${cast.length})`}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayedCast.map((member, index) => (
          <CastMember key={member.id} member={member} index={index} />
        ))}
      </div>
    </section>
  );
};

export default CastList;