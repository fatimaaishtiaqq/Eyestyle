import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Minus, Plus, ArrowRight, Shield, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import ThreeBackground from '../components/ThreeBackground';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const FREE_SHIPPING_THRESHOLD = 200;

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, cartSubtotal } = useCart();

    // Free shipping auto-logic: $0 when subtotal >= threshold
    const shipping = cartSubtotal <= 0 ? 0 : cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15.00;
    const total = cartSubtotal + shipping;

    // Progress bar: correct math — e.g. 198.99/200 = 99.5%
    const freeShippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
    const freeShippingProgress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);
    const hasUnlockedFreeShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD;

    const containerRef = React.useRef(null);

    useGSAP(() => {
        gsap.from('.cart-item-row', {
            opacity: 0,
            x: -15,
            duration: 0.35,
            stagger: 0.06,
            ease: 'power2.out'
        });
        gsap.from('.summary-panel', {
            opacity: 0,
            y: 15,
            duration: 0.4,
            delay: 0.15,
            ease: 'power2.out'
        });
    }, { scope: containerRef, dependencies: [cartItems.length] });

    const resolveImage = (img) => {
        if (!img) return '/images/sample.jpg';
        if (typeof img === 'string') return img;
        if (Array.isArray(img)) return img[0] || '/images/sample.jpg';
        return '/images/sample.jpg';
    };

    return (
        <>
            <div
                ref={containerRef}
                className="w-full min-h-screen pt-8 sm:pt-10 pb-28 lg:pb-16 px-4 sm:px-6 lg:px-10 text-[var(--text-primary)] relative bg-transparent"
            >
                <ThreeBackground variant="cart" />

                <div className="max-w-[1400px] mx-auto relative z-10">

                    {/* ── Page Header ──────────────────────────────────── */}
                    <div className="flex items-center justify-between mb-6 border-b border-[var(--surface-border)] pb-4">
                        <div>
                            <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">
                                Your Cart
                            </h1>
                            <p className="text-xs tracking-widest text-[var(--text-secondary)] uppercase mt-0.5">
                                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                        <Link
                            to="/collections/all"
                            className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Continue Shopping <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* ── Empty State ──────────────────────────────────── */}
                    {cartItems.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-32 text-[var(--text-primary)]"
                        >
                            <ShoppingBag size={56} className="mb-8 opacity-20" strokeWidth={1.5} />
                            <p className="text-lg font-serif italic text-[var(--text-muted)] mb-8">Your cart is empty.</p>
                            <Link
                                to="/collections/all"
                                className="btn-primary px-10 py-4 text-xs font-bold tracking-[0.3em] uppercase"
                            >
                                Explore Collection
                            </Link>
                        </motion.div>
                    ) : (
                        /* ── Two-Column Layout ───────────────────────────── */
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">

                            {/* ── LEFT: Cart Items ─────────────────────────── */}
                            <div className="w-full min-w-0 space-y-0">

                                {/* Column Headers — Desktop only */}
                                <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-6 pb-3 border-b border-[var(--surface-border)] text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">
                                    <span>Product</span>
                                    <span className="text-center w-24">Quantity</span>
                                    <span className="text-right w-20">Total</span>
                                    <span className="w-6"></span>
                                </div>

                                {cartItems.map((item, idx) => {
                                    const itemTotal = ((item.price || 0) * item.quantity).toFixed(2);
                                    const itemId = item._id || item.id;
                                    const variations = item.variations || {};

                                    return (
                                        <div
                                            key={item.variationId || `${itemId}-${idx}`}
                                            className="cart-item-row grid grid-cols-[72px_1fr] sm:grid-cols-[94px_1fr] md:flex md:items-center gap-x-4 gap-y-2 sm:gap-x-6 py-5 sm:py-6 border-b border-[var(--surface-border)] group"
                                        >
                                            {/* Image - Span 2 rows on mobile */}
                                            <Link to={`/product/${itemId}`} className="md:shrink-0 row-span-2 md:row-span-1">
                                                <div className="w-[72px] h-[84px] sm:w-[94px] sm:h-[110px] bg-[var(--surface-color)] overflow-hidden border border-[var(--surface-border)]">
                                                    <img
                                                        src={resolveImage(item.image)}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </div>
                                            </Link>

                                            {/* Title + Price + Variations + ID - Col 2, Row 1 on mobile */}
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/product/${itemId}`}
                                                    className="block text-sm sm:text-[15px] font-bold uppercase tracking-wide leading-tight hover:text-accent transition-colors text-[var(--text-primary)] mb-1 break-words whitespace-normal"
                                                >
                                                    {item.name}
                                                </Link>

                                                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                                                    ${(item.price || 0).toFixed(2)}
                                                </p>

                                                {/* Variation pills */}
                                                {Object.keys(variations).length > 0 && (
                                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1">
                                                        {Object.entries(variations).map(([vName, vVal]) => (
                                                            <span
                                                                key={vName}
                                                                className="text-[11px] text-[var(--text-secondary)]"
                                                            >
                                                                <span className="font-semibold">{vName}:</span> {vVal}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Product ID */}
                                                <p className="text-[11px] font-medium text-[var(--text-secondary)] tracking-wider uppercase opacity-60">
                                                    #{String(itemId).slice(-6).toUpperCase()}
                                                </p>
                                            </div>

                                            {/* Qty + Total + Remove - Col 2, Row 2 on mobile */}
                                            <div className="flex items-center gap-3 sm:gap-4 shrink-0 col-start-2 md:col-start-auto">

                                                {/* Qty Stepper */}
                                                <div className="flex items-center border border-[var(--surface-border)] h-9 w-[84px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(itemId, variations, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="w-8 h-full flex items-center justify-center text-[var(--text-primary)] opacity-60 hover:opacity-100 disabled:opacity-20 transition-opacity"
                                                    >
                                                        <Minus size={11} />
                                                    </button>
                                                    <span className="flex-1 text-center text-xs font-bold text-[var(--text-primary)]">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(itemId, variations, item.quantity + 1)}
                                                        disabled={item.countInStock != null && item.quantity >= item.countInStock}
                                                        className="w-8 h-full flex items-center justify-center text-[var(--text-primary)] opacity-60 hover:opacity-100 disabled:opacity-20 transition-opacity"
                                                    >
                                                        <Plus size={11} />
                                                    </button>
                                                </div>

                                                {/* Line Total — hidden on smallest mobile, shown from sm: */}
                                                <p className="hidden sm:block text-sm font-bold text-[var(--text-primary)] w-20 text-right">
                                                    ${itemTotal}
                                                </p>

                                                {/* Remove */}
                                                <button
                                                    onClick={() => removeFromCart(itemId, variations)}
                                                    className="text-[var(--text-secondary)] hover:text-red-500 transition-colors ml-1 p-1"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── RIGHT: Order Summary ──────────────────────── */}
                            <div className="w-full lg:sticky lg:top-20 summary-panel">
                                <div className="border border-[var(--surface-border)] p-5 sm:p-6 bg-[var(--card-bg)]">

                                    <h2 className="text-[10px] font-bold tracking-[0.5em] uppercase mb-4 pb-3 border-b border-[var(--surface-border)] text-[var(--text-primary)]">
                                        Order Summary
                                    </h2>

                                    {/* ── Free Shipping Progress Bar ──────────── */}
                                    <div className="mb-4 p-3 bg-[var(--surface-color)] border border-[var(--surface-border)]">
                                        {/* Progress track */}
                                        <div className="w-full h-[6px] bg-[var(--surface-border)] rounded-full overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                                                style={{ width: `${freeShippingProgress}%` }}
                                            />
                                        </div>

                                        {hasUnlockedFreeShipping ? (
                                            <p className="text-[12px] font-semibold text-green-600 dark:text-green-400">
                                                🎉 You've unlocked <strong>FREE shipping!</strong>
                                            </p>
                                        ) : (
                                            <p className="text-[12px] text-[var(--text-primary)]">
                                                You are <strong className="font-bold">${freeShippingGap.toFixed(2)}</strong> away from <strong>FREE shipping</strong>
                                            </p>
                                        )}
                                    </div>

                                    {/* ── Summary Rows ────────────────────────── */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[var(--text-secondary)]">Subtotal</span>
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">${cartSubtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-[var(--text-secondary)]">Shipping</span>
                                                {hasUnlockedFreeShipping && (
                                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Free</span>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                                {hasUnlockedFreeShipping ? '$0.00' : `$${shipping.toFixed(2)}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-[var(--text-secondary)]">Tax</span>
                                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Included</span>
                                        </div>
                                    </div>

                                    {/* ── Grand Total ─────────────────────────── */}
                                    <div className="border-t border-[var(--surface-border)] pt-4 mb-5 flex justify-between items-center">
                                        <span className="text-sm font-bold tracking-widest uppercase text-[var(--text-primary)]">Grand Total</span>
                                        <span className="text-[22px] font-black font-sans text-accent">${total.toFixed(2)}</span>
                                    </div>

                                    {/* ── Checkout Button ─────────────────────── */}
                                    <Link
                                        to="/checkout"
                                        className="block w-full bg-[var(--text-primary)] text-[var(--bg-color)] py-[14px] text-[11px] font-black tracking-[0.4em] uppercase text-center hover:bg-accent hover:text-white transition-colors"
                                    >
                                        Proceed to Checkout
                                    </Link>

                                    {/* Trust Badges */}
                                    <div className="mt-4 flex items-center justify-center gap-5 text-[var(--text-muted)]">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                            <Shield size={11} /> Secure Pay
                                        </div>
                                        <span className="w-px h-3 bg-current"></span>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                            <Truck size={11} /> Insured Delivery
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {/* ── Sticky Mobile Checkout Bar (lg and below only) ─────────── */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-[1000] lg:hidden border-t border-[var(--surface-border)] bg-[var(--bg-color)]/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-colors duration-400">
                    <div className="flex items-center justify-between px-4 h-16 max-w-[1400px] mx-auto">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--text-muted)] opacity-60">Subtotal</span>
                            <span className="text-base font-black text-[var(--text-primary)] tracking-tight">${cartSubtotal.toFixed(2)}</span>
                        </div>
                        <Link
                            to="/checkout"
                            className="bg-[var(--text-primary)] text-[var(--bg-color)] h-10 px-6 flex items-center text-[11px] font-black tracking-[0.2em] uppercase hover:bg-accent hover:text-white transition-all shadow-md active:scale-95"
                        >
                            Checkout
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
};

export default Cart;
