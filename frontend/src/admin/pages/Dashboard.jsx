import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Package, DollarSign, LayoutDashboard, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/apiClient';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Check if admin is logged in, else redirect
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    React.useEffect(() => {
        if (!user || !user.isAdmin) {
            navigate('/account');
        }
    }, [user?.isAdmin, navigate]);
    // Dashboard state
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeOrders: 0,
        totalCustomers: 0
    });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user || (!user.isAdmin && user.role !== 'superadmin' && user.role !== 'manager')) return;

            try {
                // Fetch metrics
                const metricsRes = await fetch(`${API_BASE_URL}/api/dashboard/metrics`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (metricsRes.ok) {
                    const metricsData = await metricsRes.json();
                    setMetrics(metricsData);
                }

                // Fetch products (for inventory overview)
                const productsRes = await fetch(`${API_BASE_URL}/api/products`);
                if (productsRes.ok) {
                    const productsData = await productsRes.json();
                    if (productsData.products && Array.isArray(productsData.products)) {
                        setProducts(productsData.products.slice(0, 5));
                    } else if (Array.isArray(productsData)) {
                        setProducts(productsData.slice(0, 5));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                showToast('Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.token]);

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== id));
            showToast('Product deleted successfully', 'error');
        }
    };

    if (!user || !user.isAdmin) return null;

    return (
        <div className="w-full pt-6 pb-20 min-h-screen text-[var(--text-primary)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-[var(--surface-border)]">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-widest uppercase flex items-center gap-3 text-[var(--text-primary)]">
                        <LayoutDashboard className="text-[var(--text-primary)]" size={28} />
                        Admin Panel
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm font-light mt-1">Manage your store, products, and orders.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] bg-[var(--surface-color)] px-4 py-2 border border-[var(--surface-border)] rounded-sm">
                        Welcome, {user.name}
                    </span>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 flex flex-col justify-between rounded-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-[var(--surface-color)] p-3 rounded-sm text-[var(--color-electric-blue)]"><DollarSign size={20} /></div>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-sans font-bold text-[var(--text-primary)]">
                            ${loading ? '...' : metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 flex flex-col justify-between rounded-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-[var(--surface-color)] p-3 rounded-sm text-[var(--color-electric-blue)]"><Package size={20} /></div>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-1">Active Orders</p>
                        <h3 className="text-3xl font-sans font-bold text-[var(--text-primary)]">{loading ? '...' : metrics.activeOrders}</h3>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 flex flex-col justify-between rounded-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-[var(--surface-color)] p-3 rounded-sm text-[var(--color-electric-blue)]"><Users size={20} /></div>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-1">Total Customers</p>
                        <h3 className="text-3xl font-sans font-bold text-[var(--text-primary)]">{loading ? '...' : metrics.totalCustomers}</h3>
                    </div>
                </div>
            </div>

            {/* Product Management Table */}
            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none">
                <div className="px-6 py-5 border-b border-[var(--surface-border)] flex justify-between items-center">
                    <h2 className="text-sm font-bold tracking-widest uppercase">Product Inventory</h2>
                    <button onClick={() => showToast('Create product modal would open here')} className="btn-primary text-xs px-4 py-2 uppercase tracking-widest transition-colors rounded-sm">
                        + Add Product
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--surface-color)] text-xs uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--surface-border)]">
                            <tr>
                                <th className="px-6 py-4 font-medium">Product ID</th>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Stock</th>
                                <th className="px-6 py-4 font-medium">Price</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-[var(--text-muted)] italic">Loading parameters...</td>
                                </tr>
                            ) : products.map((product) => (
                                <tr key={product._id} className="hover:bg-[var(--surface-color)] transition-colors">
                                    <td className="px-6 py-4 font-medium text-[var(--text-primary)] text-xs">{product._id.substring(18).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-[var(--text-primary)] max-w-[200px] truncate" title={product.name}>{product.name}</td>
                                    <td className="px-6 py-4 text-[var(--text-primary)]">{product.countInStock} units</td>
                                    <td className="px-6 py-4 text-[var(--text-primary)]">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-[10px] rounded-sm uppercase font-bold tracking-wider ${product.isActive !== false ? 'bg-[var(--surface-border)] text-[var(--text-primary)]' :
                                            'bg-[var(--surface-color)] text-[var(--text-muted)]'
                                            }`}>
                                            {product.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                                        <button onClick={() => showToast('Edit product modal would open here')} className="text-primary hover:text-primary transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(product.id)} className="text-primary hover:text-accent transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-primary italic">No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
