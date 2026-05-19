import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

export const ProductGridSkeleton = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 products-grid w-full">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
};

export default ProductGridSkeleton;
