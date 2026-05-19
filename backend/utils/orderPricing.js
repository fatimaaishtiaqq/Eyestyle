import Product from '../models/Product.js';
import Setting from '../models/Setting.js';

const DEFAULT_SETTINGS = {
    freeShippingThreshold: 200,
    shippingFee: 15,
    taxRate: 10,
};

const getStoreSettings = async () => {
    try {
        const doc = await Setting.findOne().lean();
        return { ...DEFAULT_SETTINGS, ...(doc || {}) };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

/**
 * Validate cart lines against DB and compute authoritative prices.
 * @throws {Error} with message safe to return to client (400)
 */
export const buildPricedOrder = async (orderItems) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error('No order items');
    }

    const pricedItems = [];
    let itemsPrice = 0;

    for (const item of orderItems) {
        const productId = item.product || item._id || item.id;
        if (!productId) {
            throw new Error('Invalid product in cart');
        }

        const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
        const product = await Product.findById(productId);

        if (!product || product.isActive === false) {
            throw new Error(`Product is no longer available`);
        }

        if (product.countInStock < qty) {
            throw new Error(`Insufficient stock for ${product.name}`);
        }

        const unitPrice = Number(product.price);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error(`Invalid price for ${product.name}`);
        }

        let image = item.image;
        if (typeof image !== 'string' || !image.trim()) {
            image = Array.isArray(product.images) && product.images[0] ? product.images[0] : '';
        }

        pricedItems.push({
            name: product.name,
            qty,
            image,
            price: unitPrice,
            product: product._id,
            variations: item.variations && typeof item.variations === 'object' ? item.variations : {},
        });

        itemsPrice += unitPrice * qty;
    }

    itemsPrice = +itemsPrice.toFixed(2);
    const settings = await getStoreSettings();
    const threshold = Number(settings.freeShippingThreshold) ?? DEFAULT_SETTINGS.freeShippingThreshold;
    const shippingFee = Number(settings.shippingFee) ?? DEFAULT_SETTINGS.shippingFee;
    const taxRate = Number(settings.taxRate) ?? DEFAULT_SETTINGS.taxRate;

    const shippingPrice = itemsPrice <= 0 ? 0 : itemsPrice >= threshold ? 0 : shippingFee;
    const taxPrice = +(itemsPrice * (taxRate / 100)).toFixed(2);
    const totalPrice = +(itemsPrice + shippingPrice + taxPrice).toFixed(2);

    return { orderItems: pricedItems, itemsPrice, taxPrice, shippingPrice, totalPrice };
};
