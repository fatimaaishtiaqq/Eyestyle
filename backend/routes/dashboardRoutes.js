import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Private/Admin
router.get('/metrics', protect, admin, async (req, res) => {
    try {
        // Total Revenue (Sum of all valid orders)
        const revenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
        ]);

        const totalRevenue = revenue.length > 0 ? revenue[0].totalRevenue : 0;

        // Active Orders (Not delivered, not cancelled)
        const activeOrders = await Order.countDocuments({
            status: { $in: ['pending', 'processing', 'shipped'] }
        });

        // Total Orders (All statuses)
        const totalOrders = await Order.countDocuments();

        // Total Customers
        const totalCustomers = await User.countDocuments({ role: 'customer' });

        res.json({
            totalRevenue,
            activeOrders,
            totalOrders,
            totalCustomers
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
