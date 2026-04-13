// mobile/utils/networkAwareStreaming.ts
// ─── Section 18: Network-Aware Streaming ─────────────────────────────────────
// Monitors network type (WiFi/Cellular/Offline) and dynamically adjusts
// stream quality to save data on cellular connections.

import { useEffect, useState, useCallback, useRef } from 'react';

type NetworkType = 'wifi' | 'cellular' | 'unknown' | 'none';
type StreamQuality = '360' | '480' | '720' | '1080' | 'auto';

interface NetworkState {
  type: NetworkType;
  isConnected: boolean;
  quality: StreamQuality;
  isMetered: boolean;
}

const QUALITY_MAP: Record<NetworkType, StreamQuality> = {
  wifi: '1080',
  cellular: '480',
  unknown: '720',
  none: '360',
};

let NetInfo: any = null;

async function loadNetInfo() {
  if (NetInfo) return NetInfo;
  try {
    NetInfo = await import('@react-native-community/netinfo');
    return NetInfo;
  } catch {
    // Fallback: try expo-network
    try {
      const ExpoNetwork = await import('expo-network');
      return ExpoNetwork;
    } catch {
      return null;
    }
  }
}

/**
 * React hook for network-aware streaming quality.
 * Auto-downgrades quality on cellular, restores on WiFi.
 */
export function useNetworkAwareQuality(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    type: 'unknown',
    isConnected: true,
    quality: 'auto',
    isMetered: false,
  });
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const net = await loadNetInfo();
      if (!net || !mounted) return;

      // NetInfo style (addEventListener)
      if (net.addEventListener) {
        const unsub = net.addEventListener((netState: any) => {
          if (!mounted) return;
          const type: NetworkType = netState.type === 'wifi' ? 'wifi'
            : netState.type === 'cellular' ? 'cellular'
            : netState.isConnected ? 'unknown' : 'none';
          
          setState({
            type,
            isConnected: netState.isConnected ?? true,
            quality: QUALITY_MAP[type],
            isMetered: netState.isInternetReachable === false || type === 'cellular',
          });
        });
        unsubRef.current = unsub;
      }
      // expo-network style (polling)
      else if (net.getNetworkStateAsync) {
        const check = async () => {
          if (!mounted) return;
          try {
            const netState = await net.getNetworkStateAsync();
            const type: NetworkType = netState.type?.includes('WIFI') ? 'wifi'
              : netState.type?.includes('CELLULAR') ? 'cellular'
              : netState.isConnected ? 'unknown' : 'none';
            
            setState({
              type,
              isConnected: netState.isConnected ?? true,
              quality: QUALITY_MAP[type],
              isMetered: type === 'cellular',
            });
          } catch {}
        };
        check();
        const interval = setInterval(check, 10000); // Poll every 10s
        unsubRef.current = () => clearInterval(interval);
      }
    }

    init();
    return () => {
      mounted = false;
      unsubRef.current?.();
    };
  }, []);

  return state;
}

/**
 * Get recommended quality label for display.
 */
export function getQualityLabel(quality: StreamQuality): string {
  const labels: Record<StreamQuality, string> = {
    '360': 'Low (360p) — Data Saver',
    '480': 'Medium (480p) — Cellular',
    '720': 'HD (720p)',
    '1080': 'Full HD (1080p)',
    'auto': 'Auto',
  };
  return labels[quality] || 'Auto';
}

/**
 * Check if user should be warned about cellular data usage.
 */
export function shouldWarnCellular(networkState: NetworkState, sizeMB: number): boolean {
  return networkState.type === 'cellular' && sizeMB > 100;
}

export default { useNetworkAwareQuality, getQualityLabel, shouldWarnCellular };
