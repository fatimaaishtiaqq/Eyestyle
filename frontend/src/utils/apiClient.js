// Use VITE_API_BASE_URL if set; otherwise production uses the deployed Render backend URL; dev uses localhost:5000
const rawBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://eyestyle-backend.onrender.com' : 'http://localhost:5000')).trim();
const API_BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const cache = new Map();
const DEFAULT_TTL_MS = 60 * 1000;

const buildKey = (path) => `${API_BASE_URL}${path}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getStoredUser = () => {
    try {
        const stored = localStorage.getItem('lux_user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        localStorage.removeItem('lux_user');
        return null;
    }
};

/** Allow https URLs and same-origin upload paths only */
export const isSafeMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (trimmed.startsWith('/images/') || trimmed.startsWith('/uploads/')) return true;
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === 'https:' || (import.meta.env.DEV && parsed.protocol === 'http:');
    } catch {
        return false;
    }
};

const fetchWithRetry = async (url, options = {}, maxRetries = 3, initialDelay = 800) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, options);
            if (res.status >= 500 && attempt < maxRetries) {
                lastError = new Error(`Server error ${res.status}`);
                await sleep(initialDelay * Math.pow(2, attempt));
                continue;
            }
            return res;
        } catch (err) {
            lastError = err;
            if (err instanceof TypeError && attempt < maxRetries) {
                await sleep(initialDelay * Math.pow(2, attempt));
            } else {
                throw err;
            }
        }
    }
    throw lastError;
};

/**
 * Authenticated API request. Attaches Bearer token from lux_user.
 * On 401, clears session and redirects to login.
 */
export const apiFetch = async (path, { method = 'GET', body, auth = true, headers = {} } = {}) => {
    const url = path.startsWith('http') ? path : buildKey(path);
    const reqHeaders = { ...headers };

    if (body !== undefined && !(body instanceof FormData)) {
        reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
    }

    if (auth) {
        const user = getStoredUser();
        if (!user?.token) {
            throw new Error('Not authenticated');
        }
        reqHeaders.Authorization = `Bearer ${user.token}`;
    }

    const res = await fetchWithRetry(url, {
        method,
        headers: reqHeaders,
        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && auth) {
        localStorage.removeItem('lux_user');
        window.dispatchEvent(new CustomEvent('lux-session-expired', { detail: { reason: 'token_expired' } }));
        throw new Error('Session expired. Please log in again.');
    }

    return res;
};

export const getWithCache = async (path, { ttl = DEFAULT_TTL_MS } = {}) => {
    const key = buildKey(path);
    const now = Date.now();

    const cached = cache.get(key);
    if (cached && cached.expiry > now) {
        return cached.data;
    }

    const res = await fetchWithRetry(key);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to fetch ${path}`);
    }
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
