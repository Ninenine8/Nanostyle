import { ImageAsset } from '../types';

const DB_NAME = 'NanoStyleDB';
const STORE_NAME = 'custom-models';
const DB_VERSION = 1;

/**
 * Open the IndexedDB database.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('Database error: ' + (event.target as IDBOpenDBRequest).error);

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Get all custom models from the database.
 */
export const getCustomModels = async (): Promise<ImageAsset[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by id (timestamp desc inferred if id uses Date.now())
        // But since IDs are strings, let's just return as is.
        // We'll assume newer items should be shown first, so reverse might be needed in UI.
        resolve((request.result as ImageAsset[]).reverse());
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to get custom models:", error);
    return [];
  }
};

/**
 * Save a custom model to the database.
 */
export const saveCustomModel = async (asset: ImageAsset): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Ensure the asset is marked as custom
      const modelToSave = { ...asset, isCustom: true };
      
      const request = store.add(modelToSave);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save custom model:", error);
    throw error;
  }
};

/**
 * Delete a custom model by ID.
 */
export const deleteCustomModel = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete custom model:", error);
    throw error;
  }
};