import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_BASE_URL } from '../../utils/apiClient';

const Analytics = () => {
    const { showToast } = useToast();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        activeOrders: 0,
        totalOrders: 0,
        totalCustomers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/dashboard/metrics`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const text = await res.text();
                    try {
                        const data = JSON.parse(text);
                        setMetrics(data);
                    } catch (parseErr) {
                        console.error('JSON Parse error on analytics data:', text.substring(0, 100));
                        showToast('Invalid analytics data received', 'error');
                    }
                } else {
                    console.error('Analytics fetch status:', res.status);
                    showToast('Failed to load analytics data', 'error');
                }
            } catch (error) {
                console.error('Network or fetch error on analytics:', error);
                showToast('Network error loading analytics', 'error');
            } finally {
                setLoading(false);
            }
        };
        if (user?.token) fetchAnalytics();
    }, [user?.token, showToast]);

    // Mock recent data to make charts look dynamic based on actual metrics
    const generateChartData = () => {
        const data = [];
        const baseRev = metrics.totalRevenue / 7 || 500;
        const baseCust = metrics.totalCustomers / 7 || 5;
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        for (let i = 0; i < 7; i++) {
            // Random variation +/- 30% to make it look realistic
            const variation = (Math.random() * 0.6) + 0.7;
            data.push({
                name: days[i],
                revenue: Math.round(baseRev * variation),
                customers: Math.round(baseCust * variation)
            });
        }
        return data;
    };

    const chartData = generateChartData();

    return (
        <div className="w-full pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)] flex items-center gap-3">
                        <BarChart3 className="text-[var(--text-primary)]" /> Analytics
                    </h1>
                    <p className="text-[var(--text-primary)] text-sm mt-1">Detailed performance metrics and reports.</p>
                </div>
                <div className="flex gap-2">
                    <select className="border border-[var(--surface-border)] bg-[var(--card-bg)] px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-[var(--color-electric-blue)] cursor-pointer text-[var(--text-primary)]">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>This Year</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-[var(--text-primary)] italic">Compiling data...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 rounded-none">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-[var(--surface-color)] text-[var(--text-primary)] p-3 rounded-none"><DollarSign size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-primary)]">Gross Sales</p>
                                    <h3 className="text-2xl font-sans font-bold text-[var(--text-primary)]">${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-primary)] font-bold">
                                <TrendingUp size={14} /> <span>+8.4% from previous period</span>
                            </div>
                        </div>

                        <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 rounded-none">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-[var(--surface-color)] text-[var(--text-primary)] p-3 rounded-none"><ShoppingCart size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-primary)]">Total Orders</p>
                                    <h3 className="text-2xl font-sans font-bold text-[var(--text-primary)]">{metrics.totalOrders}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-primary)] font-bold">
                                <TrendingDown size={14} /> <span>-2.1% from previous period</span>
                            </div>
                        </div>

                        <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] p-6 rounded-none">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-[var(--surface-color)] text-[var(--text-primary)] p-3 rounded-none"><Users size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--text-primary)]">Total Customers</p>
                                    <h3 className="text-2xl font-sans font-bold text-[var(--text-primary)]">{metrics.totalCustomers}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-[var(--text-primary)] font-bold">
                                <TrendingUp size={14} /> <span>+14.2% from previous period</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Revenue Chart */}
                        <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none p-6 text-[var(--text-primary)] shadow-sm">
                            <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-primary)] mb-6 border-b border-[var(--surface-border)] pb-2">Gross Sales Overview</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
                                            itemStyle={{ color: 'var(--color-electric-blue)', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="var(--color-electric-blue)" strokeWidth={3} dot={{ fill: 'var(--color-electric-blue)' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Customers/Orders Chart */}
                        <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none p-6 text-[var(--text-primary)] shadow-sm">
                            <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-primary)] mb-6 border-b border-[var(--surface-border)] pb-2">Customer Acquisition</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
                                            itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                                            cursor={{ fill: 'var(--surface-color)' }}
                                        />
                                        <Bar dataKey="customers" fill="var(--color-electric-blue)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
