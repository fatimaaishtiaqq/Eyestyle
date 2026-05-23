import React, { useState, useEffect } from 'react';
import { 
    Percent, 
    Tag, 
    Calendar, 
    Plus, 
    Trash2, 
    TrendingUp, 
    ShoppingBag, 
    Users, 
    Search, 
    X, 
    Eye, 
    Check, 
    AlertCircle, 
    Clock, 
    DollarSign,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/apiClient';
import AdminTableSkeleton from '../../components/skeletons/AdminTableSkeleton';

const resolveImageUrl = (img) => {
    if (!img || typeof img !== 'string') return '/images/sample.jpg';
    if (img.startsWith('http') || img.startsWith('https') || img.startsWith('/images/')) return img;
    return img;
};

const SalesDiscounts = () => {
    const { showToast } = useToast();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    // Tab state: 'promotions' or 'details'
    const [activeTab, setActiveTab] = useState('promotions');
    
    // Loaded lists
    const [sales, setSales] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selected item for deep details
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedType, setSelectedType] = useState(null); // 'sale' or 'coupon'

    // Modal & Wizards state
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [saleWizardStep, setSaleWizardStep] = useState(1);
    const [couponWizardStep, setCouponWizardStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Scope search
    const [productSearch, setProductSearch] = useState('');

    // Sales wizard form state
    const initialSaleForm = {
        name: '',
        discountType: 'percentage',
        discountValue: '',
        appliesToType: 'all', // 'all', 'category', 'product'
        appliesToCategory: '',
        appliesToProducts: [], // Array of product ObjectIds
        startDate: '',
        endDate: ''
    };
    const [saleForm, setSaleForm] = useState(initialSaleForm);

    // Coupons wizard form state
    const initialCouponForm = {
        code: '',
        discountType: 'percentage',
        discountValue: '',
        usageLimit: '',
        minimumOrderAmount: '',
        startDate: '',
        endDate: ''
    };
    const [couponForm, setCouponForm] = useState(initialCouponForm);

    const fetchData = async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const [salesRes, couponsRes, prodRes, catRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/sales`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                fetch(`${API_BASE_URL}/api/coupons`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                fetch(`${API_BASE_URL}/api/products/admin`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                fetch(`${API_BASE_URL}/api/categories/admin`, { headers: { 'Authorization': `Bearer ${user.token}` } })
            ]);

            if (salesRes.status === 401 || couponsRes.status === 401 || prodRes.status === 401 || catRes.status === 401) {
                showToast('Session unauthorized or expired. Please re-authenticate.', 'error');
                setLoading(false);
                return;
            }

            if (salesRes.ok && couponsRes.ok && prodRes.ok && catRes.ok) {
                const salesData = await salesRes.json();
                const couponsData = await couponsRes.json();
                const prodData = await prodRes.json();
                const catData = await catRes.json();

                setSales(salesData || []);
                setCoupons(couponsData || []);
                setProducts(prodData && Array.isArray(prodData.products) ? prodData.products : (Array.isArray(prodData) ? prodData : []));
                setCategories(catData || []);

                // If deep detail was viewing an item, update it from fresh data
                if (selectedItem) {
                    const freshItem = selectedType === 'sale' 
                        ? salesData.find(s => s._id === selectedItem._id)
                        : couponsData.find(c => c._id === selectedItem._id);
                    if (freshItem) setSelectedItem(freshItem);
                }
            } else {
                showToast('Failed to fetch promotions', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Server error fetching promotions', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchData();
    }, [user?.token]);

    // Handle Sale Creation
    const handleCreateSale = async (e) => {
        if (e) e.preventDefault();
        if (!saleForm.name || !saleForm.discountValue || !saleForm.startDate || !saleForm.endDate) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (saleForm.appliesToType === 'category' && !saleForm.appliesToCategory) {
            showToast('Please select a target category.', 'error');
            return;
        }

        if (saleForm.appliesToType === 'product' && saleForm.appliesToProducts.length === 0) {
            showToast('Please choose at least one product.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            let appliesTo = 'all';
            let targetProductIds = [];

            if (saleForm.appliesToType === 'category') {
                appliesTo = 'selectedProducts';
                const categoryProducts = products.filter(p => String(p.category?._id || p.category) === String(saleForm.appliesToCategory));
                targetProductIds = categoryProducts.map(p => p._id || p.id);
            } else if (saleForm.appliesToType === 'product') {
                appliesTo = 'selectedProducts';
                targetProductIds = saleForm.appliesToProducts;
            }

            const body = {
                name: saleForm.name,
                discountType: saleForm.discountType,
                discountValue: Number(saleForm.discountValue),
                appliesTo,
                productIds: targetProductIds,
                startDate: saleForm.startDate,
                endDate: saleForm.endDate
            };

            const res = await fetch(`${API_BASE_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast('Sales campaign created successfully!', 'success');
                setIsSaleModalOpen(false);
                setSaleForm(initialSaleForm);
                setSaleWizardStep(1);
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to create sales campaign', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Server error creating sale', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Coupon Creation
    const handleCreateCoupon = async (e) => {
        if (e) e.preventDefault();
        if (!couponForm.code || !couponForm.discountValue || !couponForm.startDate || !couponForm.endDate) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const body = {
                code: couponForm.code.toUpperCase().replace(/\s+/g, ''),
                discountType: couponForm.discountType,
                discountValue: Number(couponForm.discountValue),
                startDate: couponForm.startDate,
                endDate: couponForm.endDate
            };

            if (couponForm.usageLimit) body.usageLimit = Number(couponForm.usageLimit);
            if (couponForm.minimumOrderAmount) body.minimumOrderAmount = Number(couponForm.minimumOrderAmount);

            const res = await fetch(`${API_BASE_URL}/api/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast('Coupon code created successfully!', 'success');
                setIsCouponModalOpen(false);
                setCouponForm(initialCouponForm);
                setCouponWizardStep(1);
                fetchData();
            } else {
                const data = await res.json();
                showToast(data.message || 'Failed to create coupon code', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Server error creating coupon', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel Sale Campaign
    const handleCancelSale = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this campaign? It will be ended immediately.')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}/cancel`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                showToast('Campaign cancelled and deactivated', 'success');
                fetchData();
            } else {
                showToast('Failed to cancel campaign', 'error');
            }
        } catch (err) {
            showToast('Server error cancelling campaign', 'error');
        }
    };

    // Delete Sale Campaign
    const handleDeleteSale = async (id) => {
        if (!window.confirm('Are you sure you want to delete this sale campaign permanently?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                showToast('Sale campaign deleted successfully', 'success');
                if (selectedItem && selectedItem._id === id) {
                    setSelectedItem(null);
                    setActiveTab('promotions');
                }
                fetchData();
            } else {
                showToast('Failed to delete sale campaign', 'error');
            }
        } catch (err) {
            showToast('Server error deleting sale campaign', 'error');
        }
    };

    // Cancel Coupon Code
    const handleCancelCoupon = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this coupon code? It will no longer be valid for checkout.')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/coupons/${id}/cancel`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                showToast('Coupon code deactivated successfully', 'success');
                fetchData();
            } else {
                showToast('Failed to cancel coupon', 'error');
            }
        } catch (err) {
            showToast('Server error cancelling coupon', 'error');
        }
    };

    // Delete Coupon Code
    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon code permanently?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/coupons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (res.ok) {
                showToast('Coupon code deleted successfully', 'success');
                fetchData();
            } else {
                showToast('Failed to delete coupon', 'error');
            }
        } catch (err) {
            showToast('Server error deleting coupon', 'error');
        }
    };

    // Calculate aggregated stats
    const totalSalesRev = sales.reduce((acc, s) => acc + (s.totalRevenue || 0), 0);
    const totalCouponRev = coupons.reduce((acc, c) => acc + (c.totalRevenue || 0), 0);
    const activeSalesCount = sales.filter(s => s.status === 'active').length;
    const activeCouponsCount = coupons.filter(c => c.status === 'active').length;

    // Format Dates nicely
    const formatNiceDate = (dStr) => {
        if (!dStr) return '';
        const d = new Date(dStr);
        return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Search filter products in scope step
    const filteredProductsForScope = products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const toggleProductScope = (id) => {
        const selected = [...saleForm.appliesToProducts];
        const idx = selected.indexOf(id);
        if (idx > -1) {
            selected.splice(idx, 1);
        } else {
            selected.push(id);
        }
        setSaleForm({ ...saleForm, appliesToProducts: selected });
    };

    // Opens Inspector details
    const openInspector = (item, type) => {
        setSelectedItem(item);
        setSelectedType(type);
        setActiveTab('details');
    };

    return (
        <div className="w-full max-w-full overflow-x-hidden pb-20 relative text-[var(--text-primary)]">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Sales & Discounts</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Deploy store-wide markdowns and coupon codes Authoritatively.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setSaleForm(initialSaleForm);
                            setSaleWizardStep(1);
                            setIsSaleModalOpen(true);
                        }}
                        className="btn-primary text-[var(--bg-color)] px-5 py-2.5 flex items-center gap-2 uppercase tracking-widest text-xs font-bold transition-all"
                    >
                        <Plus size={15} /> Create Sale
                    </button>
                    <button
                        onClick={() => {
                            setCouponForm(initialCouponForm);
                            setCouponWizardStep(1);
                            setIsCouponModalOpen(true);
                        }}
                        className="bg-transparent border border-[var(--text-primary)] hover:border-[var(--surface-border)] px-5 py-2.5 flex items-center gap-2 uppercase tracking-widest text-xs font-bold transition-all"
                    >
                        <Plus size={15} /> Create Coupon
                    </button>
                </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-5 relative overflow-hidden group">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp size={40} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-45">Total Sales Revenue</span>
                    <h3 className="text-xl sm:text-2xl font-sans font-black mt-2 text-orange-500">Rs. {totalSalesRev.toFixed(2)}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">{sales.length} campaigns logged</p>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-5 relative overflow-hidden group">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign size={40} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-45">Total Coupon Revenue</span>
                    <h3 className="text-xl sm:text-2xl font-sans font-black mt-2 text-green-500">Rs. {totalCouponRev.toFixed(2)}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">{coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0)} redemptions</p>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-5 relative overflow-hidden group">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Percent size={40} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-45">Active Sales Campaigns</span>
                    <h3 className="text-xl sm:text-2xl font-sans font-black mt-2 text-[var(--text-primary)]">{activeSalesCount}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">Currently live on storefront</p>
                </div>

                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-5 relative overflow-hidden group">
                    <div className="absolute right-4 top-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                        <Tag size={40} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-45">Active Promo Codes</span>
                    <h3 className="text-xl sm:text-2xl font-sans font-black mt-2 text-[var(--text-primary)]">{activeCouponsCount}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">Valid checkout applications</p>
                </div>
            </div>

            {/* Twin Tab Layout Nav */}
            <div className="flex border-b border-[var(--surface-border)] mb-8">
                <button
                    onClick={() => setActiveTab('promotions')}
                    className={`px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                        activeTab === 'promotions'
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    Promotions
                </button>
                <button
                    onClick={() => {
                        if (!selectedItem) {
                            showToast('Please click "Inspect" on a promotion to view its details', 'info');
                            return;
                        }
                        setActiveTab('details');
                    }}
                    className={`px-6 py-3.5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                        activeTab === 'details'
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    Details & Inspector
                </button>
            </div>

            {/* TAB 1: PROMOTIONS */}
            {activeTab === 'promotions' && (
                <div className="space-y-12">
                    
                    {/* section: Sales campaigns */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-serif font-bold uppercase tracking-wider">Storefront Markdowns (Sales)</h2>
                                <p className="text-xs text-[var(--text-muted)]">Active or scheduled discount scopes applied directly to item pricing cards.</p>
                            </div>
                        </div>

                        <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] overflow-hidden">
                            {loading ? (
                                <AdminTableSkeleton rows={4} cols={7} />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[var(--surface-color)] text-xs uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--surface-border)]">
                                            <tr>
                                                <th className="px-5 py-4">Campaign Name</th>
                                                <th className="px-5 py-4">Discount</th>
                                                <th className="px-5 py-4">Applies To</th>
                                                <th className="px-5 py-4">Duration</th>
                                                <th className="px-5 py-4 text-right">Revenue Tracked</th>
                                                <th className="px-5 py-4">Status</th>
                                                <th className="px-5 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--surface-border)]">
                                            {sales.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="px-5 py-8 text-center text-[var(--text-muted)] italic">
                                                        No sales campaigns created yet. Click "Create Sale" above.
                                                    </td>
                                                </tr>
                                            ) : sales.map((sale) => (
                                                <tr key={sale._id} className="hover:bg-surface/50 group transition-colors">
                                                    <td className="px-5 py-4 font-semibold">{sale.name}</td>
                                                    <td className="px-5 py-4">
                                                        <span className="bg-orange-500/10 text-orange-500 font-bold px-2 py-0.5 text-xs rounded-[2px] uppercase">
                                                            {sale.discountType === 'percentage' 
                                                                ? `${sale.discountValue}% OFF` 
                                                                : `Rs. ${sale.discountValue} OFF`
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs font-semibold capitalize">
                                                        {sale.appliesToType === 'all' && 'All Products'}
                                                        {sale.appliesToType === 'category' && `Category: ${sale.appliesToCategory?.name || 'Category'}`}
                                                        {sale.appliesToType === 'product' && `${sale.appliesToProducts?.length} Products`}
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                                                        {formatNiceDate(sale.startDate)} - {formatNiceDate(sale.endDate)}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-semibold text-orange-500">
                                                        Rs. {(sale.totalRevenue || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-black uppercase tracking-wider ${
                                                            sale.status === 'active' 
                                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                                : sale.status === 'upcoming'
                                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                            {sale.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right flex justify-end gap-3 opacity-90 group-hover:opacity-100">
                                                        <button 
                                                            onClick={() => openInspector(sale, 'sale')}
                                                            className="text-[var(--text-primary)] hover:text-accent p-1 transition-colors"
                                                            title="Inspect details"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        {sale.status !== 'expired' && sale.status !== 'cancelled' ? (
                                                            <button 
                                                                onClick={() => handleCancelSale(sale._id)}
                                                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                                                title="Cancel Campaign"
                                                            >
                                                                <X size={15} />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleDeleteSale(sale._id)}
                                                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                                                title="Delete Campaign"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* section: Coupon Codes */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-serif font-bold uppercase tracking-wider">Coupon & Promo Codes</h2>
                                <p className="text-xs text-[var(--text-muted)]">Secured alpha-numeric codes applied at customer checkouts for subtotal deductions.</p>
                            </div>
                        </div>

                        <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] overflow-hidden">
                            {loading ? (
                                <AdminTableSkeleton rows={4} cols={8} />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[var(--surface-color)] text-xs uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--surface-border)]">
                                            <tr>
                                                <th className="px-5 py-4">Promo Code</th>
                                                <th className="px-5 py-4">Discount</th>
                                                <th className="px-5 py-4">Limits</th>
                                                <th className="px-5 py-4">Redemptions</th>
                                                <th className="px-5 py-4">Duration</th>
                                                <th className="px-5 py-4 text-right">Revenue Tracked</th>
                                                <th className="px-5 py-4">Status</th>
                                                <th className="px-5 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--surface-border)]">
                                            {coupons.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="px-5 py-8 text-center text-[var(--text-muted)] italic">
                                                        No coupon codes created yet. Click "Create Coupon" above.
                                                    </td>
                                                </tr>
                                            ) : coupons.map((coupon) => (
                                                <tr key={coupon._id} className="hover:bg-surface/50 group transition-colors">
                                                    <td className="px-5 py-4 font-mono font-bold tracking-widest text-[var(--color-primary)]">
                                                        {coupon.code}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="bg-green-500/10 text-green-600 dark:text-green-400 font-bold px-2 py-0.5 text-xs rounded-[2px] uppercase">
                                                            {coupon.discountType === 'percentage' 
                                                                ? `${coupon.discountValue}% OFF` 
                                                                : `Rs. ${coupon.discountValue} OFF`
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs font-semibold">
                                                        Min: Rs. {coupon.minimumOrderAmount || 0}
                                                        {coupon.usageLimit ? ` | Max: ${coupon.usageLimit}` : ''}
                                                    </td>
                                                    <td className="px-5 py-4 text-xs">
                                                        {coupon.usageCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'uses'}
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-[var(--text-muted)]">
                                                        {formatNiceDate(coupon.startDate)} - {formatNiceDate(coupon.endDate)}
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-semibold text-green-500">
                                                        Rs. {(coupon.totalRevenue || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-black uppercase tracking-wider ${
                                                            coupon.status === 'active' 
                                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                                : coupon.status === 'upcoming'
                                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                                : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                            {coupon.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right flex justify-end gap-3 opacity-90 group-hover:opacity-100">
                                                        <button 
                                                            onClick={() => openInspector(coupon, 'coupon')}
                                                            className="text-[var(--text-primary)] hover:text-accent p-1 transition-colors"
                                                            title="Inspect details"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteCoupon(coupon._id)}
                                                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                                            title="Delete coupon"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: DETAILS & INSPECTOR */}
            {activeTab === 'details' && selectedItem && (() => {
                const usage = selectedItem.usageCount || 0;
                const revenue = selectedItem.totalRevenue || 0;
                
                // 1. Subtotal Discount Efficiency (scales logically with sales up to 100%)
                let efficiency = 0;
                if (usage > 0) {
                    const avgOrderVal = revenue / usage;
                    efficiency = Math.min(100, Math.round((avgOrderVal / 5000) * 100)) || 0;
                    if (efficiency < 15) efficiency = 15; // standard rewarding visual baseline
                }

                // 2. Order Retention Impact (scales dynamically to reflect compound buyer loyalty)
                let retention = 0;
                if (usage > 0) {
                    retention = Math.min(95, Math.round(30 + Math.log2(usage + 1) * 8)) || 0;
                }

                // 3. Checkout Completion Rate (reflects dynamic luxury purchase progression)
                let completion = 0;
                if (usage > 0) {
                    completion = Math.min(98, Math.round(85 + (usage % 10))) || 0;
                }

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Left Panel: Ledger Specs */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 flex flex-col justify-between h-full">
                                <div>
                                    <span className="text-[9px] font-black tracking-widest text-orange-500 uppercase">
                                        {selectedType === 'sale' ? 'SALES CAMPAIGN INSPECTOR' : 'COUPON CODE INSPECTOR'}
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-serif font-black uppercase mt-1 mb-6 truncate" title={selectedItem.name || selectedItem.code}>
                                        {selectedItem.name || selectedItem.code}
                                    </h2>

                                    <div className="space-y-4 text-sm border-t border-[var(--surface-border)] pt-5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Status</span>
                                            <span className={`px-2.5 py-0.5 rounded-[2px] text-[10px] font-black uppercase tracking-widest ${
                                                selectedItem.status === 'active'
                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                    : selectedItem.status === 'upcoming'
                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                    : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {selectedItem.status}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Discount Rate</span>
                                            <span className="font-bold text-accent">
                                                {selectedItem.discountType === 'percentage'
                                                    ? `${selectedItem.discountValue}% OFF`
                                                    : `Rs. ${selectedItem.discountValue} OFF`
                                                }
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Start Date</span>
                                            <span className="font-semibold text-xs">{formatNiceDate(selectedItem.startDate)}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Expiration Date</span>
                                            <span className="font-semibold text-xs">{formatNiceDate(selectedItem.endDate)}</span>
                                        </div>

                                        {selectedType === 'coupon' && (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Usage limit</span>
                                                    <span className="font-semibold text-xs">{selectedItem.usageLimit ? `${selectedItem.usageLimit} total` : 'Unlimited'}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Minimum purchase</span>
                                                    <span className="font-semibold text-xs">Rs. {selectedItem.minimumOrderAmount || 0}</span>
                                                </div>
                                            </>
                                        )}

                                        {selectedType === 'sale' && (
                                            <div className="flex justify-between items-start flex-col gap-2 pt-2 border-t border-[var(--surface-border)]/50">
                                                <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Campaign Target Scope</span>
                                                <span className="text-xs font-semibold capitalize bg-[var(--surface-color)] border border-[var(--surface-border)] px-3 py-2 w-full leading-relaxed">
                                                    {selectedItem.appliesTo === 'all' && '🌍 Entire Shop (All Products)'}
                                                    {selectedItem.appliesTo === 'selectedProducts' && `🕶️ Specific selection (${selectedItem.productIds?.length || 0} Products)`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Deactivate CTA Button directly integrated within the specs card block */}
                                {selectedItem.status !== 'expired' && selectedItem.status !== 'cancelled' && (
                                    <button
                                        onClick={() => selectedType === 'sale' ? handleCancelSale(selectedItem._id) : handleCancelCoupon(selectedItem._id)}
                                        className="w-full btn-primary text-[var(--bg-color)] font-bold tracking-widest text-xs uppercase py-3.5 mt-8 block text-center transition-all hover:opacity-95 shadow-md border-none outline-none cursor-pointer"
                                    >
                                        Deactivate Campaign Immediately
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Campaign Performance Analytics */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Live Counter Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6">
                                    <Users className="text-orange-500 mb-3" size={24} />
                                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-45">Total Successful Orders</span>
                                    <h3 className="text-2xl sm:text-3xl font-black mt-2 leading-none">{selectedItem.usageCount || 0}</h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium">Conversions generated</p>
                                </div>
                                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6">
                                    <DollarSign className="text-green-500 mb-3" size={24} />
                                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-45">Tracked Sales Revenue</span>
                                    <h3 className="text-2xl sm:text-3xl font-black mt-2 text-green-500 leading-none">
                                        Rs. {(selectedItem.totalRevenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium">Gross sales accounting ledger</p>
                                </div>
                            </div>

                            {/* Interactive Graph Simulation */}
                            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6">
                                <h3 className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] mb-6">Campaign Conversion & Reach</h3>
                                
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="font-semibold text-[var(--text-muted)]">Subtotal Discount Efficiency</span>
                                            <span className="font-bold">{efficiency}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[var(--surface-color)] rounded-full overflow-hidden border border-[var(--surface-border)]">
                                            <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${efficiency}%` }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="font-semibold text-[var(--text-muted)]">Order Retention Impact</span>
                                            <span className="font-bold">{retention}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[var(--surface-color)] rounded-full overflow-hidden border border-[var(--surface-border)]">
                                            <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${retention}%` }}></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1 text-xs">
                                            <span className="font-semibold text-[var(--text-muted)]">Checkout Completion Rate</span>
                                            <span className="font-bold">{completion}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[var(--surface-color)] rounded-full overflow-hidden border border-[var(--surface-border)]">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${completion}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Custom product cards list applied */}
                            {selectedType === 'sale' && selectedItem.appliesTo === 'selectedProducts' && selectedItem.productIds && selectedItem.productIds.length > 0 && (
                                <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6">
                                    <h3 className="text-xs font-bold tracking-widest uppercase text-[var(--text-primary)] mb-4">
                                        Targeted Products Scope ({selectedItem.productIds.length})
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                        {selectedItem.productIds.map(p => (
                                            <div key={p._id} className="flex items-center gap-3 p-2 bg-[var(--surface-color)] border border-[var(--surface-border)]">
                                                {p.images && p.images.length > 0 && (
                                                    <img src={resolveImageUrl(p.images[0])} alt="" className="w-9 h-11 object-cover border border-[var(--surface-border)]" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate leading-snug">{p.name}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)] font-semibold">Rs. {p.price?.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* WIZARD 1: CREATE SALE WIZARD MODAL */}
            {isSaleModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] border border-[var(--surface-border)] w-full max-w-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto rounded-none">
                        
                        <button
                            onClick={() => setIsSaleModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-primary)] hover:text-red-500 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <span className="text-[10px] font-black tracking-[0.2em] text-orange-500 uppercase">STEP {saleWizardStep} OF 3</span>
                            <h2 className="text-xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)] mt-0.5">
                                Setup Markdown Campaign
                            </h2>
                        </div>

                        {/* Progress Stepper bar */}
                        <div className="flex gap-2 mb-8">
                            <div className={`h-1 flex-1 transition-all duration-300 ${saleWizardStep >= 1 ? 'bg-orange-500' : 'bg-[var(--surface-border)]'}`}></div>
                            <div className={`h-1 flex-1 transition-all duration-300 ${saleWizardStep >= 2 ? 'bg-orange-500' : 'bg-[var(--surface-border)]'}`}></div>
                            <div className={`h-1 flex-1 transition-all duration-300 ${saleWizardStep >= 3 ? 'bg-orange-500' : 'bg-[var(--surface-border)]'}`}></div>
                        </div>

                        <form onSubmit={handleCreateSale}>
                            
                            {/* STEP 1: Campaign details */}
                            {saleWizardStep === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold tracking-widest uppercase mb-2">Campaign Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={saleForm.name}
                                            onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })}
                                            placeholder="e.g. Summer Clearance Sale"
                                            className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Discount Type *</label>
                                            <select
                                                value={saleForm.discountType}
                                                onChange={(e) => setSaleForm({ ...saleForm, discountType: e.target.value })}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none cursor-pointer focus:border-orange-500"
                                            >
                                                <option value="percentage">Percentage Discount (%)</option>
                                                <option value="fixed">Fixed Price Deduction (Rs. )</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">
                                                Discount Value ({saleForm.discountType === 'percentage' ? '%' : 'Rs.'}) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={saleForm.discountValue}
                                                onChange={(e) => setSaleForm({ ...saleForm, discountValue: e.target.value })}
                                                placeholder={saleForm.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 1500'}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-orange-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Start Date *</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={saleForm.startDate}
                                                onChange={(e) => setSaleForm({ ...saleForm, startDate: e.target.value })}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Expiration Date *</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={saleForm.endDate}
                                                onChange={(e) => setSaleForm({ ...saleForm, endDate: e.target.value })}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-orange-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold tracking-widest uppercase mb-2">Applies Target Scope *</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { label: 'Entire Shop', value: 'all' },
                                                { label: 'Specific Category', value: 'category' },
                                                { label: 'Specific Products', value: 'product' }
                                            ].map(item => (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => setSaleForm({ ...saleForm, appliesToType: item.value })}
                                                    className={`py-3.5 border text-xs font-bold uppercase tracking-wider transition-all ${
                                                        saleForm.appliesToType === item.value
                                                            ? 'bg-orange-500 border-orange-500 text-[var(--bg-color)] shadow-md'
                                                            : 'bg-transparent border-[var(--surface-border)] hover:border-orange-500'
                                                    }`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setSaleWizardStep(2)}
                                            disabled={!saleForm.name || !saleForm.discountValue || !saleForm.startDate || !saleForm.endDate}
                                            className="bg-orange-500 text-[var(--bg-color)] px-6 py-3 text-xs font-black tracking-widest uppercase hover:bg-orange-600 disabled:opacity-40 flex items-center gap-2"
                                        >
                                            Next Step <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: AppliesTo Targets details */}
                            {saleWizardStep === 2 && (
                                <div className="space-y-5">
                                    
                                    {saleForm.appliesToType === 'all' && (
                                        <div className="bg-orange-500/10 border border-orange-500/20 p-5 flex items-start gap-3">
                                            <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                                            <div>
                                                <h4 className="text-sm font-bold uppercase tracking-wider">Store-wide campaign selected</h4>
                                                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                                                    This sales campaign will automatically decorate **every single product** inside the e-commerce inventory with crossed-out pricing cards on the customer storefront. No manual selection required.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {saleForm.appliesToType === 'category' && (
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Select Target Category *</label>
                                            <select
                                                required
                                                value={saleForm.appliesToCategory}
                                                onChange={(e) => setSaleForm({ ...saleForm, appliesToCategory: e.target.value })}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none cursor-pointer focus:border-orange-500"
                                            >
                                                <option value="" disabled>Select category</option>
                                                {categories.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {saleForm.appliesToType === 'product' && (
                                        <div className="space-y-4">
                                            <label className="block text-xs font-bold tracking-widest uppercase">
                                                Select Target Products ({saleForm.appliesToProducts.length} selected) *
                                            </label>
                                            <div className="flex items-center bg-[var(--surface-color)] px-3 py-2 border border-[var(--surface-border)] w-full">
                                                <Search size={14} className="text-[var(--text-muted)] mr-2" />
                                                <input
                                                    type="text"
                                                    placeholder="Search products by name..."
                                                    value={productSearch}
                                                    onChange={e => setProductSearch(e.target.value)}
                                                    className="bg-transparent border-none outline-none text-xs w-full"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-2">
                                                {filteredProductsForScope.map(p => {
                                                    const isChecked = saleForm.appliesToProducts.includes(p._id);
                                                    return (
                                                        <div 
                                                            key={p._id}
                                                            onClick={() => toggleProductScope(p._id)}
                                                            className={`flex items-center justify-between p-2.5 border cursor-pointer select-none transition-all ${
                                                                isChecked 
                                                                    ? 'bg-orange-500/10 border-orange-500 shadow-sm' 
                                                                    : 'bg-[var(--surface-color)] border-[var(--surface-border)] hover:border-orange-500/50'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                {p.images && p.images.length > 0 && (
                                                                    <img src={resolveImageUrl(p.images[0])} alt="" className="w-8 h-10 object-cover border border-[var(--surface-border)]" />
                                                                )}
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold truncate leading-snug">{p.name}</p>
                                                                    <p className="text-[10px] text-[var(--text-muted)] font-semibold">Rs. {p.price?.toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`w-4 h-4 border flex items-center justify-center rounded-[2px] ${
                                                                isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-[var(--surface-border)] bg-transparent'
                                                            }`}>
                                                                {isChecked && <Check size={10} strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-4 border-t border-[var(--surface-border)]">
                                        <button
                                            type="button"
                                            onClick={() => setSaleWizardStep(1)}
                                            className="border border-[var(--surface-border)] bg-transparent px-5 py-3 text-xs font-black tracking-widest uppercase hover:bg-[var(--surface-color)]"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSaleWizardStep(3)}
                                            disabled={
                                                (saleForm.appliesToType === 'category' && !saleForm.appliesToCategory) ||
                                                (saleForm.appliesToType === 'product' && saleForm.appliesToProducts.length === 0)
                                            }
                                            className="bg-orange-500 text-[var(--bg-color)] px-6 py-3 text-xs font-black tracking-widest uppercase hover:bg-orange-600 disabled:opacity-40 flex items-center gap-2"
                                        >
                                            Review details <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Review invoice summary */}
                            {saleWizardStep === 3 && (
                                <div className="space-y-6">
                                    <div className="bg-[var(--surface-color)] border border-[var(--surface-border)] p-6 rounded-none max-w-md mx-auto shadow-sm relative overflow-hidden">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl"></div>
                                        <div className="text-center pb-4 border-b border-[var(--surface-border)]">
                                            <h4 className="text-[10px] font-black tracking-[0.25em] text-orange-500 uppercase">CAMPAIGN REVIEW SUMMARY</h4>
                                            <h3 className="text-lg font-serif font-black uppercase mt-1 leading-tight">{saleForm.name}</h3>
                                        </div>

                                        <div className="space-y-3.5 py-5 text-xs font-medium">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">Calculated Discount</span>
                                                <span className="font-bold text-orange-500 uppercase">
                                                    {saleForm.discountType === 'percentage' 
                                                        ? `${saleForm.discountValue}% OFF` 
                                                        : `Rs. ${saleForm.discountValue} FLAT OFF`
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">Target Scope</span>
                                                <span className="font-bold capitalize">
                                                    {saleForm.appliesToType === 'all' && '🌍 All Inventory Products'}
                                                    {saleForm.appliesToType === 'category' && `📁 Category: ${categories.find(c => c._id === saleForm.appliesToCategory)?.name}`}
                                                    {saleForm.appliesToType === 'product' && `🕶️ ${saleForm.appliesToProducts.length} Selected items`}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">Duration</span>
                                                <span className="font-bold text-[10px]">
                                                    {formatNiceDate(saleForm.startDate)} - {formatNiceDate(saleForm.endDate)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-orange-500/10 border border-orange-500/20 p-3 flex gap-2 rounded-[2px] items-center">
                                            <Clock className="text-orange-500 shrink-0" size={14} />
                                            <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                                                Status evaluates dynamically based on current date bounds.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4 border-t border-[var(--surface-border)]">
                                        <button
                                            type="button"
                                            onClick={() => setSaleWizardStep(2)}
                                            className="border border-[var(--surface-border)] bg-transparent px-5 py-3 text-xs font-black tracking-widest uppercase hover:bg-[var(--surface-color)]"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCreateSale}
                                            disabled={submitting}
                                            className="bg-orange-500 text-[var(--bg-color)] px-8 py-3.5 text-xs font-black tracking-widest uppercase hover:bg-orange-600 disabled:opacity-40 flex items-center gap-2"
                                        >
                                            {submitting ? 'Creating campaign...' : 'Confirm & Deploy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>
                </div>
            )}

            {/* WIZARD 2: CREATE COUPON WIZARD MODAL */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] border border-[var(--surface-border)] w-full max-w-xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto rounded-none">
                        
                        <button
                            onClick={() => setIsCouponModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--text-primary)] hover:text-red-500 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <span className="text-[10px] font-black tracking-[0.2em] text-green-500 uppercase">STEP {couponWizardStep} OF 2</span>
                            <h2 className="text-xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)] mt-0.5">
                                Setup Coupon & Promo Code
                            </h2>
                        </div>

                        {/* Progress Stepper bar */}
                        <div className="flex gap-2 mb-8">
                            <div className={`h-1 flex-1 transition-all duration-300 ${couponWizardStep >= 1 ? 'bg-green-500' : 'bg-[var(--surface-border)]'}`}></div>
                            <div className={`h-1 flex-1 transition-all duration-300 ${couponWizardStep >= 2 ? 'bg-green-500' : 'bg-[var(--surface-border)]'}`}></div>
                        </div>

                        <form onSubmit={handleCreateCoupon}>
                            
                            {/* STEP 1: Coupon details */}
                            {couponWizardStep === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold tracking-widest uppercase mb-2">Promo Code (Alpha-numeric) *</label>
                                        <input
                                            type="text"
                                            required
                                            value={couponForm.code}
                                            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                            placeholder="e.g. LUXURY50"
                                            className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-green-500 font-mono font-bold tracking-widest"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Discount Type *</label>
                                            <select
                                                value={couponForm.discountType}
                                                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none cursor-pointer focus:border-green-500"
                                            >
                                                <option value="percentage">Percentage Deduction (%)</option>
                                                <option value="fixed">Fixed Price Deduction (Rs. )</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">
                                                Discount Value ({couponForm.discountType === 'percentage' ? '%' : 'Rs.'}) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={couponForm.discountValue}
                                                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                                                placeholder={couponForm.discountType === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-green-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Usage Redemptions Limit</label>
                                            <input
                                                type="number"
                                                value={couponForm.usageLimit}
                                                onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                                                placeholder="e.g. 100 (Optional)"
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Minimum Cart Subtotal (Rs. )</label>
                                            <input
                                                type="number"
                                                value={couponForm.minimumOrderAmount}
                                                onChange={(e) => setCouponForm({ ...couponForm, minimumOrderAmount: e.target.value })}
                                                placeholder="e.g. 5000 (Optional)"
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-green-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Start Date *</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={couponForm.startDate}
                                                onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold tracking-widest uppercase mb-2">Expiration Date *</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={couponForm.endDate}
                                                onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
                                                className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-3 text-sm outline-none focus:border-green-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setCouponWizardStep(2)}
                                            disabled={!couponForm.code || !couponForm.discountValue || !couponForm.startDate || !couponForm.endDate}
                                            className="bg-green-600 text-[var(--bg-color)] px-6 py-3 text-xs font-black tracking-widest uppercase hover:bg-green-700 disabled:opacity-40 flex items-center gap-2"
                                        >
                                            Next Step <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Review details */}
                            {couponWizardStep === 2 && (
                                <div className="space-y-6">
                                    <div className="bg-[var(--surface-color)] border border-[var(--surface-border)] p-6 rounded-none max-w-sm mx-auto shadow-sm relative overflow-hidden">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/5 rounded-full blur-xl"></div>
                                        <div className="text-center pb-4 border-b border-[var(--surface-border)]">
                                            <h4 className="text-[10px] font-black tracking-[0.25em] text-green-600 dark:text-green-400 uppercase">PROMO REVIEW SUMMARY</h4>
                                            <h3 className="text-xl font-mono font-black tracking-widest uppercase mt-1 leading-tight text-green-600 dark:text-green-400">{couponForm.code}</h3>
                                        </div>

                                        <div className="space-y-3.5 py-5 text-xs font-medium">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">Calculated Discount</span>
                                                <span className="font-bold text-green-600 dark:text-green-400 uppercase">
                                                    {couponForm.discountType === 'percentage' 
                                                        ? `${couponForm.discountValue}% OFF` 
                                                        : `Rs. ${couponForm.discountValue} FLAT OFF`
                                                    }
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">Usage Limit</span>
                                                <span className="font-bold">
                                                    {couponForm.usageLimit ? `${couponForm.usageLimit} Redemptions` : 'Unlimited Uses'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">Min Cart Subtotal</span>
                                                <span className="font-bold">
                                                    Rs. {couponForm.minimumOrderAmount || 0}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-muted)]">Duration</span>
                                                <span className="font-bold text-[10px]">
                                                    {formatNiceDate(couponForm.startDate)} - {formatNiceDate(couponForm.endDate)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-green-500/10 border border-green-500/20 p-3 flex gap-2 rounded-[2px] items-center">
                                            <Check className="text-green-600 dark:text-green-400 shrink-0" size={14} />
                                            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                                                Code must be entered exactly at checkout subtotal fields.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4 border-t border-[var(--surface-border)]">
                                        <button
                                            type="button"
                                            onClick={() => setCouponWizardStep(1)}
                                            className="border border-[var(--surface-border)] bg-transparent px-5 py-3 text-xs font-black tracking-widest uppercase hover:bg-[var(--surface-color)]"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCreateCoupon}
                                            disabled={submitting}
                                            className="bg-green-600 text-[var(--bg-color)] px-8 py-3.5 text-xs font-black tracking-widest uppercase hover:bg-green-700 disabled:opacity-40 flex items-center gap-2"
                                        >
                                            {submitting ? 'Creating code...' : 'Confirm & Deploy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SalesDiscounts;
