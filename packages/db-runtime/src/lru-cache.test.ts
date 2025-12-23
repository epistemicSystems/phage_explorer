/**
 * Unit tests for LRU Cache
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { LRUCache } from './lru-cache';

describe('LRUCache', () => {
  describe('constructor', () => {
    it('creates cache with specified maxSize', () => {
      const cache = new LRUCache<string, number>(50);
      expect(cache.size).toBe(0);
    });

    it('creates cache with default maxSize of 100', () => {
      const cache = new LRUCache<string, number>();
      // Fill to capacity
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, i);
      }
      expect(cache.size).toBe(100);
    });

    it('throws for maxSize less than 1', () => {
      expect(() => new LRUCache<string, number>(0)).toThrow('maxSize must be at least 1');
      expect(() => new LRUCache<string, number>(-5)).toThrow('maxSize must be at least 1');
    });
  });

  describe('set and get', () => {
    let cache: LRUCache<string, number>;

    beforeEach(() => {
      cache = new LRUCache<string, number>(3);
    });

    it('sets and gets a value', () => {
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('returns undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('updates value for existing key', () => {
      cache.set('a', 1);
      cache.set('a', 2);
      expect(cache.get('a')).toBe(2);
      expect(cache.size).toBe(1);
    });

    it('works with various key types', () => {
      const numCache = new LRUCache<number, string>(3);
      numCache.set(42, 'answer');
      expect(numCache.get(42)).toBe('answer');
    });

    it('works with object values', () => {
      const objCache = new LRUCache<string, { x: number }>(3);
      const obj = { x: 10 };
      objCache.set('obj', obj);
      expect(objCache.get('obj')).toBe(obj);
    });
  });

  describe('has', () => {
    it('returns true for existing keys', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
    });

    it('returns false for missing keys', () => {
      const cache = new LRUCache<string, number>(3);
      expect(cache.has('missing')).toBe(false);
    });

    it('does not update LRU order', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // has() should not update 'a' to most recent
      cache.has('a');

      // Adding 'd' should evict 'a' (still oldest)
      cache.set('d', 4);

      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest entry when capacity reached', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'

      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
      expect(cache.size).toBe(3);
    });

    it('updates LRU order on get', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' to make it most recently used
      cache.get('a');

      // Adding 'd' should now evict 'b' (oldest)
      cache.set('d', 4);

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('updates LRU order on set (update)', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Update 'a' to make it most recently used
      cache.set('a', 10);

      // Adding 'd' should now evict 'b' (oldest)
      cache.set('d', 4);

      expect(cache.get('a')).toBe(10);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('handles size 1 cache correctly', () => {
      const cache = new LRUCache<string, number>(1);
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);

      cache.set('b', 2);
      expect(cache.has('a')).toBe(false);
      expect(cache.get('b')).toBe(2);
      expect(cache.size).toBe(1);
    });
  });

  describe('delete', () => {
    it('deletes existing key and returns true', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);

      expect(cache.delete('a')).toBe(true);
      expect(cache.has('a')).toBe(false);
      expect(cache.size).toBe(0);
    });

    it('returns false for missing key', () => {
      const cache = new LRUCache<string, number>(3);
      expect(cache.delete('missing')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(false);
    });
  });

  describe('size', () => {
    it('returns current number of entries', () => {
      const cache = new LRUCache<string, number>(10);

      expect(cache.size).toBe(0);
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      cache.set('b', 2);
      expect(cache.size).toBe(2);
      cache.delete('a');
      expect(cache.size).toBe(1);
    });
  });

  describe('iterators', () => {
    let cache: LRUCache<string, number>;

    beforeEach(() => {
      cache = new LRUCache<string, number>(5);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
    });

    it('entries() yields [key, value] pairs in LRU order', () => {
      const entries = Array.from(cache.entries());
      expect(entries).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });

    it('keys() yields keys in LRU order', () => {
      const keys = Array.from(cache.keys());
      expect(keys).toEqual(['a', 'b', 'c']);
    });

    it('values() yields values in LRU order', () => {
      const values = Array.from(cache.values());
      expect(values).toEqual([1, 2, 3]);
    });

    it('reflects LRU order after access', () => {
      cache.get('a'); // Move 'a' to most recent

      const keys = Array.from(cache.keys());
      expect(keys).toEqual(['b', 'c', 'a']);
    });
  });

  describe('forEach', () => {
    it('calls callback for each entry', () => {
      const cache = new LRUCache<string, number>(5);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      const collected: Array<[string, number]> = [];
      cache.forEach((value, key) => {
        collected.push([key, value]);
      });

      expect(collected).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });

    it('receives Map instance as third argument', () => {
      const cache = new LRUCache<string, number>(5);
      cache.set('a', 1);

      let receivedMap: Map<string, number> | undefined;
      cache.forEach((_v, _k, map) => {
        receivedMap = map;
      });

      expect(receivedMap).toBeDefined();
      expect(receivedMap?.size).toBe(1);
    });
  });

  describe('chainable set', () => {
    it('returns this for chaining', () => {
      const cache = new LRUCache<string, number>(5);
      const result = cache.set('a', 1).set('b', 2).set('c', 3);

      expect(result).toBe(cache);
      expect(cache.size).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('handles undefined values correctly', () => {
      const cache = new LRUCache<string, undefined>(3);
      cache.set('a', undefined);
      // Note: get returns undefined for missing keys AND for undefined values
      // This is a known limitation - use has() to distinguish
      expect(cache.has('a')).toBe(true);
    });

    it('handles null values correctly', () => {
      const cache = new LRUCache<string, null>(3);
      cache.set('a', null);
      expect(cache.get('a')).toBeNull();
      expect(cache.has('a')).toBe(true);
    });

    it('handles rapid insertions', () => {
      const cache = new LRUCache<number, number>(100);
      for (let i = 0; i < 1000; i++) {
        cache.set(i, i * 2);
      }
      expect(cache.size).toBe(100);
      // Newest 100 entries should be present
      expect(cache.has(999)).toBe(true);
      expect(cache.has(900)).toBe(true);
      expect(cache.has(899)).toBe(false);
    });

    it('handles alternating access patterns', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);

      // Alternate accessing
      cache.get('a');
      cache.get('b');
      cache.get('a');

      // 'b' is now oldest, 'a' is newest
      cache.set('c', 3); // Should evict 'b'

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
    });
  });
});
