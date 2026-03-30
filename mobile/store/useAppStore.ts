import { create } from 'zustand';

interface AppState {
  subscriptionTier: 'free' | 'standard' | 'pro';
  setSubscriptionTier: (tier: 'free' | 'standard' | 'pro') => void;
}

export const useAppStore = create<AppState>((set) => ({
  subscriptionTier: 'free',
  setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),
}));
