import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure slugs are unique ONLY within the same parent category. 
// This allows 'oval-sunglasses' under 'men' and 'oval-sunglasses' under 'women'.
categorySchema.index({ parent: 1, slug: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
