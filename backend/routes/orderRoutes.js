import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import Sale from '../models/Sale.js';
import Coupon from '../models/Coupon.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { sendWhatsAppMessage } from '../utils/whatsappClient.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../utils/emailService.js';
import { buildPricedOrder } from '../utils/orderPricing.js';
import { safeErrorMessage } from '../utils/security.js';

const router = express.Router();

const recordPromotionalMetrics = async (order) => {
    try {
        const saleDiscounts = {}; // saleId -> { count, discount }
        
        for (const item of order.orderItems) {
            if (item.appliedSaleId) {
                const saleIdStr = String(item.appliedSaleId);
                const discount = (item.originalPrice - item.finalPrice) * item.qty;
                if (!saleDiscounts[saleIdStr]) {
                    saleDiscounts[saleIdStr] = { count: 0, discount: 0 };
                }
                saleDiscounts[saleIdStr].count += 1;
                saleDiscounts[saleIdStr].discount += discount;
            }
        }
        
        for (const [saleId, data] of Object.entries(saleDiscounts)) {
            await Sale.findByIdAndUpdate(saleId, {
                $inc: {
                    usageCount: data.count,
                    revenueGenerated: data.discount
                }
            });
        }
        
        const couponCodes = {};
        for (const item of order.orderItems) {
            if (item.appliedCouponCode) {
                const code = String(item.appliedCouponCode).toUpperCase();
                couponCodes[code] = true;
            }
        }
        
        const couponCodeList = Object.keys(couponCodes);
        if (couponCodeList.length > 0) {
            const totalSaleDiscount = Object.values(saleDiscounts).reduce((sum, d) => sum + d.discount, 0);
            const couponDiscount = Math.max(0, order.discountTotal - totalSaleDiscount);
            
            for (const code of couponCodeList) {
                await Coupon.findOneAndUpdate({ code }, {
                    $inc: {
                        usageCount: 1,
                        revenueGenerated: couponDiscount
                    }
                });
            }
        }
    } catch (err) {
        console.error('Failed to record promotional metrics:', err);
    }
};

let _stripe;
const getStripe = () => {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return _stripe;
};

const createOrderFromBody = async (req, res, extras = {}) => {
    try {
        const promoCode = req.body.promoCode || '';
        const priced = await buildPricedOrder(req.body.orderItems, promoCode);
        const order = new Order({
            orderItems: priced.orderItems,
            user: req.user._id,
            shippingAddress: req.body.shippingAddress,
            paymentMethod: req.body.paymentMethod || extras.paymentMethod || 'COD cash on delivery',
            paymentStatus: 'Pending',
            orderSource: extras.orderSource || 'Web',
            phoneNumber: req.body.shippingAddress?.phone || '',
            subtotal: priced.subtotal,
            discountTotal: priced.discountTotal,
            taxPrice: priced.taxPrice,
            shippingPrice: priced.shippingPrice,
            totalPrice: priced.totalPrice,
            status: 'pending',
        });

        const createdOrder = await order.save();
        
        // COD orders can increment promotion usage immediately since they don't depend on Stripe callbacks
        if (order.paymentMethod !== 'Card') {
            await recordPromotionalMetrics(createdOrder);
        }

        await createdOrder.populate('user', 'name email');
        await sendOrderConfirmation(createdOrder, createdOrder.user?.email, createdOrder.user?.name);
        return createdOrder;
    } catch (err) {
        const status = err.message?.includes('stock') || err.message?.includes('available') || err.message?.includes('promo') || err.message?.includes('Promo') || err.message?.includes('coupon') || err.message?.includes('Coupon') || err.message?.includes('Invalid') || err.message?.includes('expired') ? 400 : 500;
        res.status(status).json({ message: err.message || 'Could not create order' });
        return null;
    }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
    const createdOrder = await createOrderFromBody(req, res);
    if (createdOrder) {
        res.status(201).json(createdOrder);
    }
});

// @desc    Create new order via WhatsApp
// @route   POST /api/orders/whatsapp
// @access  Private
router.post('/whatsapp', protect, async (req, res) => {
    const createdOrder = await createOrderFromBody(req, res, {
        paymentMethod: req.body.paymentMethod || 'COD cash on delivery',
        orderSource: 'WhatsApp',
    });
    if (createdOrder) {
        res.status(201).json({ orderId: createdOrder._id });
    }
});

// @desc    Create Stripe Checkout Session
// @route   POST /api/orders/stripe-checkout
// @access  Private
router.post('/stripe-checkout', protect, async (req, res) => {
    try {
        const promoCode = req.body.promoCode || '';
        const priced = await buildPricedOrder(req.body.orderItems, promoCode);

        const order = new Order({
            orderItems: priced.orderItems,
            user: req.user._id,
            shippingAddress: req.body.shippingAddress,
            paymentMethod: 'Card',
            paymentStatus: 'Pending',
            orderSource: req.body.orderSource || 'Web',
            phoneNumber: req.body.shippingAddress?.phone || '',
            subtotal: priced.subtotal,
            discountTotal: priced.discountTotal,
            taxPrice: priced.taxPrice,
            shippingPrice: priced.shippingPrice,
            totalPrice: priced.totalPrice,
            status: 'pending',
        });

        const createdOrder = await order.save();

        const line_items = priced.orderItems.map((item) => ({
            price_data: {
                currency: 'pkr',
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.qty,
        }));

        if (priced.shippingPrice > 0) {
            line_items.push({
                price_data: {
                    currency: 'pkr',
                    product_data: { name: 'Shipping' },
                    unit_amount: Math.round(priced.shippingPrice * 100),
                },
                quantity: 1,
            });
        }

        if (priced.taxPrice > 0) {
            line_items.push({
                price_data: {
                    currency: 'pkr',
                    product_data: { name: 'Tax' },
                    unit_amount: Math.round(priced.taxPrice * 100),
                },
                quantity: 1,
            });
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${FRONTEND_URL}/payment-success?order_id=${createdOrder._id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/checkout?cancelled=true`,
            metadata: {
                orderId: createdOrder._id.toString(),
                userId: req.user._id.toString(),
            },
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Error:', error);
        const status = error.message?.includes('stock') || error.message?.includes('promo') || error.message?.includes('Promo') || error.message?.includes('coupon') || error.message?.includes('Coupon') ? 400 : 500;
        res.status(status).json({ message: safeErrorMessage(error, 'Payment gateway error') });
    }
});

// @desc    Confirm Stripe Payment Success
// @route   POST /api/orders/stripe-success
// @access  Private
router.post('/stripe-success', protect, async (req, res) => {
    const { session_id, order_id } = req.body;

    if (!session_id || !order_id) {
        return res.status(400).json({ message: 'session_id and order_id are required' });
    }

    try {
        const session = await getStripe().checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Payment not successful' });
        }

        const metadataOrderId = session.metadata?.orderId;
        if (!metadataOrderId || metadataOrderId !== String(order_id)) {
            return res.status(400).json({ message: 'Payment session does not match this order' });
        }

        if (session.metadata?.userId && session.metadata.userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this order' });
        }

        const order = await Order.findById(order_id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this order' });
        }

        if (order.isPaid) {
            return res.json(order);
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = 'Paid';
        order.paymentResult = {
            id: session.id,
            status: session.payment_status,
            update_time: new Date().toISOString(),
            email_address: session.customer_details?.email || '',
        };
        const updatedOrder = await order.save();
        
        // Stripe payment was successful, increment metrics now
        await recordPromotionalMetrics(updatedOrder);

        await updatedOrder.populate('user', 'name email');
        await sendOrderConfirmation(updatedOrder, updatedOrder.user?.email, updatedOrder.user?.name);
        res.json(updatedOrder);
    } catch (error) {
        console.error('Stripe Verify Error:', error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdminUser = req.user.isAdmin || req.user.role === 'superadmin' || req.user.role === 'manager';

    if (!isOwner && !isAdminUser) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
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
            const oldStatus = order.status;
            order.status = req.body.status || order.status;
            if (req.body.trackingNumber) {
                order.trackingNumber = req.body.trackingNumber;
            }

            if (req.body.status === 'delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }

            const updatedOrder = await order.save();
            await updatedOrder.populate('user', 'name email');

            if (oldStatus !== updatedOrder.status) {
                await sendOrderStatusUpdate(updatedOrder, updatedOrder.user?.email, updatedOrder.user?.name, updatedOrder.status);
            }

            const customerPhone = updatedOrder.phoneNumber || updatedOrder.shippingAddress?.phone;
            if (updatedOrder.orderSource === 'WhatsApp' && customerPhone) {
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
                    message += `We're sorry to inform you that your order *#${shortOrderId}* has been cancelled. 🚫`;
                }

                const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
                if (validStatuses.includes(req.body.status)) {
                    try {
                        await sendWhatsAppMessage(customerPhone, message);
                    } catch (err) {
                        console.error('[WhatsApp Bot] Failed to send message:', err);
                    }
                }
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
