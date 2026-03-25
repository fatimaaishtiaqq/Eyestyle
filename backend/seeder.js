import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Category from './models/Category.js';
import SubCategory from './models/SubCategory.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import categories from './data/categories.js';
import subcategories from './data/subcategories.js';
import products from './data/products.js';

dotenv.config();

const toSlug = (name) => (name || '').toLowerCase().replace(/[\s_]+/g, '-');

const importData = async () => {
    try {
        await connectDB();

        await Order.deleteMany();
        await Product.deleteMany();
        await SubCategory.deleteMany();
        await Category.deleteMany();
        await User.deleteMany();

        // 1. Seed categories (top-level only, no parent)
        const createdCategories = await Category.insertMany(
            categories.map((c) => ({ name: c.name, slug: c.slug, description: c.description || '', isActive: true }))
        );
        const categoryBySlug = {};
        createdCategories.forEach((cat) => { categoryBySlug[cat.slug] = cat._id; });

        // 2. Seed subcategories (each references parent category by ObjectId)
        const subcategoryDocs = subcategories.map((s) => {
            const categoryId = categoryBySlug[s.categorySlug];
            if (!categoryId) throw new Error(`Category slug "${s.categorySlug}" not found for subcategory "${s.name}"`);
            return {
                name: s.name,
                slug: toSlug(s.name),
                category: categoryId,
                isActive: true,
            };
        });
        const createdSubCategories = await SubCategory.insertMany(subcategoryDocs);
        const subcategoryByKey = {};
        createdSubCategories.forEach((sub) => {
            const catSlug = createdCategories.find((c) => c._id.equals(sub.category))?.slug;
            if (catSlug) subcategoryByKey[`${catSlug}:${sub.slug}`] = sub._id;
        });

        // 3. Seed users
        const createdUsers = await User.create([
            { name: 'Admin User', email: 'admin@example.com', password: '123456', role: 'superadmin', status: 'active' },
            { name: 'John Doe', email: 'john@example.com', password: '123456', role: 'customer', status: 'active' },
        ]);
        const adminUserId = createdUsers[0]._id;

        // 4. Seed products: category and subcategory must be ObjectIds (no strings)
        const productDocs = products.map((p) => {
            const categoryId = categoryBySlug[p.categorySlug];
            if (!categoryId) throw new Error(`Category slug "${p.categorySlug}" not found for product "${p.name}"`);
            let subcategoryId = null;
            if (p.subcategorySlug) {
                subcategoryId = subcategoryByKey[`${p.categorySlug}:${p.subcategorySlug}`] || null;
            }
            return {
                name: p.name,
                images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
                description: p.description || '',
                brand: p.brand || 'EYESTYLE',
                category: categoryId,
                subcategory: subcategoryId,
                price: p.price || 0,
                countInStock: p.countInStock != null ? p.countInStock : 0,
                rating: p.rating || 0,
                numReviews: p.numReviews || 0,
                details: p.details || [],
                fabric: p.fabric || '',
                user: adminUserId,
                variations: [],
            };
        });
        await Product.insertMany(productDocs);

        console.log('Data imported: categories, subcategories, users, products.');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        await Order.deleteMany();
        await Product.deleteMany();
        await SubCategory.deleteMany();
        await Category.deleteMany();
        await User.deleteMany();
        console.log('Data destroyed.');
        process.exit(0);
    } catch (error) {
        console.error('Destroy error:', error);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
