import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true }, // will act as the final price paid for the item
            originalPrice: { type: Number, required: true, default: 0 },
            finalPrice: { type: Number, required: true, default: 0 },
            discountAmount: { type: Number, required: true, default: 0 },
            appliedSaleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
            appliedCouponCode: { type: String, default: '' },
            product: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
            variations: { type: mongoose.Schema.Types.Mixed, default: {} }
        }
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String }
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Cancelled'], default: 'Pending' },
    orderSource: { type: String, enum: ['Web', 'WhatsApp'], default: 'Web' },
    phoneNumber: { type: String },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String },
    },
    subtotal: { type: Number, required: true, default: 0.0 },
    discountTotal: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 }, // this is the finalTotal
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;

