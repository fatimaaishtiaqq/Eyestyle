import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => {
    return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`min-w-[300px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-between p-4 border border-[var(--surface-border)] ${toast.type === 'success' ? 'bg-[#FF9800] text-white' : 'bg-red-700 text-white'
                                }`}
                        >
                            <span className="text-xs uppercase tracking-widest font-medium">
                                {toast.message}
                            </span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-4 text-white hover:text-gray-300 transition-colors"
                            >
                                &times;
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
