import { getSyncQueue, removeFromSyncQueue } from './db';

export async function syncPendingOperations(): Promise<{ success: number; failed: number }> {
  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (response.ok) {
        await removeFromSyncQueue(item.id);
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Sync error:', error);
      failed++;
    }
  }

  return { success, failed };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function registerOnlineHandler(callback: () => void): void {
  window.addEventListener('online', callback);
}

export function registerOfflineHandler(callback: () => void): void {
  window.addEventListener('offline', callback);
}

