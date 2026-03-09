// src/components/movies/MovieFilters.jsx
import { useState, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_GENRES } from '@/graphql/queries/genreQueries';
import { FiFilter, FiX } from 'react-icons/fi';

const MovieFilters = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    type: initialFilters.type || 'All',
    genre: initialFilters.genre || 'All',
    country: initialFilters.country || 'All',
    year: initialFilters.year || 'All',
    dub: initialFilters.dub || 'All',
    sort: initialFilters.sort || 'Hottest',
  });

  const { data: genresData } = useQuery(GET_ALL_GENRES);

  const types = ['All', 'TV', 'Kids'];
  const countries = ['All', 'United States', 'United Kingdom', 'Korea', 'Japan', 'Hollywood', 'Nollywood', 'Bollywood', 'China', 'France'];

  const currentYear = new Date().getFullYear();
  const years = ['All', ...Array.from({ length: 8 }, (_, i) => String(currentYear - i)), '2010s', '2000s', '1990s', '1980s'];

  const dubs = ['All', 'sub', 'Punjabi dub', 'Tamil dub', 'Telugu dub', 'Hindi dub', 'Arabic dub'];
  const sorts = ['ForYou', 'Hottest', 'Latest', 'Rating', 'Popular'];

  const genres = [{ name: 'All', slug: 'All' }, ...(genresData?.genres || [])];

  const handleSelect = (category, value) => {
    const newFilters = { ...filters, [category]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      type: 'All', genre: 'All', country: 'All', year: 'All', dub: 'All', sort: 'Hottest'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  // Mobile horizontal scroll row
  const FilterRow = ({ options, activeValue, category }) => {
    const scrollRef = useRef(null);
    return (
      <div className="flex items-center gap-4 py-2 border-b border-white/5 relative group">
        <div
          className="flex-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap flex items-center gap-2"
          ref={scrollRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {options.map((opt) => {
            const val = opt?.slug || opt;
            const label = opt?.name || opt;
            const isActive = activeValue === val;
            return (
              <button
                key={val}
                onClick={() => handleSelect(category, val)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm transition-colors ${isActive
                  ? 'bg-gray-700 text-white font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Desktop Dropdown
  const DesktopDropdown = ({ label, options, category, activeValue }) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <select
          value={activeValue}
          onChange={(e) => handleSelect(category, e.target.value)}
          className="w-full bg-dark-200 text-white px-4 py-3 rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none appearance-none"
        >
          {options.map((opt) => {
            const val = opt?.slug || opt;
            const text = opt?.name || opt;
            return <option key={val} value={val}>{text}</option>;
          })}
        </select>
      </div>
    );
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== 'All' && val !== 'Hottest');

  return (
    <div className="mb-8">
      {/* Desktop View (Dropdowns) */}
      <div className="hidden lg:block bg-dark-100 rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-50"></div>

        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-lg text-primary-500">
              <FiFilter />
            </div>
            Refine Search
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors bg-red-400/10 px-3 py-1.5 rounded-lg"
            >
              <FiX size={16} />
              Reset All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <DesktopDropdown label="Type" options={types} category="type" activeValue={filters.type} />
          <DesktopDropdown label="Genre" options={genres} category="genre" activeValue={filters.genre} />
          <DesktopDropdown label="Country" options={countries} category="country" activeValue={filters.country} />
          <DesktopDropdown label="Year" options={years} category="year" activeValue={filters.year} />
          <DesktopDropdown label="Dubbing" options={dubs} category="dub" activeValue={filters.dub} />
          <DesktopDropdown label="Sort By" options={sorts} category="sort" activeValue={filters.sort} />
        </div>
      </div>

      {/* Mobile View (Chips) */}
      <div className="lg:hidden bg-[#0f1115] p-6 rounded-2xl border border-white/10 space-y-1 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500 opacity-50"></div>
        <FilterRow options={types} activeValue={filters.type} category="type" />
        <FilterRow options={genres} activeValue={filters.genre} category="genre" />
        <FilterRow options={countries} activeValue={filters.country} category="country" />
        <FilterRow options={years} activeValue={filters.year} category="year" />
        <FilterRow options={dubs} activeValue={filters.dub} category="dub" />
        <FilterRow options={sorts} activeValue={filters.sort} category="sort" />
      </div>
    </div>
  );
};

export default MovieFilters;