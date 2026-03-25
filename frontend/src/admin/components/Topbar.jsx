import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/apiClient';

const Topbar = () => {
    const navigate = useNavigate();
    const storedUser = localStorage.getItem('lux_user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const notifRef = useRef(null);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [dismissedNotifs, setDismissedNotifs] = useState(() => {
        const stored = localStorage.getItem('lux_dismissed_notifs');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        const fetchPendingOrders = async () => {
            if (!user?.token) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/orders`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const pendingOrders = data.filter(order => order.status === 'pending');

                    // Filter out dismissed notifications
                    const activeNotifs = pendingOrders.filter(order => !dismissedNotifs.includes(order._id));
                    setNotifications(activeNotifs);
                }
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            }
        };
        fetchPendingOrders();

        // Polling every 30 seconds for new orders
        const interval = setInterval(fetchPendingOrders, 30000);
        return () => clearInterval(interval);
    }, [user?.token, dismissedNotifs]);

    // Handle click outside to close notifications
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };

        if (isNotifOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotifOpen]);

    const handleDismissNotif = (e, notifId) => {
        if (e && e.stopPropagation) e.stopPropagation();
        const updatedDismissed = [...dismissedNotifs, notifId];
        setDismissedNotifs(updatedDismissed);
        localStorage.setItem('lux_dismissed_notifs', JSON.stringify(updatedDismissed));

        // Remove from current view
        setNotifications(prev => prev.filter(n => n._id !== notifId));
    };

    const handleLogout = () => {
        localStorage.removeItem('lux_user');
        navigate('/');
    };

    return (
        <header className="h-16 bg-[var(--bg-color)] border-b border-[var(--surface-border)] flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
            {/* Search (Optional) */}
            <div className="flex items-center bg-[var(--surface-color)] px-4 py-2 rounded-sm border border-[var(--surface-border)] max-w-sm w-full hidden sm:flex">
                <Search size={16} className="text-[var(--text-muted)] mr-2" />
                <input
                    type="text"
                    placeholder="Search orders, products..."
                    className="bg-transparent border-none outline-none text-xs tracking-wider w-full placeholder-gray-500 text-[var(--text-primary)]"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6 ml-auto">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                        className="relative text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <Bell size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[var(--surface-color)] text-[var(--text-primary)] text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[var(--surface-border)]">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute top-10 right-0 w-72 bg-[var(--bg-color)] border border-[var(--surface-border)] py-2 z-50 rounded-none">
                            <div className="px-4 py-3 border-b border-[var(--surface-border)] flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)]">Notifications ({notifications.length})</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                                        No new notifications at this time.
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif._id} className="p-3 border-b border-[var(--surface-border)] hover:bg-[var(--surface-color)] cursor-pointer transition-colors relative group" onClick={(e) => { handleDismissNotif(e, notif._id); setIsNotifOpen(false); navigate(`/admin/orders`); }}>
                                            <p className="text-xs font-bold text-[var(--text-primary)] mb-1 pr-6">New Order Received!</p>
                                            <p className="text-[10px] text-[var(--text-muted)]">Order #{notif._id.substring(18).toUpperCase()} from {notif.user?.name || 'Guest'}.</p>
                                            <span className="text-[9px] text-[var(--text-muted)] font-medium mt-1 block">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                                            <button
                                                onClick={(e) => handleDismissNotif(e, notif._id)}
                                                className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Dismiss"
                                            >
                                                Ãƒâ€”
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="relative">
                    <button
                        onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                        className="flex items-center gap-3 pl-6 border-l border-[var(--surface-border)] focus:outline-none"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase">{user?.name || 'Admin User'}</p>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{user?.role || 'Superadmin'}</p>
                        </div>
                        <div className="w-9 h-9 bg-[var(--text-primary)] rounded-full flex items-center justify-center text-[var(--bg-color)] font-bold font-serif text-sm">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute top-12 right-0 w-48 bg-[var(--bg-color)] border border-[var(--surface-border)] py-2 z-50 rounded-none flex flex-col">
                            <button className="px-4 py-3 text-xs tracking-widest font-medium uppercase text-[var(--text-muted)] hover:bg-[var(--surface-color)] hover:text-[var(--text-primary)] text-left flex items-center gap-3 transition-colors">
                                <User size={14} /> My Profile
                            </button>
                            <button onClick={() => navigate('/admin/settings')} className="px-4 py-3 text-xs tracking-widest font-medium uppercase text-[var(--text-muted)] hover:bg-[var(--surface-color)] hover:text-[var(--text-primary)] text-left flex items-center gap-3 transition-colors">
                                <Settings size={14} /> Settings
                            </button>
                            <div className="border-t border-[var(--surface-border)] my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-3 text-xs tracking-widest font-medium uppercase text-[var(--text-primary)] hover:bg-[var(--surface-color)] text-left flex items-center gap-3 transition-colors"
                            >
                                <LogOut size={14} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
