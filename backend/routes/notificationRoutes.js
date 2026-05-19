import express from 'express';
import RestockNotification from '../models/RestockNotification.js';
import Product from '../models/Product.js';

const router = express.Router();

// @desc    Save email for restock notification
// @route   POST /api/notifications/restock
// @access  Public
router.post('/restock', async (req, res) => {
    try {
        const { email, productId } = req.body;

        if (!email || !productId) {
            return res.status(400).json({ message: 'Email and Product ID are required' });
        }

        // Validate email format
        const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user is already subscribed and not yet notified
        const existingNotification = await RestockNotification.findOne({
            product: productId,
            email: email,
            notified: false
        });

        if (existingNotification) {
            return res.status(400).json({ message: 'You are already on the notification list for this product.' });
        }

        const notification = new RestockNotification({
            product: productId,
            email: email,
            productName: product.name
        });

        await notification.save();
        res.status(201).json({ message: 'Successfully added to notification list' });
    } catch (error) {
        console.error('Restock Notification Error:', error);
        res.status(500).json({ message: 'Failed to process your request' });
    }
});

export default router;
