// src/components/layout/Header.jsx

/**
 * Header Component
 * Main navigation with search, user menu, login/logout
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiMenu, FiX, FiUser, FiLogOut, FiSettings,
  FiBookmark, FiFilm, FiTrendingUp, FiGrid, FiBell, FiChevronDown, FiSun, FiMoon,
  FiPlay, FiStar, FiFlag, FiCheckCircle, FiAward, FiTrash2
} from 'react-icons/fi';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_NOTIFICATIONS } from '@/graphql/queries/userQueries';
import { MARK_NOTIFICATION_READ, MARK_ALL_NOTIFICATIONS_READ, DELETE_NOTIFICATION } from '@/graphql/mutations/interactionMutations';
import SearchBar from '@/components/common/SearchBar';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifRef = useRef(null);

  const { data: notifData } = useQuery(GET_NOTIFICATIONS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network'
  });
  const [markAsRead] = useMutation(MARK_NOTIFICATION_READ);
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ);
  const [deleteNotification] = useMutation(DELETE_NOTIFICATION);

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id) => {
    markAsRead({
      variables: { id },
      optimisticResponse: { markNotificationRead: { success: true, message: 'read' } },
      update: (cache) => {
        const data = cache.readQuery({ query: GET_NOTIFICATIONS });
        if (data) {
          cache.writeQuery({
            query: GET_NOTIFICATIONS,
            data: {
              notifications: data.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
            }
          });
        }
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead({
      optimisticResponse: { markAllNotificationsRead: { success: true, message: 'done' } },
      update: (cache) => {
        const data = cache.readQuery({ query: GET_NOTIFICATIONS });
        if (data) {
          cache.writeQuery({
            query: GET_NOTIFICATIONS,
            data: { notifications: data.notifications.map(n => ({ ...n, isRead: true })) }
          });
        }
      }
    });
  };

  const handleDeleteNotification = (id, e) => {
    e.stopPropagation();
    deleteNotification({
      variables: { id },
      optimisticResponse: { deleteNotification: { success: true, message: 'deleted' } },
      update: (cache) => {
        const data = cache.readQuery({ query: GET_NOTIFICATIONS });
        if (data) {
          cache.writeQuery({
            query: GET_NOTIFICATIONS,
            data: { notifications: data.notifications.filter(n => n.id !== id) }
          });
        }
      }
    });
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) handleMarkAsRead(n.id);
    if (n.actionUrl) {
      router.push(n.actionUrl);
      setIsNotificationsOpen(false);
    }
  };

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
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
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
      <div className="container mx-auto px-3">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href={homeLink} className="flex items-center  px-4 md:px-8 gap-2 group">
            <span className="text-2xl md:text-3xl font-black text-primary-500 uppercase italic tracking-tighter group-hover:scale-110 transition-transform">
              clip<span className="text-white group-hover:text-primary-400 transition-colors text-3xl">X</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex px-4 items-center gap-8">
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
          <div className="flex items-center gap-2 md:gap-3">
            {/* Theme toggle */}
            {/* <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 header-icon-btn"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button> */}
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 header-icon-btn"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Auth Section */}
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative hidden md:flex" ref={notifRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 header-icon-btn"
                  >
                    <FiBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 flex w-3 h-3 justify-center items-center text-[8px] bg-primary-500 rounded-full shadow-[0_0_0_2px_#000]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20"
                      >
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                          <h3 className="font-bold text-white text-sm">Notifications</h3>
                          {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-primary-400 hover:text-primary-300 uppercase tracking-widest transition-colors">
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto p-1.5">
                          {notifications.length > 0 ? (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`flex items-start gap-3 p-3 rounded-xl mb-0.5 cursor-pointer transition-all group ${n.isRead ? 'opacity-60 hover:opacity-80 hover:bg-white/5' : 'bg-white/5 hover:bg-white/10'}`}
                              >
                                <NotifIcon type={n.type} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4 className={`text-sm truncate ${n.isRead ? 'text-gray-300' : 'text-white font-semibold'}`}>{n.title}</h4>
                                    <button
                                      onClick={(e) => handleDeleteNotification(n.id, e)}
                                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-0.5 flex-shrink-0"
                                    >
                                      <FiX size={12} />
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                                {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center">
                              <FiBell className="mx-auto w-8 h-8 text-gray-600 mb-2" />
                              <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/10 transition-colors border border-transparent header-icon-btn"
                  >
                    <HeaderAvatar user={user} />
                    <FiChevronDown className={`w-4 h-4 text-gray-300 hidden sm:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
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

// Avatar component — reads local cache first, falls back to server URL, then initials
function HeaderAvatar({ user }) {
  const [avatarSrc, setAvatarSrc] = useState(null);

  const refreshAvatar = useCallback(() => {
    if (!user) { setAvatarSrc(null); return; }
    const local = typeof window !== 'undefined'
      ? localStorage.getItem(`clipx_avatar_${user.id}`)
      : null;
    setAvatarSrc(local || user.avatar || null);
  }, [user?.id, user?.avatar]);

  useEffect(() => {
    refreshAvatar();
    // Re-read whenever profile page saves a new avatar (dispatches 'storage')
    window.addEventListener('storage', refreshAvatar);
    return () => window.removeEventListener('storage', refreshAvatar);
  }, [refreshAvatar]);

  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/20 text-white">
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={user?.name || 'User'}
          className="w-full h-full object-cover"
          onError={() => setAvatarSrc(null)}
        />
      ) : (
        <span className="text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
      )}
      {/* Online indicator dot */}
      <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-black" />
    </div>
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
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black/80 flex flex-col pt-[15vh]"
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 md:top-10 md:right-10 p-3 bg-white/10 hover:bg-white/20 
                 rounded-full text-white transition-all hover:scale-110 shadow-xl"
      >
        <FiX className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      <div className="container mx-auto px-4 md:px-12 w-full max-w-4xl">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <SearchBar autoFocus onClose={onClose} placeholder="Type a movie title, actor, or genre..." />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Notification type icon
const NOTIF_ICONS = {
  watchlist: { Icon: FiBookmark, color: 'text-blue-400 bg-blue-500/15' },
  watch: { Icon: FiPlay, color: 'text-green-400 bg-green-500/15' },
  milestone: { Icon: FiAward, color: 'text-yellow-400 bg-yellow-500/15' },
  content: { Icon: FiFilm, color: 'text-purple-400 bg-purple-500/15' },
  review: { Icon: FiStar, color: 'text-orange-400 bg-orange-500/15' },
  report: { Icon: FiFlag, color: 'text-red-400 bg-red-500/15' },
  system: { Icon: FiBell, color: 'text-gray-400 bg-gray-500/15' },
  social: { Icon: FiUser, color: 'text-cyan-400 bg-cyan-500/15' },
};

function NotifIcon({ type }) {
  const cfg = NOTIF_ICONS[type] || NOTIF_ICONS.system;
  const { Icon, color } = cfg;
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

// Relative time display
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}