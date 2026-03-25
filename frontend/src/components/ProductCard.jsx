import React, { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../utils/apiClient';

const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { showToast } = useToast();

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.variations?.length > 0) {
            showToast('Please select options on the product page', 'info');
            navigate(`/product/${product._id || product.id}`);
            return;
        }
        addToCart(product, 1, {});
        showToast('Added to cart');
    };

    const handleToggleWishlist = (e) => {
        e.preventDefault();
        const wasInWishlist = isInWishlist(product.id || product._id);
        toggleWishlist(product);

        if (wasInWishlist) {
            showToast('Removed from wishlist');
        } else {
            showToast('Added to wishlist');
        }
    };

    return (
        <motion.div
            className="group relative flex flex-col w-full card-premium overflow-hidden border border-[var(--surface-border)] shadow-sm hover:shadow-2xl transition-shadow duration-500"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            whileHover={{
                y: -10,
                rotateX: 10,
                rotateY: -10,
                perspective: 1000
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                duration: 0.6
            }}
        >
            <div className="relative overflow-hidden aspect-[3/4] bg-[var(--surface-color)] cursor-pointer min-h-0 perspective-1000">
                <Link to={`/product/${product._id || product.id}`} className="block w-full h-full">
                    <motion.img
                        src={(() => {
                            if (!product?.images || !Array.isArray(product.images) || product.images.length === 0) return product.image || '/images/sample.jpg';
                            const imgPath = product.images[0];

                            if (!imgPath || typeof imgPath !== 'string') return product.image || '/images/sample.jpg';
                            if (imgPath.startsWith('http') || imgPath.startsWith('/images/')) return imgPath;

                            const pathParts = imgPath.replace(/\\/g, '/').split('/');
                            const fileName = pathParts[pathParts.length - 1];
                            const cleanPath = `uploads/${fileName}`;

                            return `${API_BASE_URL || ''}/${cleanPath}`;
                        })()}
                        alt={product.name || 'Product'}
                        loading="lazy"
                        className="w-full h-full object-cover aspect-[3/4] origin-center z-0"
                        animate={{
                            scale: isHovered ? 1.1 : 1,
                            z: isHovered ? 50 : 0
                        }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                </Link>

                {/* Glassmorphic Badge for Hover */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <button
                    onClick={handleToggleWishlist}
                    className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${isInWishlist(product.id || product._id) ? 'bg-[var(--bg-color)] text-accent' : 'bg-[var(--bg-color)]/80 backdrop-blur-md text-[var(--text-primary)] hover:bg-[var(--bg-color)] hover:scale-110'}`}
                >
                    <Heart size={18} fill={isInWishlist(product.id || product._id) ? "currentColor" : "none"} stroke="currentColor" />
                </button>

                {/* Quick Add Button with GSAP-like feel */}
                <motion.div
                    className="absolute bottom-0 left-0 w-full z-10"
                    initial={{ y: '100%' }}
                    animate={{ y: isHovered ? '0%' : '100%' }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-[var(--text-primary)] text-[var(--bg-color)] py-5 text-[10px] tracking-[0.3em] flex items-center justify-center gap-2 uppercase font-black transition-all hover:bg-accent hover:text-white"
                    >
                        ADD TO CART
                    </button>
                </motion.div>
            </div>

            {/* Product Details */}
            <div className="pt-6 pb-5 px-5 text-center bg-[var(--bg-color)] relative z-20">
                <Link to={`/product/${product._id || product.id}`}>
                    <h3 className="font-serif text-[15px] font-bold text-[var(--text-primary)] uppercase tracking-[0.1em] truncate mb-2 group-hover:text-accent transition-colors duration-300">
                        {product.name}
                    </h3>
                </Link>
                <div className="flex flex-col items-center gap-2">
                    <span className="w-8 h-[1px] bg-[var(--surface-border)]"></span>
                    <p className="font-sans font-black text-[var(--text-primary)] text-[14px] tracking-widest">
                        ${product.price ? product.price.toFixed(2) : '0.00'}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
