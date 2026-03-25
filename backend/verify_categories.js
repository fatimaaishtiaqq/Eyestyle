import connectDB from './config/db.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const verify = async () => {
    await connectDB();
    const categories = await Category.find({ name: { $in: ['WOMEN', 'TEEN', 'KIDS', 'Sunglasses', 'Metal Frame'] } });
    console.log("Category Images Verification:");
    categories.forEach(c => console.log(`- ${c.name}: ${c.image}`));
    process.exit(0);
};

verify();
