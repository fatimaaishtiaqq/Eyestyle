import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SessionManager from './components/SessionManager';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ThreeBackgroundCanvas } from './components/ThreeBackground';

// Lazy-load storefront pages for faster initial load
const Home = lazy(() => import('./pages/Home'));
const Collection = lazy(() => import('./pages/Collection'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const About = lazy(() => import('./pages/About'));
const Cart = lazy(() => import('./pages/Cart'));
const Auth = lazy(() => import('./pages/Auth'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Shipping = lazy(() => import('./pages/Shipping'));
const Careers = lazy(() => import('./pages/Careers'));
const Sustainability = lazy(() => import('./pages/Sustainability'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const ProductList = lazy(() => import('./admin/pages/ProductList'));
const CategoryList = lazy(() => import('./admin/pages/CategoryList'));
const OrderList = lazy(() => import('./admin/pages/OrderList'));
const Analytics = lazy(() => import('./admin/pages/Analytics'));
const AdminSettings = lazy(() => import('./admin/pages/Settings'));
const ReviewsList = lazy(() => import('./admin/pages/ReviewsList'));
const SalesDiscounts = lazy(() => import('./admin/pages/SalesDiscounts'));

/* Layout wrapper for storefront pages — renders Navbar, page content via Outlet, and Footer */
const StorefrontLayout = () => {
    const location = useLocation();
    const isHome = location.pathname === '/';
    return (
        <div className="flex flex-col min-h-screen relative">
            <ThreeBackgroundCanvas />
            <div className="relative z-[60]">
                <Navbar />
            </div>
            <main className={`flex-grow pt-[104px] pb-12 w-full relative z-10 ${isHome ? '' : 'container-padding'}`}>
                <Outlet />
            </main>
            <div className="relative z-[60] mt-auto">
                <Footer />
            </div>
        </div>
    );
};

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]" aria-label="Loading">
        <div className="w-8 h-8 border-2 border-[var(--color-electric-blue)] border-t-transparent rounded-full animate-spin" />
    </div>
);

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <SessionManager />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="products" element={<ProductList />} />
                        <Route path="categories" element={<CategoryList />} />
                        <Route path="orders" element={<OrderList />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="reviews" element={<ReviewsList />} />
                        <Route path="sales-discounts" element={<SalesDiscounts />} />
                    </Route>

                    {/* Storefront Routes */}
                    <Route path="/" element={<StorefrontLayout />}>
                        <Route index element={<Home />} />
                        <Route path="collections/:category" element={<Collection />} />
                        <Route path="product/:id" element={<ProductDetails />} />
                        <Route path="about" element={<About />} />
                        <Route path="cart" element={<Cart />} />
                        <Route path="wishlist" element={<Wishlist />} />
                        <Route path="account" element={<Auth />} />
                        <Route path="checkout" element={<Checkout />} />
                        <Route path="orders" element={<OrderHistory />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="faq" element={<FAQ />} />
                        <Route path="shipping" element={<Shipping />} />
                        <Route path="careers" element={<Careers />} />
                        <Route path="sustainability" element={<Sustainability />} />
                        <Route path="privacy" element={<PrivacyPolicy />} />
                        <Route path="terms" element={<TermsOfService />} />
                        <Route path="payment-success" element={<PaymentSuccess />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
