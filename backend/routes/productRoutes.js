import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import RestockNotification from '../models/RestockNotification.js';
import { sendRestockNotification } from '../utils/emailService.js';
import { escapeRegex } from '../utils/security.js';

const router = express.Router();

const isValidObjectId = (v) => v && mongoose.Types.ObjectId.isValid(v) && String(v).length === 24;

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const pageSize = 12;
        const page = Number(req.query.pageNumber) || 1;

        // Filtering logic
        const keyword = req.query.keyword ? {
            name: {
                $regex: escapeRegex(req.query.keyword),
                $options: 'i',
            }
        } : {};

        // Category filter
        const category = req.query.category ? { category: req.query.category } : {};

        // Frame Shape & Lens Type & Price Filters
        const frameShapeFilter = req.query.frameShape ? { frameShape: { $regex: escapeRegex(req.query.frameShape), $options: 'i' } } : {};
        const lensTypeFilter = req.query.lensType ? { lensType: { $regex: escapeRegex(req.query.lensType), $options: 'i' } } : {};
        const priceFilter = req.query.price ? { price: { $lt: Number(req.query.price) } } : {};

        const combinedFilters = { ...keyword, ...category, ...frameShapeFilter, ...lensTypeFilter, ...priceFilter };

        const count = await Product.countDocuments(combinedFilters);
        const products = await Product.find(combinedFilters)
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .lean();
        const normalizedProducts = products.map(p => normalizeProductVariationsForResponse(p));
        res.json({ products: normalizedProducts, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all products (Admin view - no pagination)
// @route   GET /api/products/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 }).lean();
        const normalizedProducts = products.map(p => normalizeProductVariationsForResponse(p));
        res.json(normalizedProducts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).lean();
        if (product) {
            res.json(normalizeProductVariationsForResponse(product));
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(404).json({ message: 'Product not found' });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Helper: Ensure images array contains ONLY strings, no Objects/Buffers that crash React
const sanitizeImages = (images) => {
    if (!images || !Array.isArray(images)) return [];
    return images.map(img => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object') {
            return img.path || img.url || img.filename || '';
        }
        return '';
    }).filter(img => typeof img === 'string' && img.trim() !== '');
};

// Normalize one image path to string (for option.image)
const toImageString = (img) => {
    if (!img) return null;
    if (typeof img === 'string' && img.trim() !== '') return img.trim();
    if (img && typeof img === 'object') return img.path || img.url || img.filename || null;
    return null;
};

// Normalize variations to new schema: { name, includeImages, options: [{ value, image }] }
// Accepts legacy: options as string[] or options as { value, image }[]
const normalizeVariations = (variations) => {
    if (!variations || !Array.isArray(variations)) return [];
    return variations.map(v => {
        if (!v || typeof v !== 'object') return { name: '', includeImages: false, options: [] };
        const includeImages = Boolean(v.includeImages);
        const options = Array.isArray(v.options) ? v.options.map(opt => {
            if (typeof opt === 'string') {
                return { value: opt.trim() || '', image: includeImages ? null : null };
            }
            if (opt && typeof opt === 'object') {
                const value = (opt.value != null ? String(opt.value) : '').trim();
                const image = includeImages ? toImageString(opt.image) : null;
                return { value, image };
            }
            return { value: '', image: null };
        }).filter(o => o.value !== '') : [];
        return { name: (v.name != null ? String(v.name) : '').trim(), includeImages, options };
    }).filter(v => v.name !== '');
};

// If includeImages === true, ensure no duplicate image in same variation. Return error message or null.
const validateVariationImages = (variations) => {
    for (const v of variations) {
        if (!v.includeImages) continue;
        const used = new Set();
        for (const opt of v.options || []) {
            const img = opt.image ? String(opt.image).trim() : null;
            if (!img) continue;
            if (used.has(img)) {
                return `Duplicate image in variation "${v.name}": each option must have a unique image or no image.`;
            }
            used.add(img);
        }
    }
    return null;
};

// Ensure product variations in API response have consistent shape: { name, includeImages, options: [{ value, image }] }
// Merges legacy variationImages into options when present
const normalizeProductVariationsForResponse = (product) => {
    const p = product.toObject ? product.toObject() : { ...product };
    const legacyMaps = Array.isArray(p.variationImages) ? p.variationImages : [];
    if (!Array.isArray(p.variations)) return p;
    p.variations = p.variations.map(v => {
        const includeImages = Boolean(v && v.includeImages);
        let options = Array.isArray(v.options) ? v.options.map(opt => {
            if (typeof opt === 'string') return { value: opt, image: null };
            if (opt && typeof opt === 'object') {
                return { value: (opt.value != null ? String(opt.value) : ''), image: opt.image ? String(opt.image) : null };
            }
            return { value: '', image: null };
        }).filter(o => o.value !== '') : [];
        if (includeImages && legacyMaps.length > 0 && options.some(o => !o.image)) {
            options = options.map(opt => {
                const legacy = legacyMaps.find(l => l.variationName === v.name && l.optionName === opt.value);
                return legacy && legacy.image ? { ...opt, image: String(legacy.image) } : opt;
            });
        }
        return { name: (v && v.name) ? String(v.name) : '', includeImages, options };
    });
    delete p.variationImages;
    return p;
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, price, description, images, brand, category, subcategory, countInStock, variations, details, frameShape, lensType } = req.body;

        const safeImages = sanitizeImages(images);
        const normalizedVariations = normalizeVariations(variations);
        const validationError = validateVariationImages(normalizedVariations);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }
        if (!category || !isValidObjectId(category)) {
            return res.status(400).json({ message: 'Valid category (ObjectId) is required' });
        }
        if (subcategory != null && subcategory !== '' && !isValidObjectId(subcategory)) {
            return res.status(400).json({ message: 'Subcategory must be a valid ObjectId or empty' });
        }

        const product = new Product({
            name: name || 'Sample name',
            price: price || 0,
            user: req.user._id,
            images: safeImages.length > 0 ? safeImages : ['/images/sample.jpg'],
            brand: brand || 'Sample brand',
            category,
            subcategory: subcategory && isValidObjectId(subcategory) ? subcategory : null,
            countInStock: countInStock || 0,
            variations: normalizedVariations,
            details: Array.isArray(details) ? details : [],
            frameShape: frameShape || '',
            lensType: lensType || '',
            numReviews: 0,
            description: description || 'Sample description',
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, price, description, images, brand, category, subcategory, countInStock, isActive, variations, details, frameShape, lensType } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.name = name ?? product.name;
        product.price = price ?? product.price;
        product.description = description ?? product.description;
        product.frameShape = frameShape ?? product.frameShape;
        product.lensType = lensType ?? product.lensType;

        const safeImages = sanitizeImages(images);
        if (safeImages && safeImages.length > 0) product.images = safeImages;

        product.brand = brand ?? product.brand;
        if (category !== undefined) {
            if (!isValidObjectId(category)) return res.status(400).json({ message: 'Valid category (ObjectId) is required' });
            product.category = category;
        }
        if (subcategory !== undefined) {
            product.subcategory = subcategory && isValidObjectId(subcategory) ? subcategory : null;
        }
        
        const oldCountInStock = product.countInStock;
        product.countInStock = countInStock ?? product.countInStock;

        if (variations !== undefined) {
            const normalizedVariations = normalizeVariations(variations);
            const validationError = validateVariationImages(normalizedVariations);
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }
            product.variations = normalizedVariations;
        }
        if (details !== undefined) product.details = Array.isArray(details) ? details : [];
        if (isActive !== undefined) product.isActive = isActive;

        const updatedProduct = await product.save();

        // Restock Notification Logic
        if (oldCountInStock <= 0 && updatedProduct.countInStock > 0) {
            try {
                const notifications = await RestockNotification.find({ product: updatedProduct._id, notified: false });
                
                for (const notification of notifications) {
                    await sendRestockNotification(notification.email, updatedProduct);
                    notification.notified = true;
                    notification.notifiedAt = Date.now();
                    await notification.save();
                }
            } catch (err) {
                console.error('[Restock Logic] Failed to process restock notifications:', err);
            }
        }

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
});

export default router;
