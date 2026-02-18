// src/components/layout/Layout.jsx
import Header from './Header';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

const Layout = ({ children }) => {
  const router = useRouter();

  const isWatchPage = router.pathname.startsWith('/watch/');

  return (
    <div className="min-h-screen flex flex-col bg-[#050607]">
      {/* Header - hide on watch page */}
      {!isWatchPage && <Header />}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={router.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 ${isWatchPage ? 'h-screen w-screen overflow-hidden' : ''}`}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Footer - hide on watch page */}
      {!isWatchPage && <Footer />}

      {/* Talk with Us Button */}
      <TalkWithUsButton />
    </div>
  );
};

// Floating Chat Button Component
const TalkWithUsButton = () => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring' }}
      className="fixed bottom-6 right-6 z-40 bg-primary-500 text-white px-5 py-3 
               rounded-full shadow-glow hover:bg-primary-600 transition-all duration-300
               flex items-center gap-2 font-semibold group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        className="w-5 h-5 group-hover:animate-pulse"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <span className="hidden sm:inline">Talk with Us</span>
    </motion.button>
  );
};

export default Layout;