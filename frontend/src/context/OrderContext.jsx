import React, { createContext, useContext, useState, useEffect } from 'react';

const OrderContext = createContext();

export const useOrder = () => {
    return useContext(OrderContext);
};

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const storedOrders = localStorage.getItem('lux_orders');
        if (storedOrders) {
            setOrders(JSON.parse(storedOrders));
        }
    }, []);

    const addOrder = (cartItems, total, shippingDetails) => {
        const newOrder = {
            id: `#ORD-${Math.floor(10000 + Math.random() * 90000)}`,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            total,
            status: 'Processing',
            items: cartItems.map(item => ({
                name: item.name,
                qty: item.quantity,
                price: item.price,
                variations: item.variations || {}
            })),
            shipping: shippingDetails
        };

        const updatedOrders = [newOrder, ...orders];
        setOrders(updatedOrders);
        localStorage.setItem('lux_orders', JSON.stringify(updatedOrders));
        return newOrder;
    };

    return (
        <OrderContext.Provider value={{ orders, addOrder }}>
            {children}
        </OrderContext.Provider>
    );
};
