/**
 * One-time migration: replace string category/subcategory on products with ObjectIds.
 * Run: node scripts/migrateProductCategories.js
 * Requires: Category and SubCategory collections populated; products may have legacy string category/subcategory.
 */
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

dotenv.config();

const toSlug = (s) => (s || '').toLowerCase().replace(/[\s_]+/g, '-');

const migrate = async () => {
    await connectDB();

    const categories = await Category.find({}).lean();
    const categoryBySlug = {};
    const categoryByName = {};
    categories.forEach((c) => {
        categoryBySlug[c.slug] = c._id;
        categoryByName[c.name.toLowerCase()] = c._id;
    });

    const subcategories = await SubCategory.find({}).populate('category').lean();
    const subByKey = {};
    subcategories.forEach((s) => {
        const catSlug = s.category?.slug;
        if (catSlug) subByKey[`${catSlug}:${s.slug}`] = s._id;
        subByKey[s.slug] = s._id;
    });

    const products = await Product.find({}).lean();
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of products) {
        const update = {};
        let needUpdate = false;

        if (doc.category) {
            if (typeof doc.category === 'string') {
                const slug = toSlug(doc.category);
                const id = categoryBySlug[slug] || categoryByName[doc.category.toLowerCase()];
                if (id) {
                    update.category = id;
                    needUpdate = true;
                } else {
                    console.warn(`Product ${doc._id} (${doc.name}): category "${doc.category}" not found`);
                    failed++;
                }
            }
        }

        if (doc.subcategory != null && doc.subcategory !== '') {
            if (typeof doc.subcategory === 'string') {
                const subSlug = toSlug(doc.subcategory);
                let subId = subByKey[subSlug];
                if (!subId && update.category) {
                    const cat = categories.find((c) => c._id.equals(update.category));
                    if (cat) subId = subByKey[`${cat.slug}:${subSlug}`];
                }
                if (subId) {
                    update.subcategory = subId;
                    needUpdate = true;
                } else {
                    update.subcategory = null;
                    needUpdate = true;
                }
            }
        }

        if (needUpdate) {
            await Product.updateOne({ _id: doc._id }, { $set: update });
            updated++;
        } else {
            skipped++;
        }
    }

    console.log(`Migration done. Updated: ${updated}, Skipped: ${skipped}, Failed resolve: ${failed}`);
    process.exit(0);
};

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});
