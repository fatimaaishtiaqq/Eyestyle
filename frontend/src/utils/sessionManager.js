/**
 * Session Manager — Centralized session timeout utility
 * 
 * Handles idle timeout (30 min), max session (24h), and cleanup.
 * No React dependency — pure JS so it can be used anywhere.
 */
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════
export const IDLE_TIMEOUT_MS      = 30 * 60 * 1000;   // 30 minutes
export const MAX_SESSION_MS       = 24 * 60 * 60 * 1000; // 24 hours
export const WARNING_BEFORE_MS    = 2 * 60 * 1000;     // Show warning 2 min before idle expires

// localStorage keys
const KEY_USER           = 'lux_user';
const KEY_LOGIN_TIME     = 'lux_session_login_time';
const KEY_LAST_ACTIVITY  = 'lux_session_last_activity';

// ═══════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════

/** Check if a user is currently logged in */
export const isLoggedIn = () => !!localStorage.getItem(KEY_USER);

/** Save login timestamp + initial activity timestamp */
export const recordLogin = () => {
    const now = Date.now().toString();
    localStorage.setItem(KEY_LOGIN_TIME, now);
    localStorage.setItem(KEY_LAST_ACTIVITY, now);
};

/** Update last-activity timestamp (called on user interaction) */
export const recordActivity = () => {
    if (!isLoggedIn()) return;
    localStorage.setItem(KEY_LAST_ACTIVITY, Date.now().toString());
};

/**
 * Check session validity.
 * @returns {{ valid: boolean, reason?: 'idle'|'max', warningIdle?: boolean }}
 */
export const checkSession = () => {
    if (!isLoggedIn()) return { valid: false, reason: 'none' };

    const now = Date.now();
    const loginTime    = parseInt(localStorage.getItem(KEY_LOGIN_TIME) || '0', 10);
    const lastActivity = parseInt(localStorage.getItem(KEY_LAST_ACTIVITY) || '0', 10);

    // 1. Max session duration exceeded (24h)
    if (loginTime && now - loginTime > MAX_SESSION_MS) {
        return { valid: false, reason: 'max' };
    }

    // 2. Idle timeout exceeded (30 min)
    if (lastActivity && now - lastActivity > IDLE_TIMEOUT_MS) {
        return { valid: false, reason: 'idle' };
    }

    // 3. Warning zone — within 2 min of idle timeout
    if (lastActivity && now - lastActivity > IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
        return { valid: true, warningIdle: true };
    }

    return { valid: true };
};

/**
 * Perform full logout — clears all session data, signs out of Firebase,
 * and dispatches a custom event so React components can react.
 * 
 * @param {'idle'|'max'|'manual'} reason - Why the logout happened
 */
export const performLogout = async (reason = 'manual') => {
    // Clear httpOnly JWT cookie via backend
    try {
        await fetch((import.meta.env.PROD ? 'https://eyestyle-backend.onrender.com' : 'http://localhost:5000') + '/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch { /* silent */ }

    // Clear auth data from localStorage
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_LOGIN_TIME);
    localStorage.removeItem(KEY_LAST_ACTIVITY);

    // Sign out of Firebase (silently, don't break if it fails)
    try {
        await signOut(auth);
    } catch {
        // Firebase sign-out failed — not critical
    }

    // Dispatch custom event so SessionManager.jsx (or any listener) can handle redirect + toast
    window.dispatchEvent(
        new CustomEvent('lux-session-expired', { detail: { reason } })
    );
};

/**
 * Get a human-readable message for the logout reason.
 */
export const getLogoutMessage = (reason) => {
    switch (reason) {
        case 'idle':
            return 'Your session expired due to inactivity. Please login again.';
        case 'max':
            return 'Your session has expired. Please login again.';
        default:
            return '';
    }
};
