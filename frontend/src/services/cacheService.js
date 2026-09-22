/**
 * Universal Dual-Layer Cache Service
 * Compatible across all browser engines, privacy modes, and mobile/desktop platforms.
 */

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.prefix = 'salintinig_cache_';
    this.maxEntries = 50;
    this.isSessionStorageAvailable = this._checkStorageSupport();
  }

  /**
   * Safe check for sessionStorage support (handles Safari Private Mode & WebViews)
   */
  _checkStorageSupport() {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return false;
      const testKey = '__salintinig_test__';
      window.sessionStorage.setItem(testKey, '1');
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper to remove keys matching prefix from sessionStorage safely
   */
  _removeStorageKeys(prefixPattern) {
    if (!this.isSessionStorageAvailable) return;
    try {
      const keysToRemove = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const sKey = window.sessionStorage.key(i);
        if (sKey && sKey.startsWith(prefixPattern)) {
          keysToRemove.push(sKey);
        }
      }
      for (const k of keysToRemove) {
        window.sessionStorage.removeItem(k);
      }
    } catch {
      // Ignore storage interaction failures
    }
  }

  /**
   * Retrieve cached data by key. Checks in-memory cache first, then sessionStorage.
   * @param {string} key 
   * @returns {*|null}
   */
  get(key) {
    const memItem = this.memoryCache.get(key);
    if (memItem) {
      if (Date.now() <= memItem.expiresAt) return memItem.data;
      this.memoryCache.delete(key);
    }

    if (this.isSessionStorageAvailable) {
      try {
        const raw = window.sessionStorage.getItem(this.prefix + key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Date.now() <= parsed.expiresAt) {
            this.memoryCache.set(key, parsed);
            return parsed.data;
          }
          window.sessionStorage.removeItem(this.prefix + key);
        }
      } catch {
        // Fall back to memory cache seamlessly
      }
    }

    return null;
  }

  /**
   * Store data in cache with a TTL (Time To Live).
   * @param {string} key 
   * @param {*} data 
   * @param {number} ttlMs Time to live in ms (default: 3 minutes)
   */
  set(key, data, ttlMs = 180000) {
    const expiresAt = Date.now() + ttlMs;
    const entry = { data, expiresAt };

    if (this.memoryCache.size >= this.maxEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, entry);

    if (this.isSessionStorageAvailable) {
      try {
        window.sessionStorage.setItem(this.prefix + key, JSON.stringify(entry));
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
          this._removeStorageKeys(this.prefix);
        }
      }
    }
  }

  /**
   * Invalidate cache entries starting with a prefix.
   * @param {string} keyPrefix 
   */
  invalidate(keyPrefix) {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.memoryCache.delete(key);
      }
    }
    this._removeStorageKeys(this.prefix + keyPrefix);
  }

  /**
   * Clear all app cached entries.
   */
  clear() {
    this.memoryCache.clear();
    this._removeStorageKeys(this.prefix);
  }
}

export const cacheService = new CacheService();
export default cacheService;
