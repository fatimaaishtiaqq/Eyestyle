import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem('lux_cart');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('lux_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, quantity = 1, variations = {}) => {
        const maxQty = product.countInStock != null ? Math.max(0, Number(product.countInStock)) : null;
        if (maxQty != null && quantity > maxQty) quantity = maxQty;
        if (quantity < 1) return;

        setCartItems(prev => {
            const targetId = product._id || product.id;
            const defaultVariationId = JSON.stringify(variations);
            const existingItem = prev.find(item => (item._id || item.id) === targetId && JSON.stringify(item.variations || item.size || {}) === defaultVariationId);

            if (existingItem) {
                let newQty = existingItem.quantity + quantity;
                if (existingItem.countInStock != null && newQty > existingItem.countInStock) newQty = existingItem.countInStock;
                return prev.map(item =>
                    (item._id || item.id) === targetId && JSON.stringify(item.variations || item.size || {}) === defaultVariationId
                        ? { ...item, quantity: newQty }
                        : item
                );
            }
            return [...prev, { ...product, id: targetId, quantity, variations, variationId: defaultVariationId }];
        });
    };

    const removeFromCart = (id, variations) => {
        const targetVarId = JSON.stringify(variations || {});
        setCartItems(prev => prev.filter(item => !((item._id || item.id) === id && (item.variationId || JSON.stringify(item.variations || item.size || {})) === targetVarId)));
    };

    const updateQuantity = (id, variations, quantity) => {
        if (quantity < 1) return;
        const targetVarId = JSON.stringify(variations || {});
        setCartItems(prev =>
            prev.map(item => {
                if ((item._id || item.id) !== id || (item.variationId || JSON.stringify(item.variations || item.size || {})) !== targetVarId) return item;
                let qty = quantity;
                if (item.countInStock != null && qty > item.countInStock) qty = item.countInStock;
                return { ...item, quantity: qty };
            })
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal,
            cartSubtotal: cartTotal // keep backwards compatibility just in case
        }}>
            {children}
        </CartContext.Provider>
    );
};
