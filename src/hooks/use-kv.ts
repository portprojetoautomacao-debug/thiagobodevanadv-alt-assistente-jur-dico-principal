/**
 * Custom KV (Key-Value) storage hook
 * 
 * This hook provides a unified interface for key-value storage that works in both:
 * - Development: Uses localStorage as a fallback
 * - Production: Uses Vercel KV (Redis) for persistent storage
 * 
 * This replaces @github/spark's useKV to avoid 403 authentication errors
 * when deployed to Vercel.
 */

import { useState, useEffect, useCallback } from 'react';

// Type for storage operations
type StorageValue<T> = T | null;

/**
 * Custom hook for key-value storage
 * 
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [value, setValue] - Current value and setter function
 */
export function useKV<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from localStorage
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // In production, also sync to Vercel KV (if available)
        if (import.meta.env.PROD && typeof window.fetch !== 'undefined') {
          syncToVercelKV(key, valueToStore);
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Load from Vercel KV on mount (production only)
  useEffect(() => {
    if (import.meta.env.PROD) {
      loadFromVercelKV<T>(key).then((value) => {
        if (value !== null) {
          setStoredValue(value);
        }
      }).catch((error) => {
        console.error(`Error loading from Vercel KV for key "${key}":`, error);
      });
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Sync data to Vercel KV in production
 */
async function syncToVercelKV<T>(key: string, value: T): Promise<void> {
  try {
    const response = await fetch('/api/kv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
      console.error('Failed to sync to Vercel KV:', response.statusText);
    }
  } catch (error) {
    console.error('Error syncing to Vercel KV:', error);
    // Don't throw - we don't want to break the app if KV sync fails
  }
}

/**
 * Load data from Vercel KV in production
 */
async function loadFromVercelKV<T>(key: string): Promise<StorageValue<T>> {
  try {
    const response = await fetch(`/api/kv?key=${encodeURIComponent(key)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Key doesn't exist
      }
      console.error('Failed to load from Vercel KV:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.value as T;
  } catch (error) {
    console.error('Error loading from Vercel KV:', error);
    return null;
  }
}
