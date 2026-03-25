import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luxury-ecommerce');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'luxury-ecommerce/products',
            resource_type: 'auto'
        });
        return result.secure_url;
    } catch (error) {
        console.error(`Cloudinary Upload Error for ${localFilePath}:`, error.message);
        return null;
    }
};

const mapLocalPathToAbsolutePath = (localUrl) => {
    if (!localUrl || localUrl.startsWith('http') || localUrl.startsWith('https') || localUrl.startsWith('/images/')) {
        return null; // Already a full URL, relative generic asset, or empty
    }

    // Normalize path (e.g. /uploads/image.png)
    const normalized = localUrl.replace(/\\/g, '/');
    const filename = normalized.split('/').pop();

    const absolutePath = path.resolve(__dirname, '../uploads', filename);
    if (fs.existsSync(absolutePath)) {
        return absolutePath;
    }
    return null;
};

const migrateImages = async () => {
    await connectDB();

    console.log('--- Starting Products Migration ---');
    const products = await Product.find({});
    let productUpdates = 0;

    for (let product of products) {
        let changed = false;
        const newImages = [];

        // Migrate main images
        for (let img of product.images) {
            const localPath = mapLocalPathToAbsolutePath(img);
            if (localPath) {
                console.log(`Uploading ${localPath} for Product ${product.name}...`);
                const cloudUrl = await uploadToCloudinary(localPath);
                if (cloudUrl) {
                    newImages.push(cloudUrl);
                    changed = true;
                } else {
                    newImages.push(img); // keep original if upload failed
                }
            } else {
                newImages.push(img); // keep original if already online or missing
            }
        }
        product.images = newImages;

        // Migrate variation images
        if (product.variations && product.variations.length > 0) {
            for (let v = 0; v < product.variations.length; v++) {
                const variation = product.variations[v];
                if (variation.options && variation.options.length > 0) {
                    for (let o = 0; o < variation.options.length; o++) {
                        const option = variation.options[o];
                        if (option.image) {
                            const localPath = mapLocalPathToAbsolutePath(option.image);
                            if (localPath) {
                                console.log(`Uploading variation image ${localPath} for Product ${product.name}...`);
                                const cloudUrl = await uploadToCloudinary(localPath);
                                if (cloudUrl) {
                                    product.variations[v].options[o].image = cloudUrl;
                                    changed = true;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (changed) {
            await product.save();
            console.log(`Updated Product: ${product.name}`);
            productUpdates++;
        }
    }
    console.log(`Finished Products. Updated ${productUpdates} products.`);

    console.log('--- Starting Categories Migration ---');
    const categories = await Category.find({});
    let catUpdates = 0;
    for (let cat of categories) {
        if (cat.image) {
            const localPath = mapLocalPathToAbsolutePath(cat.image);
            if (localPath) {
                console.log(`Uploading ${localPath} for Category ${cat.name}...`);
                const cloudUrl = await uploadToCloudinary(localPath);
                if (cloudUrl) {
                    cat.image = cloudUrl;
                    await cat.save();
                    console.log(`Updated Category: ${cat.name}`);
                    catUpdates++;
                }
            }
        }
    }
    console.log(`Finished Categories. Updated ${catUpdates} categories.`);

    console.log('--- Starting SubCategories Migration ---');
    const subCategories = await SubCategory.find({});
    let subUpdates = 0;
    for (let sub of subCategories) {
        if (sub.image) {
            const localPath = mapLocalPathToAbsolutePath(sub.image);
            if (localPath) {
                console.log(`Uploading ${localPath} for SubCategory ${sub.name}...`);
                const cloudUrl = await uploadToCloudinary(localPath);
                if (cloudUrl) {
                    sub.image = cloudUrl;
                    await sub.save();
                    console.log(`Updated SubCategory: ${sub.name}`);
                    subUpdates++;
                }
            }
        }
    }
    console.log(`Finished SubCategories. Updated ${subUpdates} subcategories.`);

    console.log('--- Migration Complete ---');
    process.exit(0);
};

migrateImages();
