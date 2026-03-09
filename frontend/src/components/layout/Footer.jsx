// src/components/layout/Footer.jsx
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa';
import { FiSend, FiHeart } from 'react-icons/fi';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const quickLinks = [
    { name: 'Browse Movies', href: '/movies' },
    { name: 'Top Rated', href: '/movies?sort=rating' },
    { name: 'New Releases', href: '/movies/recent' },
    { name: 'Genres', href: '/genres' },
    { name: 'Recommendations', href: '/recommendations' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '/help' },
    { name: 'Download Guide', href: '/guide' },
    { name: 'Quality Standards', href: '/quality' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Report Issue', href: '/report' },
  ];

  const socialLinks = [
    { icon: FaFacebookF, href: 'https://facebook.com/clipX', label: 'Facebook', color: 'hover:bg-blue-600' },
    { icon: FaTwitter, href: 'https://twitter.com/clipX', label: 'Twitter', color: 'hover:bg-sky-500' },
    { icon: FaInstagram, href: 'https://instagram.com/clipX', label: 'Instagram', color: 'hover:bg-pink-600' },
    { icon: FaYoutube, href: 'https://youtube.com/clipX', label: 'YouTube', color: 'hover:bg-red-600' },
  ];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      // Handle subscription logic (TODO: send to backend)
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-dark-100 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-black text-primary-500 uppercase italic tracking-tighter">
                clip<span className="text-white text-3xl">X</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Your ultimate destination for discovering and downloading amazing movies.
              Get personalized AI recommendations and enjoy high-quality entertainment.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={`p-2 bg-dark-200 rounded-lg text-gray-400 
                           transition-all duration-300 ${social.color} hover:text-white`}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-500 transition-colors 
                             text-sm inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-primary-500 group-hover:w-3 transition-all duration-300" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-500 transition-colors 
                             text-sm inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 h-0.5 bg-primary-500 group-hover:w-3 transition-all duration-300" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get updates on new releases and personalized recommendations.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-dark-200 text-white px-4 py-3 pr-12 rounded-lg 
                           border border-white/10 focus:outline-none focus:border-primary-500
                           text-sm transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 
                           bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <FiSend size={16} />
                </button>
              </div>

              {subscribed && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-green-500 text-sm"
                >
                  ✓ Successfully subscribed!
                </motion.p>
              )}
            </form>

            {/* App Download (optional) */}
            <div className="mt-6">
              <p className="text-gray-500 text-xs mb-2">Coming soon on</p>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 bg-dark-200 rounded text-xs text-gray-400">
                  iOS App
                </div>
                <div className="px-3 py-1.5 bg-dark-200 rounded text-xs text-gray-400">
                  Android App
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm flex items-center gap-1">
              © {new Date().getFullYear()} clipX. Made with
              <FiHeart className="text-red-500" size={14} />
              All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-primary-500 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-primary-500 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-primary-500 transition-colors">
                Cookie Policy
              </Link>
              <Link href="/dmca" className="text-gray-400 hover:text-primary-500 transition-colors">
                DMCA
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;