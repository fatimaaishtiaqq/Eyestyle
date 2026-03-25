import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState(() => {
        try {
            const stored = localStorage.getItem('lux_wishlist');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('lux_wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const toggleWishlist = (product) => {
        setWishlistItems(prev => {
            const targetId = product._id || product.id;
            const exists = prev.find(item => (item._id || item.id) === targetId);
            if (exists) {
                return prev.filter(item => (item._id || item.id) !== targetId);
            }
            return [...prev, product];
        });
    };

    const isInWishlist = (id) => {
        return wishlistItems.some(item => (item._id || item.id) === id);
    };

    const wishlistCount = wishlistItems.length;

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            toggleWishlist,
            isInWishlist,
            wishlistCount
        }}>
            {children}
        </WishlistContext.Provider>
    );
};
