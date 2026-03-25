import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AdminLayout = () => {
    const navigate = useNavigate();

    // Auth Guard
    useEffect(() => {
        const storedUser = localStorage.getItem('lux_user');
        const user = storedUser ? JSON.parse(storedUser) : null;

        // Ensure user is an admin or manager
        if (!user || (!user.isAdmin && user.role !== 'superadmin' && user.role !== 'manager')) {
            navigate('/account');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Sidebar (fixed) */}
            <Sidebar />

            {/* Main Content Area (offset by sidebar width) */}
            <div className="flex-1 flex flex-col transition-all duration-300 ml-20 lg:ml-64">
                <Topbar />
                <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
                    {/* The nested routes (Dashboard, Products, etc.) will render here */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
