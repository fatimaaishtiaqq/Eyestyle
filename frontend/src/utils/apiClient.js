// Use VITE_API_BASE_URL if set; otherwise production uses the actual user backend URL; dev uses localhost:5000 to avoid proxy issues with uploads
const rawBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://luxury-ecommerce-backend.vercel.app' : 'http://localhost:5000')).trim();
const API_BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

// Simple in-memory cache to avoid refetching the same resources repeatedly
const cache = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

const buildKey = (path) => `${API_BASE_URL}${path}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetches a URL with automatic retry on network errors or 5xx responses.
// Retries up to maxRetries times with exponential backoff (initialDelay * 2^attempt).
const fetchWithRetry = async (url, maxRetries = 3, initialDelay = 800) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url);
            // Retry on server errors (5xx) — these indicate cold-start / transient issues
            if (res.status >= 500 && attempt < maxRetries) {
                lastError = new Error(`Server error ${res.status}`);
                await sleep(initialDelay * Math.pow(2, attempt));
                continue;
            }
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(text || `Failed to fetch ${url}`);
            }
            return res;
        } catch (err) {
            lastError = err;
            // Only retry on network errors (TypeError), not on intentional HTTP errors
            if (err instanceof TypeError && attempt < maxRetries) {
                await sleep(initialDelay * Math.pow(2, attempt));
            } else if (!(err instanceof TypeError)) {
                throw err; // Re-throw HTTP errors immediately
            }
        }
    }
    throw lastError;
};

export const getWithCache = async (path, { ttl = DEFAULT_TTL_MS } = {}) => {
    const key = buildKey(path);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && cached.expiry > now) {
        return cached.data;
    }

    const res = await fetchWithRetry(key);
    const data = await res.json();
    cache.set(key, { data, expiry: now + ttl });
    return data;
};

export const invalidateCache = (pathPrefix = '') => {
    const fullPrefix = pathPrefix ? buildKey(pathPrefix) : '';
    for (const key of cache.keys()) {
        if (!fullPrefix || key.startsWith(fullPrefix)) {
            cache.delete(key);
        }
    }
};

export { API_BASE_URL };

