import mongoose from 'mongoose';

const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

subCategorySchema.index({ category: 1, slug: 1 }, { unique: true });

const SubCategory = mongoose.model('SubCategory', subCategorySchema);
export default SubCategory;
