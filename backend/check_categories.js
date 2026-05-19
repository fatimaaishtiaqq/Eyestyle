import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Category = mongoose.model('Category_Temp', categorySchema, 'categories');

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required. Set it in backend/.env');
    process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    const categories = await Category.find({});
    const noImages = categories.filter(c => !c.image);
    console.log("Categories missing images:");
    noImages.forEach(c => console.log(`- ID: ${c._id}, Name: ${c.name}`));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
