import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL, getWithCache } from '../utils/apiClient';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const headerRef = useRef(null);

    const { cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('lux_user');
            if (storedUser) setUser(JSON.parse(storedUser));
        } catch {
            localStorage.removeItem('lux_user');
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getWithCache('/api/categories');
                const parents = data.filter(c => !c.parent);
                const tree = parents.map(p => ({
                    name: p.name,
                    slug: p.slug,
                    path: `/collections/${p.slug}`,
                    image: p.image || `https://source.unsplash.com/random/400x600?${p.slug},luxury`, // Fallback for visually rich menus
                    subcategories: data
                        .filter(c => c.parent?._id === p._id || c.parent?.slug === p.slug)
                        .map(sub => ({
                            name: sub.name,
                            path: `/collections/${p.slug}?category=${sub._id}`
                        }))
                }));
                setCategories(tree);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useGSAP(() => {
        if (isScrolled) {
            gsap.to(headerRef.current, {
                backgroundColor: 'rgba(var(--bg-rgb), 0.95)',
                backdropFilter: 'blur(10px)',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                duration: 0.4,
                ease: 'power2.out'
            });
        } else {
            gsap.to(headerRef.current, {
                backgroundColor: 'transparent',
                backdropFilter: 'blur(0px)',
                paddingTop: '1.25rem',
                paddingBottom: '1.25rem',
                boxShadow: 'none',
                duration: 0.4,
                ease: 'power2.out'
            });
        }
    }, [isScrolled]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/collections/all?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsSearchOpen(false);
            setMobileMenuOpen(false);
        }
    };

    return (
        <header
            ref={headerRef}
            className={`fixed top-0 w-full z-50 transition-colors duration-400 border-b border-[var(--surface-border)]`}
        >
            <div className="max-w-[1600px] mx-auto px-2 sm:px-12 lg:px-16">
                <div className="flex justify-between items-center h-16 w-full relative">

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center justify-start lg:hidden z-20 mr-2 sm:mr-4">
                        <button
                            className="text-[var(--text-primary)] hover:text-[var(--color-electric-blue)] transition-all duration-300 transform active:scale-90 p-1"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Logo & Desktop Categories */}
                    <div className="flex items-center justify-start gap-12 z-10 flex-shrink min-w-0">
                        {/* Logo */}
                        <div className="flex-shrink min-w-0 text-left">
                            <Link to="/" className="inline-flex items-center group px-1 max-w-full">
                                <span className="text-lg sm:text-2xl font-serif font-bold tracking-widest sm:tracking-[0.2em] text-[var(--text-primary)] transition-all duration-500 group-hover:tracking-[0.2em] sm:group-hover:tracking-[0.3em] uppercase truncate w-full">EYESTYLE</span>
                            </Link>
                        </div>

                        {/* Categories (Next to Logo) */}
                        <nav className="hidden lg:flex gap-10 items-center">
                            {categories.map((link) => (
                                <div key={link.name} className="relative group h-full flex items-center">
                                    <Link
                                        to={link.path}
                                        className="text-[13px] font-sans font-bold tracking-[0.2em] text-[var(--text-body)] hover:text-[var(--text-primary)] transition-colors py-4 flex items-center gap-1 uppercase"
                                    >
                                        {link.name}
                                        {link.subcategories && link.subcategories.length > 0 && <ChevronDown size={12} className="group-hover:-rotate-180 transition-transform duration-300" />}
                                    </Link>

                                    {/* MEGA MENU style subcategory dropdown */}
                                    {link.subcategories && link.subcategories.length > 0 && (
                                        <div className="absolute top-12 left-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 transform origin-top -translate-y-4 group-hover:translate-y-0 z-[100]">
                                            <div className="bg-[var(--bg-color)] shadow-2xl p-0 min-w-[500px] flex border border-[var(--surface-border)] rounded-sm overflow-hidden">
                                                {/* Left: Content */}
                                                <div className="flex-1 p-8 flex flex-col">
                                                    <p className="text-[10px] tracking-widest text-[var(--text-muted)] uppercase mb-6 font-bold border-b border-[var(--surface-border)] pb-2">Categories</p>
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                                        {link.subcategories.map(sub => (
                                                            <Link
                                                                key={sub.name}
                                                                to={sub.path}
                                                                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:translate-x-1 transition-all duration-300 font-sans flex items-center gap-2 group/item"
                                                            >
                                                                <span className="w-0 h-[1px] bg-[var(--text-primary)] transition-all duration-300 group-hover/item:w-3"></span>
                                                                {sub.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Right: Featured Category Image */}
                                                <div className="w-[200px] relative overflow-hidden group/img">
                                                    <img
                                                        src={link.image}
                                                        alt={link.name}
                                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
                                                        <p className="text-white text-[10px] tracking-[0.3em] uppercase font-bold text-center border border-white/40 px-3 py-2">Discover {link.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Icons (Far Right) */}
                    <div className="flex items-center justify-end gap-2 sm:gap-5 lg:gap-8 flex-1 z-20">
                        <div className="flex items-center relative">
                            {isSearchOpen ? (
                                <form onSubmit={handleSearchSubmit} className="flex items-center border-b border-[var(--text-primary)] pb-1 overflow-hidden bg-[var(--bg-color)] absolute right-0 top-1/2 -translate-y-1/2 z-[60] w-[160px] sm:w-[220px]">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="SEARCH..."
                                        className="outline-none bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-[10px] tracking-widest w-full font-sans uppercase pl-1"
                                        autoFocus
                                    />
                                    <button type="submit" className="text-[var(--text-primary)] ml-2 hover:scale-110 transition-transform shrink-0">
                                        <Search size={16} strokeWidth={1.5} />
                                    </button>
                                    <button type="button" onClick={() => setIsSearchOpen(false)} className="text-[var(--text-primary)] ml-3 opacity-50 hover:opacity-100 shrink-0">
                                        <X size={16} />
                                    </button>
                                </form>
                            ) : (
                                <button onClick={() => setIsSearchOpen(true)} className="text-[var(--text-primary)] hover:scale-110 transition-all flex items-center p-1" aria-label="Search">
                                    <Search size={20} strokeWidth={1.5} className="sm:w-[22px] sm:h-[22px]" />
                                </button>
                            )}
                        </div>

                        <button onClick={toggleTheme} className="text-[var(--text-primary)] hover:scale-110 transition-all flex items-center p-1" aria-label="Toggle Theme">
                            {theme === 'dark' ? <Sun size={20} strokeWidth={1.5} className="sm:w-[22px] sm:h-[22px]" /> : <Moon size={20} strokeWidth={1.5} className="sm:w-[22px] sm:h-[22px]" />}
                        </button>
                        <Link to="/account" className="text-[var(--text-primary)] hover:scale-110 transition-all flex items-center p-1" aria-label="Account">
                            <User size={20} strokeWidth={1.5} className="sm:w-[22px] sm:h-[22px]" />
                        </Link>
                        <Link to="/wishlist" className="text-[var(--text-primary)] hover:scale-110 transition-all relative flex items-center p-1" aria-label="Wishlist">
                            <Heart size={20} strokeWidth={1.5} className="sm:w-[22px] sm:h-[22px]" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 sm:-right-2 bg-[var(--color-primary)] text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-sans font-bold shadow-lg">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/cart" className="text-[var(--text-primary)] hover:scale-110 transition-all relative flex items-center p-1" aria-label="Cart">
                            <ShoppingBag size={20} strokeWidth={1.5} className="sm:w-[22px] sm:h-[22px]" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 sm:-right-2 bg-[var(--color-primary)] text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-sans font-bold shadow-lg">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:hidden bg-[var(--bg-color)] border-t border-[var(--surface-border)] absolute w-full shadow-2xl overflow-hidden"
                    >
                        <div className="px-6 py-10 space-y-8 flex flex-col">
                            {categories.map((link) => (
                                <div key={link.name} className="flex flex-col space-y-4">
                                    <Link
                                        to={link.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-lg font-serif font-bold text-[var(--text-primary)] tracking-widest uppercase"
                                    >
                                        {link.name}
                                    </Link>
                                    {link.subcategories && (
                                        <div className="flex flex-col pl-6 space-y-3 border-l-2 border-[var(--surface-border)]">
                                            {link.subcategories.map(sub => (
                                                <Link
                                                    key={sub.name}
                                                    to={sub.path}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-wide"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="flex items-center justify-between pt-6 border-t border-[var(--surface-border)]">
                                <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--text-muted)]">Theme Appearance</span>
                                <button onClick={toggleTheme} className="text-[var(--text-primary)] p-2 rounded-full bg-[var(--surface-color)] border border-[var(--surface-border)]" aria-label="Toggle Theme">
                                    {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
                                </button>
                            </div>
                            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[var(--surface-color)] rounded-sm px-4 py-3 border border-[var(--surface-border)]">
                                <Search size={18} className="text-[var(--text-muted)] mr-3" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="SEARCH PRODUCTS..."
                                    className="w-full text-[10px] tracking-widest outline-none bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] font-sans uppercase"
                                />
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
