import React from 'react';
import { Leaf } from 'lucide-react';

const Sustainability = () => {
    return (
        <div className="w-full pt-8 pb-12 min-h-screen px-4 sm:px-10 text-[var(--text-primary)] relative bg-transparent transition-colors duration-400">
            <div className="max-w-3xl mx-auto">
                {/* Hero Section - Centered & Elegant */}
                <div className="mb-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                            <Leaf size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] tracking-[0.6em] font-black text-accent uppercase mb-2 opacity-80">OUR COMMITMENT</p>
                    <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter uppercase mb-4 leading-none text-[var(--text-primary)]">
                        SUSTAINABILITY
                    </h1>
                    <div className="max-w-xl mx-auto">
                        <p className="text-sm md:text-base text-[var(--text-secondary)] font-sans uppercase tracking-widest opacity-80 leading-relaxed font-semibold">
                            Envisioning a better future through conscious craftsmanship.
                        </p>
                    </div>
                </div>

                {/* Content Sections - Structured Editorial Style */}
                <div className="space-y-12">
                    <section className="relative">
                        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-6 gap-2">
                            <h2 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight text-[var(--text-primary)]">Ethical Sourcing</h2>
                            <span className="hidden md:block flex-grow border-b border-[var(--surface-border)] mx-6 opacity-30"></span>
                            <span className="text-[10px] font-black tracking-widest text-accent uppercase">Pillar 01</span>
                        </div>
                        <p className="text-base md:text-lg font-sans text-[var(--text-secondary)] leading-relaxed tracking-wide">
                            At EYESTYLE, luxury and responsibility go hand in hand. We partner directly with family-owned Italian acetate manufacturers who utilize bio-based plasticizers derived from renewable sources like cotton seed and wood pulp, significantly reducing our reliance on fossil fuels.
                        </p>
                    </section>

                    <section className="relative">
                        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-6 gap-2">
                            <h2 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight text-[var(--text-primary)]">Waste Reduction</h2>
                            <span className="hidden md:block flex-grow border-b border-[var(--surface-border)] mx-6 opacity-30"></span>
                            <span className="text-[10px] font-black tracking-widest text-accent uppercase">Pillar 02</span>
                        </div>
                        <p className="text-base md:text-lg font-sans text-[var(--text-secondary)] leading-relaxed tracking-wide">
                            The traditional eyewear manufacturing process can generate immense waste. Our workshops employ precision CNC milling and closed-loop water systems to minimize offcuts and water pollution. Any scrap metal from our titanium lines is 100% recycled back into the supply chain.
                        </p>
                    </section>

                    <section className="relative">
                        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-6 gap-2">
                            <h2 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight text-[var(--text-primary)]">Eco-Conscious Packaging</h2>
                            <span className="hidden md:block flex-grow border-b border-[var(--surface-border)] mx-6 opacity-30"></span>
                            <span className="text-[10px] font-black tracking-widest text-accent uppercase">Pillar 03</span>
                        </div>
                        <p className="text-base md:text-lg font-sans text-[var(--text-secondary)] leading-relaxed tracking-wide">
                            Our protective cases are crafted from vegan leather alternatives and recycled microfiber. All shipping materials are fully biodegradable and sourced from FSC-certified forests, ensuring your new vision arrives without leaving a permanent mark on the earth.
                        </p>
                    </section>
                </div>

                {/* Footer Accent */}
                <div className="mt-16 pt-8 border-t border-[var(--surface-border)] text-center">
                    <p className="text-[10px] font-black tracking-[0.4em] text-[var(--text-muted)] uppercase italic">
                        Every frame tells a story of preservation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sustainability;
