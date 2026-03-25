import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Layers,
    ShoppingCart,
    Users,
    Settings,
    Bell,
    LogOut,
    Menu,
    X,
    BarChart3
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(true);

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
        { name: 'Products', path: '/admin/products', icon: <Package size={20} /> },
        { name: 'Categories', path: '/admin/categories', icon: <Layers size={20} /> },
        { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
        { name: 'Customers', path: '/admin/customers', icon: <Users size={20} /> }
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <aside className={`bg-[var(--bg-color)] border-r border-[var(--surface-border)] h-screen transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} flex flex-col fixed left-0 top-0 z-40`}>
            {/* Header */}
            <div className={`h-16 flex items-center border-b border-[var(--surface-border)] ${isOpen ? 'justify-between px-6' : 'justify-center'} shrink-0`}>
                {isOpen && <Link to="/" className="text-xl font-serif font-bold tracking-widest text-[var(--text-primary)]">EYESTYLE</Link>}
                <button onClick={toggleSidebar} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        return (
                            <li key={item.name} className="px-3">
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-4 px-3 py-3 rounded-none transition-all duration-200 ${isActive ? 'bg-[var(--surface-color)] text-[var(--text-primary)] font-semibold border-l-2 border-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-color)] hover:text-[var(--text-primary)]'}`}
                                >
                                    <div className={`${!isOpen && 'mx-auto'}`}>
                                        {item.icon}
                                    </div>
                                    {isOpen && <span className="text-xs font-bold uppercase tracking-widest">{item.name}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[var(--surface-border)] space-y-2">
                <Link to="/admin/settings" className={`w-full flex items-center gap-4 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ${!isOpen && 'justify-center'}`}>
                    <Settings size={20} />
                    {isOpen && <span className="text-xs font-bold uppercase tracking-widest text-left flex-1">Settings</span>}
                </Link>
                <Link to="/" className={`w-full flex items-center gap-4 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ${!isOpen && 'justify-center'}`}>
                    <LogOut size={20} />
                    {isOpen && <span className="text-xs font-bold uppercase tracking-widest text-left flex-1">Back to Store</span>}
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
