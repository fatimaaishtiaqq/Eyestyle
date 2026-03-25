import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Category from './models/Category.js';

dotenv.config();

const updateImages = async () => {
    try {
        console.log('Connecting to database...');
        await connectDB();

        const updates = [
            { name: 'WOMEN', image: '/images/categories/women.png' },
            { name: 'TEEN', image: '/images/categories/teen.png' },
            { name: 'KIDS', image: '/images/categories/kids.png' },
            { name: 'Sunglasses', image: '/images/categories/sunglasses.png' },
            { name: 'Metal Frame', image: '/images/categories/metal-frame.png' }
        ];

        for (const update of updates) {
            const result = await Category.findOneAndUpdate(
                { name: new RegExp('^' + update.name + '$', 'i') },
                { image: update.image },
                { new: true }
            );
            if (result) {
                console.log(`Updated ${update.name} with image ${update.image}`);
            } else {
                console.log(`Category ${update.name} not found`);
            }
        }
        console.log('All image updates completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating images:', error);
        process.exit(1);
    }
};

updateImages();
