import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema({
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });

// Option level: value (e.g. "Red") and optional image
const variationOptionSchema = mongoose.Schema({
    value: { type: String, required: true },
    image: { type: String, default: null }
}, { _id: false });

// Variation: name, includeImages flag, options array
const variationSchema = mongoose.Schema({
    name: { type: String, required: true },
    includeImages: { type: Boolean, default: false },
    options: [variationOptionSchema]
}, { _id: false });

const productSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    images: [{ type: String }],
    brand: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: false },
    description: { type: String, required: true },
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    variations: [variationSchema],
    details: [String],
    fabric: { type: String },
    frameShape: { type: String },
    lensType: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
