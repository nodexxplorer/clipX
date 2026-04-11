/**
 * Offline Sync Queue Utility
 * Queues GraphQL mutations when offline and replays them via Background Sync API
 */

const DB_NAME = 'clipx_sync';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('No IndexedDB'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queue a GraphQL mutation for background sync.
 * Call this when a mutation fails due to offline status.
 *
 * @param {string} operationName - e.g. 'UpdateWatchProgress'
 * @param {string} query - the GraphQL query string
 * @param {object} variables - mutation variables
 */
export async function queueMutation(operationName, query, variables) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({
      payload: { operationName, query, variables },
      timestamp: Date.now(),
    });

    // Request background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('clipx-sync-progress');
    }
  } catch {
    // IndexedDB or sync not available — mutation is lost
    console.warn('[OfflineSync] Could not queue mutation');
  }
}

/**
 * Flush the sync queue manually (e.g. when coming back online).
 * Useful as a fallback when Background Sync is not supported.
 */
export async function flushQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = async () => {
        const items = request.result || [];
        let flushed = 0;

        for (const item of items) {
          try {
            const response = await fetch('/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
              credentials: 'include',
              body: JSON.stringify(item.payload),
            });
            if (response.ok) {
              const deleteTx = db.transaction(STORE_NAME, 'readwrite');
              deleteTx.objectStore(STORE_NAME).delete(item.id);
              flushed++;
            }
          } catch {
            break; // Still offline
          }
        }
        resolve(flushed);
      };
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

// Auto-flush when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushQueue().catch(() => {});
  });
}
