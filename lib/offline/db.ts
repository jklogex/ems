// IndexedDB wrapper for offline storage

const DB_NAME = 'ems_offline';
const DB_VERSION = 1;

interface DB {
  workOrders: IDBObjectStore;
  syncQueue: IDBObjectStore;
}

let dbInstance: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Work orders store
      if (!db.objectStoreNames.contains('workOrders')) {
        const workOrdersStore = db.createObjectStore('workOrders', { keyPath: 'id' });
        workOrdersStore.createIndex('status', 'status', { unique: false });
        workOrdersStore.createIndex('technician_id', 'technician_id', { unique: false });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncQueueStore.createIndex('type', 'type', { unique: false });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export async function saveWorkOrder(workOrder: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workOrders'], 'readwrite');
    const store = transaction.objectStore('workOrders');
    const request = store.put(workOrder);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getWorkOrders(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workOrders'], 'readonly');
    const store = transaction.objectStore('workOrders');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getWorkOrder(id: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workOrders'], 'readonly');
    const store = transaction.objectStore('workOrders');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function addToSyncQueue(item: {
  type: string;
  url: string;
  method: string;
  body?: any;
  timestamp?: number;
}): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.add({
      ...item,
      timestamp: item.timestamp || Date.now(),
    });

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getSyncQueue(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('timestamp');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

