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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Phase 6: Global React Query client — caches API responses for 2 minutes
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2,  // data fresh for 2 minutes
            gcTime: 1000 * 60 * 5,     // kept in memory for 5 minutes
            retry: 1,
            refetchOnWindowFocus: false, // don't refetch just because user switched tabs
        }
    }
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
    </React.StrictMode>,
)
