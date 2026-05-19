import express from 'express';
import Coupon from '../models/Coupon.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { buildPricedOrder } from '../utils/orderPricing.js';

const router = express.Router();

// Helper to compute dynamic status based on dates
const getDynamicStatus = (coupon) => {
    if (coupon.status === 'cancelled') return 'cancelled';
    const now = new Date();
    if (now < new Date(coupon.startDate)) return 'scheduled';
    if (now > new Date(coupon.endDate)) return 'expired';
    return 'active';
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const coupons = await Coupon.find({})
            .populate('productIds', 'name price image images')
            .sort({ createdAt: -1 });

        const updatedCoupons = [];
        for (const coupon of coupons) {
            const calculatedStatus = getDynamicStatus(coupon);
            if (coupon.status !== calculatedStatus) {
                coupon.status = calculatedStatus;
                await coupon.save();
            }
            updatedCoupons.push(coupon);
        }

        res.json(updatedCoupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { code, discountType, discountValue, startDate, endDate, usageLimit, minimumOrderAmount, appliesTo, productIds } = req.body;

        if (!code || !discountType || discountValue === undefined || !startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Validate code format (letters, numbers allowed, no special chars)
        if (!/^[a-zA-Z0-9]+$/.test(code)) {
            return res.status(400).json({ message: 'Promo code can only contain alphanumeric characters' });
        }

        const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
        if (couponExists) {
            return res.status(400).json({ message: 'A coupon with this promo code already exists' });
        }

        if (discountType === 'percentage' && (discountValue < 1 || discountValue > 90)) {
            return res.status(400).json({ message: 'Percentage discount must be between 1% and 90%' });
        }

        if (discountType === 'fixed' && discountValue <= 0) {
            return res.status(400).json({ message: 'Fixed discount value must be greater than 0' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const now = new Date();
        let initialStatus = 'scheduled';
        if (now >= start && now <= end) {
            initialStatus = 'active';
        } else if (now > end) {
            initialStatus = 'expired';
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            startDate: start,
            endDate: end,
            usageLimit: usageLimit !== undefined ? usageLimit : null,
            minimumOrderAmount: minimumOrderAmount || 0,
            appliesTo,
            productIds: appliesTo === 'selectedProducts' ? productIds : [],
            status: initialStatus
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Validate coupon for checkout
// @route   POST /api/coupons/validate
// @access  Public
router.post('/validate', async (req, res) => {
    try {
        const { code, orderItems } = req.body;

        if (!code || !code.trim()) {
            return res.status(400).json({ message: 'Please enter a promo code' });
        }

        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ message: 'Cart items are required to validate promo code' });
        }

        // Run pricing calculations authoritatively to check eligibility and coupon values
        const priced = await buildPricedOrder(orderItems, code);
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        // Calculate direct coupon contribution
        // Total discount minus the active sale discounts
        const totalItemsSaleSubtotal = priced.orderItems.reduce((sum, item) => {
            // Recompute sale price before coupon discount:
            // Since buildPricedOrder distributes coupon proportionally,
            // let's isolate the discount.
            // Wait, we can find the active sale price of the item directly.
            // If item has appliedSaleId, let's find the saleUnitPrice.
            // Alternatively, a simpler way is to run buildPricedOrder WITHOUT a promo code
            // and compare the itemsPrice!
            return sum;
        }, 0);

        const basePriced = await buildPricedOrder(orderItems, '');
        const couponDiscountTotal = +(basePriced.itemsPrice - priced.itemsPrice).toFixed(2);

        res.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: couponDiscountTotal,
            minimumOrderAmount: coupon.minimumOrderAmount,
            taxPrice: priced.taxPrice,
            shippingPrice: priced.shippingPrice,
            totalPrice: priced.totalPrice
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Cancel a coupon
// @route   PATCH /api/coupons/:id/cancel
// @access  Private/Admin
router.patch('/:id/cancel', protect, admin, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        if (coupon.status === 'expired') {
            return res.status(400).json({ message: 'Cannot cancel an expired coupon' });
        }

        coupon.status = 'cancelled';
        coupon.isActive = false;
        const updatedCoupon = await coupon.save();
        res.json(updatedCoupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        await coupon.deleteOne();
        res.json({ message: 'Promo code successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
