import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import Sale from '../models/Sale.js';
import Coupon from '../models/Coupon.js';

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
 * Fetch applicable active sale for a product
 */
export const getActiveSaleForProduct = async (product) => {
    const now = new Date();
    const activeSales = await Sale.find({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: { $ne: 'cancelled' }
    }).lean();

    const pIdStr = String(product._id);
    const applicableSales = activeSales.filter(sale => {
        if (sale.appliesTo === 'all') return true;
        if (sale.appliesTo === 'selectedProducts' && Array.isArray(sale.productIds)) {
            return sale.productIds.some(id => String(id) === pIdStr);
        }
        return false;
    });

    if (applicableSales.length === 0) return null;

    // Select the sale that yields the highest discount amount
    let bestSale = null;
    let maxDiscountAmount = -1;

    applicableSales.forEach(sale => {
        let discount = 0;
        if (sale.discountType === 'percentage') {
            discount = product.price * (sale.discountValue / 100);
        } else if (sale.discountType === 'fixed') {
            discount = Math.min(product.price, sale.discountValue);
        }
        if (discount > maxDiscountAmount) {
            maxDiscountAmount = discount;
            bestSale = sale;
        }
    });

    return bestSale;
};

/**
 * Validate cart lines against DB and compute authoritative prices, active sales, and promo codes.
 * @throws {Error} with message safe to return to client (400)
 */
export const buildPricedOrder = async (orderItems, promoCode = '') => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error('No order items');
    }

    const pricedItems = [];
    let originalSubtotal = 0;
    let saleSubtotal = 0;

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

        const regularUnitPrice = Number(product.price);
        if (!Number.isFinite(regularUnitPrice) || regularUnitPrice < 0) {
            throw new Error(`Invalid price for ${product.name}`);
        }

        let image = item.image;
        if (typeof image !== 'string' || !image.trim()) {
            image = Array.isArray(product.images) && product.images[0] ? product.images[0] : '';
        }

        // 1. Calculate Active Sale
        const activeSale = await getActiveSaleForProduct(product);
        let saleUnitPrice = regularUnitPrice;
        let appliedSaleId = null;

        if (activeSale) {
            appliedSaleId = activeSale._id;
            if (activeSale.discountType === 'percentage') {
                saleUnitPrice = regularUnitPrice * (1 - activeSale.discountValue / 100);
            } else if (activeSale.discountType === 'fixed') {
                saleUnitPrice = Math.max(0, regularUnitPrice - activeSale.discountValue);
            }
        }

        saleUnitPrice = +saleUnitPrice.toFixed(2);
        originalSubtotal += regularUnitPrice * qty;
        saleSubtotal += saleUnitPrice * qty;

        pricedItems.push({
            name: product.name,
            qty,
            image,
            price: saleUnitPrice, // initially set to saleUnitPrice, will adjust if coupon applies
            originalPrice: regularUnitPrice,
            finalPrice: saleUnitPrice,
            discountAmount: +(regularUnitPrice - saleUnitPrice).toFixed(2),
            appliedSaleId,
            appliedCouponCode: '',
            product: product._id,
            variations: item.variations && typeof item.variations === 'object' ? item.variations : {},
        });
    }

    // 2. Validate and Apply Promo Code (Coupon) if provided
    let appliedCoupon = null;
    let couponDiscountTotal = 0;

    if (promoCode && typeof promoCode === 'string' && promoCode.trim() !== '') {
        const cleanCode = promoCode.trim().toUpperCase();
        const coupon = await Coupon.findOne({ code: cleanCode });

        if (!coupon) {
            throw new Error('Invalid promo code');
        }

        if (coupon.isActive === false || coupon.status === 'cancelled') {
            throw new Error('Promo code is no longer active');
        }

        const now = new Date();
        if (now < new Date(coupon.startDate)) {
            throw new Error('Promo code is not active yet');
        }
        if (now > new Date(coupon.endDate)) {
            throw new Error('Promo code has expired');
        }

        if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            throw new Error('Promo code usage limit has been reached');
        }

        // Filter coupon-eligible items (calculated based on their saleUnitPrice)
        const eligibleItems = pricedItems.filter(item => {
            if (coupon.appliesTo === 'all') return true;
            if (coupon.appliesTo === 'selectedProducts' && Array.isArray(coupon.productIds)) {
                return coupon.productIds.some(id => String(id) === String(item.product));
            }
            return false;
        });

        if (eligibleItems.length === 0) {
            throw new Error('Promo code is not applicable to any products in your cart');
        }

        const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.finalPrice * item.qty), 0);

        if (coupon.minimumOrderAmount && eligibleSubtotal < coupon.minimumOrderAmount) {
            throw new Error(`Minimum order subtotal of Rs. ${coupon.minimumOrderAmount.toFixed(2)} is required for this promo code`);
        }

        // Calculate coupon discount amount
        if (coupon.discountType === 'percentage') {
            couponDiscountTotal = eligibleSubtotal * (coupon.discountValue / 100);
        } else if (coupon.discountType === 'fixed') {
            couponDiscountTotal = Math.min(eligibleSubtotal, coupon.discountValue);
        }

        couponDiscountTotal = +couponDiscountTotal.toFixed(2);
        appliedCoupon = coupon;

        // Proportionally distribute the coupon discount across eligible items
        if (couponDiscountTotal > 0 && eligibleSubtotal > 0) {
            eligibleItems.forEach(item => {
                const itemSubtotal = item.finalPrice * item.qty;
                const proportion = itemSubtotal / eligibleSubtotal;
                const itemCouponDiscount = couponDiscountTotal * proportion;
                
                item.finalPrice = +(item.finalPrice - (itemCouponDiscount / item.qty)).toFixed(2);
                item.discountAmount = +(item.originalPrice - item.finalPrice).toFixed(2);
                item.price = item.finalPrice; // standard e-commerce item price is now finalPrice
                item.appliedCouponCode = coupon.code;
            });
        }
    }

    originalSubtotal = +originalSubtotal.toFixed(2);
    
    // Calculate final subtotal after both active sales and applied coupon
    const finalSubtotal = +pricedItems.reduce((sum, item) => sum + (item.finalPrice * item.qty), 0).toFixed(2);
    const discountTotal = +(originalSubtotal - finalSubtotal).toFixed(2);

    const settings = await getStoreSettings();
    const threshold = Number(settings.freeShippingThreshold) ?? DEFAULT_SETTINGS.freeShippingThreshold;
    const shippingFee = Number(settings.shippingFee) ?? DEFAULT_SETTINGS.shippingFee;
    const taxRate = Number(settings.taxRate) ?? DEFAULT_SETTINGS.taxRate;

    const shippingPrice = finalSubtotal <= 0 ? 0 : finalSubtotal >= threshold ? 0 : shippingFee;
    const taxPrice = +(finalSubtotal * (taxRate / 100)).toFixed(2);
    const totalPrice = +(finalSubtotal + shippingPrice + taxPrice).toFixed(2);

    return {
        orderItems: pricedItems,
        subtotal: originalSubtotal,
        discountTotal,
        itemsPrice: finalSubtotal, // fits order itemsPrice
        taxPrice,
        shippingPrice,
        totalPrice,
        appliedCouponCode: appliedCoupon ? appliedCoupon.code : null
    };
};
