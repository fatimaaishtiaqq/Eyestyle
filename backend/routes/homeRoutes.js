import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import { applyActiveSalesToProducts, normalizeProductVariationsForResponse } from './productRoutes.js';

const router = express.Router();

// @desc    Get data for storefront home page
// @route   GET /api/home-data
// @access  Public
router.get('/', async (req, res) => {
    try {
        const now = new Date();

        // 1. Fetch active parent categories
        const categories = await Category.find({ isActive: { $ne: false }, parent: null })
            .select('name slug image _id')
            .lean();

        // 2. Fetch the current active sale campaign
        const activeSale = await Sale.findOne({
            startDate: { $lte: now },
            endDate: { $gte: now },
            status: { $ne: 'cancelled' }
        })
            .select('name discountType discountValue terms appliesTo')
            .lean();

        // 3. Fetch 8 newest active products
        const products = await Product.find({ isActive: { $ne: false } })
            .select('name price images category subcategory countInStock rating numReviews frameShape lensType brand description variations variationImages')
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();

        // Normalize variations and apply active sale discounts
        const normalizedProducts = products.map(p => normalizeProductVariationsForResponse(p));
        const decoratedProducts = await applyActiveSalesToProducts(normalizedProducts);

        // Project only the fields needed by storefront home
        const featuredProducts = decoratedProducts.map(p => ({
            _id: p._id,
            name: p.name,
            price: p.price,
            images: p.images,
            category: p.category,
            subcategory: p.subcategory,
            countInStock: p.countInStock,
            rating: p.rating,
            numReviews: p.numReviews,
            frameShape: p.frameShape,
            lensType: p.lensType,
            brand: p.brand,
            description: p.description,
            salePrice: p.salePrice || null,
            activeSale: p.activeSale || null,
            variations: p.variations || []
        }));

        // Set cache control for performance
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

        res.json({
            categories,
            featuredProducts,
            activeSale
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
});

export default router;
