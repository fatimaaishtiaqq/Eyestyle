import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Package, DollarSign, LayoutDashboard, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/apiClient';
import AdminDashboardSkeleton from '../../components/skeletons/AdminDashboardSkeleton';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Check if admin is logged in, else redirect
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    React.useEffect(() => {
        if (!user || (!user.isAdmin && user.role !== 'superadmin' && user.role !== 'manager')) {
            navigate('/account');
        }
    }, [user, navigate]);
    // Dashboard data via React Query
    const { data: metricsData, isLoading: metricsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/dashboard/metrics`, {
                headers: { 'Authorization': `Bearer ${user?.token}` },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch metrics');
            return res.json();
        },
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        enabled: !!(user?.token),
    });

    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['admin-dashboard-products'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/api/products/admin?limit=5&page=1`, {
                headers: { 'Authorization': `Bearer ${user?.token}` },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch products');
            return res.json();
        },
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        enabled: !!(user?.token),
    });

    const loading = metricsLoading || productsLoading;
    const metrics = metricsData || { totalRevenue: 0, activeOrders: 0, totalCustomers: 0 };
    const products = productsData?.products?.slice(0, 5) || [];

    const handleDelete = (id) => {
        showToast('Please delete products from the Products tab', 'info');
    };

    if (!user || (!user.isAdmin && user.role !== 'superadmin' && user.role !== 'manager')) return null;

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

            {loading ? (
                <AdminDashboardSkeleton />
            ) : (
                <>
                    {/* Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 flex flex-col justify-between rounded-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-[var(--surface-color)] p-3 rounded-sm text-[var(--color-electric-blue)]"><DollarSign size={20} /></div>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-medium mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-sans font-bold text-[var(--text-primary)]">
                            Rs. {loading ? '...' : metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                    <td className="px-6 py-4 text-[var(--text-primary)]">Rs. {product.price.toFixed(2)}</td>
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
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
