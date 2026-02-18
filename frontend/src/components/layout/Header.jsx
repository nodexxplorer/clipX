// src/components/layout/Header.jsx

/**
 * Header Component
 * Main navigation with search, user menu, login/logout
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiMenu, FiX, FiUser, FiLogOut, FiSettings,
  FiBookmark, FiFilm, FiTrendingUp, FiGrid, FiBell, FiChevronDown
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from '@/components/common/SearchBar';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const userMenuRef = useRef(null);

  // Handle scroll for header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  // Dynamic home link based on auth status
  const homeLink = isAuthenticated ? '/dashboard' : '/';

  const navLinks = [
    { href: homeLink, label: 'Home' },
    { href: '/movies', label: 'Movies', icon: FiFilm },
    { href: '/series', label: 'Series', icon: FiFilm },
    { href: '/anime', label: 'Anime', icon: FiFilm },
    { href: '/movies/trending', label: 'Trending', icon: FiTrendingUp },
    { href: '/genres', label: 'Genres', icon: FiGrid },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-black/90 backdrop-blur-xl border-b border-white/5'
        : 'bg-gradient-to-b from-black/80 via-black/20 to-transparent'
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href={homeLink} className="flex items-center gap-2 group">
            <span className="text-2xl md:text-3xl font-black text-primary-500 uppercase italic tracking-tighter group-hover:scale-110 transition-transform">
              clip<span className="text-white group-hover:text-primary-400 transition-colors text-3xl">X</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary-400 ${router.pathname === link.href ? 'text-primary-400' : 'text-gray-300'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36 6.36l-1.42-1.42M7.05 6.05L5.63 4.63m12.72 0l-1.42 1.42M7.05 17.95l-1.42 1.42" /></svg>
              )}
            </button>
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Auth Section */}
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-300 hover:text-white transition-colors hidden sm:block">
                  <FiBell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-300">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <FiChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50">
                          <p className="font-medium text-white truncate">{user?.name}</p>
                          <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <MenuItem href="/dashboard" icon={FiGrid} onClick={() => setIsUserMenuOpen(false)}>
                            Dashboard
                          </MenuItem>
                          <MenuItem href="/watchlist" icon={FiBookmark} onClick={() => setIsUserMenuOpen(false)}>
                            My Watchlist
                          </MenuItem>
                          <MenuItem href="/profile" icon={FiSettings} onClick={() => setIsUserMenuOpen(false)}>
                            Settings
                          </MenuItem>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-700 py-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors"
                          >
                            <FiLogOut className="w-5 h-5" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <Link
                  href="/auth/login"
                  className="hidden sm:block text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3 md:px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <nav className="py-4 space-y-1 border-t border-gray-800">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${router.pathname === link.href
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                  >
                    {link.icon && <link.icon className="w-5 h-5" />}
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    <div className="pt-2 mt-2 border-t border-gray-800 space-y-1">
                      <Link
                        href="/watchlist"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                      >
                        <FiBookmark className="w-5 h-5" />
                        <span className="font-medium">My Watchlist</span>
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                      >
                        <FiSettings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <FiLogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 mt-2 border-t border-gray-800 space-y-1">
                    <Link
                      href="/auth/login"
                      className="block px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <SearchOverlay onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>
    </header>
  );
}

// Menu Item Component
function MenuItem({ href, icon: Icon, children, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );
}

// Search Overlay Component
function SearchOverlay({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 py-20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <FiX className="w-6 h-6" />
        </button>
        <div className="max-w-2xl mx-auto">
          <SearchBar autoFocus onClose={onClose} />
        </div>
      </div>
    </motion.div>
  );
}