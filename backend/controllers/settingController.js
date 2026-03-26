import Setting from '../models/Setting.js';

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = await Setting.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error reading settings' });
    }
};

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        const { taxRate, freeShippingThreshold, shippingFee, storeName, supportEmail, maintenanceMode } = req.body;
        
        let settings = await Setting.findOne();
        
        if (settings) {
            settings.taxRate = taxRate !== undefined ? taxRate : settings.taxRate;
            settings.freeShippingThreshold = freeShippingThreshold !== undefined ? freeShippingThreshold : settings.freeShippingThreshold;
            settings.shippingFee = shippingFee !== undefined ? shippingFee : settings.shippingFee;
            settings.storeName = storeName || settings.storeName;
            settings.supportEmail = supportEmail || settings.supportEmail;
            settings.maintenanceMode = maintenanceMode !== undefined ? maintenanceMode : settings.maintenanceMode;

            const updatedSettings = await settings.save();
            res.json(updatedSettings);
        } else {
            // Create if it doesn't exist
            settings = await Setting.create({
                taxRate,
                freeShippingThreshold,
                shippingFee,
                storeName,
                supportEmail,
                maintenanceMode
            });
            res.status(201).json(settings);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error updating settings' });
    }
};

export { getSettings, updateSettings };
