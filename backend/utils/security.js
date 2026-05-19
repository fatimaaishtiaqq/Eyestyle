/** Escape user input for safe use in MongoDB $regex */
export const escapeRegex = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const isProduction = () => process.env.NODE_ENV === 'production';

/** Generic client-facing error message in production */
export const safeErrorMessage = (err, fallback = 'Server Error') => {
    if (!isProduction()) {
        return err?.message || fallback;
    }
    return fallback;
};
