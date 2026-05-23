import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { Heart, ChevronRight, Share2, Star, ShieldCheck, Camera, Loader2, Edit3, MessageSquare } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getWithCache, API_BASE_URL, apiFetch, getStoredUser, isSafeMediaUrl, apiFetchPublic } from '../utils/apiClient';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import ThreeBackground from '../components/ThreeBackground';
import ProductDetailSkeleton from '../components/skeletons/ProductDetailSkeleton';
import ReviewSkeleton from '../components/skeletons/ReviewSkeleton';
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
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyEmail, setNotifyEmail] = useState('');
    const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);

    const { addToCart, cartItems } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();
    const { theme } = useTheme(); // To fetch the current theme for dynamic heart coloring

    const { data: productData, isLoading: loading } = useQuery({
        queryKey: ['product', id],
        queryFn: () => apiFetchPublic(`/api/products/${id}`),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        enabled: !!id,
    });

    const product = React.useMemo(() => {
        return productData ? { ...productData, image: normalizeImagePath(productData) } : null;
    }, [productData]);

    const { data: allProductsData } = useQuery({
        queryKey: ['products-list'],
        queryFn: () => apiFetchPublic('/api/products'),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        enabled: !!product,
    });

    const relatedProducts = React.useMemo(() => {
        if (!product || !allProductsData) return [];
        return (allProductsData.products || []).filter(p => {
            if (p._id === product._id) return false;
            const pCat = typeof p.category === 'object' ? String(p.category?._id || p.category?.name) : String(p.category || '');
            const curCat = typeof product.category === 'object' ? String(product.category?._id || product.category?.name) : String(product.category || '');
            return pCat && curCat && pCat === curCat;
        });
    }, [product, allProductsData]);
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    // Reviews System States
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [eligibility, setEligibility] = useState({ eligible: false, alreadyReviewed: false, existingReview: null });
    const [eligibilityLoading, setEligibilityLoading] = useState(true);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const containerRef = React.useRef(null);
    const prefersReducedMotion = useReducedMotion();

    // Animation tracking refs to prevent re-running GSAP when states change
    const animatedMainRef = React.useRef(false);
    const animatedRelatedRef = React.useRef(false);
    const animatedRecentRef = React.useRef(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('lux_user');
            setCurrentUser(stored ? JSON.parse(stored) : null);
        } catch {
            setCurrentUser(null);
        }
        // Reset animation tracking when changing products
        animatedMainRef.current = false;
        animatedRelatedRef.current = false;
        animatedRecentRef.current = false;
    }, [id]);

    useGSAP(() => {
        const prefersReduce =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduce || !product || loading || !containerRef.current) {
            return;
        }

        // 1. Animate Main Product Info (once)
        if (!animatedMainRef.current) {
            let animated = false;

            if (containerRef.current.querySelector('.product-image-parallax')) {
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
                animated = true;
            }

            // Very fast reveal — no delay so content shows as soon as product loads
            if (containerRef.current.querySelector('.product-title')) {
                gsap.fromTo('.product-title',
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.28, ease: "power2.out" }
                );
                animated = true;
            }

            if (containerRef.current.querySelector('.stagger-reveal')) {
                gsap.fromTo('.stagger-reveal > *',
                    { y: 10, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.22, stagger: 0.04, ease: "power2.out", delay: 0.08 }
                );
                animated = true;
            }

            if (animated) {
                animatedMainRef.current = true;
            }
        }

        // 2. Animate Related Products (once when relatedProducts is loaded and rendered)
        if (!animatedRelatedRef.current && relatedProducts.length > 0) {
            const cards = containerRef.current.querySelectorAll('.curated-section .related-product-card');
            if (cards.length > 0) {
                gsap.fromTo(cards,
                    { y: 20, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.35,
                        stagger: 0.05,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: '.curated-section',
                            start: 'top 92%',
                            once: true
                        }
                    }
                );
                animatedRelatedRef.current = true;
            }
        }

        // 3. Animate Recently Viewed Products (once when recentlyViewed is loaded and rendered)
        if (!animatedRecentRef.current && recentlyViewed.length > 0) {
            const cards = containerRef.current.querySelectorAll('.recent-history-section .related-product-card');
            if (cards.length > 0) {
                gsap.fromTo(cards,
                    { y: 20, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.35,
                        stagger: 0.05,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: '.recent-history-section',
                            start: 'top 92%',
                            once: true
                        }
                    }
                );
                animatedRecentRef.current = true;
            }
        }

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
            ScrollTrigger.getAll().forEach((st) => st.kill());
        };
    }, { scope: containerRef, dependencies: [product, loading, relatedProducts, recentlyViewed] });

    const fetchReviewsAndEligibility = async () => {
        try {
            setReviewsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${id}`);
            if (res.ok) {
                const data = await res.json();
                setReviews(data);
            }
        } catch (err) {
            console.error('Error loading reviews:', err);
        } finally {
            setReviewsLoading(false);
        }

        const storedUser = localStorage.getItem('lux_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        setCurrentUser(user);
        if (user?.token) {
            try {
                setEligibilityLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/reviews/eligibility/${id}`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setEligibility(data);
                    
                    // If user already reviewed, pre-fill the form with their previous review
                    if (data.alreadyReviewed && data.existingReview) {
                        setReviewRating(data.existingReview.rating);
                        setReviewComment((data.existingReview.comment || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
                        setReviewImages(data.existingReview.reviewImages || []);
                    }
                }
            } catch (err) {
                console.error('Error loading eligibility:', err);
            } finally {
                setEligibilityLoading(false);
            }
        } else {
            setEligibility({ eligible: false, alreadyReviewed: false, existingReview: null });
            setEligibilityLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        try {
            setUploadingImages(true);
            const formData = new FormData();
            files.forEach(file => formData.append('images', file));
            
            const res = await apiFetch('/api/upload', {
                method: 'POST',
                body: formData,
                auth: true,
            });
            
            if (res.ok) {
                const data = await res.json();
                setReviewImages(prev => [...prev, ...(data.images || []).filter(isSafeMediaUrl)]);
                showToast('Images uploaded successfully', 'success');
            } else {
                showToast('Image upload failed', 'error');
            }
        } catch (err) {
            console.error('Image upload error:', err);
            showToast('Error uploading images', 'error');
        } finally {
            setUploadingImages(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        const storedUser = localStorage.getItem('lux_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        if (!user?.token) {
            showToast('Please log in first', 'error');
            return;
        }

        try {
            setSubmittingReview(true);
            const url = isEditMode && eligibility.existingReview
                ? `${API_BASE_URL}/api/reviews/${eligibility.existingReview._id}`
                : `${API_BASE_URL}/api/reviews`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    productId: id,
                    rating: reviewRating,
                    comment: reviewComment,
                    reviewImages
                })
            });

            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Review submitted successfully!', 'success');
                setShowReviewModal(false);
                if (!isEditMode) {
                    setReviewComment('');
                    setReviewImages([]);
                }
                fetchReviewsAndEligibility();
            } else {
                showToast(data.message || 'Submission failed', 'error');
            }
        } catch (err) {
            console.error('Submit review error:', err);
            showToast('Error submitting review', 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleOpenReviewModal = (edit = false) => {
        if (!currentUser?.token) {
            showToast('Please log in to leave a review', 'error');
            return;
        }
        setIsEditMode(edit);
        if (edit && eligibility.existingReview) {
            setReviewRating(eligibility.existingReview.rating);
            setReviewComment((eligibility.existingReview.comment || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
            setReviewImages(eligibility.existingReview.reviewImages || []);
        } else {
            setReviewRating(5);
            setReviewComment('');
            setReviewImages([]);
        }
        setShowReviewModal(true);
    };

    useEffect(() => {
        if (!showReviewModal) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setShowReviewModal(false);
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [showReviewModal]);

    useEffect(() => {
        if (id) {
            fetchReviewsAndEligibility();
        }
    }, [id]);

    useEffect(() => {
        if (product) {
            setSelectedVariations({});
            setActiveImage(getDefaultProductImage(product));
            setQuantity(1);
        }
    }, [id, product ? product._id : null]);

    // Manage recently viewed products in localStorage
    useEffect(() => {
        if (!product) return;
        try {
            const stored = localStorage.getItem('recentlyViewed');
            let viewed = stored ? JSON.parse(stored) : [];
            // Remove current product to avoid showing it, and so we can move it to front
            viewed = viewed.filter(p => p._id !== product._id);
            // Set state to show OTHER recently viewed products (max 4)
            setRecentlyViewed(viewed.slice(0, 4));
            // Add current product to history for next time
            viewed.unshift(product);
            // Keep history limited to 6
            localStorage.setItem('recentlyViewed', JSON.stringify(viewed.slice(0, 6)));
        } catch (e) {
            console.error('Failed to parse recently viewed:', e);
        }
    }, [product]);

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
            <div className="container-padding py-10">
                <ProductDetailSkeleton />
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

    const handleNotifySubmit = async (e) => {
        e.preventDefault();
        if (!notifyEmail) return;
        
        setIsSubmittingNotify(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/restock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: notifyEmail, productId: product._id || product.id })
            });
            const data = await response.json();
            
            if (response.ok) {
                showToast(data.message, 'success');
                setShowNotifyModal(false);
                setNotifyEmail('');
            } else {
                showToast(data.message || 'Failed to submit', 'error');
            }
        } catch (error) {
            showToast('Network error, please try again', 'error');
        } finally {
            setIsSubmittingNotify(false);
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

                <div className="max-w-[1200px] w-full mx-auto px-10 py-[30px] box-border">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

                        {/* Left: Interactive Media Gallery */}
                        <div className="lg:col-span-7 flex flex-col lg:flex-row gap-4 product-image-container relative lg:sticky lg:top-24 lg:self-start z-0 w-full">
                            {/* Thumbnails */}
                            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto w-full lg:w-[90px] max-h-[550px] pb-4 lg:pb-0 hide-scrollbar z-10 order-2 lg:order-1 pr-1 shrink-0">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setActiveImage(img); setHoverThumbnail(null); }}
                                        className={`relative aspect-[3/4] w-20 md:w-24 lg:w-full shrink-0 overflow-hidden transition-all duration-500 border glass-modern ${displayImage === img ? 'border-accent p-0.5' : 'border-black/5 opacity-50 hover:opacity-100 scale-95 hover:scale-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt={`view-${idx}`} />
                                    </button>
                                ))}
                            </div>

                            {/* Main Image */}
                            <motion.div
                                className="flex-1 aspect-[4/5] relative overflow-hidden bg-black/[0.02] order-1 lg:order-2 border border-black/5 glass-panel-premium cursor-crosshair w-full max-h-[550px] isolate"
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
                                        <motion.img
                                            src={displayImage}
                                            alt={product.name}
                                            className="w-full h-full object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)]"
                                            style={{ 
                                                transform: 'translateZ(60px)',
                                                transformOrigin: `${(mousePos.x + 0.5) * 100}% ${(mousePos.y + 0.5) * 100}%`
                                            }}
                                            whileHover={{ scale: 1.6 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Inventory Status Floating Badge */}
                                {product.countInStock <= 0 ? (
                                    <div className="absolute top-6 right-6 z-10 bg-black text-white px-4 py-2">
                                        <p className="text-[10px] tracking-[0.2em] font-black uppercase">SOLD OUT</p>
                                    </div>
                                ) : product.countInStock < 10 && product.countInStock > 0 ? (
                                    <div className="absolute top-6 right-6 z-10 glass-modern px-4 py-2 border border-red-500/20">
                                        <p className="text-[9px] tracking-[0.15em] font-black text-red-500">LIMITED: {product.countInStock}</p>
                                    </div>
                                ) : null}
                            </motion.div>
                        </div>

                        {/* Right: Premium Product Info */}
                        <div className="lg:col-span-5 flex flex-col stagger-reveal w-full">
                            <div className="glass-panel-premium p-6 sm:p-8 lg:p-10 space-y-6 relative w-full h-auto">

                                {/* 1. Title & Price */}
                                <div className="mb-6">
                                    <h1 className="text-[17px] md:text-[18px] lg:text-[20px] leading-snug font-serif font-black tracking-tighter uppercase product-title mb-2">
                                        {product.name}
                                    </h1>
                                    
                                    {/* Rating stars near title */}
                                    {product?.numReviews > 0 && (
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={12} 
                                                        className={i < Math.round(product?.rating || 0) ? "fill-orange-500 text-orange-500" : "text-gray-300"} 
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-45">
                                                {(product?.rating || 0).toFixed(1)} / 5.0 ({product?.numReviews || 0} review{product?.numReviews !== 1 ? 's' : ''})
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex flex-row items-center justify-between gap-4 mt-4 mb-6 w-full">
                                        {product.salePrice ? (
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-orange-500">
                                                    Rs. {Number(product.salePrice).toFixed(2)}
                                                </span>
                                                <span className="text-base sm:text-lg text-[var(--text-muted)] line-through opacity-50">
                                                    Rs. {Number(product.price).toFixed(2)}
                                                </span>
                                                <span className="bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 shadow-md rounded-[2px] ml-2">
                                                    {product.activeSale.discountType === 'percentage'
                                                        ? `${product.activeSale.discountValue}% OFF`
                                                        : 'SALE'}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-xl sm:text-2xl font-sans font-black tracking-tight">
                                                Rs. {product.price ? Number(product.price).toFixed(2) : '0.00'}
                                            </p>
                                        )}
                                        <div className="flex-1 h-[1px] bg-black/10 dark:bg-white/10 mx-4 hidden sm:block"></div>
                                        <span className="text-[9px] tracking-[0.4em] font-black uppercase opacity-40 shrink-0">ITEM No. {id.slice(-6).toUpperCase()}</span>
                                    </div>
                                </div>

                                {/* 2. Variations / Color Options */}
                                {(product.variations && product.variations.length > 0) && (
                                    <div ref={variationSectionRef} className="pt-6 mt-6 mb-8 border-t border-black/10 dark:border-white/10 -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 space-y-6">
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
                                                                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-[1.02]'
                                                                        : 'bg-transparent text-[var(--text-primary)] border-[var(--text-primary)]/20 hover:border-[var(--color-primary)]/50'
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
                                <div className="pt-8 mt-8 border-t border-black/10 dark:border-white/10 -mx-6 sm:-mx-8 lg:-mx-10 px-6 sm:px-8 lg:px-10 space-y-5 md:space-y-6">
                                    <div className="flex flex-col gap-4 md:gap-6">
                                        {product.countInStock <= 0 ? (
                                            <div className="flex flex-col gap-3">
                                                <button disabled className="w-full h-16 sm:h-12 bg-black/5 dark:bg-white/5 text-[var(--text-primary)] opacity-50 text-[11px] sm:text-[10px] font-black tracking-[0.4em] uppercase flex items-center justify-center cursor-not-allowed border border-black/10 dark:border-white/10">
                                                    SOLD OUT
                                                </button>
                                                <button onClick={() => setShowNotifyModal(true)} className="w-full h-16 sm:h-12 bg-[var(--color-primary)] text-white transition-all text-[11px] sm:text-[10px] font-black tracking-[0.4em] uppercase flex items-center justify-center shadow-sm hover:bg-[var(--color-primary-hover)]">
                                                    NOTIFY ME WHEN AVAILABLE
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-row flex-nowrap gap-4 h-14 w-full">
                                                {/* Quantity */}
                                                <div className="flex border border-black/10 items-center justify-between w-[110px] h-full px-3 bg-black/[0.03] shrink-0">
                                                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-lg opacity-40 hover:opacity-100 transition-opacity font-black w-6 select-none">-</button>
                                                    <span className="font-black text-xs">{quantity}</span>
                                                    <button type="button" onClick={() => setQuantity(product.countInStock != null ? Math.min(product.countInStock, quantity + 1) : quantity + 1)} className="text-lg opacity-40 hover:opacity-100 transition-opacity font-black w-6 select-none">+</button>
                                                </div>

                                                {/* Add to Cart */}
                                                <button
                                                    onClick={handleAddToCart}
                                                    className="flex-1 h-full bg-[var(--color-primary)] text-white text-[11px] sm:text-[10px] font-black tracking-[0.4em] uppercase flex items-center justify-center transition-all hover:bg-[var(--color-primary-hover)] group relative overflow-hidden shadow-sm"
                                                >
                                                    <span className="relative z-10">ADD TO CART</span>
                                                    <div className="absolute inset-0 bg-[#000000]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-5 md:mt-6">
                                        <button
                                            onClick={handleToggleWishlist}
                                            className={`flex-1 h-12 border flex items-center justify-center gap-3 transition-all ${isInWishlist(product.id || product._id)
                                                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                                : 'border-[var(--surface-border)] hover:border-[var(--color-primary)] text-[var(--text-primary)] hover:text-[var(--color-primary)]'
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

                    {/* NEW: Premium Verified Purchase Reviews Module */}
                    <div className="mt-20 pt-16 border-t border-black/10 dark:border-white/10 w-full space-y-12">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-xs font-black tracking-[0.4em] uppercase opacity-45 mb-2">CUSTOMER EXPERIENCE</h3>
                                <h4 className="text-3xl font-serif font-black uppercase tracking-tight">VERIFIED CUSTOMER REVIEWS</h4>
                            </div>

                            {/* Eligibility Button Actions */}
                            {!reviewsLoading && !eligibilityLoading && (
                                <div>
                                    {currentUser ? (
                                        eligibility.eligible ? (
                                            eligibility.alreadyReviewed ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">You've reviewed this product</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenReviewModal(true)}
                                                        className="relative z-30 h-12 px-6 bg-black text-white hover:bg-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-colors cursor-pointer"
                                                    >
                                                        <Edit3 size={12} /> Edit Your Review
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenReviewModal(false)}
                                                    className="relative z-30 h-12 px-8 bg-[var(--color-primary)] text-white hover:bg-black text-[10px] font-black uppercase tracking-[0.2em] transition-colors cursor-pointer"
                                                >
                                                    Write A Review
                                                </button>
                                            )
                                        ) : (
                                            <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-40 bg-black/5 dark:bg-white/5 px-4 py-3 border border-black/10">
                                                Only verified buyers can review this product.
                                            </span>
                                        )
                                    ) : (
                                        <Link 
                                            to="/account" 
                                            className="h-12 px-8 bg-[var(--color-primary)] text-white hover:bg-black text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center transition-colors"
                                        >
                                            Login To Review
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
                            {/* Left Column: Star Stats & Breakdown */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="glass-panel-premium p-6 sm:p-8 space-y-6 border border-black/5">
                                    <div className="text-center md:text-left">
                                        <p className="text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase">Overall Rating</p>
                                        <div className="flex items-baseline justify-center md:justify-start gap-2 mt-2">
                                            <span className="text-5xl font-serif font-black">{product?.rating ? product.rating.toFixed(1) : '0.0'}</span>
                                            <span className="text-sm font-black text-[var(--text-muted)] uppercase">/ 5.0</span>
                                        </div>
                                        <div className="flex justify-center md:justify-start gap-1 mt-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={16} 
                                                    className={i < Math.round(product?.rating || 0) ? "fill-orange-500 text-orange-500" : "text-gray-300"} 
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-black tracking-wider text-[var(--text-muted)] uppercase mt-2">
                                            Based on {product?.numReviews || 0} approved review{product?.numReviews !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {/* Star bar breakdown */}
                                    <div className="space-y-3 pt-6 border-t border-black/10 dark:border-white/10">
                                        {[5, 4, 3, 2, 1].map(stars => {
                                            const total = reviews.length;
                                            const count = reviews.filter(r => r.rating === stars).length;
                                            const pct = total > 0 ? (count / total) * 100 : 0;
                                            return (
                                                <div key={stars} className="flex items-center gap-3 text-xs pr-2">
                                                    <span className="w-12 text-[9px] font-black uppercase tracking-wider opacity-60 text-right">{stars} Star</span>
                                                    <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/10 overflow-hidden">
                                                        <div 
                                                            className="h-full bg-orange-500 transition-all duration-500" 
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="w-8 text-[9px] font-black tracking-wider opacity-60 text-left">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Reviews List */}
                            <div className="lg:col-span-8 space-y-6">
                                {reviewsLoading ? (
                                    <ReviewSkeleton />
                                ) : reviews.length === 0 ? (
                                    <div className="min-h-[220px] border border-black/10 dark:border-white/10 flex flex-col items-center justify-center p-8 text-center bg-black/[0.01]">
                                        <MessageSquare size={24} className="opacity-30 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-45">No reviews available yet.</p>
                                        <p className="text-xs font-sans opacity-60 mt-2 max-w-sm">
                                            Be the first to share your experience with this design! Only verified buyers who purchased this product can leave a review.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {reviews.map((review) => (
                                            <div 
                                                key={review._id} 
                                                className="border-b border-black/10 dark:border-white/10 pb-8 space-y-4"
                                            >
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                    {/* Rating stars */}
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                size={12} 
                                                                className={i < review.rating ? "fill-orange-500 text-orange-500" : "text-gray-300"} 
                                                            />
                                                        ))}
                                                    </div>

                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                                                        {review.userName}
                                                    </span>

                                                    <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                                                        {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>

                                                    {review.verifiedPurchase && (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-500/10 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                                            <ShieldCheck size={9} /> Verified Purchase
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Review Comment text */}
                                                <p className="text-sm font-sans leading-relaxed opacity-85 text-[var(--text-primary)] pr-4">
                                                    {review.comment}
                                                </p>

                                                {/* Uploaded images list */}
                                                {review.reviewImages && review.reviewImages.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {review.reviewImages.filter(isSafeMediaUrl).map((img, index) => (
                                                            <a 
                                                                key={index} 
                                                                href={img} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="w-16 h-16 border border-black/10 hover:border-black overflow-hidden shrink-0 hover:scale-105 transition-transform"
                                                            >
                                                                <img src={img} alt="Review attachment" className="w-full h-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Admin reply details */}
                                                {review.adminReply && (
                                                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 p-4 ml-6 md:ml-10 relative">
                                                        <div className="flex items-center justify-between border-b border-black/5 pb-2 mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1 h-1 bg-[var(--color-primary)]"></span>
                                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">EYESTYLE Team Reply</span>
                                                            </div>
                                                            {review.adminReplyAt && (
                                                                <span className="text-[8px] opacity-40">
                                                                    {new Date(review.adminReplyAt).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-sans leading-relaxed opacity-80">
                                                            {review.adminReply}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>



                    {/* Related Products Section */}
                    <div className="mt-8 md:mt-12 lg:mt-16 w-full related-section curated-section">
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

                    {/* Recently Viewed Products Section */}
                    {recentlyViewed.length > 0 && (
                        <div className="mt-8 md:mt-12 lg:mt-16 w-full related-section recent-history-section">
                            <div className="mb-12 text-center">
                                <h2 className="text-[9px] font-black tracking-[0.8em] uppercase opacity-30 mb-4">YOUR HISTORY</h2>
                                <h3 className="text-3xl md:text-5xl font-serif font-black tracking-tighter uppercase italic italic-outline">RECENTLY VIEWED</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                                {recentlyViewed.map((viewed) => (
                                    <div key={viewed._id} className="related-product-card">
                                        <ProductCard product={viewed} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Notify Me Modal */}
            {createPortal(
                <AnimatePresence>
                    {showNotifyModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                            onClick={() => setShowNotifyModal(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-panel-premium p-8 md:p-12 text-center max-w-md w-full border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-[14px] tracking-[0.3em] font-black uppercase mb-4 text-white">Notify Me When Available</h3>
                                <p className="text-sm font-sans mb-8 opacity-90 text-white leading-relaxed">
                                    We'll send you an email as soon as this product is back in stock.
                                </p>
                                <form onSubmit={handleNotifySubmit} className="space-y-6">
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="Enter your email address"
                                        value={notifyEmail}
                                        onChange={(e) => setNotifyEmail(e.target.value)}
                                        className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 p-4 outline-none focus:border-white transition-colors"
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowNotifyModal(false)}
                                            className="flex-1 bg-transparent text-white border border-white/20 py-4 text-[10px] font-black tracking-[0.2em] uppercase hover:bg-white/5"
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingNotify}
                                            className="flex-1 bg-white text-black py-4 text-[10px] font-black tracking-[0.2em] uppercase hover:bg-[var(--color-primary)] hover:text-white transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingNotify ? 'SUBMITTING...' : 'NOTIFY ME'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        {/* Review Form Modal — portaled to body */}
        {showReviewModal && createPortal(
            <motion.div
                key="review-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-modal-title"
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--bg-color)]/70 backdrop-blur-md"
                onClick={() => setShowReviewModal(false)}
            >
                <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                    className="glass-panel-premium p-8 md:p-10 max-w-lg w-full border border-[var(--surface-border)] text-[var(--text-primary)] relative bg-[var(--card-bg)] shadow-2xl rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 id="review-modal-title" className="text-xl font-serif font-black uppercase tracking-widest mb-1 text-[var(--text-primary)]">
                        {isEditMode ? 'Edit Your Experience' : 'Rate Your Glasses'}
                    </h3>
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--text-secondary)] mb-6 opacity-75">
                        {product?.name}
                    </p>

                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                        {/* Clickable Star selector */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)]">Your Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewRating(star)}
                                        className="transition-transform active:scale-95"
                                    >
                                        <Star 
                                            size={28} 
                                            className={star <= reviewRating ? "fill-[var(--color-primary)] text-[var(--color-primary)]" : "text-[var(--text-secondary)]/30 hover:text-[var(--color-primary)]/50 transition-colors"} 
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review text area input */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)]">Write Your Thoughts</label>
                            <textarea
                                required
                                rows="4"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="What did you love? How is the premium frame craftsmanship? Feel free to describe details..."
                                className="w-full bg-[var(--surface-color)] border border-[var(--surface-border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 p-4 text-xs outline-none focus:border-[var(--color-primary)] transition-all resize-none rounded-md min-h-[120px]"
                            ></textarea>
                        </div>

                        {/* Multi image upload field */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)]">Share Review Images (Optional)</label>
                            <div className="flex flex-wrap gap-3">
                                {/* Previews */}
                                {reviewImages.map((img, i) => (
                                    <div key={i} className="w-16 h-16 border border-[var(--surface-border)] relative group rounded overflow-hidden shadow-sm">
                                        <img src={img} alt="review preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-black text-red-500 transition-opacity"
                                        >
                                            REMOVE
                                        </button>
                                    </div>
                                ))}

                                {/* Upload button container */}
                                {reviewImages.length < 5 && (
                                    <label className="w-16 h-16 border border-dashed border-[var(--surface-border)] hover:border-[var(--color-primary)] cursor-pointer flex flex-col items-center justify-center transition-all bg-[var(--surface-color)] rounded">
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden" 
                                            disabled={uploadingImages}
                                        />
                                        {uploadingImages ? (
                                            <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
                                        ) : (
                                            <>
                                                <Camera size={16} className="text-[var(--text-secondary)]/60" />
                                                <span className="text-[7px] font-black tracking-widest text-[var(--text-secondary)]/60 mt-1 uppercase">ADD</span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 bg-transparent text-[var(--text-primary)] border border-[var(--surface-border)] py-4 text-[10px] font-black tracking-[0.25em] uppercase hover:bg-[var(--surface-color)] hover:border-[var(--text-primary)] transition-all rounded-md"
                            >
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                disabled={submittingReview || uploadingImages}
                                className="flex-1 bg-[var(--color-primary)] text-white py-4 text-[10px] font-black tracking-[0.25em] uppercase hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 rounded-md shadow-md hover:shadow-lg"
                            >
                                {submittingReview ? <Loader2 size={12} className="animate-spin" /> : 'SUBMIT REVIEW'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>,
            document.body
        )}
        </>
    );
};

export default ProductDetails;
