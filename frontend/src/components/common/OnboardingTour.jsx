/**
 * Onboarding Tour Component
 * Shows guided tooltips for each page the user visits for the first time
 * Tracks visited pages in localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiX, FiPlay, FiSearch, FiHeart, FiSettings, FiFilm, FiList, FiUser, FiDollarSign, FiClock, FiStar } from 'react-icons/fi';

// Page-specific tour configurations
const PAGE_TOURS = {
    '/': [
        { title: 'Welcome to clipX! 🎬', description: 'Your premium streaming destination. Let us show you around!', icon: FiPlay },
        { title: 'Trending Movies', description: 'Scroll down to see what\'s hot right now. Hover on any poster for a quick preview.', icon: FiStar },
        { title: 'Continue Watching', description: 'If you\'re logged in, your in-progress movies appear at the top. Pick up where you left off!', icon: FiClock },
    ],
    '/movies': [
        { title: 'Browse & Filter', description: 'Use the filters to narrow down by genre, year, type (movie, series, anime), and more.', icon: FiFilm },
        { title: 'Infinite Scroll', description: 'Keep scrolling to load more movies automatically. No pagination needed!', icon: FiList },
    ],
    '/watchlist': [
        { title: 'Your Watchlist ❤️', description: 'All movies and series you\'ve saved appear here. Click the heart on any movie to add/remove it.', icon: FiHeart },
    ],
    '/dashboard': [
        { title: 'Your Dashboard', description: 'See your activity, watch history, stats, and personalized recommendations all in one place.', icon: FiUser },
    ],
    '/subscription': [
        { title: 'Manage Your Plan', description: 'Upgrade, downgrade, or cancel your subscription. View payment history and manage family plans.', icon: FiDollarSign },
    ],
    '/pricing': [
        { title: 'Choose Your Plan', description: 'Compare Free, Standard, and Pro tiers. Toggle between monthly and yearly billing to save 20%.', icon: FiDollarSign },
    ],
    '/profile': [
        { title: 'Your Profile', description: 'Update your avatar, name, email, and preferences. Find your referral link here too!', icon: FiSettings },
    ],
};

function getPageKey(pathname) {
    // Normalize dynamic routes
    if (pathname.startsWith('/movies/') && pathname !== '/movies/recent') return null; // Skip individual movie pages
    if (pathname.startsWith('/watch/')) return null;
    if (pathname.startsWith('/admin')) return null;
    if (pathname.startsWith('/auth')) return null;
    return pathname;
}

export default function OnboardingTour() {
    const router = useRouter();
    const [showTour, setShowTour] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tourSteps, setTourSteps] = useState([]);

    useEffect(() => {
        const pageKey = getPageKey(router.pathname);
        if (!pageKey) return;

        const steps = PAGE_TOURS[pageKey];
        if (!steps || steps.length === 0) return;

        // Check if user has seen tour for this page
        try {
            const visitedPages = JSON.parse(localStorage.getItem('clipx_toured_pages') || '[]');
            if (visitedPages.includes(pageKey)) return;

            // Small delay before showing
            const timer = setTimeout(() => {
                setTourSteps(steps);
                setCurrentStep(0);
                setShowTour(true);
            }, 1500);
            return () => clearTimeout(timer);
        } catch {
            return;
        }
    }, [router.pathname]);

    const completeTour = useCallback(() => {
        const pageKey = getPageKey(router.pathname);
        if (pageKey) {
            try {
                const visited = JSON.parse(localStorage.getItem('clipx_toured_pages') || '[]');
                if (!visited.includes(pageKey)) {
                    visited.push(pageKey);
                    localStorage.setItem('clipx_toured_pages', JSON.stringify(visited));
                }
            } catch { }
        }
        setShowTour(false);
        setCurrentStep(0);
    }, [router.pathname]);

    const skipAll = useCallback(() => {
        // Mark all pages as visited so tour never shows again
        localStorage.setItem('clipx_toured_pages', JSON.stringify(Object.keys(PAGE_TOURS)));
        setShowTour(false);
    }, []);

    const nextStep = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    if (!showTour || tourSteps.length === 0) return null;

    const step = tourSteps[currentStep];
    const StepIcon = step?.icon || FiPlay;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={completeTour}
            >
                <motion.div
                    key={`${router.pathname}-${currentStep}`}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 border border-white/10 rounded-2xl p-7 max-w-md w-full shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close */}
                    <button onClick={completeTour} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>

                    {/* Progress dots */}
                    {tourSteps.length > 1 && (
                        <div className="flex gap-1.5 mb-5">
                            {tourSteps.map((_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-primary-500' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    )}

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-4">
                        <StepIcon className="w-6 h-6 text-primary-400" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-black text-white text-center mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">{step.description}</p>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 font-bold">{currentStep + 1}/{tourSteps.length}</span>
                            <button onClick={skipAll} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors underline">
                                Don&apos;t show tours
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button onClick={prevStep} className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">
                                    Back
                                </button>
                            )}
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors"
                            >
                                {currentStep < tourSteps.length - 1 ? 'Next' : 'Got it!'}
                                <FiArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
