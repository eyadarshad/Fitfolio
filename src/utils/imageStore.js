// ============================================
// DripCheck — IndexedDB Image Storage
// ============================================
// Stores clothing images in IndexedDB instead of localStorage
// to avoid the 5-10MB localStorage limit.
// Images are stored as Blobs, keyed by clothing item ID.

const DB_NAME = 'dripcheck_images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.warn('IndexedDB not available, falling back to data URLs');
            reject(request.error);
        };
    });

    return dbPromise;
}

/**
 * Save an image (as data URL string) to IndexedDB.
 * @param {string} id - Clothing item ID
 * @param {string} dataUrl - The base64 data URL of the image
 */
export async function saveImage(id, dataUrl) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(dataUrl, id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        // Fallback: store in memory cache
        imageCache.set(id, dataUrl);
    }
}

/**
 * Load an image from IndexedDB by clothing item ID.
 * @param {string} id
 * @returns {Promise<string|null>} data URL or null
 */
export async function loadImage(id) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return imageCache.get(id) || null;
    }
}

/**
 * Delete an image from IndexedDB.
 * @param {string} id
 */
export async function deleteImage(id) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        imageCache.delete(id);
    }
}

/**
 * Migrate existing images from localStorage clothes items into IndexedDB.
 * This runs once on first load if clothes have imageDataUrl fields.
 */
export async function migrateFromLocalStorage() {
    try {
        const raw = localStorage.getItem('dripcheck_clothes');
        if (!raw) return;

        const clothes = JSON.parse(raw);
        const db = await openDB();
        const needsMigration = clothes.filter(c => c.imageDataUrl && c.imageDataUrl.startsWith('data:'));

        if (needsMigration.length === 0) return;

        console.log(`Migrating ${needsMigration.length} images to IndexedDB...`);

        for (const item of needsMigration) {
            await saveImage(item.id, item.imageDataUrl);
        }

        // Update localStorage to only keep a placeholder
        const updated = clothes.map(c => {
            if (c.imageDataUrl && c.imageDataUrl.startsWith('data:')) {
                return { ...c, imageDataUrl: `idb:${c.id}` };
            }
            return c;
        });

        localStorage.setItem('dripcheck_clothes', JSON.stringify(updated));
        console.log('Image migration complete!');
    } catch (e) {
        console.warn('Image migration failed:', e);
    }
}

/**
 * Resolve image URL: if it starts with 'idb:', load from IndexedDB async.
 * Otherwise return the URL as-is (could be a data URL or external URL).
 */
export async function resolveImageUrl(url) {
    if (!url) return null;
    if (url.startsWith('idb:')) {
        const id = url.slice(4);
        return await loadImage(id);
    }
    return url;
}

// In-memory fallback cache
const imageCache = new Map();
