import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';
import { useCart } from '../context/CartContext';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        const verifyPayment = async () => {
            if (!sessionId || !orderId) {
                setStatus('error');
                setErrorMessage('Missing payment information.');
                return;
            }

            try {
                const res = await apiFetch('/api/orders/stripe-success', {
                    method: 'POST',
                    body: { session_id: sessionId, order_id: orderId },
                    auth: true,
                });

                if (res.ok) {
                    // Clear cart data since order is fully paid
                    clearCart();
                    localStorage.removeItem('lux_cart');
                    localStorage.removeItem('checkout_shipping_details');
                    localStorage.removeItem('checkout_billing_details');
                    localStorage.removeItem('checkout_guest_email');
                    
                    // Dispatch custom event to update cart in other components
                    window.dispatchEvent(new Event('storage'));
                    
                    setStatus('success');
                } else {
                    const data = await res.json();
                    setStatus('error');
                    setErrorMessage(data.message || 'Payment verification failed.');
                }
            } catch (err) {
                setStatus('error');
                setErrorMessage('Network error while verifying payment.');
            }
        };

        verifyPayment();
    }, [sessionId, orderId, navigate]);

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-6 bg-transparent text-[var(--text-primary)]">
            <div className="max-w-md w-full bg-[var(--card-bg)] border border-[var(--surface-border)] p-8 text-center shadow-lg">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-12 h-12 mb-6 animate-spin text-[var(--color-primary)]" />
                        <h1 className="text-xl font-serif font-bold tracking-widest uppercase mb-2">Verifying Payment</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Please wait while we confirm your order...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 mb-6 text-green-500" />
                        <h1 className="text-2xl font-serif font-bold tracking-widest uppercase mb-3">Payment Successful</h1>
                        <p className="text-sm text-[var(--text-secondary)] mb-8">
                            Thank you for your purchase! Your payment has been confirmed and your order is being processed.
                        </p>
                        <Link 
                            to="/orders" 
                            className="w-full bg-[var(--color-primary)] text-white py-4 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-[var(--color-primary-hover)] transition-colors inline-block"
                        >
                            View Order
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 mb-6 text-red-500" />
                        <h1 className="text-xl font-serif font-bold tracking-widest uppercase mb-3">Payment Error</h1>
                        <p className="text-sm text-[var(--text-secondary)] mb-8">
                            {errorMessage}
                        </p>
                        <Link 
                            to="/checkout" 
                            className="w-full border border-[var(--color-primary)] text-[var(--text-primary)] py-4 text-[11px] font-black tracking-[0.4em] uppercase hover:bg-[var(--surface-color)] transition-colors inline-block mb-3"
                        >
                            Return to Checkout
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
