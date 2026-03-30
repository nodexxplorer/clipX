/**
 * useSubscription Hook (Mobile)
 * Centralises subscription tier checks for UI gating.
 */
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Tier = 'free' | 'standard' | 'pro';

interface TierConfig {
  label: string;
  maxQuality: string;
  canDownload: boolean;
  canUseAI: boolean;
  canWatch4K: boolean;
  canWatchHD: boolean;
  hasAds: boolean;
  maxDevices: number;
  color: string;
}

const TIER_CONFIG: Record<Tier, TierConfig> = {
  free: {
    label: 'Free',
    maxQuality: '480p',
    canDownload: false,
    canUseAI: false,
    canWatch4K: false,
    canWatchHD: false,
    hasAds: true,
    maxDevices: 1,
    color: '#6b7280',
  },
  standard: {
    label: 'Standard',
    maxQuality: '720p',
    canDownload: true,
    canUseAI: false,
    canWatch4K: false,
    canWatchHD: true,
    hasAds: false,
    maxDevices: 2,
    color: '#3b82f6',
  },
  pro: {
    label: 'Pro',
    maxQuality: '4K',
    canDownload: true,
    canUseAI: true,
    canWatch4K: true,
    canWatchHD: true,
    hasAds: false,
    maxDevices: 5,
    color: '#8b5cf6',
  },
};

const QUALITY_LEVELS = ['360p', '480p', '720p', '1080p', '4K'];

export function useSubscription() {
  const { user } = useAuth();

  const tier = useMemo<Tier>(() => {
    const rawTier = (user as any)?.subscriptionTier || (user as any)?.subscription_tier || 'free';
    return rawTier.toLowerCase() as Tier;
  }, [user]);

  const config = TIER_CONFIG[tier] || TIER_CONFIG.free;

  const isQualityAllowed = (quality: string): boolean => {
    const tierIdx = QUALITY_LEVELS.indexOf(config.maxQuality);
    const requestedIdx = QUALITY_LEVELS.indexOf(quality);
    return requestedIdx <= tierIdx;
  };

  const requiresUpgrade = (feature: string): boolean => {
    switch (feature) {
      case 'download': return !config.canDownload;
      case 'ai': return !config.canUseAI;
      case '4k': return !config.canWatch4K;
      case 'hd': return !config.canWatchHD;
      default: return false;
    }
  };

  return {
    tier,
    tierLabel: config.label,
    tierColor: config.color,
    ...config,
    isQualityAllowed,
    requiresUpgrade,
    isPremium: tier !== 'free',
    isPro: tier === 'pro',
  };
}
