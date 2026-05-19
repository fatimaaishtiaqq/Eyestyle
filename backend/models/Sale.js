import mongoose from 'mongoose';

const saleSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['sale', 'coupon'],
        default: 'sale'
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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    terms: {
        type: String,
        maxLength: 500,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['scheduled', 'active', 'expired', 'cancelled'],
        default: 'scheduled'
    },
    usageCount: {
        type: Number,
        required: true,
        default: 0
    },
    revenueGenerated: {
        type: Number,
        required: true,
        default: 0
    },
    emailsSent: {
        type: String,
        default: 'N/A'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Method or pre-find/post-init helper to dynamic update status if needed
// However, checking dates dynamically on query is more elegant.

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
