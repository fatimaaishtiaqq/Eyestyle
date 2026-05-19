import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendPasswordResetOTP, sendPasswordResetConfirmation } from '../utils/emailService.js';

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
//  In-memory IP-based rate limiter for request-otp
//  Max 5 requests per 15 minutes per IP
// ═══════════════════════════════════════════════════════════════
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

const rateLimiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, windowStart: now });
        return next();
    }

    const entry = rateLimitMap.get(ip);

    // Reset window if expired
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, windowStart: now });
        return next();
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }

    entry.count++;
    return next();
};

// Cleanup stale rate limit entries every 30 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(ip);
        }
    }
}, 30 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════════════════════════
const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const MAX_RESEND_COUNT = 5;
const OTP_VERIFIED_WINDOW_MINUTES = 5;

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generic success message (prevents email enumeration)
const GENERIC_OTP_MESSAGE = 'If this email is registered, an OTP has been sent.';

// ═══════════════════════════════════════════════════════════════
//  1. POST /api/forgot-password/request-otp
// ═══════════════════════════════════════════════════════════════
router.post('/request-otp', rateLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // If user doesn't exist or is a Firebase-only user, return generic success
        if (!user || user.authProvider === 'firebase') {
            return res.json({ success: true, message: GENERIC_OTP_MESSAGE });
        }

        // Check cooldown — must wait 60s between requests
        if (user.resetPasswordLastSentAt) {
            const elapsed = (Date.now() - new Date(user.resetPasswordLastSentAt).getTime()) / 1000;
            if (elapsed < OTP_COOLDOWN_SECONDS) {
                const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - elapsed);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${remaining} seconds before requesting a new OTP.`
                });
            }
        }

        // Check hourly resend limit
        // Reset resend count if last send was more than 1 hour ago
        if (user.resetPasswordLastSentAt) {
            const hourElapsed = (Date.now() - new Date(user.resetPasswordLastSentAt).getTime()) / 1000;
            if (hourElapsed > 3600) {
                user.resetPasswordResendCount = 0;
            }
        }

        if (user.resetPasswordResendCount >= MAX_RESEND_COUNT) {
            return res.status(429).json({
                success: false,
                message: 'Maximum OTP requests reached. Please try again in an hour.'
            });
        }

        // Generate cryptographically secure 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Hash the OTP before storing
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Save to user document (invalidates any previous OTP)
        user.resetPasswordOtpHash = otpHash;
        user.resetPasswordOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        user.resetPasswordOtpAttempts = 0;
        user.resetPasswordOtpVerified = false;
        user.resetPasswordOtpVerifiedAt = null;
        user.resetPasswordLastSentAt = new Date();
        user.resetPasswordResendCount = (user.resetPasswordResendCount || 0) + 1;
        await user.save({ validateModifiedOnly: true });

        // Send OTP email
        await sendPasswordResetOTP(user.email, otp, user.name);

        return res.json({ success: true, message: GENERIC_OTP_MESSAGE });

    } catch (error) {
        console.error('[Forgot Password] request-otp error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// ═══════════════════════════════════════════════════════════════
//  2. POST /api/forgot-password/verify-otp
// ═══════════════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.resetPasswordOtpHash) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // Check if OTP has expired
        if (new Date() > new Date(user.resetPasswordOtpExpiresAt)) {
            // Clear expired OTP
            user.resetPasswordOtpHash = null;
            user.resetPasswordOtpExpiresAt = null;
            await user.save({ validateModifiedOnly: true });
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Check attempt limit
        if (user.resetPasswordOtpAttempts >= MAX_OTP_ATTEMPTS) {
            // Invalidate the OTP after too many attempts
            user.resetPasswordOtpHash = null;
            user.resetPasswordOtpExpiresAt = null;
            await user.save({ validateModifiedOnly: true });
            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.',
                locked: true
            });
        }

        // Increment attempt count before comparison
        user.resetPasswordOtpAttempts += 1;

        // Compare entered OTP with stored hash
        const isMatch = await bcrypt.compare(otp.toString(), user.resetPasswordOtpHash);

        if (!isMatch) {
            await user.save({ validateModifiedOnly: true });
            const remaining = MAX_OTP_ATTEMPTS - user.resetPasswordOtpAttempts;
            return res.status(400).json({
                success: false,
                message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                attemptsRemaining: remaining
            });
        }

        // OTP is correct — mark as verified
        user.resetPasswordOtpVerified = true;
        user.resetPasswordOtpVerifiedAt = new Date();
        await user.save({ validateModifiedOnly: true });

        return res.json({ success: true, message: 'OTP verified successfully.' });

    } catch (error) {
        console.error('[Forgot Password] verify-otp error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// ═══════════════════════════════════════════════════════════════
//  3. POST /api/forgot-password/reset-password
// ═══════════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        if (!PASSWORD_REGEX.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid request.' });
        }

        // Verify the OTP was successfully verified
        if (!user.resetPasswordOtpVerified) {
            return res.status(400).json({ success: false, message: 'OTP verification required before resetting password.' });
        }

        // Check that OTP verification happened within the allowed window (5 minutes)
        if (user.resetPasswordOtpVerifiedAt) {
            const verifiedElapsed = (Date.now() - new Date(user.resetPasswordOtpVerifiedAt).getTime()) / 1000 / 60;
            if (verifiedElapsed > OTP_VERIFIED_WINDOW_MINUTES) {
                // Clear all reset fields
                user.resetPasswordOtpHash = null;
                user.resetPasswordOtpExpiresAt = null;
                user.resetPasswordOtpAttempts = 0;
                user.resetPasswordOtpVerified = false;
                user.resetPasswordOtpVerifiedAt = null;
                await user.save({ validateModifiedOnly: true });
                return res.status(400).json({
                    success: false,
                    message: 'Session expired. Please request a new OTP.'
                });
            }
        }

        // Update password (pre-save hook in User model will hash it)
        user.password = newPassword;

        // If this was a Firebase user who is now setting a local password,
        // update authProvider to local so they can use email/password login
        if (user.authProvider === 'firebase') {
            user.authProvider = 'local';
        }

        // Clear all OTP fields
        user.resetPasswordOtpHash = null;
        user.resetPasswordOtpExpiresAt = null;
        user.resetPasswordOtpAttempts = 0;
        user.resetPasswordOtpVerified = false;
        user.resetPasswordOtpVerifiedAt = null;
        user.resetPasswordLastSentAt = null;
        user.resetPasswordResendCount = 0;

        await user.save();

        // Send confirmation email (fire and forget)
        sendPasswordResetConfirmation(user.email, user.name).catch(() => {});

        return res.json({ success: true, message: 'Password reset successfully. You can now sign in with your new password.' });

    } catch (error) {
        console.error('[Forgot Password] reset-password error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

export default router;
