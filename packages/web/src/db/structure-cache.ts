/**
 * IndexedDB-based cache for 3D structure data.
 * Provides Tier 2 caching for structures fetched from RCSB.
 *
 * Features:
 * - Persists structures across browser sessions
 * - LRU eviction when cache exceeds size limit
 * - Versioned entries by PDB ID
 */

const DB_NAME = 'phage-explorer-structure-cache';
const DB_VERSION = 1;
const STORE_NAME = 'structures';
const MAX_CACHE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export interface CachedStructure {
  pdbId: string;
  data: ArrayBuffer; // Raw PDB/mmCIF text as bytes
  format: 'pdb' | 'mmcif';
  fetchedAt: number; // Unix timestamp
  accessedAt: number; // For LRU
  sizeBytes: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open or create the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'pdbId' });
        store.createIndex('accessedAt', 'accessedAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Get a cached structure by PDB ID.
 * Updates accessedAt timestamp on hit (for LRU).
 */
export async function getCachedStructure(pdbId: string): Promise<CachedStructure | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(pdbId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as CachedStructure | undefined;
        if (!result) {
          resolve(null);
          return;
        }

        // Update access time for LRU
        result.accessedAt = Date.now();
        store.put(result);
        resolve(result);
      };
    });
  } catch (err) {
    console.warn('[structure-cache] Failed to get cached structure:', err);
    return null;
  }
}

/**
 * Cache a structure.
 * May trigger LRU eviction if cache is full.
 */
export async function cacheStructure(
  pdbId: string,
  data: ArrayBuffer,
  format: 'pdb' | 'mmcif'
): Promise<void> {
  try {
    const db = await openDB();
    const now = Date.now();
    const entry: CachedStructure = {
      pdbId,
      data,
      format,
      fetchedAt: now,
      accessedAt: now,
      sizeBytes: data.byteLength,
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    // Check if eviction needed (async, don't block)
    void evictIfNeeded(db);
  } catch (err) {
    console.warn('[structure-cache] Failed to cache structure:', err);
  }
}

/**
 * Evict oldest entries if cache exceeds size limit.
 *
 * Note: IndexedDB transactions auto-commit when the event loop is idle,
 * so we must avoid awaiting between operations within a single transaction.
 * We solve this by first reading entries in one transaction, then deleting
 * in a separate transaction without any awaits between delete requests.
 */
async function evictIfNeeded(db: IDBDatabase): Promise<void> {
  // Phase 1: Read all entries to determine what to evict
  const entries: CachedStructure[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

  let totalSize = entries.reduce((sum, e) => sum + e.sizeBytes, 0);

  if (totalSize <= MAX_CACHE_SIZE_BYTES) return;

  // Sort by accessedAt ascending (oldest first)
  entries.sort((a, b) => a.accessedAt - b.accessedAt);

  // Determine which entries to delete
  const keysToDelete: string[] = [];
  for (const entry of entries) {
    if (totalSize <= MAX_CACHE_SIZE_BYTES) break;
    totalSize -= entry.sizeBytes;
    keysToDelete.push(entry.pdbId);
  }

  if (keysToDelete.length === 0) return;

  // Phase 2: Delete all entries in a single transaction without awaiting
  // between operations (to prevent transaction auto-commit)
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    // Issue all delete requests synchronously (no await between them)
    for (const key of keysToDelete) {
      store.delete(key);
    }
  });
}

/**
 * Get cache statistics.
 */
export async function getCacheStats(): Promise<{
  entryCount: number;
  totalSizeBytes: number;
  oldestAccessedAt: number | null;
  newestAccessedAt: number | null;
}> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const entries: CachedStructure[] = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    const totalSizeBytes = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    const accessTimes = entries.map(e => e.accessedAt);

    return {
      entryCount: entries.length,
      totalSizeBytes,
      oldestAccessedAt: accessTimes.length > 0 ? Math.min(...accessTimes) : null,
      newestAccessedAt: accessTimes.length > 0 ? Math.max(...accessTimes) : null,
    };
  } catch (err) {
    console.warn('[structure-cache] Failed to get cache stats:', err);
    return {
      entryCount: 0,
      totalSizeBytes: 0,
      oldestAccessedAt: null,
      newestAccessedAt: null,
    };
  }
}

/**
 * Clear all cached structures.
 */
export async function clearStructureCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (err) {
    console.warn('[structure-cache] Failed to clear cache:', err);
  }
}

/**
 * Check if a structure is cached (without loading it).
 */
export async function isStructureCached(pdbId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.count(pdbId);
      request.onerror = () => resolve(false);
      request.onsuccess = () => resolve(request.result > 0);
    });
  } catch {
    return false;
  }
}
