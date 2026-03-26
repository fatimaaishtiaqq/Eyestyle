import mongoose from 'mongoose';

const settingSchema = mongoose.Schema({
    taxRate: {
        type: Number,
        required: true,
        default: 10
    },
    freeShippingThreshold: {
        type: Number,
        required: true,
        default: 200
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 15
    },
    storeName: {
        type: String,
        required: true,
        default: 'EYESTYLE Luxury'
    },
    supportEmail: {
        type: String,
        required: true,
        default: 'support@eyestyle.com'
    },
    maintenanceMode: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    timestamps: true
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
