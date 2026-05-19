import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'react-loading-skeleton/dist/skeleton.css'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ToastProvider>
            <CartProvider>
                <WishlistProvider>
                        <ThemeProvider>
                            <SettingsProvider>
                                <App />
                            </SettingsProvider>
                        </ThemeProvider>
                </WishlistProvider>
            </CartProvider>
        </ToastProvider>
    </React.StrictMode>,
)
