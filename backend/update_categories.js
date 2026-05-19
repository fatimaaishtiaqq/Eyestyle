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

const Category = mongoose.model('Category_Temp2', categorySchema, 'categories');

const updates = [
    { name: 'WOMEN', image: '/images/categories/women.png' },
    { name: 'TEEN', image: '/images/categories/teen.png' },
    { name: 'KIDS', image: '/images/categories/kids.png' },
    { name: 'Sunglasses', image: '/images/categories/sunglasses.png' },
    { name: 'Metal Frame', image: '/images/categories/metal_frame.png' }
];

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required. Set it in backend/.env');
    process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to DB, applying updates...");
        for (const update of updates) {
            const result = await Category.updateOne(
                { name: update.name },
                { $set: { image: update.image } }
            );
            console.log(`Updated ${update.name}: Modified ${result.modifiedCount} document(s)`);
        }
        console.log("Migration complete.");
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
