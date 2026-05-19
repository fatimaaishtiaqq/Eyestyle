import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: Recalculate average rating & numReviews on Product model
const recalculateProductRating = async (productId) => {
    try {
        const approvedReviews = await Review.find({ productId, isApproved: true });
        const numReviews = approvedReviews.length;
        const rating = numReviews > 0
            ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / numReviews
            : 0;

        await Product.findByIdAndUpdate(productId, { 
            rating: Number(rating.toFixed(1)), 
            numReviews 
        });
    } catch (err) {
        console.error('Error recalculating product rating:', err);
    }
};

// @desc    Get public approved reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ 
            productId: req.params.productId, 
            isApproved: true 
        }).sort({ createdAt: -1 });
        
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server Error loading reviews' });
    }
});

// @desc    Get review eligibility for logged-in user and product
// @route   GET /api/reviews/eligibility/:productId
// @access  Private
router.get('/eligibility/:productId', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        // 1. Check if user already reviewed this product
        const alreadyReviewed = await Review.findOne({ productId, userId });

        // 2. Check if user purchased this product in a "delivered" order
        const orders = await Order.find({ 
            user: userId, 
            $or: [
                { status: 'delivered' },
                { isDelivered: true }
            ]
        });

        let purchased = false;
        let orderId = null;

        for (const order of orders) {
            const hasProduct = order.orderItems.some(
                item => item.product.toString() === productId
            );
            if (hasProduct) {
                purchased = true;
                orderId = order._id;
                break;
            }
        }

        res.json({
            eligible: purchased,
            alreadyReviewed: !!alreadyReviewed,
            existingReview: alreadyReviewed || null,
            orderId
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error checking eligibility' });
    }
});

// @desc    Submit a review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { productId, rating, comment, reviewImages } = req.body;
        const userId = req.user._id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Please provide a rating between 1 and 5' });
        }
        if (!comment || comment.trim() === '') {
            return res.status(400).json({ message: 'Please provide a review comment' });
        }

        // Sanitize review comment by escaping simple HTML tags
        const sanitizedComment = comment
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        // Check eligibility (DO NOT trust frontend)
        const orders = await Order.find({ 
            user: userId, 
            $or: [
                { status: 'delivered' },
                { isDelivered: true }
            ]
        });
        let purchased = false;
        let orderId = null;

        for (const order of orders) {
            const hasProduct = order.orderItems.some(
                item => item.product.toString() === productId
            );
            if (hasProduct) {
                purchased = true;
                orderId = order._id;
                break;
            }
        }

        if (!purchased) {
            return res.status(403).json({ message: 'Only verified buyers can review this product.' });
        }

        // Check duplicate
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }

        const review = new Review({
            productId,
            userId,
            orderId,
            rating,
            comment: sanitizedComment,
            userName: req.user.name,
            reviewImages: Array.isArray(reviewImages) ? reviewImages : [],
            verifiedPurchase: true,
            isApproved: false // Requires admin approval by default
        });

        const createdReview = await review.save();
        res.status(201).json({
            message: 'Your review has been submitted and is waiting for admin approval.',
            review: createdReview
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }
        res.status(500).json({ message: error.message || 'Server Error submitting review' });
    }
});

// @desc    Update user's own review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const { rating, comment, reviewImages } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to edit this review' });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ message: 'Please provide a rating between 1 and 5' });
        }

        // Sanitize review comment
        if (comment) {
            review.comment = comment
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        }

        if (rating) review.rating = rating;
        if (reviewImages) review.reviewImages = reviewImages;

        // Reset approval/rejection flags for admin to review again
        const wasApproved = review.isApproved;
        review.isApproved = false;
        review.isRejected = false;
        review.rejectionReason = '';

        const updatedReview = await review.save();

        // If it was approved, recalculate now since it's hidden/pending again
        if (wasApproved) {
            await recalculateProductRating(review.productId);
        }

        res.json({
            message: 'Your review has been updated and is waiting for re-approval.',
            review: updatedReview
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error updating review' });
    }
});

// @desc    Admin: Get all reviews
// @route   GET /api/reviews/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        // Find all reviews and populate product name/images
        const reviews = await Review.find({})
            .populate('productId', 'name images')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server Error loading reviews for admin' });
    }
});

// @desc    Admin: Approve review
// @route   PATCH /api/reviews/admin/:id/approve
// @access  Private/Admin
router.patch('/admin/:id/approve', protect, admin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.isApproved = true;
        review.isRejected = false;
        review.rejectionReason = '';

        await review.save();
        await recalculateProductRating(review.productId);

        res.json({ message: 'Review approved successfully', review });
    } catch (error) {
        res.status(500).json({ message: 'Server Error approving review' });
    }
});

// @desc    Admin: Reject review
// @route   PATCH /api/reviews/admin/:id/reject
// @access  Private/Admin
router.patch('/admin/:id/reject', protect, admin, async (req, res) => {
    try {
        const { reason } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const wasApproved = review.isApproved;

        review.isApproved = false;
        review.isRejected = true;
        review.rejectionReason = reason || 'Does not meet review guidelines.';

        await review.save();

        if (wasApproved) {
            await recalculateProductRating(review.productId);
        }

        res.json({ message: 'Review rejected successfully', review });
    } catch (error) {
        res.status(500).json({ message: 'Server Error rejecting review' });
    }
});

// @desc    Admin: Add or edit admin reply to a review
// @route   PATCH /api/reviews/admin/:id/reply
// @access  Private/Admin
router.patch('/admin/:id/reply', protect, admin, async (req, res) => {
    try {
        const { reply } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.adminReply = reply;
        review.adminReplyAt = reply ? Date.now() : null;

        await review.save();

        res.json({ message: 'Admin reply updated successfully', review });
    } catch (error) {
        res.status(500).json({ message: 'Server Error replying to review' });
    }
});

// @desc    Admin: Delete review
// @route   DELETE /api/reviews/admin/:id
// @access  Private/Admin
router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const productId = review.productId;
        const wasApproved = review.isApproved;

        await review.deleteOne();

        if (wasApproved) {
            await recalculateProductRating(productId);
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error deleting review' });
    }
});

export default router;
