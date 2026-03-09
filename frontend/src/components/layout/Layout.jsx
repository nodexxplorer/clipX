// src/components/layout/Layout.jsx
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';

// Code splitting: Header and Footer are large — lazy load them
const Header = dynamic(() => import('./Header'), { ssr: false });
const Footer = dynamic(() => import('./Footer'), { ssr: false });
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false });

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

      {/* Real-time Chat Widget */}
      {!isWatchPage && <ChatWidget room="global" />}
    </div>
  );
};

export default Layout;