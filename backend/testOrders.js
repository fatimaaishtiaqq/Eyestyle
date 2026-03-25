import mongoose from 'mongoose';
import Order from './models/Order.js';
import User from './models/User.js';
import Product from './models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const orders = await Order.find({}).populate('user', 'id name email').lean();
        console.log("Found orders:", orders.length);
        console.log(JSON.stringify(orders, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}).catch(console.error);
