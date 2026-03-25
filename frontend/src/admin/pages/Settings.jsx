import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

const AdminSettings = () => {
    const { showToast } = useToast();
    const { theme: currentTheme, setTheme } = useTheme();
    const [settings, setSettings] = useState({
        storeName: 'EYESTYLE Luxury',
        supportEmail: 'support@eyestyle.com',
        taxRate: 10,
        freeShippingThreshold: 200,
        maintenanceMode: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleThemeChange = (e) => {
        setTheme(e.target.value);
    };

    const handleSave = () => {
        // Mock save
        showToast('Settings saved successfully', 'success');
    };

    return (
        <div className="w-full pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Settings</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Manage global store configurations.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="btn-primary px-6 py-2 flex items-center gap-2 uppercase tracking-widest text-xs font-bold transition-colors"
                >
                    <Save size={16} /> Save Changes
                </button>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--surface-border)] rounded-none p-8 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Store Name</label>
                        <input
                            type="text"
                            name="storeName"
                            value={settings.storeName}
                            onChange={handleChange}
                            className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none bg-transparent focus:border-[var(--color-electric-blue)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Support Email</label>
                        <input
                            type="email"
                            name="supportEmail"
                            value={settings.supportEmail}
                            onChange={handleChange}
                            className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none bg-transparent focus:border-[var(--color-electric-blue)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Tax Rate (%)</label>
                        <input
                            type="number"
                            name="taxRate"
                            value={settings.taxRate}
                            onChange={handleChange}
                            className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none bg-transparent focus:border-[var(--color-electric-blue)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Free Shipping Threshold ($)</label>
                        <input
                            type="number"
                            name="freeShippingThreshold"
                            value={settings.freeShippingThreshold}
                            onChange={handleChange}
                            className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none bg-transparent focus:border-[var(--color-electric-blue)]"
                        />
                    </div>
                </div>

                {/* Theme Preference removed as dark mode is now global */}

                <div className="mt-10 pt-8 border-t border-[var(--surface-border)]">
                    <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-[var(--text-primary)]">Advanced</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={settings.maintenanceMode}
                            onChange={handleChange}
                            className="w-4 h-4 accent-[var(--color-electric-blue)]"
                        />
                        <span className="text-sm font-medium text-[var(--text-body)]">Enable Maintenance Mode (Hides store from public)</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
