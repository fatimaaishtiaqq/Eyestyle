import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    verifiedPurchase: {
        type: Boolean,
        default: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isRejected: {
        type: Boolean,
        default: false
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    reviewImages: [{
        type: String
    }],
    adminReply: {
        type: String,
        default: ''
    },
    adminReplyAt: {
        type: Date
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Prevent a user from leaving multiple reviews for a single product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
