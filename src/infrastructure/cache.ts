/**
 * Production Cache Implementation
 *
 * Uses Keyv for flexible, production-ready caching
 * Supports file-based storage (can be swapped for Redis/Memcached)
 */

import Keyv from 'keyv';
import KeyvFile from 'keyv-file';
import { ICache, ILogger } from '../domain/types';
import config from '../config';
import fs from 'fs';
import path from 'path';

export class Cache implements ICache {
  private readonly keyv: Keyv;
  private readonly logger: ILogger;
  private readonly ttl: number;

  constructor(logger: ILogger) {
    this.logger = logger;
    this.ttl = config.get('cache.ttl');

    const cacheStore = config.get('cache.store');
    const namespace = config.get('cache.namespace');

    // Ensure cache directory exists
    this.ensureCacheDir(cacheStore);

    // Initialize Keyv with file store
    this.keyv = new Keyv({
      store: new KeyvFile({
        filename: path.join(cacheStore, 'cache.json'),
        writeDelay: 100 // Batch writes for performance
      }),
      namespace,
      ttl: this.ttl
    });

    // Handle errors
    this.keyv.on('error', (err) => {
      this.logger.error('Cache error', { error: err.message });
    });

    this.logger.info('Cache initialized', { store: cacheStore, ttl: this.ttl });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.keyv.get(key);
      const hit = value !== undefined;

      this.logger.debug('Cache access', { key, hit });

      return value as T | undefined;
    } catch (error) {
      this.logger.error('Cache get error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.keyv.set(key, value, ttl);
      this.logger.debug('Cache set', { key, ttl: ttl ?? this.ttl });
    } catch (error) {
      this.logger.error('Cache set error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.keyv.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error('Cache has error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.keyv.delete(key);
      this.logger.debug('Cache delete', { key, deleted: result });
      return result;
    } catch (error) {
      this.logger.error('Cache delete error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.keyv.clear();
      this.logger.info('Cache cleared');
    } catch (error) {
      this.logger.error('Cache clear error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDir(cacheStore: string): void {
    try {
      if (!fs.existsSync(cacheStore)) {
        fs.mkdirSync(cacheStore, { recursive: true });
        this.logger.info('Cache directory created', { path: cacheStore });
      }
    } catch (error) {
      this.logger.error('Failed to create cache directory', {
        path: cacheStore,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
