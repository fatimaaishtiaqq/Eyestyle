import express from 'express';
import Order from '../models/Order.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { sendWhatsAppMessage } from '../utils/whatsappClient.js';

const router = express.Router();

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            status: 'pending'
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    }
});

// @desc    Create new order via WhatsApp
// @route   POST /api/orders/whatsapp
// @access  Public (or Private depending on your auth requirement, we'll keep it same as standard orders if user is required)
router.post('/whatsapp', protect, async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        const order = new Order({
            orderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod: 'WhatsApp',
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            status: 'pending'
        });

        const createdOrder = await order.save();
        res.status(201).json({ orderId: createdOrder._id });
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = req.body.status || order.status;
            if (req.body.trackingNumber) {
                order.trackingNumber = req.body.trackingNumber;
            }

            // Auto update delivery time based on status
            if (req.body.status === 'delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }

            const updatedOrder = await order.save();

            // Notify Customer via WhatsApp if they used WhatsApp checkout or provided a phone number
            // The phone number might be in the shipping address
            if (updatedOrder.shippingAddress && updatedOrder.shippingAddress.phone) {
                const customerPhone = updatedOrder.shippingAddress.phone;
                let message = `*Order Update from Luxury E-Commerce*\n\n`;

                const shortOrderId = updatedOrder._id.toString().substring(18);
                if (req.body.status === 'processing') {
                    message += `Hello! Your order *#${shortOrderId}* is now being processed. 📦`;
                } else if (req.body.status === 'shipped') {
                    message += `Great news! Your order *#${shortOrderId}* has been shipped. 🚚`;
                    if (req.body.trackingNumber) message += `\nTracking Number: ${req.body.trackingNumber}`;
                } else if (req.body.status === 'delivered') {
                    message += `Your order *#${shortOrderId}* has been delivered! 🎉 Enjoy your purchase!`;
                } else if (req.body.status === 'cancelled') {
                    message += `We're sorry to inform you that your order *#${shortOrderId}* has been cancelled. 🚫 If you have any questions, please contact our support team.`;
                }

                const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
                if (validStatuses.includes(req.body.status)) {
                    console.log(`[WhatsApp Bot] Attempting to send status update to ${customerPhone} for order ${updatedOrder._id}`);
                    // AWAIT the message so Vercel does not kill the serverless function prematurely
                    try {
                        await sendWhatsAppMessage(customerPhone, message);
                    } catch (err) {
                        console.error('[WhatsApp Bot] Failed to send message:', err);
                    }
                } else {
                    console.log(`[WhatsApp Bot] Status '${req.body.status}' does not have a configured message payload.`);
                }
            } else {
                console.log(`[WhatsApp Bot] No phone number found in order ${updatedOrder._id}. Skipping message.`);
            }

            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
