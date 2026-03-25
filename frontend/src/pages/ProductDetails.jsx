import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ChevronRight, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { getWithCache, API_BASE_URL } from '../utils/apiClient';
import { useTheme } from '../context/ThemeContext';
import ThreeBackground from '../components/ThreeBackground';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);


const normalizeImagePath = (data) => {
    let parsedImage = data.image || '/images/sample.jpg';

    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        let imgPath = data.images[0];

        // If the DB accidentally stored a File object or similar, try to salvage
        if (imgPath && typeof imgPath === 'object') {
            imgPath = imgPath.path || imgPath.url || imgPath.filename || '';
        }

        if (typeof imgPath === 'string' && imgPath.trim() !== '') {
            if (imgPath.startsWith('http') || imgPath.startsWith('/images/')) {
                parsedImage = imgPath;
            } else {
                const pathParts = imgPath.replace(/\\/g, '/').split('/');
                const fileName = pathParts[pathParts.length - 1];
                const base = API_BASE_URL || '';
                parsedImage = `${base}/uploads/${fileName}`;
            }
        }
    }

    return parsedImage;
};

const API_URL = API_BASE_URL || '';

const resolveVariationImage = (imgPath) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('http') || imgPath.startsWith('/images/')) return imgPath;
    const pathParts = String(imgPath).replace(/\\/g, '/').split('/');
    const fileName = pathParts[pathParts.length - 1];
    return `${API_URL}/uploads/${fileName}`;
};

/** First image in product images array — used as default main image on load. No variation applied. */
const getDefaultProductImage = (data) => {
    if (!data) return '';
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        let imgPath = data.images[0];
        if (imgPath && typeof imgPath === 'object') imgPath = imgPath.path || imgPath.url || imgPath.filename || '';
        if (typeof imgPath === 'string' && imgPath.trim() !== '') return resolveVariationImage(imgPath);
    }
    return normalizeImagePath(data);
};

const getCategorySlugFromProduct = (product) => {
    const raw = product?.category;
    if (!raw) return 'all';
    if (typeof raw === 'object') {
        return String(raw.slug || raw.name || 'all').toLowerCase();
    }
    return String(raw);
};

const getCategoryLabelFromProduct = (product) => {
    const raw = product?.category;
    if (!raw) return 'Collection';
    if (typeof raw === 'object') {
        return String(raw.name || 'Collection');
    }
    const str = String(raw);
    // If backend only stored an id here, don't show it to the user
    if (/^[0-9a-fA-F]{16,24}$/.test(str) || str.length > 24) {
        return 'Collection';
    }
    return str;
};

const getShortProductTitle = (name, wordLimit = 2) => {
    if (!name) return '';
    const parts = String(name).split(/\s+/);
    if (parts.length <= wordLimit) return String(name);
    return `${parts.slice(0, wordLimit).join(' ')}...`;
};

const ProductDetails = () => {
    const { id } = useParams();
    const variationSectionRef = React.useRef(null);
    const [selectedVariations, setSelectedVariations] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [showAllColors, setShowAllColors] = useState({});
    const [visibleCounts, setVisibleCounts] = useState({});
    const rulerRefs = React.useRef({});
    const [activeTab, setActiveTab] = useState('description');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    /** Single source of truth for main image. Updated by: thumbnail click, variation change, or product load. */
    const [activeImage, setActiveImage] = useState(null);
    const [hoverThumbnail, setHoverThumbnail] = useState(null);
    const [showVariationRequiredModal, setShowVariationRequiredModal] = useState(false);

    const { addToCart, cartItems } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();
    const { theme } = useTheme(); // To fetch the current theme for dynamic heart coloring

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);

    const containerRef = React.useRef(null);

    useGSAP(() => {
        const prefersReduce =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduce) {
            return;
        }

        gsap.to('.product-image-parallax', {
            y: -30,
            ease: "none",
            scrollTrigger: {
                trigger: '.product-image-container',
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });

        // Very fast reveal — no delay so content shows as soon as product loads
        gsap.from('.product-title', {
            y: 18,
            opacity: 0,
            duration: 0.28,
            ease: "power2.out"
        });

        gsap.from('.stagger-reveal > *', {
            y: 10,
            opacity: 0,
            duration: 0.22,
            stagger: 0.04,
            ease: "power2.out",
            delay: 0.08
        });

        gsap.from('.related-product-card', {
            y: 20,
            opacity: 0,
            duration: 0.35,
            stagger: 0.05,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '.related-section',
                start: 'top 92%',
                once: true
            }
        });

        const t = setTimeout(() => ScrollTrigger.refresh(), 60);
        let scrollEndTicker;
        const onScrollEnd = () => {
            clearTimeout(scrollEndTicker);
            scrollEndTicker = setTimeout(() => ScrollTrigger.refresh(), 120);
        };
        window.addEventListener('scroll', onScrollEnd, { passive: true });
        return () => {
            clearTimeout(t);
            clearTimeout(scrollEndTicker);
            window.removeEventListener('scroll', onScrollEnd);
        };
    }, { scope: containerRef, dependencies: [product] });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await getWithCache(`/api/products/${id}`, { ttl: 0 });

                const fullProduct = {
                    ...data,
                    image: normalizeImagePath(data)
                };
                setProduct(fullProduct);
                setSelectedVariations({});
                setActiveImage(getDefaultProductImage(fullProduct));
                setQuantity(1);

                // Fetch all products once (cached) to find related ones
                const allData = await getWithCache('/api/products');
                const related = (allData.products || []).filter(p => {
                    if (p._id === fullProduct._id) return false;

                    const pCat = typeof p.category === 'object' ? String(p.category?._id || p.category?.name) : String(p.category || '');
                    const curCat = typeof fullProduct.category === 'object' ? String(fullProduct.category?._id || fullProduct.category?.name) : String(fullProduct.category || '');

                    return pCat && curCat && pCat === curCat;
                });
                setRelatedProducts(related);
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Cap quantity when product has limited stock
    useEffect(() => {
        if (product?.countInStock == null) return;
        const max = Number(product.countInStock);
        if (max < 1) setQuantity(1);
        else setQuantity((q) => (q > max ? max : q));
    }, [product?.countInStock]);

    // When variation selection changes: update single source of truth (activeImage). Variation always wins over thumbnail.
    useEffect(() => {
        if (!product || !product.variations?.length) return;
        const defaultImg = getDefaultProductImage(product);
        let variationImageUrl = null;
        for (const v of product.variations) {
            if (!v.options?.length) continue;
            const selectedValue = selectedVariations[v.name];
            if (selectedValue == null) continue;
            const option = v.options.find(o => (typeof o === 'object' ? o.value : o) === selectedValue);
            if (option && typeof option === 'object' && option.image && String(option.image).trim()) {
                variationImageUrl = resolveVariationImage(option.image);
                break;
            }
        }
        setActiveImage(variationImageUrl != null ? variationImageUrl : defaultImg);
    }, [selectedVariations, product]);

    // Aggregate all product images for the carousel; first image is always default (same as getDefaultProductImage).
    const allImages = React.useMemo(() => {
        if (!product) return [];
        const seen = new Set();
        const ordered = [];
        const defaultImg = getDefaultProductImage(product);
        if (defaultImg && !seen.has(defaultImg)) {
            seen.add(defaultImg);
            ordered.push(defaultImg);
        }
        if (Array.isArray(product.images)) {
            product.images.forEach(img => {
                let path = img;
                if (path && typeof path === 'object') path = path.path || path.url || path.filename || '';
                if (typeof path === 'string' && path.trim() !== '') {
                    const resolved = resolveVariationImage(path);
                    if (resolved && !seen.has(resolved)) {
                        seen.add(resolved);
                        ordered.push(resolved);
                    }
                }
            });
        }
        if (product.image && !seen.has(product.image)) ordered.push(product.image);
        return ordered;
    }, [product]);

    // Single source of truth: activeImage. Hover shows thumbnail preview; when not hovering, show activeImage.
    const displayImage = hoverThumbnail || activeImage || getDefaultProductImage(product);

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
        setMousePos({ x: 0, y: 0 });
    };

    if (loading) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center">
                <div className="w-20 h-[1px] bg-accent animate-pulse mb-8"></div>
                <p className="text-[10px] tracking-[1em] uppercase font-black">LOADING EXPERIENCE</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center text-[var(--text-primary)]">
                <h1 className="text-4xl font-serif font-black tracking-tighter mb-8">PRODUCT NOT FOUND</h1>
                <Link to="/collections/all" className="text-[10px] tracking-[0.3em] font-black border-b border-accent pb-2">BACK TO GALLERY</Link>
            </div>
        );
    }

    const hasAllVariationsSelected = () => {
        if (!product?.variations?.length) return true;
        return product.variations.every(
            (v) => selectedVariations[v.name] != null && String(selectedVariations[v.name]).trim() !== ''
        );
    };

    const handleAddToCart = () => {
        if (product.variations && product.variations.length > 0 && !hasAllVariationsSelected()) {
            setShowVariationRequiredModal(true);
            setTimeout(() => variationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            return;
        }
        const countInStock = product.countInStock != null ? Number(product.countInStock) : null;
        if (countInStock != null && countInStock < 1) {
            showToast('This product is currently out of stock', 'error');
            return;
        }
        const variationId = JSON.stringify(selectedVariations);
        const existingInCart = cartItems.find(
            (item) => (item._id || item.id) === (product._id || product.id) && (item.variationId || JSON.stringify(item.variations || {})) === variationId
        );
        const existingQty = existingInCart ? existingInCart.quantity : 0;
        const totalWanted = existingQty + quantity;
        if (countInStock != null && totalWanted > countInStock) {
            showToast(`Only ${countInStock} in stock. You have ${existingQty} in cart.`, 'error');
            return;
        }
        addToCart(product, quantity, selectedVariations);
        showToast(`Added ${quantity} to cart`);
    };

    const handleToggleWishlist = () => {
        const wasInWishlist = isInWishlist(product.id || product._id);
        toggleWishlist(product);

        if (wasInWishlist) {
            showToast('Removed from wishlist');
        } else {
            showToast('Added to wishlist', 'success');
        }
    };

    return (
        <>
            {/* Mandatory Variation Modal */}
            <AnimatePresence>
                {showVariationRequiredModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-0 left-0 w-full h-full z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
                        onClick={() => setShowVariationRequiredModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel-premium p-12 text-center max-w-sm w-full border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-[10px] tracking-[0.5em] font-black uppercase mb-8 text-white">ATTENTION</h3>
                            <p className="text-sm font-sans mb-10 opacity-90 text-white leading-relaxed">
                                Please select all required options to proceed.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowVariationRequiredModal(false)}
                                className="w-full bg-white text-black py-5 text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:bg-[var(--color-primary)] hover:text-white"
                            >
                                ACKNOWLEDGED
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={containerRef} className="w-full pb-32 text-[var(--text-primary)] bg-transparent perspective-2000">
                <ThreeBackground variant="product" />

                <div className="pt-8 px-6 sm:px-10 max-w-[1600px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:min-h-[calc(100vh-140px)]">

                        {/* Left: Interactive Media Gallery */}
                        <div className="lg:col-span-6 xl:col-span-7 flex flex-col xl:flex-row gap-4 product-image-container relative lg:h-[calc(100vh-140px)]">
                            {/* Thumbnails */}
                            <div className="flex xl:flex-col gap-3 overflow-x-auto xl:overflow-y-auto w-full xl:w-24 max-h-[500px] xl:max-h-full pb-4 xl:pb-0 hide-scrollbar z-10 order-2 xl:order-1 pr-1">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setActiveImage(img); setHoverThumbnail(null); }}
                                        className={`relative aspect-[3/4] w-20 md:w-24 xl:w-full shrink-0 overflow-hidden transition-all duration-500 border glass-modern ${displayImage === img ? 'border-accent p-0.5' : 'border-black/5 opacity-50 hover:opacity-100 scale-95 hover:scale-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`view-${idx}`} />
                                    </button>
                                ))}
                            </div>

                            {/* Main Image */}
                            <motion.div
                                className="flex-1 aspect-[4/5] md:aspect-[3/4] lg:aspect-auto relative overflow-hidden bg-black/[0.02] order-1 xl:order-2 border border-black/5 glass-panel-premium cursor-crosshair w-full lg:h-full"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    perspective: '1200px',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={displayImage}
                                        initial={{ opacity: 0, scale: 0.95, rotateY: -5 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            rotateY: mousePos.x * 15,
                                            rotateX: -mousePos.y * 15,
                                            z: 30
                                        }}
                                        exit={{ opacity: 0, scale: 1.05, rotateY: 5 }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="w-full h-full product-image-parallax flex items-center justify-center p-8"
                                    >
                                        <img
                                            src={displayImage}
                                            alt={product.name}
                                            className="w-full h-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)]"
                                            style={{ transform: 'translateZ(60px)' }}
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Inventory Status Floating Badge */}
                                {product.countInStock < 10 && product.countInStock > 0 && (
                                    <div className="absolute top-6 right-6 z-10 glass-modern px-4 py-2 border border-red-500/20">
                                        <p className="text-[9px] tracking-[0.15em] font-black text-red-500">LIMITED: {product.countInStock}</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Right: Premium Product Info */}
                        <div className="lg:col-span-6 xl:col-span-5 flex flex-col stagger-reveal w-full lg:h-[calc(100vh-140px)]">
                            <div className="glass-panel-premium p-6 sm:p-8 lg:p-10 space-y-5 lg:h-full flex flex-col justify-center relative">

                                {/* 1. Title & Price */}
                                <div className="space-y-2">
                                    <h1 className="text-[17px] md:text-[18px] lg:text-[20px] leading-snug font-serif font-black tracking-tighter uppercase product-title">
                                        {product.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-1">
                                        <p className="text-xl sm:text-2xl font-sans font-black tracking-tight">
                                            ${product.price ? Number(product.price).toFixed(2) : '0.00'}
                                        </p>
                                        <span className="w-8 h-[1px] bg-black/10 hidden sm:block"></span>
                                        <span className="text-[9px] tracking-[0.4em] font-black uppercase opacity-20 hidden md:inline">ITEM No. {id.slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>

                                {/* 2. Variations / Color Options */}
                                {(product.variations && product.variations.length > 0) && (
                                    <div ref={variationSectionRef} className="pt-4 border-t border-black/5 space-y-4">
                                        {product.variations.map((variation, vIndex) => {
                                            const vName = variation.name;
                                            const totalOptions = variation.options.length;

                                            // Mobile optimization: Limit options visually to save space for CTA
                                            const mobileLimit = 4;
                                            const displayOptions = (isMobile && !showAllColors[vName])
                                                ? variation.options.slice(0, mobileLimit)
                                                : variation.options;

                                            const hasMore = variation.options.length > (isMobile ? mobileLimit : totalOptions);

                                            return (
                                                <div key={vIndex} className="relative">
                                                    {/* Hidden Ruler for wrapping detection */}
                                                    <div
                                                        ref={el => rulerRefs.current[vName] = el}
                                                        className="absolute top-0 left-0 w-full opacity-0 pointer-events-none flex flex-wrap gap-2 z-[-1]"
                                                        aria-hidden="true"
                                                    >
                                                        {variation.options.map((option, rIndex) => (
                                                            <button key={`ruler-${rIndex}`} className="h-10 px-5 sm:px-6 flex items-center justify-center font-black text-[9px] uppercase tracking-[0.2em] border border-transparent">
                                                                {typeof option === 'object' && option != null ? option.value : option}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="mb-3">
                                                        <span className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase text-black dark:text-[var(--text-primary)]">
                                                            CHOOSE {variation.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {displayOptions.map((option, oIndex) => {
                                                            const optionValue = typeof option === 'object' && option != null ? option.value : option;
                                                            const isSelected = selectedVariations[variation.name] === optionValue;
                                                            return (
                                                                <button
                                                                    key={oIndex}
                                                                    type="button"
                                                                    onClick={() => setSelectedVariations(prev => ({ ...prev, [variation.name]: optionValue }))}
                                                                    className={`h-10 px-5 flex items-center justify-center font-black text-[9px] uppercase tracking-[0.2em] transition-all border ${isSelected
                                                                        ? 'bg-[var(--text-primary)] text-[var(--bg-color)] border-[var(--text-primary)] shadow-sm scale-[1.02]'
                                                                        : 'bg-transparent text-[var(--text-primary)] border-[var(--text-primary)]/20 hover:border-[var(--text-primary)]/50'
                                                                        }`}
                                                                >
                                                                    {optionValue}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {hasMore && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAllColors(prev => ({ ...prev, [vName]: !prev[vName] }))}
                                                            className="mt-3 text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase text-black dark:text-[var(--text-primary)] opacity-60 hover:opacity-100 transition-opacity underline underline-offset-4"
                                                        >
                                                            {showAllColors[vName] ? 'Show Less' : 'View More'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* 3. Purchase Controls */}
                                <div className="pt-4 border-t border-black/5 space-y-4">
                                    <div className="flex flex-row flex-nowrap gap-2 sm:gap-4 h-auto sm:h-12">
                                        {/* Quantity */}
                                        <div className="flex border border-black/10 items-center justify-between w-20 sm:w-28 h-16 sm:h-full px-2 sm:px-3 bg-black/[0.03] shrink-0">
                                            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-lg opacity-40 hover:opacity-100 transition-opacity font-black w-6">-</button>
                                            <span className="font-black text-xs">{quantity}</span>
                                            <button type="button" onClick={() => setQuantity(product.countInStock != null ? Math.min(product.countInStock, quantity + 1) : quantity + 1)} className="text-lg opacity-40 hover:opacity-100 transition-opacity font-black w-6">+</button>
                                        </div>

                                        {/* Add to Cart */}
                                        <button
                                            onClick={handleAddToCart}
                                            className="flex-1 h-16 sm:h-full bg-[var(--text-primary)] text-[var(--bg-color)] text-[11px] sm:text-[10px] font-black tracking-[0.4em] uppercase flex items-center justify-center transition-all hover:bg-accent group relative overflow-hidden"
                                        >
                                            <span className="relative z-10">ADD TO CART</span>
                                            <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        </button>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleToggleWishlist}
                                            className={`flex-1 h-12 border flex items-center justify-center gap-3 transition-all ${isInWishlist(product.id || product._id)
                                                ? 'border-accent text-accent bg-accent/5'
                                                : 'border-black/10 hover:border-[var(--text-primary)] text-[var(--text-primary)]'
                                                }`}
                                        >
                                            <Heart size={12} fill={isInWishlist(product.id || product._id) ? "currentColor" : "none"} />
                                            <span className="text-[9px] font-black tracking-[0.2em] uppercase">{isInWishlist(product.id || product._id) ? 'WISHLISTED' : 'ADD TO WISHLIST'}</span>
                                        </button>

                                        <button
                                            onClick={async () => {
                                                if (navigator.share) {
                                                    try { await navigator.share({ title: product.name, url: window.location.href }); } catch (e) { }
                                                } else {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    showToast('Link copied');
                                                }
                                            }}
                                            className="w-12 h-12 border border-black/10 hover:border-[var(--text-primary)] flex items-center justify-center transition-all opacity-60 hover:opacity-100 text-[var(--text-primary)]"
                                        >
                                            <Share2 size={14} />
                                        </button>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>

                {/* Bottom Section: Description & Details */}
                <div className="mt-16 lg:mt-24 w-full">
                    {/* Description */}
                    <div className="mb-12">
                        <h4 className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase opacity-70 mb-6 text-black dark:text-[var(--text-primary)]">PRODUCT DESCRIPTION</h4>
                        <p className="text-sm sm:text-base font-sans leading-relaxed opacity-80 text-[var(--text-primary)] max-w-4xl">
                            {product.description || 'Expertly crafted for the discerning individual.'}
                        </p>
                    </div>

                    {/* Craftsmanship & Delivery Details */}
                    <div className="pt-12 border-t border-black/10 dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
                        <div className="space-y-6">
                            <h4 className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase opacity-70 text-black dark:text-[var(--text-primary)]">CRAFTSMANSHIP</h4>
                            <div className="space-y-5">
                                {(product.details || ['Handcrafted Finish', 'Premium Materials', 'Designed for Comfort']).slice(0, 3).map((detail, i) => (
                                    <div key={i} className="flex items-start gap-4">
                                        <div className="w-1 h-[1px] bg-accent mt-3 shrink-0"></div>
                                        <span className="text-xs sm:text-sm font-black tracking-[0.05em] uppercase opacity-80 leading-relaxed text-[var(--text-primary)]">{detail}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-xs sm:text-sm font-black tracking-[0.3em] uppercase opacity-70 text-black dark:text-[var(--text-primary)]">DELIVERY & CARE</h4>
                            <p className="text-sm sm:text-base font-sans tracking-wide leading-relaxed opacity-80 text-[var(--text-primary)] block">
                                Complimentary white-glove shipping on all orders. Returns accepted within 14 days in original condition.
                            </p>
                        </div>
                    </div>
                    {/* Related Products Section */}
                    <div className="mt-40 w-full related-section">
                        <div className="mb-12 text-center">
                            <h2 className="text-[9px] font-black tracking-[0.8em] uppercase opacity-30 mb-4">CURATED SELECTION</h2>
                            <h3 className="text-3xl md:text-5xl font-serif font-black tracking-tighter uppercase italic italic-outline">YOU MAY ALSO DESIRE</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                            {relatedProducts.slice(0, 4).map((related) => (
                                <div key={related._id} className="related-product-card">
                                    <ProductCard product={related} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductDetails;
