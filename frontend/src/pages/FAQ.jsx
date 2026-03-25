import ThreeBackground from '../components/ThreeBackground';

const FAQ = () => {
    const faqs = [
        { q: "What materials are your frames made of?", a: "We use premium materials including handcrafted Italian acetate, ultra-lightweight titanium, and durable metal alloys to ensure maximum comfort and longevity." },
        { q: "Do you offer prescription lenses?", a: "Currently, we offer standard fashion lenses, UV-protective sunglasses, and blue light blocking lenses. We are working on adding prescription lens services in the future." },
        { q: "How do I know my frame size?", a: "Please refer to our Frame Size Guide to learn how to measure your face and find the perfect fit. Most of our frames come in Standard fit." },
        { q: "What is your return policy?", a: "We offer a 30-day return policy for unused frames in their original packaging. Please visit our Shipping & Returns page for detailed instructions." }
    ];

    return (
        <div className="w-full pt-6 pb-16 min-h-screen px-6 sm:px-10 text-[var(--text-primary)] relative bg-transparent transition-colors duration-400">
            <ThreeBackground variant="collection" />

            <div className="max-w-[1000px] mx-auto relative z-10">
                {/* Hero Section - Compact & Balanced */}
                <div className="mb-12 text-center">
                    <p className="text-[10px] tracking-[0.8em] font-black text-accent uppercase mb-3 opacity-80">INFORMATION NEXUS</p>
                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter uppercase mb-3 leading-none text-[var(--text-primary)]">
                        F.A.Q.
                    </h1>
                    <div className="flex items-center justify-center gap-6">
                        <span className="w-12 h-[1px] bg-white/20"></span>
                        <p className="text-[10px] tracking-[0.4em] font-black uppercase text-white shadow-sm">Knowledge Base</p>
                        <span className="w-12 h-[1px] bg-white/20"></span>
                    </div>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="glass-modern border border-[var(--surface-border)] p-8 md:p-10 relative overflow-hidden group hover:border-accent/30 transition-all rounded-sm">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent"></div>

                            <div className="flex items-start gap-4 mb-5">
                                <span className="text-accent text-sm font-black mt-1">Q.</span>
                                <h3 className="text-xl md:text-2xl font-serif font-black uppercase tracking-tight text-[var(--text-primary)] leading-tight">
                                    {faq.q}
                                </h3>
                            </div>

                            <div className="flex items-start gap-4 border-t border-[var(--surface-border)] pt-6">
                                <span className="text-[var(--text-muted)] text-sm font-bold mt-1 opacity-50">A.</span>
                                <p className="text-sm font-sans text-[var(--text-secondary)] uppercase tracking-[0.05em] leading-relaxed opacity-80">
                                    {faq.a}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
