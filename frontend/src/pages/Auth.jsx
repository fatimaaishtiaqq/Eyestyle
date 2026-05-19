import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../utils/apiClient';
import { recordLogin, performLogout } from '../utils/sessionManager';
import ThreeBackground from '../components/ThreeBackground';
import { User, ShoppingBag, Settings, LogOut, Mail, Lock, UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react';

const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: v => v.length >= 8 },
    { id: 'lower', label: 'One lowercase letter', test: v => /[a-z]/.test(v) },
    { id: 'upper', label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
    { id: 'number', label: 'One number', test: v => /\d/.test(v) },
    { id: 'special', label: 'One special character', test: v => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
];
import { auth, googleProvider } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [user, setUser] = useState(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('lux_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || '/';

    const syncWithBackend = async (firebaseUser, displayName, authMethod = 'email') => {
        try {
            const idToken = await firebaseUser.getIdToken();
            const res = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken,
                    authMethod,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || 'Failed to sync with backend.');
            }

            if (data?.token) {
                localStorage.setItem('lux_user', JSON.stringify({
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    isAdmin: data.isAdmin,
                    role: data.role,
                    token: data.token,
                }));
                recordLogin();
            }

            setSuccess(isLogin ? 'Signed in successfully.' : 'Account created successfully.');

            setTimeout(() => {
                if (data.isAdmin) {
                    navigate('/admin');
                } else {
                    navigate(from);
                }
            }, 600);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await syncWithBackend(result.user, result.user.displayName, 'google');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email || !password || (!isLogin && !name)) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);
            let userCredential;

            if (isLogin) {
                // Try Firebase login first, fall back to MongoDB login if it fails
                // (needed when password was reset via forgot-password which updates MongoDB only)
                try {
                    userCredential = await signInWithEmailAndPassword(auth, email, password);
                    await syncWithBackend(userCredential.user, userCredential.user.displayName, 'email');
                } catch (firebaseErr) {
                    // If Firebase login fails, try direct backend MongoDB login
                    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data?.message || 'Invalid email or password.');
                    }
                    // MongoDB login succeeded — save user data
                    localStorage.setItem('lux_user', JSON.stringify({
                        _id: data._id,
                        name: data.name,
                        email: data.email,
                        isAdmin: data.isAdmin,
                        role: data.role,
                        token: data.token,
                    }));
                    recordLogin();
                    setSuccess('Signed in successfully.');
                    setTimeout(() => {
                        if (data.isAdmin) {
                            navigate('/admin');
                        } else {
                            navigate(from);
                        }
                    }, 600);
                }
            } else {
                // Firebase Register
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name });
                await syncWithBackend(userCredential.user, name, 'email');
            }
        } catch (err) {
            // Firebase returns specific error codes, make them user friendly
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already in use. Please sign in instead.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError(err.message);
            }
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setUser(null);
        performLogout('manual');
    };

    /* ─────────────────────────────────────────────────────────
       LOGGED-IN VIEW — Card-based Account Dashboard
    ───────────────────────────────────────────────────────── */
    if (user) {
        return (
            <div className="w-full min-h-screen pb-20 text-[var(--text-primary)] relative bg-transparent">
                <ThreeBackground variant="auth" />

                <div className="max-w-2xl mx-auto relative z-10">

                    {/* Page Heading */}
                    <div className="mb-8 border-b border-[var(--surface-border)] pb-4">
                        <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">
                            My Account
                        </h1>
                        <p className="text-[12px] text-[var(--text-secondary)] tracking-wider mt-1">
                            Manage your account and orders
                        </p>
                    </div>

                    {/* ── Profile Card ──────────────────────────── */}
                    <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-6 sm:p-8 mb-5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-full bg-[var(--surface-color)] border border-[var(--surface-border)] flex items-center justify-center text-2xl font-serif font-bold text-accent shrink-0">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-lg font-serif font-bold text-[var(--text-primary)] truncate">
                                    {user.name}
                                </h2>
                                <p className="text-sm text-[var(--text-secondary)] truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Action Cards ──────────────────────────── */}
                    <div className="space-y-4">

                        {/* My Orders */}
                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 flex items-center gap-4 hover:border-accent transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-full bg-[var(--surface-color)] border border-[var(--surface-border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-accent transition-colors shrink-0">
                                <ShoppingBag size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                                    My Orders
                                </p>
                                <p className="text-[12px] text-[var(--text-muted)]">
                                    View your order history and track deliveries
                                </p>
                            </div>
                            <span className="text-[var(--text-muted)] group-hover:text-accent transition-colors">›</span>
                        </button>

                        {/* Admin Dashboard — visible only for admins */}
                        {user.isAdmin && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="w-full border border-accent/20 bg-accent/5 p-5 flex items-center gap-4 hover:border-accent transition-colors text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                                    <Settings size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                                        Admin Dashboard
                                    </p>
                                    <p className="text-[12px] text-[var(--text-muted)]">
                                        Manage products, orders, and users
                                    </p>
                                </div>
                                <span className="text-accent">›</span>
                            </button>
                        )}

                        {/* Sign Out */}
                        <button
                            onClick={handleLogout}
                            className="w-full border border-red-500/20 bg-red-500/5 p-5 flex items-center gap-4 hover:border-red-500 transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                                <LogOut size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                                    Sign Out
                                </p>
                                <p className="text-[12px] text-[var(--text-muted)]">
                                    End your current session
                                </p>
                            </div>
                            <span className="text-red-500/50 group-hover:text-red-500 transition-colors">›</span>
                        </button>

                    </div>
                </div>
            </div>
        );
    }

    /* ─────────────────────────────────────────────────────────
       LOGGED-OUT VIEW — Sign In / Create Account Form
    ───────────────────────────────────────────────────────── */
    return (
        <div className="w-full min-h-screen pb-20 text-[var(--text-primary)] relative bg-transparent">
            <ThreeBackground variant="auth" />

            <div className="max-w-lg mx-auto relative z-10">

                {/* Page Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase text-[var(--text-primary)]">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </h1>
                    <p className="text-[12px] text-[var(--text-secondary)] tracking-wider mt-1">
                        {isLogin
                            ? 'Sign in to access your account and orders'
                            : 'Create an account to start shopping'}
                    </p>
                </div>

                {/* ── Auth Card ─────────────────────────────── */}
                <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-6 sm:p-8">

                    {/* Tab Switcher */}
                    <div className="flex border-b border-[var(--surface-border)] mb-6">
                        <button
                            className={`flex-1 pb-3 text-[11px] font-black tracking-[0.3em] uppercase transition-all relative ${isLogin ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                        >
                            Sign In
                            {isLogin && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]" />}
                        </button>
                        <button
                            className={`flex-1 pb-3 text-[11px] font-black tracking-[0.3em] uppercase transition-all relative ${!isLogin ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                        >
                            Create Account
                            {!isLogin && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)]" />}
                        </button>
                    </div>

                    {/* Error / Success Messages */}
                    {error && (
                        <div className="mb-5 text-[11px] font-bold tracking-wider text-red-500 bg-red-500/5 border border-red-500/20 px-4 py-3 text-center">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 text-[11px] font-bold tracking-wider text-green-500 bg-green-500/5 border border-green-500/20 px-4 py-3 text-center">
                            {success}
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className={`w-full bg-[var(--surface-color)] border border-[var(--surface-border)] text-[var(--text-primary)] py-3 flex items-center justify-center gap-3 transition-colors hover:border-[var(--text-primary)] mb-5 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-[12px] font-bold tracking-wider">Continue with Google</span>
                    </button>

                    <div className="flex items-center gap-4 mb-5">
                        <div className="h-[1px] flex-1 bg-[var(--surface-border)]"></div>
                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">OR</span>
                        <div className="h-[1px] flex-1 bg-[var(--surface-border)]"></div>
                    </div>

                    {/* Form */}
                    <form className="space-y-5" onSubmit={handleSubmit}>

                        {/* Name — only for registration */}
                        {!isLogin && (
                            <div>
                                <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-1.5" htmlFor="name">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input
                                        type="text"
                                        id="name"
                                        placeholder="Your full name"
                                        style={{ paddingLeft: '52px' }}
                                        className="w-full border border-[var(--surface-border)] bg-[var(--surface-color)] pr-4 py-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--placeholder-color)] outline-none focus:border-accent transition-colors"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-1.5" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="your@email.com"
                                    style={{ paddingLeft: '52px' }}
                                    className="w-full border border-[var(--surface-border)] bg-[var(--surface-color)] pr-4 py-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--placeholder-color)] outline-none focus:border-accent transition-colors"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)]" htmlFor="password">
                                    Password
                                </label>
                                {isLogin && (
                                    <Link
                                        to="/forgot-password"
                                        className="text-[10px] font-bold tracking-wider text-[var(--color-primary)] hover:underline uppercase"
                                    >
                                        Forgot Password?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="••••••••"
                                    style={{ paddingLeft: '52px' }}
                                    className="w-full border border-[var(--surface-border)] bg-[var(--surface-color)] pr-12 py-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--placeholder-color)] outline-none focus:border-accent transition-colors"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Password Rules — only for registration */}
                        {!isLogin && password && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 px-1">
                                {PASSWORD_RULES.map(r => (
                                    <div key={r.id} className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                                            r.test(password)
                                                ? 'bg-green-500 text-white'
                                                : 'border border-[var(--surface-border)] text-[var(--text-muted)]'
                                        }`}>
                                            {r.test(password) ? '✓' : ''}
                                        </div>
                                        <span className={`text-[11px] ${
                                            r.test(password)
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-[var(--text-muted)]'
                                        }`}>{r.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full btn-primary py-4 text-[11px] font-black tracking-[0.4em] uppercase transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Auth;
