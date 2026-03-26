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
            className="group flex flex-col w-full card-premium overflow-hidden rounded-[4px] sm:rounded-[14px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
        >
            <div className="relative overflow-hidden aspect-[4/3] bg-[var(--surface-color)] cursor-pointer">
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
                        className="w-full h-full object-cover object-center z-0 transition-transform duration-700 ease-out"
                        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                    />
                </Link>

                <button
                    onClick={handleToggleWishlist}
                    className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isInWishlist(product.id || product._id) ? 'bg-white text-rose-500' : 'bg-white/90 backdrop-blur-md text-gray-500 hover:bg-white hover:scale-110'}`}
                >
                    <Heart size={16} fill={isInWishlist(product.id || product._id) ? "currentColor" : "none"} stroke="currentColor" />
                </button>
            </div>

            {/* Product Details - Mockup matched styling */}
            <div className="flex flex-col p-2 sm:p-5 bg-[var(--card-bg)] flex-grow">
                
                {/* Product Meta */}
                <div className="flex items-center gap-1 mb-0.5 sm:mb-3">
                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 bg-[var(--surface-border)]">
                         <img src="/icons/glasses-icon.png" alt="icon" className="w-full h-full object-cover opacity-50" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <Link to={`/product/${product._id || product.id}`}>
                        <h3 className="font-sans text-[12px] sm:text-[16px] font-bold text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)] line-clamp-1 leading-tight">
                            {product.name}
                        </h3>
                    </Link>
                </div>
                
                <p className="font-sans text-[10px] sm:text-[13px] text-[var(--text-secondary)] mb-1 truncate opacity-70">
                    {product.description || "Minimal & stylish eyewear"}
                </p>
                


                <div className="mt-auto pt-1">
                    <p className="font-sans font-bold text-[var(--text-primary)] text-[14px] sm:text-xl mb-2 sm:mb-3">
                        Rs. {product.price ? product.price.toFixed(2) : '0.00'}
                    </p>
                    
                    <button
                        onClick={handleAddToCart}
                        className="w-full btn-primary py-1.5 sm:py-3 text-[10px] sm:text-sm"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
