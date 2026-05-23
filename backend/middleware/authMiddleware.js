import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    // Phase 8: Read token from httpOnly cookie first, fall back to Authorization header
    // This supports both cookie-based auth (production) and header-based auth (legacy/mobile)
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password -firebaseUid -resetPasswordOtpHash -resetPasswordOtpExpiresAt -resetPasswordOtpVerified');

        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Account is blocked. Contact support.' });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Auth middleware error:', error.message);
        }
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.role === 'superadmin' || req.user.role === 'manager')) {
        return next();
    }
    return res.status(403).json({ message: 'Not authorized as admin' });
};

export { protect, admin };
