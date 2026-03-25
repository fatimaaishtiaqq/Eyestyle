import ThreeBackground from '../components/ThreeBackground';

const Shipping = () => {
    return (
        <div className="w-full pt-6 pb-16 min-h-screen px-6 sm:px-10 text-[var(--text-primary)] relative bg-transparent transition-colors duration-400">
            <ThreeBackground variant="collection" />

            <div className="max-w-[1200px] mx-auto relative z-10">
                {/* Hero Section - Compact & Balanced */}
                <div className="mb-12 text-center">
                    <p className="text-[10px] tracking-[0.8em] font-black text-accent uppercase mb-3 opacity-80">LOGISTICS PROTOCOL</p>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter uppercase mb-3 leading-none text-[var(--text-primary)]">
                        SHIPPING
                    </h1>
                    <div className="flex items-center justify-center gap-6">
                        <span className="w-12 h-[1px] bg-white/20"></span>
                        <p className="text-[10px] tracking-[0.4em] font-black uppercase text-white shadow-sm">Delivery & Returns</p>
                        <span className="w-12 h-[1px] bg-white/20"></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
                    {/* Distribution Card */}
                    <section className="glass-modern border border-[var(--surface-border)] p-10 md:p-14 relative overflow-hidden flex flex-col rounded-sm">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"></div>
                        <h2 className="text-3xl font-serif font-black uppercase tracking-tight mb-8 text-[var(--text-primary)]">
                            DISTRIBUTION <span className="italic font-light text-accent">Methods</span>
                        </h2>
                        <div className="space-y-10">
                            {[
                                { label: 'STANDARD TRANSIT', detail: 'Complimentary on acquisitions over $150. Delivery within 3-5 operational days.' },
                                { label: 'EXPRESS EXPEDITION', detail: '$15 flat rate. Delivery within 1-2 operational days.' },
                                { label: 'GLOBAL REACH', detail: 'Calculated at checkout. Average transit of 7-14 operational days.' }
                            ].map((item, i) => (
                                <div key={i} className="border-l-2 border-accent/30 pl-6 group">
                                    <p className="text-[11px] md:text-xs font-black tracking-[0.3em] text-[var(--text-primary)] uppercase mb-2 group-hover:text-accent transition-colors">
                                        {item.label}
                                    </p>
                                    <p className="text-xs font-sans text-[var(--text-secondary)] uppercase tracking-[0.05em] leading-relaxed opacity-70">
                                        {item.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Retraction Card */}
                    <section className="glass-modern border border-[var(--surface-border)] p-10 md:p-14 relative overflow-hidden flex flex-col rounded-sm">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"></div>
                        <h2 className="text-3xl font-serif font-black uppercase tracking-tight mb-8 text-[var(--text-primary)]">
                            RETRACTION <span className="italic font-light text-accent">Policies</span>
                        </h2>
                        <p className="text-sm font-sans text-[var(--text-secondary)] uppercase tracking-[0.05em] mb-12 leading-relaxed opacity-80">
                            We demand absolute satisfaction. If an acquisition fails to meet your criteria, we accept returns of pristine merchandise within 30 days.
                        </p>
                        <ul className="space-y-8 mt-auto">
                            {[
                                'Pristine condition requirements',
                                'Prepaid domestic documentation',
                                'Rapid financial restoration'
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-5 text-sm md:text-base font-serif font-black italic tracking-tight text-[var(--text-primary)] border-b border-[var(--surface-border)] pb-4 last:border-0 hover:text-accent transition-colors cursor-default">
                                    <span className="w-2 h-2 bg-accent rounded-full"></span>
                                    {text.toUpperCase()}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Shipping;
