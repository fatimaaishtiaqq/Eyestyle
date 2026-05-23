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

// --- Performance Indexes ---
// Speeds up category/subcategory filtering + sort by newest
productSchema.index({ category: 1, createdAt: -1 });
// Speeds up frame shape + lens type combined filter
productSchema.index({ frameShape: 1, lensType: 1 });
// Speeds up isActive filter used across all public queries
productSchema.index({ isActive: 1 });
// Speeds up price range filter
productSchema.index({ price: 1 });
// Speeds up subcategory filter
productSchema.index({ subcategory: 1 });
// Full-text index for keyword search — replaces slow $regex on name
productSchema.index({ name: 'text', brand: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
