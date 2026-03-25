import React, { useState, useEffect } from 'react';
import { Ban, CheckCircle, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { API_BASE_URL } from '../../utils/apiClient';

const CustomerList = () => {
    const { showToast } = useToast();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter out superadmins or just show all users? We'll show all and disable block on superadmin below
                setCustomers(data);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch customers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchCustomers();
    }, [user?.token]);

    const handleToggleStatus = async (id, currentStatus, currentRole) => {
        if (currentRole === 'superadmin') {
            showToast('Cannot modify Superadmin status', 'error');
            return;
        }

        const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/users/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showToast(`User ${newStatus}`, 'success');
                fetchCustomers();
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch (err) {
            showToast('Server error', 'error');
        }
    };

    return (
        <div className="w-full pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Customers</h1>
                    <p className="text-[var(--text-primary)] text-sm mt-1">Manage user accounts and access levels.</p>
                </div>
            </div>

            {/* List */}
            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none">
                <div className="p-4 border-b border-[var(--surface-border)] flex justify-between items-center gap-4">
                    <div className="flex items-center bg-[var(--surface-color)] px-3 py-2 border border-[var(--surface-border)] w-full max-w-md">
                        <Search size={14} className="text-[var(--text-primary)] mr-2" />
                        <input type="text" placeholder="Search customers by name or email..." className="bg-transparent border-none outline-none text-xs w-full" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--surface-color)] text-xs uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--surface-border)]">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Total Orders</th>
                                <th className="px-6 py-4 text-right">Total Spent</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-border)]">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-[var(--text-primary)] italic">Syncing User Directory...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-[var(--text-primary)] italic">No customers found.</td></tr>
                            ) : customers.map((customer) => (
                                <tr key={customer._id} className="hover:bg-surface">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-[var(--text-primary)]">{customer.name}</p>
                                        <p className="text-xs text-[var(--text-primary)]">{customer.email}</p>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-primary)] uppercase text-[10px] tracking-widest font-bold">{customer.role}</td>
                                    <td className="px-6 py-4 text-right font-medium">-</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${customer.status === 'active' ? 'bg-[var(--surface-color)] text-[var(--text-primary)]' : 'bg-[var(--surface-color)] text-[var(--text-primary)]'
                                            }`}>
                                            {customer.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                                        {customer.role === 'superadmin' ? (
                                            <span className="text-[var(--text-primary)] text-xs italic">Protected</span>
                                        ) : customer.status !== 'blocked' ? (
                                            <button onClick={() => handleToggleStatus(customer._id, customer.status, customer.role)} className="text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-xs uppercase tracking-widest font-bold">
                                                <Ban size={14} /> Block
                                            </button>
                                        ) : (
                                            <button onClick={() => handleToggleStatus(customer._id, customer.status, customer.role)} className="text-[var(--text-primary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-xs uppercase tracking-widest font-bold">
                                                <CheckCircle size={14} /> Unblock
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerList;
