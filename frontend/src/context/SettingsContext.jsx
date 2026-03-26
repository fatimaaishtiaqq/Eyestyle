import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/apiClient';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        taxRate: 10,
        freeShippingThreshold: 200,
        shippingFee: 15,
        storeName: 'EYESTYLE Luxury',
        supportEmail: 'support@eyestyle.com',
        maintenanceMode: false
    });
    
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/settings`);
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettingsState = (newSettings) => {
        setSettings({ ...settings, ...newSettings });
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, updateSettingsState, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
