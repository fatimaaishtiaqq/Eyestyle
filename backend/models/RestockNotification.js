import mongoose from 'mongoose';

const restockNotificationSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    email: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    notified: {
        type: Boolean,
        default: false
    },
    notifiedAt: {
        type: Date
    }
}, { timestamps: true });

const RestockNotification = mongoose.model('RestockNotification', restockNotificationSchema);
export default RestockNotification;
