import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiClient';
import { useToast } from '../context/ToastContext';
import ThreeBackground from '../components/ThreeBackground';

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3, SUCCESS: 4 };

const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: v => v.length >= 8 },
    { id: 'lower', label: 'One lowercase letter', test: v => /[a-z]/.test(v) },
    { id: 'upper', label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
    { id: 'number', label: 'One number', test: v => /\d/.test(v) },
    { id: 'special', label: 'One special character', test: v => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
];

const ForgotPassword = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Timers
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);

    const otpRefs = useRef([]);

    // Countdown timers
    useEffect(() => {
        if (otpExpiry <= 0) return;
        const t = setInterval(() => setOtpExpiry(p => Math.max(0, p - 1)), 1000);
        return () => clearInterval(t);
    }, [otpExpiry]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setInterval(() => setResendCooldown(p => Math.max(0, p - 1)), 1000);
        return () => clearInterval(t);
    }, [resendCooldown]);

    const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ── Step 1: Request OTP ──
    const handleRequestOtp = async (e) => {
        if (e) e.preventDefault();
        setError('');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/forgot-password/request-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim() })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message); setLoading(false); return; }
            showToast(data.message, 'success');
            setOtpExpiry(600);
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            setStep(STEPS.OTP);
        } catch { setError('Network error. Please try again.'); }
        setLoading(false);
    };

    // ── Step 2: Verify OTP ──
    const handleVerifyOtp = async () => {
        setError('');
        const code = otp.join('');
        if (code.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/forgot-password/verify-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim(), otp: code })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                if (data.locked) { setOtp(['', '', '', '', '', '']); }
                setLoading(false);
                return;
            }
            showToast('OTP verified!', 'success');
            setStep(STEPS.PASSWORD);
        } catch { setError('Network error. Please try again.'); }
        setLoading(false);
    };

    // ── Resend OTP ──
    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/forgot-password/request-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim() })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message); setLoading(false); return; }
            showToast('New OTP sent!', 'success');
            setOtpExpiry(600);
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();
        } catch { setError('Network error.'); }
        setLoading(false);
    };

    // ── Step 3: Reset Password ──
    const allRulesPass = PASSWORD_RULES.every(r => r.test(newPassword));
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
    const canSubmitPassword = allRulesPass && passwordsMatch;

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!canSubmitPassword) return;
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/forgot-password/reset-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim(), newPassword, confirmPassword })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message); setLoading(false); return; }
            showToast(data.message, 'success');
            setStep(STEPS.SUCCESS);
        } catch { setError('Network error. Please try again.'); }
        setLoading(false);
    };

    // OTP input handlers
    const handleOtpChange = (idx, val) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...otp];
        next[idx] = val.slice(-1);
        setOtp(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };
    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    };
    const handleOtpPaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (text.length === 6) { setOtp(text.split('')); otpRefs.current[5]?.focus(); e.preventDefault(); }
    };

    // ── SHARED INPUT CLASSES ──
    const inputCls = "w-full border border-[var(--surface-border)] bg-[var(--surface-color)] pr-4 py-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--placeholder-color)] outline-none focus:border-accent transition-colors";
    const inputClsPass = "w-full border border-[var(--surface-border)] bg-[var(--surface-color)] pr-12 py-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--placeholder-color)] outline-none focus:border-accent transition-colors";
    const iconInputStyle = { paddingLeft: '52px' };

    return (
        <div className="w-full min-h-screen pb-20 text-[var(--text-primary)] relative bg-transparent">
            <ThreeBackground variant="auth" />
            <div className="max-w-lg mx-auto relative z-10">

                {/* Page Heading */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl sm:text-[28px] font-serif font-bold tracking-widest uppercase">
                        {step === STEPS.SUCCESS ? 'All Done' : 'Reset Password'}
                    </h1>
                    <p className="text-[12px] text-[var(--text-secondary)] tracking-wider mt-1">
                        {step === STEPS.EMAIL && 'Enter your email to receive a verification code'}
                        {step === STEPS.OTP && 'Enter the 6-digit code sent to your email'}
                        {step === STEPS.PASSWORD && 'Choose a new secure password'}
                        {step === STEPS.SUCCESS && 'Your password has been updated'}
                    </p>
                </div>

                {/* Card */}
                <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-6 sm:p-8">

                    {/* Step indicator */}
                    {step !== STEPS.SUCCESS && (
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3].map(s => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-colors ${step >= s ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' : 'border-[var(--surface-border)] text-[var(--text-muted)]'}`}>
                                        {step > s ? '✓' : s}
                                    </div>
                                    {s < 3 && <div className={`w-8 h-[2px] transition-colors ${step > s ? 'bg-[var(--color-primary)]' : 'bg-[var(--surface-border)]'}`} />}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-5 text-[11px] font-bold tracking-wider text-red-500 bg-red-500/5 border border-red-500/20 px-4 py-3 text-center">
                            {error}
                        </div>
                    )}

                    {/* ═══ STEP 1: EMAIL ═══ */}
                    {step === STEPS.EMAIL && (
                        <form onSubmit={handleRequestOtp} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className={inputCls} style={iconInputStyle} autoFocus />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className={`w-full btn-primary py-4 text-[11px] font-black tracking-[0.4em] uppercase ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                            <Link to="/account" className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors mt-2">
                                <ArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </form>
                    )}

                    {/* ═══ STEP 2: OTP ═══ */}
                    {step === STEPS.OTP && (
                        <div className="space-y-5">
                            <p className="text-[12px] text-[var(--text-secondary)] text-center">
                                Code sent to <strong className="text-[var(--text-primary)]">{email}</strong>
                            </p>

                            {/* OTP Boxes */}
                            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                                {otp.map((d, i) => (
                                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={d}
                                        onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                                        className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-black border border-[var(--surface-border)] bg-[var(--surface-color)] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] transition-colors"
                                        autoFocus={i === 0}
                                    />
                                ))}
                            </div>

                            {/* Expiry timer */}
                            {otpExpiry > 0 && (
                                <p className="text-center text-[11px] text-[var(--text-muted)]">
                                    Code expires in <span className="font-bold text-[var(--text-primary)]">{fmt(otpExpiry)}</span>
                                </p>
                            )}

                            <button onClick={handleVerifyOtp} disabled={loading || otp.join('').length !== 6}
                                className={`w-full btn-primary py-4 text-[11px] font-black tracking-[0.4em] uppercase ${loading || otp.join('').length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>

                            {/* Resend */}
                            <div className="text-center">
                                {resendCooldown > 0 ? (
                                    <p className="text-[11px] text-[var(--text-muted)]">Resend OTP in <span className="font-bold">{fmt(resendCooldown)}</span></p>
                                ) : (
                                    <button onClick={handleResend} disabled={loading} className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-primary)] hover:underline disabled:opacity-50">
                                        Resend OTP
                                    </button>
                                )}
                            </div>

                            <button onClick={() => { setStep(STEPS.EMAIL); setError(''); }} className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors w-full">
                                <ArrowLeft size={14} /> Change Email
                            </button>
                        </div>
                    )}

                    {/* ═══ STEP 3: NEW PASSWORD ═══ */}
                    {step === STEPS.PASSWORD && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-1.5">New Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className={inputClsPass} style={iconInputStyle} autoFocus />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Strength Checklist */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 px-1">
                                {PASSWORD_RULES.map(r => (
                                    <div key={r.id} className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${r.test(newPassword) ? 'bg-green-500 text-white' : 'border border-[var(--surface-border)] text-[var(--text-muted)]'}`}>
                                            {r.test(newPassword) ? '✓' : ''}
                                        </div>
                                        <span className={`text-[11px] ${r.test(newPassword) ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)]'}`}>{r.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[11px] font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClsPass} style={iconInputStyle} />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {confirmPassword && !passwordsMatch && (
                                    <p className="text-[11px] text-red-500 mt-1.5">Passwords do not match.</p>
                                )}
                                {passwordsMatch && (
                                    <p className="text-[11px] text-green-500 mt-1.5 flex items-center gap-1"><CheckCircle size={12} /> Passwords match</p>
                                )}
                            </div>

                            <button type="submit" disabled={loading || !canSubmitPassword}
                                className={`w-full btn-primary py-4 text-[11px] font-black tracking-[0.4em] uppercase ${loading || !canSubmitPassword ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    {/* ═══ STEP 4: SUCCESS ═══ */}
                    {step === STEPS.SUCCESS && (
                        <div className="flex flex-col items-center py-6">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                                <ShieldCheck size={32} className="text-green-500" />
                            </div>
                            <h2 className="text-lg font-serif font-bold tracking-widest uppercase mb-2">Password Updated</h2>
                            <p className="text-[12px] text-[var(--text-secondary)] text-center mb-8 max-w-xs">
                                Your password has been reset successfully. You can now sign in with your new password.
                            </p>
                            <Link to="/account" className="w-full btn-primary py-4 text-[11px] font-black tracking-[0.4em] uppercase text-center block">
                                Back to Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
