import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Filter, ChevronDown, X } from 'lucide-react';
import { getWithCache } from '../utils/apiClient';
import ThreeBackground from '../components/ThreeBackground';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);



const Collection = () => {
    const { category } = useParams();
    const location = useLocation();

    // Sort and basic toggles
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('recommended');

    // Active Filters — applied immediately on change
    const [frameShapes, setFrameShapes] = useState([]);
    const [lensTypes, setLensTypes] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    const [priceRange, setPriceRange] = useState('');

    // On location search parse url params
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';
    const queryCategoryId = searchParams.get('category');

    // Toggle array items instantly (no temp state needed)
    const handleToggle = (state, setState, value) => {
        if (state.includes(value)) {
            setState(state.filter(item => item !== value));
        } else {
            setState([...state, value]);
        }
    };

    // Remove single active filter (Chip)
    const removeFrameShapeFilter = (val) => setFrameShapes(frameShapes.filter(s => s !== val));
    const removeLensTypeFilter = (val) => setLensTypes(lensTypes.filter(s => s !== val));
    const removeFabricFilter = (val) => setFabrics(fabrics.filter(f => f !== val));
    const removePriceFilter = () => setPriceRange('');

    const resetAllFilters = () => {
        setFrameShapes([]);
        setLensTypes([]);
        setFabrics([]);
        setPriceRange('');
    };

    const [allProducts, setAllProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const containerRef = React.useRef(null);

    useGSAP(() => {
        const prefersReduce =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReduce) {
            return;
        }

        // Fade in as soon as content is in the DOM (no scroll dependency) — feels instant when loading finishes
        gsap.fromTo(".collection-content",
            { opacity: 0, y: 6 },
            {
                opacity: 1,
                y: 0,
                duration: 0.2,
                ease: 'power2.out',
                delay: 0.02
            }
        );
        const t = setTimeout(() => ScrollTrigger.refresh(), 80);
        return () => clearTimeout(t);
    }, { scope: containerRef, dependencies: [loading] });

    useEffect(() => {
        const fetchProductsAndCategories = async () => {
            try {
                const [prodData, catData] = await Promise.all([
                    getWithCache('/api/products'),
                    getWithCache('/api/categories')
                ]);
                setAllProducts(prodData.products || []);
                setAllCategories(catData || []);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductsAndCategories();
    }, []);

    // ── Filter logic based on fetched live products ──────────────────────────

    // Step 1: Apply category + search filters first (these are immutable route-level filters)
    let categoryFilteredProducts = [...allProducts];

    if (category && category !== 'all') {
        const catLower = category.toLowerCase();
        const targetCategory = allCategories.find(c => c.slug === catLower);

        if (targetCategory) {
            categoryFilteredProducts = categoryFilteredProducts.filter(p => {
                const pCatId = typeof p.category === 'object' ? String(p.category?._id) : String(p.category);
                if (pCatId === String(targetCategory._id)) return true;

                const pSubCatId = typeof p.subcategory === 'object' ? String(p.subcategory?._id) : String(p.subcategory);
                if (pSubCatId) {
                    const subCatObj = allCategories.find(c => String(c._id) === pSubCatId);
                    if (subCatObj && (String(subCatObj.parent) === String(targetCategory._id) || String(subCatObj.parent?._id) === String(targetCategory._id))) {
                        return true;
                    }
                }
                return false;
            });
        } else {
            categoryFilteredProducts = categoryFilteredProducts.filter(p =>
                p.name.toLowerCase().includes(catLower) || (p.brand && p.brand.toLowerCase() === catLower)
            );
        }
    }

    if (queryCategoryId) {
        categoryFilteredProducts = categoryFilteredProducts.filter(p => {
            const pCatId = typeof p.category === 'object' ? String(p.category?._id) : String(p.category);
            const pSubCatId = typeof p.subcategory === 'object' ? String(p.subcategory?._id) : String(p.subcategory);
            return pCatId === queryCategoryId || pSubCatId === queryCategoryId;
        });
    }

    if (searchQuery) {
        categoryFilteredProducts = categoryFilteredProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    // Step 2: Compute dynamic option counts BEFORE applying each attribute filter
    // This way counts reflect "how many match if you add this option"

    // For Frame Shape counts: apply lensType + fabric + price filters, then count by frameShape
    const productsForFrameCount = categoryFilteredProducts.filter(p => {
        const matchLens = lensTypes.length === 0 || (p.lensType && lensTypes.includes(p.lensType));
        const matchFabric = fabrics.length === 0 || (p.fabric && fabrics.includes(p.fabric));
        const matchPrice = !priceRange ||
            (priceRange === 'under100' ? p.price < 100 :
                priceRange === '100to300' ? p.price >= 100 && p.price <= 300 :
                    priceRange === 'over300' ? p.price > 300 : true);
        return matchLens && matchFabric && matchPrice;
    });

    // For Lens Type counts: apply frameShape + fabric + price filters, then count by lensType
    const productsForLensCount = categoryFilteredProducts.filter(p => {
        const matchFrame = frameShapes.length === 0 || (p.frameShape && frameShapes.includes(p.frameShape));
        const matchFabric = fabrics.length === 0 || (p.fabric && fabrics.includes(p.fabric));
        const matchPrice = !priceRange ||
            (priceRange === 'under100' ? p.price < 100 :
                priceRange === '100to300' ? p.price >= 100 && p.price <= 300 :
                    priceRange === 'over300' ? p.price > 300 : true);
        return matchFrame && matchFabric && matchPrice;
    });

    // For Fabric counts: apply frameShape + lensType + price
    const productsForFabricCount = categoryFilteredProducts.filter(p => {
        const matchFrame = frameShapes.length === 0 || (p.frameShape && frameShapes.includes(p.frameShape));
        const matchLens = lensTypes.length === 0 || (p.lensType && lensTypes.includes(p.lensType));
        const matchPrice = !priceRange ||
            (priceRange === 'under100' ? p.price < 100 :
                priceRange === '100to300' ? p.price >= 100 && p.price <= 300 :
                    priceRange === 'over300' ? p.price > 300 : true);
        return matchFrame && matchLens && matchPrice;
    });

    // Derive available options (only show values that actually exist and have count > 0)
    const frameShapeCountMap = {};
    productsForFrameCount.forEach(p => {
        if (p.frameShape) frameShapeCountMap[p.frameShape] = (frameShapeCountMap[p.frameShape] || 0) + 1;
    });

    const lensTypeCountMap = {};
    productsForLensCount.forEach(p => {
        if (p.lensType) lensTypeCountMap[p.lensType] = (lensTypeCountMap[p.lensType] || 0) + 1;
    });

    const fabricCountMap = {};
    productsForFabricCount.forEach(p => {
        if (p.fabric) fabricCountMap[p.fabric] = (fabricCountMap[p.fabric] || 0) + 1;
    });

    // Available options: union of currently-selected (always keep checked items visible even if count=0)
    // + items with count > 0 from the sibling-filtered pool
    const availableFrameShapes = [...new Set([
        ...frameShapes,
        ...Object.keys(frameShapeCountMap)
    ])].sort();

    const availableLensTypes = [...new Set([
        ...lensTypes,
        ...Object.keys(lensTypeCountMap)
    ])].sort();

    const availableFabrics = [...new Set([
        ...fabrics,
        ...Object.keys(fabricCountMap)
    ])].sort();

    // Step 3: Apply all active attribute filters to get final product list
    let filteredProducts = [...categoryFilteredProducts];

    if (frameShapes.length > 0) {
        filteredProducts = filteredProducts.filter(p => p.frameShape && frameShapes.includes(p.frameShape));
    }
    if (lensTypes.length > 0) {
        filteredProducts = filteredProducts.filter(p => p.lensType && lensTypes.includes(p.lensType));
    }
    if (fabrics.length > 0) {
        filteredProducts = filteredProducts.filter(p => p.fabric && fabrics.includes(p.fabric));
    }
    if (priceRange) {
        filteredProducts = filteredProducts.filter(p => {
            if (priceRange === 'under100') return p.price < 100;
            if (priceRange === '100to300') return p.price >= 100 && p.price <= 300;
            if (priceRange === 'over300') return p.price > 300;
            return true;
        });
    }

    // Sorting
    if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
        filteredProducts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    const hasActiveFilters = frameShapes.length > 0 || lensTypes.length > 0 || fabrics.length > 0 || !!priceRange;

    const title = searchQuery ? `SEARCH: ${searchQuery}` : (category && category !== 'all' ? `${category.replace(/-/g, ' ').toUpperCase()}'S COLLECTION` : 'ALL COLLECTIONS');

    return (
        <div ref={containerRef} className="w-full flex-col flex mb-20 pt-8 px-4 sm:px-6 lg:px-8 min-h-screen">
            <ThreeBackground variant="collection" />
            <div className="collection-content">
                {/* Header */}
                <div className="text-center mb-4 mt-0 pt-0">
                    <h1 className="text-4xl font-serif font-bold tracking-wider mb-2 uppercase text-[var(--text-primary)]">{title}</h1>
                    <p className="opacity-80 font-light max-w-2xl mx-auto text-[var(--text-primary)]">Explore our curated selection of premium eyewear and exquisite frame designs.</p>
                </div>

                {/* Top Toolbar (Filters Button + Active Chips) */}
                <div className="flex flex-row items-center justify-between gap-4 mb-6 border-b border-[var(--surface-border)] pb-4 flex-wrap sm:flex-nowrap">

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            className="flex items-center gap-2 btn-primary px-6 py-2 text-xs tracking-widest font-medium uppercase shadow-sm"
                            onClick={() => setShowFilters(true)}
                        >
                            <Filter size={16} /> Filters
                            {hasActiveFilters && (
                                <span className="ml-1 bg-white text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
                                    {frameShapes.length + lensTypes.length + fabrics.length + (priceRange ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        {/* Active Filter Chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            {frameShapes.map(shape => (
                                <span key={shape} className="flex items-center gap-1.5 bg-[var(--color-bg-section)] border border-[var(--surface-border)] text-[var(--text-primary)] px-3 py-1 text-[11px] tracking-wider uppercase font-medium rounded-sm">
                                    {shape}
                                    <button onClick={() => removeFrameShapeFilter(shape)} className="hover:text-accent transition-colors"><X size={12} /></button>
                                </span>
                            ))}
                            {lensTypes.map(lens => (
                                <span key={lens} className="flex items-center gap-1.5 bg-[var(--color-bg-section)] border border-[var(--surface-border)] text-[var(--text-primary)] px-3 py-1 text-[11px] tracking-wider uppercase font-medium rounded-sm">
                                    {lens}
                                    <button onClick={() => removeLensTypeFilter(lens)} className="hover:text-accent transition-colors"><X size={12} /></button>
                                </span>
                            ))}
                            {fabrics.map(fab => (
                                <span key={fab} className="flex items-center gap-1.5 bg-[var(--color-bg-section)] border border-[var(--surface-border)] text-[var(--text-primary)] px-3 py-1 text-[11px] tracking-wider uppercase font-medium rounded-sm">
                                    {fab}
                                    <button onClick={() => removeFabricFilter(fab)} className="hover:text-accent transition-colors"><X size={12} /></button>
                                </span>
                            ))}
                            {priceRange && (
                                <span className="flex items-center gap-1.5 bg-[var(--color-bg-section)] border border-[var(--surface-border)] text-[var(--text-primary)] px-3 py-1 text-[11px] tracking-wider uppercase font-medium rounded-sm">
                                    {priceRange === 'under100' ? '< Rs. 100' : priceRange === '100to300' ? 'Rs. 100 - Rs. 300' : '> Rs. 300'}
                                    <button onClick={removePriceFilter} className="hover:text-accent transition-colors"><X size={12} /></button>
                                </span>
                            )}

                            {/* Clear All Button if any filter active */}
                            {hasActiveFilters && (
                                <button
                                    onClick={resetAllFilters}
                                    className="text-[11px] opacity-70 underline ml-2 hover:text-accent uppercase tracking-widest font-medium text-[var(--text-primary)]"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="flex items-center gap-3 shrink-0 text-xs font-medium tracking-widest uppercase opacity-80 text-[var(--text-primary)]">
                        <span className="hidden sm:inline">Sort By:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent outline-none border-b border-[var(--surface-border)] py-1 cursor-pointer text-[var(--text-primary)] focus:border-accent transition-colors [&>option]:bg-[var(--bg-color)] [&>option]:text-[var(--text-primary)]"
                        >
                            <option value="recommended">Recommended</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="newest">Newest Arrivals</option>
                        </select>
                    </div>
                </div>

                {/* Product Grid */}
                <div>
                    <div className="mb-6 text-sm opacity-60 font-medium text-[var(--text-primary)]">
                        Showing {filteredProducts.length} results
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-8 lg:gap-y-12">
                        {filteredProducts.map((product) => (
                            <div key={product._id || product.id}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-32 opacity-70 flex flex-col items-center text-[var(--text-primary)]">
                            <Filter size={48} className="mb-4" />
                            <h3 className="text-lg font-medium mb-2">No products found</h3>
                            <p>Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </div>

                {/* Filter Drawer */}
                {showFilters && (
                    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 transition-opacity" onClick={(e) => { if (e.target === e.currentTarget) setShowFilters(false); }}>
                        <div className="w-full max-w-md bg-[var(--bg-color)] h-full border-l border-[var(--surface-border)] flex flex-col animate-slide-in-right text-[var(--text-primary)]">

                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--surface-border)] shrink-0">
                                <h2 className="text-lg font-serif font-bold tracking-widest uppercase">Filters</h2>
                                <button onClick={() => setShowFilters(false)} className="hover:text-accent transition-colors rounded-full p-1 border border-transparent hover:border-[var(--surface-border)]">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Drawer Body — instant filtering, no apply button */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">

                                {/* Frame Shape */}
                                {availableFrameShapes.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[var(--surface-border)]">Frame Shape</h3>
                                        <ul className="space-y-3">
                                            {availableFrameShapes.map(shape => {
                                                const count = frameShapeCountMap[shape] || 0;
                                                const isChecked = frameShapes.includes(shape);
                                                return (
                                                    <li key={shape}>
                                                        <label className={`flex items-center justify-between gap-3 cursor-pointer transition-colors ${count === 0 && !isChecked ? 'opacity-35' : 'hover:text-accent'}`}>
                                                            <span className="flex items-center gap-3 text-sm font-medium">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handleToggle(frameShapes, setFrameShapes, shape)}
                                                                    className="w-4 h-4 accent-accent shrink-0"
                                                                    disabled={count === 0 && !isChecked}
                                                                />
                                                                {shape}
                                                            </span>
                                                            <span className="text-xs opacity-50 font-normal tabular-nums">({count})</span>
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {/* Lens Type */}
                                {availableLensTypes.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[var(--surface-border)]">Lens Type</h3>
                                        <ul className="space-y-3">
                                            {availableLensTypes.map(lens => {
                                                const count = lensTypeCountMap[lens] || 0;
                                                const isChecked = lensTypes.includes(lens);
                                                return (
                                                    <li key={lens}>
                                                        <label className={`flex items-center justify-between gap-3 cursor-pointer transition-colors ${count === 0 && !isChecked ? 'opacity-35' : 'hover:text-accent'}`}>
                                                            <span className="flex items-center gap-3 text-sm font-medium">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handleToggle(lensTypes, setLensTypes, lens)}
                                                                    className="w-4 h-4 accent-accent shrink-0"
                                                                    disabled={count === 0 && !isChecked}
                                                                />
                                                                {lens}
                                                            </span>
                                                            <span className="text-xs opacity-50 font-normal tabular-nums">({count})</span>
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {/* Material / Fabric */}
                                {availableFabrics.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[var(--surface-border)]">Material</h3>
                                        <ul className="space-y-3">
                                            {availableFabrics.map(fab => {
                                                const count = fabricCountMap[fab] || 0;
                                                const isChecked = fabrics.includes(fab);
                                                return (
                                                    <li key={fab}>
                                                        <label className={`flex items-center justify-between gap-3 cursor-pointer transition-colors ${count === 0 && !isChecked ? 'opacity-35' : 'hover:text-accent'}`}>
                                                            <span className="flex items-center gap-3 text-sm font-medium">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => handleToggle(fabrics, setFabrics, fab)}
                                                                    className="w-4 h-4 accent-accent shrink-0"
                                                                    disabled={count === 0 && !isChecked}
                                                                />
                                                                {fab}
                                                            </span>
                                                            <span className="text-xs opacity-50 font-normal tabular-nums">({count})</span>
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {/* Price Range */}
                                <div>
                                    <h3 className="text-xs font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[var(--surface-border)]">Price Range</h3>
                                    <ul className="space-y-3 text-sm font-medium">
                                        {[
                                            { value: 'under100', label: 'Under Rs. 100' },
                                            { value: '100to300', label: 'Rs. 100 – Rs. 300' },
                                            { value: 'over300', label: 'Over Rs. 300' },
                                        ].map(({ value, label }) => (
                                            <li key={value}>
                                                <label className="flex items-center gap-3 cursor-pointer hover:text-accent transition-colors">
                                                    <input
                                                        type="radio"
                                                        name="priceRange"
                                                        checked={priceRange === value}
                                                        onChange={() => setPriceRange(priceRange === value ? '' : value)}
                                                        className="w-4 h-4 accent-accent"
                                                    />
                                                    {label}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Reset Selections — sits right below last filter, no gap */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => { resetAllFilters(); }}
                                        className="w-full bg-transparent border border-[var(--surface-border)] text-[var(--text-primary)] py-3 text-xs font-bold tracking-widest uppercase hover:text-accent hover:border-accent transition-colors"
                                    >
                                        Reset Selections
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Collection;
