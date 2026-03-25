import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, X, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/apiClient';

const resolveImageUrl = (img) => {
    if (!img || typeof img !== 'string') return '/images/sample.jpg';
    if (img.startsWith('http') || img.startsWith('https') || img.startsWith('/images/')) return img;
    return img;
};

const OrderList = () => {
    const { showToast } = useToast();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tabs for Active vs Completed
    const [activeTab, setActiveTab] = useState('active'); // active, completed, all
    const [searchTerm, setSearchTerm] = useState('');

    // Modal
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    const openInvoiceModal = (order) => {
        setSelectedOrder(order);
        setIsInvoiceModalOpen(true);
    };

    const fetchOrders = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchOrders();
    }, [user?.token]);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/orders/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showToast(`Order marked as ${newStatus}`, 'success');
                // Also update local state for immediate feedback
                setOrders(orders.map(o => o._id === id ? { ...o, status: newStatus } : o));
                if (selectedOrder && selectedOrder._id === id) {
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                }
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
    };

    const handleCancelOrder = async (id) => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            await handleUpdateStatus(id, 'cancelled');
            setIsModalOpen(false);
        }
    };

    const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
        const orderIdStr = order._id ? String(order._id) : '';
        const matchesSearch = orderIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const currentStatus = order.status || 'pending';
        const isActive = ['pending', 'processing', 'shipped'].includes(currentStatus);
        const isCompleted = currentStatus === 'delivered';
        const isCancelled = currentStatus === 'cancelled';

        let matchesTab = true;
        if (activeTab === 'active') matchesTab = isActive;
        if (activeTab === 'completed') matchesTab = isCompleted;
        if (activeTab === 'cancelled') matchesTab = isCancelled;
        if (activeTab === 'all') matchesTab = true;

        return matchesSearch && matchesTab;
    }) : [];

    const openDetailsModal = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Orders</h1>
                    <p className="text-[var(--text-primary)] text-sm mt-1">Track and manage customer orders.</p>
                </div>
            </div>

            {/* List */}
            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none">
                <div className="border-b border-[var(--surface-border)] flex p-4 gap-6 items-center">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`text-xs font-bold tracking-widest uppercase pb-1 border-b-2 ${activeTab === 'active' ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:border-[var(--surface-border)]'}`}
                    >
                        Active Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`text-xs font-bold tracking-widest uppercase pb-1 border-b-2 ${activeTab === 'completed' ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:border-[var(--surface-border)]'}`}
                    >
                        Completed Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('cancelled')}
                        className={`text-xs font-bold tracking-widest uppercase pb-1 border-b-2 ${activeTab === 'cancelled' ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:border-[var(--surface-border)]'}`}
                    >
                        Cancelled
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`text-xs font-bold tracking-widest uppercase pb-1 border-b-2 ${activeTab === 'all' ? 'border-[var(--text-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:border-[var(--surface-border)]'}`}
                    >
                        All
                    </button>
                </div>

                <div className="p-4 border-b border-[var(--surface-border)] flex justify-between items-center gap-4">
                    <div className="flex items-center bg-[var(--surface-color)] px-3 py-2 border border-[var(--surface-border)] w-full max-w-md">
                        <Search size={14} className="text-[var(--text-primary)] mr-2" />
                        <input
                            type="text"
                            placeholder="Search orders by ID or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--surface-color)] text-xs uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--surface-border)]">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-border)]">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-[var(--text-primary)] italic">Syncing Orders...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-[var(--text-primary)] italic">No {activeTab !== 'all' ? activeTab : ''} orders found.</td></tr>
                            ) : filteredOrders.map((order) => (
                                <tr key={order._id || Math.random()} className="hover:bg-surface">
                                    <td className="px-6 py-4 font-bold text-[var(--text-primary)] text-xs uppercase tracking-widest">{order._id ? String(order._id).substring(18) : 'N/A'}</td>
                                    <td className="px-6 py-4 text-[var(--text-primary)]">{order.user?.name || 'Guest'}</td>
                                    <td className="px-6 py-4 text-[var(--text-primary)]">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right font-medium">${(order.totalPrice || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={order.status || 'pending'}
                                            onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                            className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider outline-none cursor-pointer border border-transparent hover:border-[var(--surface-border)] w-24 ${order.status === 'delivered' ? 'bg-[var(--surface-color)] text-[var(--text-primary)]' :
                                                order.status === 'shipped' ? 'bg-[var(--surface-color)] text-[var(--text-primary)]' :
                                                    order.status === 'processing' ? 'bg-[var(--surface-color)] text-[var(--text-primary)]' :
                                                        order.status === 'cancelled' ? 'bg-[var(--surface-color)] text-[var(--text-primary)]' : 'bg-[var(--surface-color)] text-[var(--text-primary)]'
                                                }`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                                        <button onClick={() => openInvoiceModal(order)} className="text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-xs uppercase tracking-widest font-bold mt-1 transition-colors">
                                            <FileText size={14} /> Invoice
                                        </button>
                                        <button onClick={() => openDetailsModal(order)} className="text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-xs uppercase tracking-widest font-bold mt-1 transition-colors">
                                            <Eye size={14} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] border border-[var(--surface-border)] rounded-none w-full max-w-3xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-primary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6 border-b border-[var(--surface-border)] pb-4">
                            <h2 className="text-xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Order Details</h2>
                            <p className="text-sm text-[var(--text-primary)] mt-1">ID: #{selectedOrder._id}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] mb-3 border-b border-[var(--surface-border)] pb-2">Customer Information</h3>
                                <p className="text-sm font-medium mb-1">{selectedOrder.user?.name || 'Guest'}</p>
                                <p className="text-sm text-[var(--text-primary)] mb-1">{selectedOrder.user?.email || 'N/A'}</p>
                                <div className="mt-4">
                                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Shipping Address</h4>
                                    <p className="text-sm text-[var(--text-primary)]">
                                        {selectedOrder.shippingAddress?.address}<br />
                                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}<br />
                                        {selectedOrder.shippingAddress?.country}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] mb-3 border-b border-[var(--surface-border)] pb-2">Order Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-[var(--text-primary)]">Status:</span> <span className="font-bold uppercase tracking-wider">{selectedOrder.status}</span></div>
                                    <div className="flex justify-between"><span className="text-[var(--text-primary)]">Date:</span> <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-[var(--text-primary)]">Payment Method:</span> <span>{selectedOrder.paymentMethod}</span></div>
                                    <div className="flex justify-between pt-2 border-t border-[var(--surface-border)] mt-2 font-bold mb-4"><span>Total Amount:</span> <span>${selectedOrder.totalPrice?.toFixed(2)}</span></div>
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
                                    <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Order Actions</h4>
                                    {selectedOrder.status !== 'cancelled' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedOrder._id, 'processing')}
                                                disabled={selectedOrder.status === 'processing' || selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'}
                                                className={`w-full border py-2 text-xs font-bold tracking-widest uppercase transition-colors ${selectedOrder.status === 'processing'
                                                    ? 'bg-black text-white border-[var(--text-primary)] cursor-default'
                                                    : selectedOrder.status === 'pending'
                                                        ? 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--text-primary)] hover:bg-black hover:text-white'
                                                        : 'bg-[var(--surface-color)] text-[var(--text-primary)] border-[var(--surface-border)] cursor-not-allowed opacity-50'
                                                    }`}
                                            >
                                                {selectedOrder.status === 'processing' ? 'Currently Processing' : 'Mark Processing'}
                                            </button>

                                            <button
                                                onClick={() => handleUpdateStatus(selectedOrder._id, 'shipped')}
                                                disabled={selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'}
                                                className={`w-full border py-2 text-xs font-bold tracking-widest uppercase transition-colors ${selectedOrder.status === 'shipped'
                                                    ? 'bg-black text-white border-[var(--text-primary)] cursor-default'
                                                    : (selectedOrder.status === 'pending' || selectedOrder.status === 'processing')
                                                        ? 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--text-primary)] hover:bg-black hover:text-white'
                                                        : 'bg-[var(--surface-color)] text-[var(--text-primary)] border-[var(--surface-border)] cursor-not-allowed opacity-50'
                                                    }`}
                                            >
                                                {selectedOrder.status === 'shipped' ? 'Currently Shipped' : 'Mark Shipped'}
                                            </button>

                                            <button
                                                onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered')}
                                                disabled={selectedOrder.status === 'delivered'}
                                                className={`w-full border py-2 text-xs font-bold tracking-widest uppercase transition-colors ${selectedOrder.status === 'delivered'
                                                    ? 'bg-black text-white border-[var(--text-primary)] cursor-default'
                                                    : (selectedOrder.status === 'pending' || selectedOrder.status === 'processing' || selectedOrder.status === 'shipped')
                                                        ? 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--text-primary)] hover:bg-black hover:text-white'
                                                        : 'bg-[var(--surface-color)] text-[var(--text-primary)] border-[var(--surface-border)] cursor-not-allowed opacity-50'
                                                    }`}
                                            >
                                                {selectedOrder.status === 'delivered' ? 'Completed (Delivered)' : 'Mark Delivered'}
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                                        <button
                                            onClick={() => handleCancelOrder(selectedOrder._id)}
                                            className="w-full border border-red-900 text-red-900 bg-[var(--card-bg)] py-2 text-xs font-bold tracking-widest uppercase hover:bg-red-900 hover:text-white mt-4 transition-colors"
                                        >Cancel Order</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] mb-3 border-b border-[var(--surface-border)] pb-2">Items Ordered</h3>
                            <div className="space-y-4">
                                {selectedOrder.orderItems?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-center bg-[var(--surface-color)] p-3">
                                        <img src={resolveImageUrl(item.image)} alt={item.name} className="w-16 h-16 object-cover border border-[var(--surface-border)]" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{item.name}</p>
                                            <p className="text-xs text-[var(--text-primary)]">Qty: {item.qty} x ${item.price.toFixed(2)}</p>
                                        </div>
                                        <div className="font-bold text-sm">
                                            ${(item.qty * item.price).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {isInvoiceModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-[var(--bg-color)] print:fixed print:inset-0">
                    <div className="bg-[var(--bg-color)] border border-[var(--surface-border)] rounded-none w-full max-w-2xl max-h-[90vh] overflow-y-auto relative print:max-w-full print:h-auto print:overflow-visible print:border-none">
                        <div className="flex justify-between items-center bg-[var(--surface-color)] px-6 py-4 border-b border-[var(--surface-border)] sticky top-0 print:hidden">
                            <h2 className="font-serif text-xl font-bold tracking-widest uppercase text-[var(--text-primary)]">Invoice #{selectedOrder._id.substring(18)}</h2>
                            <button onClick={() => setIsInvoiceModalOpen(false)} className="text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between mb-12">
                                <div>
                                    <h3 className="font-serif text-2xl font-bold tracking-widest mb-2 text-[var(--text-primary)]">EYESTYLE</h3>
                                    <p className="text-sm text-[var(--text-primary)]">123 Vision Way<br />New York, NY 10001<br />support@eyestyle.com</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] mb-1">Date</p>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mb-8 border-b border-[var(--surface-border)] pb-6">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)] mb-3">Bill To:</h4>
                                <p className="text-sm text-[var(--text-primary)] font-medium">{selectedOrder.user?.name || 'Guest'}</p>
                                <p className="text-sm text-[var(--text-primary)]">{selectedOrder.user?.email || 'N/A'}</p>
                                <p className="text-sm text-[var(--text-primary)] mt-2">
                                    {selectedOrder.shippingAddress?.address}<br />
                                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}<br />
                                    {selectedOrder.shippingAddress?.country}
                                </p>
                            </div>

                            <table className="w-full text-sm mb-8">
                                <thead>
                                    <tr className="border-b border-[var(--surface-border)]">
                                        <th className="text-left font-bold uppercase tracking-widest text-[var(--text-primary)] py-3">Item</th>
                                        <th className="text-center font-bold uppercase tracking-widest text-[var(--text-primary)] py-3">Qty</th>
                                        <th className="text-right font-bold uppercase tracking-widest text-[var(--text-primary)] py-3">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.orderItems?.map((item, idx) => (
                                        <tr key={idx} className="border-b border-[var(--surface-border)]">
                                            <td className="py-4 text-[var(--text-primary)]">{item.name}</td>
                                            <td className="py-4 text-center text-[var(--text-primary)]">{item.qty}</td>
                                            <td className="py-4 text-right text-[var(--text-primary)] font-medium">${item.price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-end">
                                <div className="w-64 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-primary)]">Subtotal</span>
                                        <span className="font-medium text-[var(--text-primary)]">${(selectedOrder.itemsPrice || (selectedOrder.totalPrice - selectedOrder.shippingPrice - selectedOrder.taxPrice)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-primary)]">Shipping</span>
                                        <span className="font-medium text-[var(--text-primary)]">${(selectedOrder.shippingPrice || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--text-primary)]">Tax</span>
                                        <span className="font-medium text-[var(--text-primary)]">${(selectedOrder.taxPrice || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-3 border-t border-[var(--surface-border)] text-[var(--text-primary)]">
                                        <span>Total</span>
                                        <span>${(selectedOrder.totalPrice || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 text-center border-t border-[var(--surface-border)] pt-8 print:hidden">
                                <p className="text-sm text-[var(--text-primary)] italic">Thank you for shopping with EYESTYLE.</p>
                                <button onClick={() => window.print()} className="mt-6 border border-[var(--text-primary)] px-8 py-3 text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--text-primary)] hover:bg-black hover:text-white transition-colors">
                                    Print Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderList;
