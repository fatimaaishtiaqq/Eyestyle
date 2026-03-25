import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const updateAdmin = async () => {
    try {
        await connectDB();

        const result = await User.updateOne(
            { email: 'admin@example.com' },
            { $set: { role: 'superadmin' } }
        );

        console.log(`Updated documents: ${result.modifiedCount}`);
        process.exit();
    } catch (error) {
        console.error(`Error updating admin: ${error}`);
        process.exit(1);
    }
};

updateAdmin();
