import React from 'react';

const Careers = () => {
    return (
        <div className="w-full pt-12 pb-16 min-h-screen px-4 sm:px-10 text-[var(--text-primary)] relative bg-transparent transition-colors duration-400">
            <div className="max-w-4xl mx-auto">
                {/* Hero Header - Compact & Elegant */}
                <div className="mb-10 text-center">
                    <p className="text-[10px] tracking-[0.5em] font-black text-accent uppercase mb-3 opacity-80">OPPORTUNITIES</p>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter uppercase mb-3 leading-none text-[var(--text-primary)]">
                        CAREERS <span className="italic font-light">AT</span> EYESTYLE
                    </h1>
                    <p className="text-sm md:text-base text-[var(--text-secondary)] font-sans uppercase tracking-[0.15em] opacity-70">
                        Join our team of optical visionaries.
                    </p>
                </div>

                {/* Main Careers Message Box - Refined & Premium */}
                <div className="glass-modern border border-[var(--surface-border)] p-8 md:p-12 mb-16 relative overflow-hidden text-center rounded-sm">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"></div>
                    <h2 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight mb-4 text-[var(--text-primary)]">
                        We are <span className="italic font-light text-accent">always</span> looking for talent.
                    </h2>
                    <p className="text-[var(--text-secondary)] font-sans text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-8 opacity-90 uppercase tracking-[0.05em]">
                        At EYESTYLE, we are passionate about design, craftsmanship, and providing a luxury optical experience. If you share our dedication to excellence, we would love to hear from you.
                    </p>
                    <div className="pt-8 border-t border-[var(--surface-border)] opacity-80">
                        <p className="text-xs font-black tracking-widest uppercase mb-1 text-[var(--text-primary)]">Current Status</p>
                        <p className="text-sm font-medium mb-4 text-[var(--text-muted)] italic">No open positions at this time</p>
                        <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] hover:opacity-70 transition-all cursor-pointer inline-block border-b border-accent pb-1">
                            Submit resume for future opportunities
                        </p>
                    </div>
                </div>

                {/* Culture / Benefits / Growth - Structured Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 text-left">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-accent"></div>
                            <h3 className="font-black text-xs tracking-[0.3em] uppercase text-[var(--text-primary)]">Our Culture</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans leading-relaxed tracking-wide opacity-80 uppercase">
                            An open, collaborative environment focused on innovation and precise optics.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-accent"></div>
                            <h3 className="font-black text-xs tracking-[0.3em] uppercase text-[var(--text-primary)]">Benefits</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans leading-relaxed tracking-wide opacity-80 uppercase">
                            Comprehensive health, wellness, and generous eyewear allowances for staff.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-accent"></div>
                            <h3 className="font-black text-xs tracking-[0.3em] uppercase text-[var(--text-primary)]">Growth</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] text-xs md:text-sm font-sans leading-relaxed tracking-wide opacity-80 uppercase">
                            We invest heavily in professional development and advanced optical training.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Careers;
