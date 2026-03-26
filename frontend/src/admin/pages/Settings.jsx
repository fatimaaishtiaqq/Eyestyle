import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { API_BASE_URL } from '../../utils/apiClient';

const AdminSettings = () => {
    const { showToast } = useToast();
    const { theme: currentTheme, setTheme } = useTheme();
    const { settings: globalSettings, updateSettingsState, loading } = useSettings();
    
    const [settings, setSettings] = useState({
        storeName: 'EYESTYLE Luxury',
        supportEmail: 'support@eyestyle.com',
        taxRate: 10,
        freeShippingThreshold: 200,
        shippingFee: 15,
        maintenanceMode: false
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (globalSettings) {
            setSettings({
                storeName: globalSettings.storeName || 'EYESTYLE Luxury',
                supportEmail: globalSettings.supportEmail || 'support@eyestyle.com',
                taxRate: globalSettings.taxRate ?? 10,
                freeShippingThreshold: globalSettings.freeShippingThreshold ?? 200,
                shippingFee: globalSettings.shippingFee ?? 15,
                maintenanceMode: globalSettings.maintenanceMode ?? false
            });
        }
    }, [globalSettings]);

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

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const userStr = localStorage.getItem('lux_user');
            const user = userStr ? JSON.parse(userStr) : null;
            
            if (!user || !user.token) {
                showToast('Not authorized to save settings', 'error');
                setIsSaving(false);
                return;
            }

            const res = await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                const updatedSettings = await res.json();
                updateSettingsState(updatedSettings);
                showToast('Settings saved successfully', 'success');
            } else {
                showToast('Failed to save settings', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Server error while saving settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-[var(--text-primary)]">Loading settings...</div>;
    }

    return (
        <div className="w-full pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">Settings</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Manage global store configurations.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary px-6 py-2 flex items-center gap-2 uppercase tracking-widest text-xs font-bold transition-colors disabled:opacity-50"
                >
                    <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
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
                        <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Free Shipping Threshold (Rs.)</label>
                        <input
                            type="number"
                            name="freeShippingThreshold"
                            value={settings.freeShippingThreshold}
                            onChange={handleChange}
                            className="w-full border border-[var(--surface-border)] px-4 py-2 text-sm outline-none bg-transparent focus:border-[var(--color-electric-blue)]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold tracking-widest uppercase mb-2 text-[var(--text-primary)]">Shipping Fee (Rs.)</label>
                        <input
                            type="number"
                            name="shippingFee"
                            value={settings.shippingFee}
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
