import express from 'express';
import Category from '../models/Category.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, description, parent, image } = req.body;

        // Ensure slug is created from name (e.g., "Men" -> "men")
        const slug = name.toLowerCase().replace(/[\s_]+/g, '-');
        const parentId = parent || null;

        const categoryExists = await Category.findOne({ slug, parent: parentId });

        if (categoryExists) {
            res.status(400);
            return res.json({ message: parentId ? 'A subcategory with this name already exists under the selected parent.' : 'A main category with this name already exists.' });
        }

        const category = await Category.create({
            name,
            slug,
            description,
            image,
            parent: parent || null
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all active categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).populate('parent', 'name slug');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all categories (Admin)
// @route   GET /api/categories/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const categories = await Category.find({}).populate('parent', 'name slug');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Edit a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, description, parent, image } = req.body;
        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = name || category.name;
            if (name) {
                category.slug = name.toLowerCase().replace(/[\s_]+/g, '-');
            }
            category.description = description !== undefined ? description : category.description;
            category.image = image !== undefined ? image : category.image;
            category.parent = parent || null;

            // Cannot be its own parent
            if (category._id.toString() === category.parent?.toString()) {
                return res.status(400).json({ message: "Category cannot be its own parent" });
            }

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
