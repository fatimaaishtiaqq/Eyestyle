import mongoose from 'mongoose';
import Order from './models/Order.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const user = await User.findOne({ isAdmin: true });
        if (!user) throw new Error("No admin user found");

        await Order.create({
            user: user._id,
            orderItems: [{
                name: "Test Item",
                qty: 1,
                image: "http://example.com/test.jpg",
                price: 100,
                product: new mongoose.Types.ObjectId()
            }],
            shippingAddress: {
                address: "123 Test St",
                city: "Test City",
                postalCode: "12345",
                country: "TestCountry"
            },
            paymentMethod: "PayPal",
            taxPrice: 10,
            shippingPrice: 5,
            totalPrice: 115,
            status: "pending"
        });
        console.log("Mock order created");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}).catch(console.error);
