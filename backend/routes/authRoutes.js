import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(res, user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            token,
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password
    });

    if (user) {
        const token = generateToken(res, user._id);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            token,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
});

// @desc    Hybrid Firebase Authentication Login / Sync
// @route   POST /api/auth/firebase
// @access  Public
router.post('/firebase', async (req, res) => {
    const { email, name, uid } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required from Firebase' });
    }

    try {
        // Find existing user by email
        let user = await User.findOne({ email });

        // If user does not exist in MongoDB, create them
        if (!user) {
            // Generate a secure random password since they use Firebase for auth
            const randomPassword = Math.random().toString(36).slice(-12);
            user = await User.create({
                name: name || 'Firebase User',
                email,
                password: randomPassword
            });
        }

        // Return JWT token identically to existing login/register methods
        const token = generateToken(res, user._id);
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role,
            token,
        });
    } catch (error) {
        console.error('Firebase Auth Sync Error:', error);
        res.status(500).json({ message: 'Backend Sync Failed' });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get user by ID
// @route   GET /api/auth/users/:id
// @access  Private/Admin
router.get('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update user status (block/unblock)
// @route   PUT /api/auth/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user.role === 'superadmin') {
                return res.status(400).json({ message: 'Cannot block a superadmin' });
            }

            user.status = req.body.status || user.status;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
