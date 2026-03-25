import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { OrderProvider } from './context/OrderContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ToastProvider>
            <CartProvider>
                <WishlistProvider>
                    <OrderProvider>
                        <ThemeProvider>
                            <App />
                        </ThemeProvider>
                    </OrderProvider>
                </WishlistProvider>
            </CartProvider>
        </ToastProvider>
    </React.StrictMode>,
)
