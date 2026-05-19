import mongoose from 'mongoose';

const couponSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed']
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usageCount: {
        type: Number,
        required: true,
        default: 0
    },
    minimumOrderAmount: {
        type: Number,
        default: 0
    },
    appliesTo: {
        type: String,
        required: true,
        enum: ['all', 'selectedProducts'],
        default: 'all'
    },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        required: true,
        enum: ['scheduled', 'active', 'expired', 'cancelled'],
        default: 'scheduled'
    },
    revenueGenerated: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
