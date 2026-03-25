import React, { useState } from 'react';
import ThreeBackground from '../components/ThreeBackground';

const Contact = () => {
    const [status, setStatus] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('COMMUNICATION RECEIVED. OUR AGENTS WILL RESPOND SHORTLY.');
        e.target.reset();
    };

    return (
        <div className="w-full pt-6 pb-16 min-h-screen px-6 sm:px-10 text-[var(--text-primary)] relative bg-transparent transition-colors duration-400">
            <ThreeBackground variant="auth" />

            <div className="max-w-[1200px] mx-auto relative z-10">
                {/* Hero Section - Balanced & Compact */}
                <div className="mb-8 text-center">
                    <p className="text-[10px] tracking-[0.8em] font-black text-accent uppercase mb-3 opacity-80">DIRECT CHANNEL</p>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter uppercase mb-3 leading-none text-[var(--text-primary)]">
                        CONTACT US
                    </h1>
                    <div className="flex items-center justify-center gap-6">
                        <span className="w-12 h-[1px] bg-white/20"></span>
                        <p className="text-[10px] tracking-[0.4em] font-black uppercase text-white shadow-sm">Elite Concierge Support</p>
                        <span className="w-12 h-[1px] bg-white/20"></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                    {/* Inquiries Card */}
                    <div className="glass-modern border border-[var(--surface-border)] p-10 md:p-14 relative overflow-hidden flex flex-col rounded-sm">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"></div>
                        <h2 className="text-3xl font-serif font-black uppercase tracking-tight mb-6 text-[var(--text-primary)]">
                            INQUIRIES <span className="italic font-light text-accent">Concierge</span>
                        </h2>
                        <p className="text-sm font-sans text-[var(--text-secondary)] uppercase tracking-[0.05em] mb-12 leading-relaxed opacity-80">
                            Whether you seek styling advice or require assistance with an acquisition, our dedicated concierge team is at your disposal.
                        </p>

                        <div className="space-y-10 mt-auto">
                            <div className="group">
                                <p className="text-[8px] font-black tracking-[0.5em] text-accent uppercase mb-2">Email</p>
                                <p className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] group-hover:text-accent transition-colors cursor-pointer">
                                    SUPPORT@EYESTYLE.COM
                                </p>
                            </div>
                            <div className="group">
                                <p className="text-[8px] font-black tracking-[0.5em] text-accent uppercase mb-2">Phone</p>
                                <p className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] group-hover:text-accent transition-colors cursor-pointer">
                                    +1 (800) 123-4567
                                </p>
                            </div>
                            <div className="group">
                                <p className="text-[8px] font-black tracking-[0.5em] text-accent uppercase mb-2">Hours</p>
                                <p className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
                                    MON-FRI, 9AM - 6PM EST
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form Card */}
                    <div className="glass-modern border border-[var(--surface-border)] p-10 md:p-14 relative overflow-hidden rounded-sm">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"></div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[8px] font-black tracking-[0.4em] text-[var(--text-primary)] uppercase">Name</label>
                                <input required type="text" className="w-full bg-[var(--color-bg-section)] border border-[var(--surface-border)] px-5 py-4 outline-none focus:border-accent transition-all font-sans text-sm text-[var(--text-primary)] rounded-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[8px] font-black tracking-[0.4em] text-[var(--text-primary)] uppercase">Email</label>
                                <input required type="email" className="w-full bg-[var(--color-bg-section)] border border-[var(--surface-border)] px-5 py-4 outline-none focus:border-accent transition-all font-sans text-sm text-[var(--text-primary)] rounded-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[8px] font-black tracking-[0.4em] text-[var(--text-primary)] uppercase">Message</label>
                                <textarea required rows="4" className="w-full bg-[var(--color-bg-section)] border border-[var(--surface-border)] px-5 py-4 outline-none focus:border-accent transition-all font-sans text-sm text-[var(--text-primary)] resize-none rounded-none"></textarea>
                            </div>

                            <button type="submit" className="w-full h-16 bg-[var(--text-primary)] text-[var(--color-bg-section)] text-[10px] font-black tracking-[0.5em] uppercase hover:bg-accent hover:text-white transition-all transform hover:-translate-y-1">
                                DISPATCH MESSAGE
                            </button>
                            {status && (
                                <p className="text-accent text-[8px] mt-6 text-center font-black tracking-[0.2em] uppercase animate-pulse border border-accent/20 py-3 bg-accent/5">
                                    {status}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
