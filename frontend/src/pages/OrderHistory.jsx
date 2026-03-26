import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, FileText, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../utils/apiClient';
import { useToast } from '../context/ToastContext';
import ThreeBackground from '../components/ThreeBackground';

/* ── Status badge mapping ─────────────────────────────── */
const statusStyles = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    shipped: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
    completed: 'bg-green-500/10 text-green-600 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const getStatusClass = (status) => {
    const key = (status || 'pending').toLowerCase();
    return statusStyles[key] || statusStyles.pending;
};

const OrderHistory = () => {
    const { showToast } = useToast();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchMyOrders = async () => {
            if (!user?.token) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/api/orders/myorders`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                } else {
                    showToast('Failed to load order history', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Server error', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, [user?.token, showToast]);

    return (
        <div className="w-full min-h-screen pt-10 sm:pt-12 pb-20 px-4 sm:px-6 lg:px-10 text-[var(--text-primary)] relative bg-transparent">
            <ThreeBackground variant="auth" />

            <div className="max-w-[1200px] mx-auto relative z-10">

                {/* ── Page Header (tight) ───────────────────── */}
                <div className="mb-6 border-b border-[var(--surface-border)] pb-4">
                    <p className="text-[10px] tracking-[0.4em] font-bold text-accent uppercase mb-1">Transaction Archive</p>
                    <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">
                        Order History
                    </h1>
                    <p className="text-[12px] text-[var(--text-secondary)] tracking-wider mt-1">
                        Your past orders and invoices
                    </p>
                </div>

                {/* ── Loading State ─────────────────────────── */}
                {loading ? (
                    <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-16 flex flex-col items-center justify-center">
                        <div className="w-10 h-[2px] bg-accent animate-pulse mb-4"></div>
                        <p className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Loading orders...</p>
                    </div>

                    /* ── Empty State ────────────────────────────── */
                ) : orders.length === 0 ? (
                    <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-12 sm:p-16 text-center">
                        <ShoppingBag size={40} className="mx-auto mb-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                        <p className="text-sm text-[var(--text-secondary)] mb-6">You haven't placed any orders yet.</p>
                        <Link
                            to="/collections/all"
                            className="btn-primary inline-block px-8 py-3.5 text-[11px] font-black tracking-[0.3em] uppercase"
                        >
                            Start Shopping
                        </Link>
                    </div>

                    /* ── Orders List ────────────────────────────── */
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => {
                            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                            });
                            const shortId = order._id.slice(-8).toUpperCase();

                            return (
                                <div
                                    key={order._id}
                                    className="border border-[var(--surface-border)] bg-[var(--card-bg)] overflow-hidden hover:border-accent/30 transition-colors"
                                >
                                    {/* ── Order Header Row ──────────── */}
                                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--surface-border)] bg-[var(--surface-color)]">

                                        {/* Left: Date + Reference + Total */}
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                            <div>
                                                <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Date</p>
                                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{orderDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Order</p>
                                                <p className="text-[13px] font-semibold text-[var(--text-primary)] tracking-wider">#{shortId}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Total</p>
                                                <p className="text-[13px] font-bold text-accent">Rs. {order.totalPrice.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Right: Status Badge */}
                                        <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold tracking-wider uppercase border rounded-sm shrink-0 ${getStatusClass(order.status)}`}>
                                            {order.status || 'Pending'}
                                        </span>
                                    </div>

                                    {/* ── Items + Action ──────────────── */}
                                    <div className="px-5 py-4">
                                        <div className="space-y-2.5 mb-4">
                                            {order.orderItems?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--surface-border)] last:border-0">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="text-[11px] font-bold text-[var(--text-muted)] shrink-0">[{item.qty}]</span>
                                                        <div className="min-w-0">
                                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{item.name}</p>
                                                            {item.variations && Object.keys(item.variations).length > 0 && (
                                                                <p className="text-[11px] text-[var(--text-muted)] truncate">
                                                                    {Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">Rs. {item.price.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* View Invoice Button */}
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-accent hover:underline transition-colors"
                                        >
                                            <FileText size={14} />
                                            View Invoice
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Invoice Modal ─────────────────────────────────── */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 pt-24 sm:pt-32"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[var(--bg-color)] w-[94%] sm:w-full sm:max-w-3xl max-h-[82vh] sm:max-h-[85vh] overflow-y-auto relative border border-[var(--surface-border)] shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-[var(--bg-color)] border-b border-[var(--surface-border)] px-6 py-4 flex items-center justify-between z-10">
                                <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] uppercase tracking-wider">Invoice</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 sm:p-8">

                                {/* Invoice Meta */}
                                <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 pb-6 border-b border-[var(--surface-border)]">
                                    <div>
                                        <h3 className="text-xl font-serif font-bold text-[var(--text-primary)] mb-2">Eyestyle</h3>
                                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                            123 Vision Way<br />New York, NY 10001<br />support@eyestyle.com
                                        </p>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-1">Order Reference</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)] tracking-wider mb-2">#{selectedOrder._id.toUpperCase()}</p>
                                        <p className="text-[12px] text-[var(--text-secondary)]">{new Date(selectedOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Recipient */}
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] mb-1">Billed To</p>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">{user?.name}</p>
                                    <p className="text-[12px] text-[var(--text-secondary)]">{user?.email}</p>
                                </div>

                                {/* Items Table */}
                                <table className="w-full mb-6">
                                    <thead>
                                        <tr className="border-b border-[var(--surface-border)]">
                                            <th className="text-left text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] py-3">Item</th>
                                            <th className="text-center text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] py-3">Qty</th>
                                            <th className="text-right text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] py-3">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.orderItems?.map((item, idx) => (
                                            <tr key={idx} className="border-b border-[var(--surface-border)] last:border-0">
                                                <td className="py-3">
                                                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{item.name}</p>
                                                    {item.variations && Object.keys(item.variations).length > 0 && (
                                                        <p className="text-[11px] text-[var(--text-muted)]">
                                                            {Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-3 text-center text-sm text-[var(--text-secondary)]">{item.qty}</td>
                                                <td className="py-3 text-right text-sm font-semibold text-[var(--text-primary)]">Rs. {item.price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-[var(--text-primary)]">
                                            Rs. {(selectedOrder.totalPrice - (selectedOrder.shippingPrice || 0) - (selectedOrder.taxPrice || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                        <span>Shipping</span>
                                        <span className="font-semibold text-[var(--text-primary)]">Rs. {(selectedOrder.shippingPrice || 0).toFixed(2)}</span>
                                    </div>
                                    {(selectedOrder.taxPrice || 0) > 0 && (
                                        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                            <span>Tax</span>
                                            <span className="font-semibold text-[var(--text-primary)]">Rs. {selectedOrder.taxPrice.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-3 border-t border-[var(--surface-border)]">
                                        <span className="text-sm font-black tracking-widest uppercase text-[var(--text-primary)]">Total</span>
                                        <span className="text-xl font-black text-accent">Rs. {selectedOrder.totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--surface-border)]">
                                    <p className="text-[11px] text-[var(--text-muted)] tracking-wider">Thank you for shopping with us.</p>
                                    <button
                                        onClick={() => window.print()}
                                        className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-[11px] tracking-wider uppercase"
                                    >
                                        <Package size={14} />
                                        Print Invoice
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderHistory;
