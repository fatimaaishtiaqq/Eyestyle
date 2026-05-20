import express from 'express';
import Sale from '../models/Sale.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to compute dynamic status based on dates
const getDynamicStatus = (sale) => {
    if (sale.status === 'cancelled') return 'cancelled';
    const now = new Date();
    if (now < new Date(sale.startDate)) return 'scheduled';
    if (now > new Date(sale.endDate)) return 'expired';
    return 'active';
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const sales = await Sale.find({})
            .populate('productIds', 'name price image images countInStock')
            .sort({ createdAt: -1 });
        
        // Dynamically correct and sync statuses based on actual dates
        const updatedSales = [];
        for (const sale of sales) {
            const calculatedStatus = getDynamicStatus(sale);
            if (sale.status !== calculatedStatus) {
                sale.status = calculatedStatus;
                await sale.save();
            }
            updatedSales.push(sale);
        }

        res.json(updatedSales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a sale
// @route   POST /api/sales
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { name, discountType, discountValue, appliesTo, productIds, startDate, endDate, terms } = req.body;

        if (!name || !discountType || discountValue === undefined || !startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Validate name format (letters, numbers, spaces allowed)
        if (!/^[a-zA-Z0-9\s-]+$/.test(name)) {
            return res.status(400).json({ message: 'Sale name can only contain letters, numbers, hyphens, and spaces' });
        }

        const now = new Date();
        const saleExists = await Sale.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            status: { $ne: 'cancelled' },
            endDate: { $gte: now }
        });
        if (saleExists) {
            return res.status(400).json({ message: 'An active or scheduled sale with this name already exists' });
        }

        if (discountType === 'percentage' && (discountValue < 1 || discountValue > 90)) {
            return res.status(400).json({ message: 'Percentage discount must be between 1% and 90%' });
        }

        if (discountType === 'fixed' && discountValue <= 0) {
            return res.status(400).json({ message: 'Fixed discount value must be greater than 0' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        // Check if duration is over 30 days
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            return res.status(400).json({ message: 'Maximum sale duration is 30 days' });
        }

        let initialStatus = 'scheduled';
        if (now >= start && now <= end) {
            initialStatus = 'active';
        } else if (now > end) {
            initialStatus = 'expired';
        }

        const sale = await Sale.create({
            name: name.trim(),
            discountType,
            discountValue,
            appliesTo,
            productIds: appliesTo === 'selectedProducts' ? productIds : [],
            startDate: start,
            endDate: end,
            terms: terms || '',
            status: initialStatus,
            createdBy: req.user?._id
        });

        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id).populate('productIds', 'name price image images countInStock');
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        
        const calculatedStatus = getDynamicStatus(sale);
        if (sale.status !== calculatedStatus) {
            sale.status = calculatedStatus;
            await sale.save();
        }

        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Edit a sale
// @route   PUT /api/sales/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { name, discountType, discountValue, appliesTo, productIds, startDate, endDate, terms } = req.body;
        const sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        if (sale.status === 'expired') {
            return res.status(400).json({ message: 'Cannot edit an expired sale' });
        }

        if (name && name.trim().toLowerCase() !== sale.name.toLowerCase()) {
            const now = new Date();
            const saleExists = await Sale.findOne({
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
                status: { $ne: 'cancelled' },
                endDate: { $gte: now }
            });
            if (saleExists) {
                return res.status(400).json({ message: 'An active or scheduled sale with this name already exists' });
            }
            sale.name = name.trim();
        }

        if (discountType) sale.discountType = discountType;
        if (discountValue !== undefined) {
            if (discountType === 'percentage' && (discountValue < 1 || discountValue > 90)) {
                return res.status(400).json({ message: 'Percentage discount must be between 1% and 90%' });
            }
            if (discountType === 'fixed' && discountValue <= 0) {
                return res.status(400).json({ message: 'Fixed discount value must be greater than 0' });
            }
            sale.discountValue = discountValue;
        }

        if (appliesTo) sale.appliesTo = appliesTo;
        if (productIds !== undefined) {
            sale.productIds = appliesTo === 'selectedProducts' ? productIds : [];
        }

        if (startDate) sale.startDate = new Date(startDate);
        if (endDate) sale.endDate = new Date(endDate);

        if (sale.startDate >= sale.endDate) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const diffTime = Math.abs(sale.endDate - sale.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            return res.status(400).json({ message: 'Maximum sale duration is 30 days' });
        }

        if (terms !== undefined) sale.terms = terms;

        // Recompute dynamic status
        sale.status = getDynamicStatus(sale);

        const updatedSale = await sale.save();
        res.json(updatedSale);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Cancel/Deactivate a sale
// @route   PATCH /api/sales/:id/cancel
// @access  Private/Admin
router.patch('/:id/cancel', protect, admin, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        if (sale.status === 'expired') {
            return res.status(400).json({ message: 'Cannot cancel an expired sale' });
        }

        sale.status = 'cancelled';
        const updatedSale = await sale.save();
        res.json(updatedSale);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        await sale.deleteOne();
        res.json({ message: 'Sale successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
