// src/components/common/Pagination.jsx
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Show 5 page numbers at a time

    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-dark-100 border border-white/10 
                 hover:bg-primary-500 hover:border-primary-500
                 disabled:opacity-50 disabled:cursor-not-allowed
                 disabled:hover:bg-dark-100 disabled:hover:border-white/10
                 transition-all duration-300"
      >
        <FiChevronLeft size={20} />
      </button>

      {/* First Page */}
      {currentPage > 3 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 rounded-lg bg-dark-100 border border-white/10
                     hover:bg-primary-500 hover:border-primary-500
                     transition-all duration-300"
          >
            1
          </button>
          {currentPage > 4 && (
            <span className="text-gray-500">...</span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg border transition-all duration-300
            ${page === currentPage
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-dark-100 border-white/10 hover:bg-primary-500 hover:border-primary-500'
            }`}
        >
          {page}
        </button>
      ))}

      {/* Last Page */}
      {currentPage < totalPages - 2 && (
        <>
          {currentPage < totalPages - 3 && (
            <span className="text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 rounded-lg bg-dark-100 border border-white/10
                     hover:bg-primary-500 hover:border-primary-500
                     transition-all duration-300"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-dark-100 border border-white/10 
                 hover:bg-primary-500 hover:border-primary-500
                 disabled:opacity-50 disabled:cursor-not-allowed
                 disabled:hover:bg-dark-100 disabled:hover:border-white/10
                 transition-all duration-300"
      >
        <FiChevronRight size={20} />
      </button>
    </div>
  );
};

export default Pagination;