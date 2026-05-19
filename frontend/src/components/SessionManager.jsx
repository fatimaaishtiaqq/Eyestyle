/**
 * SessionManager — React component that monitors session health.
 * 
 * Rendered once in App.jsx inside <Router>.
 * - Tracks user activity events (throttled)
 * - Runs periodic session checks every 60s
 * - Shows warning modal before idle timeout
 * - Handles auto-logout with toast + redirect
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
    isLoggedIn,
    recordActivity,
    checkSession,
    performLogout,
    getLogoutMessage
} from '../utils/sessionManager';

const ACTIVITY_THROTTLE_MS = 30_000; // Only update localStorage once per 30s
const CHECK_INTERVAL_MS    = 60_000; // Check session every 60s

const SessionManager = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [showWarning, setShowWarning] = useState(false);
    const lastActivityWrite = useRef(0);
    const checkTimerRef = useRef(null);

    // ── Throttled activity recorder ──
    const handleActivity = useCallback(() => {
        const now = Date.now();
        if (now - lastActivityWrite.current < ACTIVITY_THROTTLE_MS) return;
        lastActivityWrite.current = now;
        recordActivity();

        // If warning is showing and user interacts, dismiss it
        setShowWarning(false);
    }, []);

    // ── Session check logic ──
    const runSessionCheck = useCallback(() => {
        if (!isLoggedIn()) {
            setShowWarning(false);
            return;
        }

        const result = checkSession();

        if (!result.valid) {
            // Session expired — auto logout
            setShowWarning(false);
            const msg = getLogoutMessage(result.reason);
            performLogout(result.reason);
            if (msg) showToast(msg, 'error');
            navigate('/account', { replace: true });
            return;
        }

        if (result.warningIdle) {
            setShowWarning(true);
        }
    }, [navigate, showToast]);

    // ── Handle "Stay Logged In" button ──
    const handleStayLoggedIn = useCallback(() => {
        recordActivity();
        lastActivityWrite.current = Date.now();
        setShowWarning(false);
    }, []);

    // ── Listen for manual/external logout events ──
    useEffect(() => {
        const handleExpired = (e) => {
            const reason = e.detail?.reason;
            // Only redirect + toast for auto-logouts, not manual
            if (reason && reason !== 'manual') {
                const msg = getLogoutMessage(reason);
                if (msg) showToast(msg, 'error');
                navigate('/account', { replace: true });
            } else if (reason === 'manual') {
                navigate('/');
            }
        };

        window.addEventListener('lux-session-expired', handleExpired);
        return () => window.removeEventListener('lux-session-expired', handleExpired);
    }, [navigate, showToast]);

    // ── Route change → record activity ──
    useEffect(() => {
        if (isLoggedIn()) {
            recordActivity();
            lastActivityWrite.current = Date.now();
        }
    }, [location.pathname]);

    // ── Attach activity listeners + periodic check ──
    useEffect(() => {
        if (!isLoggedIn()) return;

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));

        // Run check immediately, then every 60s
        runSessionCheck();
        checkTimerRef.current = setInterval(runSessionCheck, CHECK_INTERVAL_MS);

        return () => {
            events.forEach(evt => window.removeEventListener(evt, handleActivity));
            if (checkTimerRef.current) clearInterval(checkTimerRef.current);
        };
    }, [handleActivity, runSessionCheck, location.pathname]);

    // ── On page load / refresh: immediate session validation ──
    useEffect(() => {
        if (!isLoggedIn()) return;
        const result = checkSession();
        if (!result.valid) {
            const msg = getLogoutMessage(result.reason);
            performLogout(result.reason);
            if (msg) showToast(msg, 'error');
            navigate('/account', { replace: true });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ═══ Warning Modal ═══
    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-8 max-w-sm w-[90%] text-center shadow-2xl">
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>

                <h3 className="text-base font-serif font-bold tracking-widest uppercase text-[var(--text-primary)] mb-2">
                    Session Expiring Soon
                </h3>
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-6">
                    You have been inactive. Your session will expire soon. Click below to stay logged in.
                </p>

                <button
                    onClick={handleStayLoggedIn}
                    className="w-full btn-primary py-3.5 text-[11px] font-black tracking-[0.3em] uppercase"
                >
                    Stay Logged In
                </button>
            </div>
        </div>
    );
};

export default SessionManager;
