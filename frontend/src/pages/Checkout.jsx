import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { API_BASE_URL } from '../utils/apiClient';
import ThreeBackground from '../components/ThreeBackground';
import { ChevronDown, ChevronUp, Shield, Lock, Package } from 'lucide-react';

// Reusable field component for clean DRY forms
const Field = ({ label, name, type = 'text', value, onChange, required, placeholder, colSpan }) => (
    <div className={colSpan ? `md:col-span-${colSpan}` : ''}>
        <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full border border-[var(--surface-border)] bg-[var(--surface-color)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--placeholder-color)] outline-none focus:border-accent transition-colors"
        />
    </div>
);

const Checkout = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { showToast } = useToast();
    const { settings } = useSettings();
    const navigate = useNavigate();

    // Auth state
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
        const stored = localStorage.getItem('lux_user');
        if (stored) setCurrentUser(JSON.parse(stored));
    }, []);

    // Mobile summary toggle
    const [summaryOpen, setSummaryOpen] = useState(false);

    // Selected payment method
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

    // Billing address toggle
    const [sameAsShipping, setSameAsShipping] = useState(true);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [guestEmail, setGuestEmail] = useState(() => {
        return localStorage.getItem('checkout_guest_email') || '';
    });

    const [shippingDetails, setShippingDetails] = useState(() => {
        const saved = localStorage.getItem('checkout_shipping_details');
        return saved ? JSON.parse(saved) : {
            firstName: '', lastName: '', address: '', city: '',
            postalCode: '', country: '', phone: ''
        };
    });

    const [billingDetails, setBillingDetails] = useState(() => {
        const saved = localStorage.getItem('checkout_billing_details');
        return saved ? JSON.parse(saved) : {
            firstName: '', lastName: '', address: '', city: '',
            postalCode: '', country: ''
        };
    });

    // Persist form data to localStorage
    useEffect(() => {
        localStorage.setItem('checkout_shipping_details', JSON.stringify(shippingDetails));
    }, [shippingDetails]);

    useEffect(() => {
        localStorage.setItem('checkout_billing_details', JSON.stringify(billingDetails));
    }, [billingDetails]);

    useEffect(() => {
        localStorage.setItem('checkout_guest_email', guestEmail);
    }, [guestEmail]);


    // Pricing logic
    const threshold = settings?.freeShippingThreshold ?? 200;
    const shippingFee = settings?.shippingFee ?? 15;
    const taxRate = settings?.taxRate ?? 10;
    
    const shipping = cartTotal <= 0 ? 0 : cartTotal >= threshold ? 0 : shippingFee;
    const taxes = +(cartTotal * (taxRate / 100)).toFixed(2);
    const grandTotal = +(cartTotal + shipping + taxes).toFixed(2);

    const handleShippingChange = (e) =>
        setShippingDetails({ ...shippingDetails, [e.target.name]: e.target.value });

    const handleBillingChange = (e) =>
        setBillingDetails({ ...billingDetails, [e.target.name]: e.target.value });

    // Redirect empty cart to cart page
    useEffect(() => {
        if (cartItems.length === 0) {
            showToast('Your cart is empty.', 'error');
            navigate('/cart');
        }
    }, [cartItems.length, navigate, showToast]);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        // Gate auth only at submit time
        const stored = localStorage.getItem('lux_user');
        const user = stored ? JSON.parse(stored) : null;
        if (!user?.token) {
            showToast('Please sign in to complete your order.', 'error');
            navigate('/account', { state: { from: '/checkout' } });
            return;
        }

        if (!shippingDetails.firstName || !shippingDetails.address || !shippingDetails.city ||
            !shippingDetails.postalCode || !shippingDetails.country || !shippingDetails.phone) {
            showToast('Please fill in all required shipping fields, including your phone number.', 'error');
            return;
        }

        const orderItems = cartItems.map(item => ({
            name: item.name,
            qty: item.quantity,
            image: (Array.isArray(item.images) && item.images[0]) ? item.images[0] : (item.image || '/images/sample.jpg'),
            price: item.price,
            product: item.id || item._id,
            variations: item.variations || {}
        }));

        const finalBilling = sameAsShipping ? {
            address: shippingDetails.address,
            city: shippingDetails.city,
            postalCode: shippingDetails.postalCode,
            country: shippingDetails.country
        } : billingDetails;

        const orderData = {
            orderItems,
            shippingAddress: {
                address: shippingDetails.address,
                city: shippingDetails.city,
                postalCode: shippingDetails.postalCode,
                country: shippingDetails.country
            },
            billingAddress: finalBilling,
            paymentMethod,
            itemsPrice: cartTotal,
            taxPrice: taxes,
            shippingPrice: shipping,
            totalPrice: grandTotal
        };

        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                clearCart();
                localStorage.removeItem('checkout_shipping_details');
                localStorage.removeItem('checkout_billing_details');
                localStorage.removeItem('checkout_guest_email');
                showToast('Order placed successfully!', 'success');
                navigate('/orders');
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to place order', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Server error during checkout', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolveImage = (img) => {
        if (!img) return '/images/sample.jpg';
        if (typeof img === 'string') return img;
        if (Array.isArray(img)) return img[0] || '/images/sample.jpg';
        return '/images/sample.jpg';
    };

    const handleWhatsAppOrder = async () => {
        if (!shippingDetails.firstName || !shippingDetails.address || !shippingDetails.city ||
            !shippingDetails.postalCode || !shippingDetails.country || !shippingDetails.phone) {
            showToast('Please fill in all required shipping fields (including phone) before placing a WhatsApp order.', 'error');
            return;
        }

        // Gate auth only at submit time if required, or allow guest depending on your setup.
        // Copying the existing logic from handlePlaceOrder:
        const stored = localStorage.getItem('lux_user');
        const user = stored ? JSON.parse(stored) : null;
        if (!user?.token) {
            showToast('Please sign in to complete your order.', 'error');
            navigate('/account', { state: { from: '/checkout' } });
            return;
        }

        const phoneNumber = "923085961662";

        // Prepare order data to save in MongoDB
        const orderItemsList = cartItems.map(item => ({
            name: item.name,
            qty: item.quantity,
            image: (Array.isArray(item.images) && item.images[0]) ? item.images[0] : (item.image || '/images/sample.jpg'),
            price: item.price,
            product: item.id || item._id,
            variations: item.variations || {}
        }));

        const finalBilling = sameAsShipping ? {
            address: shippingDetails.address,
            city: shippingDetails.city,
            postalCode: shippingDetails.postalCode,
            country: shippingDetails.country,
            phone: shippingDetails.phone // Add phone to billing just in case
        } : billingDetails;

        const orderData = {
            orderItems: orderItemsList,
            shippingAddress: {
                address: shippingDetails.address,
                city: shippingDetails.city,
                postalCode: shippingDetails.postalCode,
                country: shippingDetails.country,
                phone: shippingDetails.phone // Include phone for backend to use for notifications
            },
            billingAddress: finalBilling,
            itemsPrice: cartTotal,
            taxPrice: taxes,
            shippingPrice: shipping,
            totalPrice: grandTotal
        };

        let orderId = 'PENDING';

        try {
            setIsSubmitting(true);
            const res = await fetch(`${API_BASE_URL}/api/orders/whatsapp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                const data = await res.json();
                orderId = data.orderId;
                clearCart();
                localStorage.removeItem('checkout_shipping_details');
                localStorage.removeItem('checkout_billing_details');
                localStorage.removeItem('checkout_guest_email');
                // We'll let the whatsapp opening happen below, then redirect to orders
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to initialize WhatsApp order', 'error');
                setIsSubmitting(false);
                return;
            }
        } catch (err) {
            console.error(err);
            showToast('Server error initializing order', 'error');
            setIsSubmitting(false);
            return;
        }

        let message = `✧･ﾟ: *✧･ﾟ:* 𝓝𝓮𝔀 𝓞𝓻𝓭𝓮𝓻 *:･ﾟ✧*:･ﾟ✧\n`;
        message += `Thank you for shopping at *Luxury E-Commerce*\n`;
        message += `───────────────────────\n\n`;

        message += `🏷️ *ORDER ID:* #${orderId}\n\n`;

        message += `👤 *ＣＵＳＴＯＭＥＲ ＤＥＴＡＩＬＳ*\n`;
        message += `▸ *Name:* ${shippingDetails.firstName} ${shippingDetails.lastName}\n`;
        message += `▸ *Phone:* ${shippingDetails.phone || 'N/A'}\n\n`;

        message += `📍 *ＳＨＩＰＰＩＮＧ ＡＤＤＲＥＳＳ*\n`;
        message += `${shippingDetails.address}, ${shippingDetails.city}\n`;
        message += `${shippingDetails.postalCode}, ${shippingDetails.country}\n\n`;
        message += `───────────────────────\n\n`;

        message += `🛍️ *ＯＲＤＥＲ ＩＴＥＭＳ*\n\n`;
        cartItems.forEach((item, index) => {
            const itemPrice = ((item.price || 0) * item.quantity).toFixed(2);

            message += `*${index + 1}. ${item.name}*\n`;
            message += `▸ Qty: ${item.quantity}  |  Price: Rs. ${itemPrice}\n`;
            if (item.variations && Object.keys(item.variations).length > 0) {
                message += `▸ Specs: ${Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
            }
            message += `\n`;
        });

        message += `───────────────────────\n\n`;
        message += `💰 *ＯＲＤＥＲ ＳＵＭＭＡＲＹ*\n`;
        message += `▸ Subtotal: Rs. ${cartTotal.toFixed(2)}\n`;
        message += `▸ Shipping: ${shipping === 0 && cartTotal > 0 ? 'Free' : `Rs. ${shipping.toFixed(2)}`}\n`;
        message += `▸ Taxes: Rs. ${taxes.toFixed(2)}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `🏆 *TOTAL DUE: Rs. ${grandTotal.toFixed(2)}*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `💳 *Payment Method:* ${paymentMethod}\n`;
        message += `\n_Please confirm this order to proceed. Thank you!_ ✨`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');

        setIsSubmitting(false);
        navigate('/orders');
    };

    return (
        <div className="w-full min-h-screen pt-8 sm:pt-10 pb-20 px-4 sm:px-6 lg:px-10 text-[var(--text-primary)] relative bg-transparent">
            <ThreeBackground variant="cart" />

            <div className="max-w-[1400px] mx-auto relative z-10">

                {/* ── Page Header ─────────────────────────────────────── */}
                <div className="mb-6 border-b border-[var(--surface-border)] pb-4">
                    <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">
                        Checkout
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)] font-medium tracking-wider">
                        <Lock size={11} />
                        <span>Secure & Encrypted</span>
                    </div>
                </div>

                {/* ── Mobile: Collapsible Order Summary ───────────────── */}
                <div className="lg:hidden mb-5 border border-[var(--surface-border)] bg-[var(--card-bg)]">
                    <button
                        onClick={() => setSummaryOpen(!summaryOpen)}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-[var(--text-primary)]"
                    >
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <Package size={16} />
                            Order Summary ({cartItems.length} item{cartItems.length !== 1 && 's'})
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-accent">Rs. {grandTotal.toFixed(2)}</span>
                            {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </button>

                    {summaryOpen && (
                        <div className="border-t border-[var(--surface-border)] px-4 py-4 space-y-3">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-12 h-14 shrink-0 bg-[var(--surface-color)] border border-[var(--surface-border)] overflow-hidden">
                                        <img src={resolveImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
                                        <p className="text-[11px] text-[var(--text-secondary)]">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-[var(--text-primary)] shrink-0">
                                        Rs. {((item.price || 0) * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                            <div className="border-t border-[var(--surface-border)] pt-3 space-y-1.5 text-sm">
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Subtotal</span><span>Rs. {cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 && cartTotal > 0 ? 'Free' : `Rs. ${shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Taxes ({settings?.taxRate ?? 10}%)</span><span>Rs. {taxes.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-black text-[var(--text-primary)] pt-1 border-t border-[var(--surface-border)]">
                                    <span>Total</span><span className="text-accent">Rs. {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Main Two-Column Layout ───────────────────────────── */}
                <form onSubmit={handlePlaceOrder}>
                    <div className="flex flex-col lg:flex-row gap-8 items-start">

                        {/* ─── LEFT COLUMN: All Forms ─────────────────────── */}
                        <div className="w-full lg:flex-1 space-y-6">

                            {/* ─ 1. CONTACT ──────────────────────────────── */}
                            <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--surface-border)]">
                                    <span className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-color)] flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                                    <h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-[var(--text-primary)]">Contact</h2>
                                </div>

                                {currentUser ? (
                                    <div className="flex items-center justify-between py-1">
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">{currentUser.name}</p>
                                            <p className="text-[12px] text-[var(--text-secondary)]">{currentUser.email}</p>
                                        </div>
                                        <Link to="/account" className="text-[11px] font-bold text-accent hover:underline tracking-wider uppercase">
                                            Switch Account
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                        <div className="flex-1">
                                            <Field
                                                label="Email address"
                                                name="email"
                                                type="email"
                                                value={guestEmail}
                                                onChange={(e) => setGuestEmail(e.target.value)}
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                        <div className="shrink-0 text-[12px] text-[var(--text-secondary)] whitespace-nowrap pt-5">
                                            Already have an account?{' '}
                                            <Link
                                                to="/account"
                                                state={{ from: '/checkout' }}
                                                className="font-bold text-[var(--text-primary)] hover:text-accent transition-colors underline"
                                            >
                                                Sign in
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ─ 2. SHIPPING ADDRESS ─────────────────────── */}
                            <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--surface-border)]">
                                    <span className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-color)] flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                                    <h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-[var(--text-primary)]">Shipping Address</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="First Name" name="firstName" value={shippingDetails.firstName} onChange={handleShippingChange} required />
                                    <Field label="Last Name" name="lastName" value={shippingDetails.lastName} onChange={handleShippingChange} required />
                                    <div className="md:col-span-2">
                                        <Field label="Address" name="address" value={shippingDetails.address} onChange={handleShippingChange} required placeholder="Street address, apartment, suite..." />
                                    </div>
                                    <Field label="City" name="city" value={shippingDetails.city} onChange={handleShippingChange} required />
                                    <Field label="Postal Code" name="postalCode" value={shippingDetails.postalCode} onChange={handleShippingChange} required />
                                    <Field label="Country" name="country" value={shippingDetails.country} onChange={handleShippingChange} required />
                                    <Field label="Phone Number" name="phone" type="tel" value={shippingDetails.phone} onChange={handleShippingChange} required placeholder="+1 (000) 000-0000" />
                                </div>
                            </div>

                            {/* ─ 3. PAYMENT METHOD ───────────────────────── */}
                            <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--surface-border)]">
                                    <span className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-color)] flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                                    <h2 className="text-[11px] font-black tracking-[0.4em] uppercase text-[var(--text-primary)]">Payment Method</h2>
                                </div>

                                <div className="h-14 flex items-center justify-center border border-[var(--color-primary)] bg-[var(--color-primary)] text-[11px] font-bold tracking-wider uppercase text-white shadow-md">
                                    Cash on Delivery
                                </div>
                            </div>


                            {/* ─ Mobile Place Order Button ────────────────── */}
                            <div className="lg:hidden">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[var(--color-primary)] text-white py-4 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {isSubmitting ? 'Processing...' : 'Place Order'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleWhatsAppOrder}
                                    className="w-full mt-3 bg-green-600 text-white py-4 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                                >
                                    <span>Place Order via WhatsApp</span>
                                </button>
                            </div>
                        </div>

                        {/* ─── RIGHT COLUMN: Order Summary (Desktop) ───────── */}
                        <div className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 sticky top-20">
                            <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-6">

                                <h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-[var(--text-primary)] mb-4 pb-3 border-b border-[var(--surface-border)]">
                                    Order Summary
                                </h2>

                                {/* Product list */}
                                <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                                    {cartItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <div className="w-14 h-16 bg-[var(--surface-color)] border border-[var(--surface-border)] overflow-hidden">
                                                    <img src={resolveImage(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                {/* Qty badge */}
                                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-color)] text-[10px] font-black flex items-center justify-center">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight truncate">{item.name}</p>
                                                {item.variations && Object.keys(item.variations).length > 0 && (
                                                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                                                        {Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-[var(--text-primary)] shrink-0">
                                                Rs. {((item.price || 0) * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Pricing breakdown */}
                                <div className="border-t border-[var(--surface-border)] pt-4 space-y-2.5 mb-4">
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-[var(--text-primary)]">Rs. {cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-2">
                                            <span>Shipping</span>
                                            {shipping === 0 && cartTotal > 0 && (
                                                <span className="text-[10px] font-bold text-green-500 uppercase">Free</span>
                                            )}
                                        </div>
                                        <span className="font-semibold text-[var(--text-primary)]">
                                            {shipping === 0 && cartTotal > 0 ? 'Rs. 0.00' : `Rs. ${shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Taxes ({settings?.taxRate ?? 10}%)</span>
                                        <span className="font-semibold text-[var(--text-primary)]">Rs. {taxes.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Grand Total */}
                                <div className="border-t border-[var(--surface-border)] pt-4 mb-5 flex justify-between items-center">
                                    <span className="text-sm font-black tracking-widest uppercase text-[var(--text-primary)]">Total Due</span>
                                    <span className="text-2xl font-black font-sans text-accent">Rs. {grandTotal.toFixed(2)}</span>
                                </div>

                                {/* Place Order CTA */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-[var(--color-primary)] text-white py-4 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 mb-3 shadow-sm"
                                >
                                    {isSubmitting ? 'Processing...' : 'Place Order'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleWhatsAppOrder}
                                    className="w-full bg-green-600 text-white py-4 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-green-700 transition-colors flex justify-center items-center gap-2 mb-4"
                                >
                                    <span>Place Order via WhatsApp</span>
                                </button>

                                {/* Trust row */}
                                <div className="flex items-center justify-center gap-5 text-[var(--text-muted)]">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <Shield size={11} /> Secure Pay
                                    </div>
                                    <span className="w-px h-3 bg-current"></span>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <Lock size={11} /> Encrypted
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
