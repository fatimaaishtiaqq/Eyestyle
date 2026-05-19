import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const ProductCardSkeleton = () => {
    return (
        <AppSkeletonTheme>
            <div className="flex flex-col w-full card-premium overflow-hidden rounded-[4px] sm:rounded-[14px] bg-[var(--card-bg)] border border-[var(--surface-border)]">
                {/* Product Image placeholder */}
                <div className="relative overflow-hidden aspect-[4/3] bg-[var(--surface-color)] w-full">
                    <Skeleton className="w-full h-full" height="100%" containerClassName="w-full h-full block" style={{ borderRadius: 0 }} />
                </div>

                {/* Details Section */}
                <div className="flex flex-col p-2 sm:p-5 bg-[var(--card-bg)] flex-grow">
                    {/* Title shimmer */}
                    <div className="flex items-center gap-1 mb-1.5 sm:mb-3">
                        <Skeleton circle width={20} height={20} className="flex-shrink-0" />
                        <div className="flex-grow">
                            <Skeleton className="w-4/5 h-[14px] sm:h-[18px]" />
                        </div>
                    </div>

                    {/* Description shimmer */}
                    <div className="mb-2">
                        <Skeleton className="w-[95%] h-[10px] sm:h-[13px]" />
                    </div>

                    {/* Price and CTA shimmers */}
                    <div className="mt-auto pt-1">
                        <div className="mb-3">
                            <Skeleton className="w-1/3 h-[18px] sm:h-[24px]" />
                        </div>
                        <Skeleton className="w-full h-8 sm:h-11" style={{ borderRadius: '2px' }} />
                    </div>
                </div>
            </div>
        </AppSkeletonTheme>
    );
};

export default ProductCardSkeleton;
