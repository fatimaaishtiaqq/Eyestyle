import ThreeBackground from '../components/ThreeBackground';

const About = () => {
    return (
        <div className="w-full pt-16 pb-24 min-h-screen px-4 sm:px-10 text-[var(--text-primary)] relative bg-transparent transition-colors duration-400">
            <ThreeBackground variant="default" />

            <div className="max-w-[1400px] mx-auto relative z-10">
                {/* Immersive Header - Tightened Spacing */}
                <div className="mb-16 text-center">
                    <p className="text-[10px] tracking-[0.6em] font-black text-accent uppercase mb-4 opacity-80">ESTABLISHED LEGACY</p>
                    <h1 className="text-5xl md:text-8xl font-serif font-black tracking-tighter uppercase leading-none mb-8 text-[var(--text-primary)]">
                        OUR VISION
                    </h1>
                    <div className="max-w-2xl mx-auto glass-modern border border-[var(--surface-border)] p-8 md:p-12 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--surface-border)] to-transparent"></div>
                        <p className="text-lg md:text-xl font-serif italic uppercase leading-relaxed text-[var(--text-primary)]">
                            "True elegance is clear vision combined with timeless design. Our journey began with a single frame and a passion for optical perfection."
                        </p>
                    </div>
                </div>

                {/* Genesis Section - Balanced Grid & Spacing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
                    <div className="relative group overflow-hidden border border-[var(--surface-border)] rounded-sm max-h-[500px] lg:max-h-[600px]">
                        <img
                            src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1600&auto=format&fit=crop"
                            alt="Eyewear Craftsmanship"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                    </div>

                    <div className="space-y-8 lg:space-y-10">
                        <div>
                            <p className="text-[8px] font-black tracking-[0.4em] text-accent uppercase mb-4 opacity-80">THE NARRATIVE</p>
                            <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tighter uppercase leading-[1.1] mb-6 text-[var(--text-primary)]">
                                THE GENESIS OF <span className="italic font-light">EYESTYLE</span>
                            </h2>
                            <div className="w-16 h-1 bg-accent"></div>
                        </div>

                        <div className="space-y-6 text-sm font-sans text-[var(--text-secondary)] leading-loose uppercase tracking-[0.05em]">
                            <p>
                                Founded with a passion for precise optics and high fashion, EYESTYLE has dedicated itself to curating the finest luxury eyewear. We believe that glasses are more than just a tool for sight; they are the defining accessory of your personal style.
                            </p>
                            <p>
                                That is why we meticulously source premium materials like Italian acetate, pure titanium, and advanced lightweight alloys. Every piece is a testament to the pursuit of aesthetic and optical purity.
                            </p>
                            <p>
                                Our partner artisans dedicate countless hours to crafting flawless frames and polishing exquisite lenses, ensuring every pair offers unparalleled clarity and comfort.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Pillars Section - 3-Column Grid with Optimized Responsiveness */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {[
                        { title: 'CRAFTSMANSHIP', desc: 'Every piece is masterfully created with an obsessive attention to detail.' },
                        { title: 'SUPERIOR QUALITY', desc: 'We source only the rarest and finest raw materials from around the globe.' },
                        { title: 'SUSTAINABILITY', desc: 'Ethical production that respects both our artisans and our planet.' }
                    ].map((item, idx) => (
                        <div key={idx} className="glass-modern border border-[var(--surface-border)] p-10 text-center group hover:border-accent/40 transition-all duration-500 rounded-sm">
                            <p className="text-[9px] font-black tracking-[0.3em] text-accent uppercase mb-4 opacity-70">PILLAR {idx + 1}</p>
                            <h3 className="text-lg font-serif font-black uppercase tracking-normal mb-3 text-[var(--text-primary)] group-hover:scale-105 transition-all">{item.title}</h3>
                            <p className="text-[11px] font-sans text-[var(--text-muted)] uppercase tracking-[0.15em] leading-relaxed px-4">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default About;
