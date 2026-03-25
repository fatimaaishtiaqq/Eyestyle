import express from 'express';
import SubCategory from '../models/SubCategory.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const toSlug = (name) => (name || '').toLowerCase().replace(/[\s_]+/g, '-');

// @desc    Get subcategories (optionally by category)
// @route   GET /api/subcategories?category=:categoryId
// @access  Public
router.get('/', async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.category) query.category = req.query.category;
        const subcategories = await SubCategory.find(query).populate('category', 'name slug').sort({ name: 1 });
        res.json(subcategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all subcategories (Admin)
// @route   GET /api/subcategories/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const query = req.query.category ? { category: req.query.category } : {};
        const subcategories = await SubCategory.find(query).populate('category', 'name slug').sort({ name: 1 });
        res.json(subcategories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create subcategory
// @route   POST /api/subcategories
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, category, description, image } = req.body;
        if (!name || !category) {
            return res.status(400).json({ message: 'Name and category are required' });
        }
        const slug = toSlug(name);
        const existing = await SubCategory.findOne({ category, slug });
        if (existing) return res.status(400).json({ message: 'Subcategory with this name already exists in this category' });
        const subcategory = await SubCategory.create({ name, slug, category, description, image });
        res.status(201).json(subcategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update subcategory
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const subcategory = await SubCategory.findById(req.params.id);
        if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });
        const { name, category, description, image } = req.body;
        if (name) {
            subcategory.name = name;
            subcategory.slug = toSlug(name);
        }
        if (category !== undefined) subcategory.category = category;
        if (description !== undefined) subcategory.description = description;
        if (image !== undefined) subcategory.image = image;
        await subcategory.save();
        res.json(subcategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete subcategory
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const subcategory = await SubCategory.findById(req.params.id);
        if (subcategory) {
            await subcategory.deleteOne();
            res.json({ message: 'Subcategory removed' });
        } else {
            res.status(404).json({ message: 'Subcategory not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
