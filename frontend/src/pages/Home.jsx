import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Truck, Clock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { API_BASE_URL, getWithCache } from '../utils/apiClient';
import ThreeBackground from '../components/ThreeBackground';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const heroSlides = [
    {
        id: 1,
        image: "/images/generated/hero_highres_new_vision_1_1772800876135.png",
        subtitle: "THE NEW VISION COLLECTION",
        title: "ELEGANCE IN EVERY FRAME",
        text: "Discover our latest arrivals featuring meticulous craftsmanship, premium materials, and modern designs for timeless sophistication.",
        link: "/collections/all"
    },
    {
        id: 2,
        image: "/images/generated/hero_highres_summer_sun_2_1772800895014.png",
        subtitle: "SUMMER ESSENTIALS",
        title: "CHASE THE SUN IN STYLE",
        text: "Elevate your look with our meticulously designed designer sunglasses, offering ultimate UV protection and undeniable style.",
        link: "/collections/unisex"
    },
    {
        id: 3,
        image: "/images/generated/hero_highres_accessories_3_1772800963920.png",
        subtitle: "LUXURY ACCESSORIES",
        title: "THE PERFECT COMPANION",
        text: "Protect your investment with our handcrafted premium leather cases and exclusive eyewear care kits.",
        link: "/collections/women"
    },
    {
        id: 4,
        image: "/images/generated/hero_highres_everyday_men_4_clear_1772801359699.png",
        subtitle: "EVERYDAY EXCELLENCE",
        title: "CLARITY MEETS COMFORT",
        text: "Experience the perfect blend of optical clarity and weightless comfort with our titanium and acetate collections.",
        link: "/collections/men"
    }
];

const resolveImageUrl = (img) => {
    if (!img || typeof img !== 'string') return null;
    if (img.startsWith('http') || img.startsWith('https') || img.startsWith('/images/')) return img;
    // Fallback just in case, though Cloudinary returns https://...
    return img;
};

const Home = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [direction, setDirection] = useState(1); // 1 for right, -1 for left

    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
        }, 6000); // Slightly longer for luxurious pace
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getWithCache('/api/products');
                setTrendingProducts(data.products || []);
            } catch (error) {
                console.error('Failed to fetch trending products:', error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getWithCache('/api/categories');
                setCategories(data.filter(cat => !cat.parent && cat.isActive));
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const containerRef = useRef(null);

    // Hero text animation — runs once on mount only (NOT tied to currentSlide)
    useGSAP(() => {
        const prefersReduce =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduce) return;

        gsap.from('.hero-content > *', {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power4.out',
            delay: 0.5
        });
    }, { scope: containerRef, dependencies: [] });

    // Scroll reveals & parallax — also run once on mount, never re-run on slide change
    useGSAP(() => {
        const prefersReduce =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduce) return;

        // Scroll reveals for all sections — once: true keeps content visible after first play
        const sections = gsap.utils.toArray('section');
        sections.forEach((section) => {
            gsap.from(section, {
                opacity: 0,
                y: 60,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: section,
                    start: 'top 92%',
                    once: true,
                    toggleActions: 'play none none none'
                }
            });
        });

        // Parallax effect for section images
        gsap.to('.parallax-img', {
            yPercent: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: '.parallax-img',
                scrub: true
            }
        });

        // Refresh ScrollTrigger after scroll ends so fast-scrolled content still appears
        let scrollEndTicker;
        const onScrollEnd = () => {
            clearTimeout(scrollEndTicker);
            scrollEndTicker = setTimeout(() => ScrollTrigger.refresh(), 150);
        };
        window.addEventListener('scroll', onScrollEnd, { passive: true });
        return () => {
            clearTimeout(scrollEndTicker);
            window.removeEventListener('scroll', onScrollEnd);
        };
    }, { scope: containerRef, dependencies: [] });

    const nextSlide = () => {
        setDirection(1);
        setCurrentSlide(currentSlide === heroSlides.length - 1 ? 0 : currentSlide + 1);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentSlide(currentSlide === 0 ? heroSlides.length - 1 : currentSlide - 1);
    };

    return (
        <div ref={containerRef} className="w-full flex-col flex overflow-hidden bg-transparent">
            <ThreeBackground variant="home" />

            {/* Hero Carousel Section */}
            <section
                className="relative min-h-[85vh] max-w-full overflow-hidden group flex items-center justify-start w-full"
            >
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0 -z-10"
                    >
                        <motion.div
                            className="absolute inset-0 origin-center"
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 8, ease: "linear" }}
                        >
                            <img
                                src={heroSlides[currentSlide].image}
                                alt="Luxury Eyewear Hero"
                                className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.25))' }}></div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>

                {/* Text Content wrapped relative block with matching slide */}
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="relative h-full w-full max-w-[600px] flex items-center z-10"
                    >
                        <div className="w-full text-white hero-content flex flex-col items-center text-center md:items-start md:text-left mx-auto md:mx-0 px-6 sm:px-10 lg:px-20" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                            <h2 className="text-[clamp(14px,2vw,18px)] font-sans tracking-[0.5em] font-black uppercase mb-6 text-white/80 border-b-2 md:border-b-0 md:border-l-2 md:pl-4 border-white pb-2 md:pb-0">
                                {heroSlides[currentSlide].subtitle}
                            </h2>
                            <h1 className="text-[clamp(32px,6vw,72px)] leading-[1.1] font-serif font-black mb-6 text-white tracking-tighter w-full">
                                {heroSlides[currentSlide].title.split(' ').slice(0, 2).join(' ')}<br />
                                <span className="text-outline-white italic">{heroSlides[currentSlide].title.split(' ').slice(2).join(' ')}</span>
                            </h1>
                            <p className="text-[clamp(14px,2vw,16px)] text-white/70 font-sans leading-relaxed font-light mb-0">
                                {heroSlides[currentSlide].text}
                            </p>
                            <div className="flex flex-col md:flex-row w-full gap-[12px] md:gap-[20px] mt-[24px]">
                                <Link
                                    to={heroSlides[currentSlide].link}
                                    className="w-full md:w-auto bg-white text-black px-12 py-5 text-[10px] font-sans font-black tracking-[0.3em] uppercase transition-all hover:bg-accent hover:text-white flex justify-center items-center"
                                >
                                    DISCOVER NOW
                                </Link>
                                <Link
                                    to="/collections/all"
                                    className="w-full md:w-auto border border-white/30 backdrop-blur-md px-12 py-5 text-[10px] font-sans font-black tracking-[0.3em] uppercase transition-all hover:bg-white/10 flex justify-center items-center"
                                >
                                    VIEW COLLECTION
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Carousel Controls */}
                <div className="absolute top-1/2 -translate-y-1/2 left-6 lg:left-10 z-20">
                    <button onClick={prevSlide} className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg backdrop-blur-sm">
                        <ChevronLeft size={24} />
                    </button>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-6 lg:right-10 z-20">
                    <button onClick={nextSlide} className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg backdrop-blur-sm">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </section>

            {/* Category Section - Transparent to show 3D */}
            {categories.length > 0 && (
                <section className="pt-24 md:pt-32 pb-12 md:pb-16 bg-transparent relative z-10">
                    <style>{`
                        .carousel-card {
                            width: calc((100% - 0px) / 1); /* Mobile: 1 card */
                        }
                        @media (min-width: 768px) {
                            .carousel-card {
                                width: calc((100% - clamp(16px, 3vw, 32px)) / 2); /* Tablet: 2 cards */
                            }
                        }
                        @media (min-width: 1024px) {
                            .carousel-card {
                                width: calc((100% - (2 * clamp(16px, 3vw, 32px))) / 3); /* Laptop: 3 cards */
                            }
                        }
                        @media (min-width: 1440px) {
                            .carousel-card {
                                width: calc((100% - (3 * clamp(16px, 3vw, 32px))) / 4); /* Desktop: 4 cards */
                            }
                        }
                    `}</style>
                    <div className="max-w-[1600px] mx-auto px-4 md:px-10 mb-20 text-center">
                        <span className="text-[10px] font-sans tracking-[0.5em] font-black text-[var(--text-muted)] uppercase mb-4 block">CATEGORIES</span>
                        <h3 className="text-5xl md:text-6xl font-serif font-black text-[var(--text-primary)] uppercase tracking-tighter">OUR REFINED<br /><span className="italic font-light">SELECTIONS</span></h3>
                    </div>

                    <div className="max-w-[1600px] mx-auto overflow-hidden pb-10 px-4 md:px-10">
                        <div
                            className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            style={{ gap: 'clamp(16px, 3vw, 32px)' }}
                        >
                            {categories.map((cat, idx) => (
                                <Link
                                    key={cat._id}
                                    to={`/collections/${cat.slug}`}
                                    className="relative shrink-0 snap-start group overflow-hidden block aspect-[3/4] max-w-full carousel-card"
                                >
                                    <img
                                        src={resolveImageUrl(cat.image)}
                                        alt={cat.name}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                    <div className="absolute bottom-10 left-10 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <p className="text-[10px] tracking-[0.3em] font-bold mb-2">0{idx + 1}</p>
                                        <h4 className="text-4xl font-serif font-black uppercase mb-4 leading-none text-white">{cat.name}</h4>
                                        <span className="text-[10px] tracking-[0.5em] font-black border-b border-white pb-1">VIEW ALL</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* New Arrivals - Transparent */}
            <section className="pt-12 md:pt-16 pb-24 md:pb-32 bg-transparent relative z-10">
                <div className="max-w-[1600px] mx-auto px-4 md:px-10 flex flex-col items-center text-center mb-20">
                    <span className="text-[10px] font-sans tracking-[0.5em] font-black text-[var(--text-muted)] uppercase mb-4 block">LATEST DROP</span>
                    <h3 className="text-5xl md:text-6xl font-serif font-black text-[var(--text-primary)] uppercase tracking-tighter mb-10">THE LATEST<br /><span className="italic font-light">ARRIVALS</span></h3>
                    <Link to="/collections/all" className="text-[10px] font-sans font-black tracking-[0.4em] uppercase border-2 border-[var(--text-primary)] px-10 py-5 hover:bg-[var(--text-primary)] hover:text-[var(--bg-color)] transition-all">
                        SEE THE FULL RANGE
                    </Link>
                </div>

                <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-12 px-4 md:px-10">
                    {trendingProducts.slice(0, 5).map((product) => (
                        <div key={product._id} className="reveal-item">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Split Banner - More immersive */}
            <section className="h-[600px] w-full flex flex-col md:flex-row">
                <Link to="/collections/men" className="relative flex-1 group overflow-hidden border-r border-white/5">
                    <img
                        src="/images/generated/collection_men_new_1772798073357.png"
                        alt="Men"
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-700">
                        <h2 className="text-[10px] tracking-[1em] mb-4 text-white/60">FOR THEM</h2>
                        <h3 className="text-7xl md:text-9xl font-serif font-black text-white tracking-widest uppercase">MEN</h3>
                    </div>
                </Link>
                <Link to="/collections/women" className="relative flex-1 group overflow-hidden">
                    <img
                        src="/images/generated/collection_women_new_1772798088665.png"
                        alt="Women"
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-all"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-700">
                        <h2 className="text-[10px] tracking-[1em] mb-4 text-white/60">FOR HER</h2>
                        <h3 className="text-7xl md:text-9xl font-serif font-black text-white tracking-widest uppercase">WOMEN</h3>
                    </div>
                </Link>
            </section>

            {/* Trending Section */}
            <section className="pt-24 md:pt-32 pb-12 md:pb-16 bg-transparent relative z-10">
                <div className="max-w-[1600px] mx-auto px-4 md:px-10 text-center mb-20">
                    <span className="text-[10px] font-sans tracking-[0.5em] font-black text-[var(--text-muted)] uppercase mb-4 block">THE TREND</span>
                    <h3 className="text-5xl md:text-6xl font-serif font-black text-[var(--text-primary)] uppercase tracking-tighter">OUR MOST<br /><span className="italic font-light">COVETED</span></h3>
                </div>

                <div className="max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-12 gap-y-20 px-4 md:px-10">
                    {trendingProducts.slice(5, 15).map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </section>

            {/* Newsletter - Glassmorphism */}
            <section className="pt-12 md:pt-16 pb-12 md:pb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
                <div className="max-w-4xl mx-auto relative z-10 px-4 text-center">
                    <span className="text-[10px] font-sans tracking-[0.5em] font-black mb-10 text-[var(--text-primary)] block">THE NEWSLETTER</span>
                    <h3 className="text-5xl md:text-6xl font-serif font-black mb-12 uppercase leading-none text-[var(--text-primary)]">GAIN EARLY<br /><span className="italic italic-outline">ACCESS</span></h3>
                    <form className="max-w-2xl mx-auto flex flex-col md:flex-row gap-6">
                        <input
                            type="email"
                            placeholder="YOUR EMAIL"
                            className="flex-1 bg-transparent border-b-2 border-[var(--text-primary)] py-5 text-sm tracking-widest uppercase font-bold outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                            required
                        />
                        <button className="bg-[var(--text-primary)] text-[var(--bg-color)] px-14 py-5 text-[10px] font-black tracking-widest uppercase hover:bg-black hover:text-white transition-all">
                            JOIN NOW
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Home;
