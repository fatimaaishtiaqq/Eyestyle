import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import ThreeBackground from '../components/ThreeBackground';

const Wishlist = () => {
    const { wishlistItems } = useWishlist();

    return (
        <div className="w-full pt-8 pb-32 min-h-screen px-4 sm:px-10 text-[var(--text-primary)] relative bg-transparent">
            <ThreeBackground variant="collection" />

            <div className="max-w-[1500px] mx-auto relative z-10">
                {/* Immersive Header */}
                <div className="mb-10 text-center pt-2">
                    <p className="text-[10px] tracking-[0.5em] font-black text-accent uppercase mb-1">PRIVATE COLLECTION</p>
                    <h1 className="text-4xl font-serif font-bold tracking-wider mb-2 uppercase text-[var(--text-primary)]">
                        WISHLIST
                    </h1>
                    <div className="flex items-center justify-center gap-4">
                        <span className="w-10 h-[1px] bg-[var(--surface-border)] opacity-30"></span>
                        <p className="text-[10px] tracking-[0.2em] font-black uppercase opacity-50">
                            {wishlistItems.length} CURATED ITEM{wishlistItems.length !== 1 && 'S'}
                        </p>
                        <span className="w-10 h-[1px] bg-[var(--surface-border)] opacity-30"></span>
                    </div>
                </div>

                {wishlistItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto glass-modern border border-[var(--surface-border)] p-16 sm:p-24 text-center shadow-xl"
                    >
                        <Heart size={48} className="mb-8 opacity-20 mx-auto text-accent" strokeWidth={1} />
                        <h2 className="text-2xl font-serif font-bold uppercase mb-4 tracking-tight">Your Gallery is Empty</h2>
                        <p className="text-sm font-sans opacity-60 mb-10 max-w-sm mx-auto leading-relaxed">
                            Discover our latest masterpieces and save your favorites to your personal gallery.
                        </p>
                        <Link to="/collections/all" className="btn-primary inline-block px-10 py-4 text-[10px] font-black tracking-[0.4em] uppercase shadow-lg active:scale-95">
                            START EXPLORING
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-8 lg:gap-y-12">
                        <AnimatePresence>
                            {wishlistItems.map((product) => (
                                <motion.div
                                    key={product.id || product._id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    className="relative"
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
