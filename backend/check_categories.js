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

mongoose.connect(process.env.MONGO_URI || "mongodb://mahboobali5961_db_user:XEunjXxRaozMw9j6@ac-p7onjpp-shard-00-00.p0zawgs.mongodb.net:27017,ac-p7onjpp-shard-00-01.p0zawgs.mongodb.net:27017,ac-p7onjpp-shard-00-02.p0zawgs.mongodb.net:27017/ecommerceDB?ssl=true&replicaSet=atlas-915jqg-shard-0&authSource=admin&retryWrites=true&w=majority")
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
