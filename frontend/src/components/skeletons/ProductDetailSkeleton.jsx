import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const ProductDetailSkeleton = () => {
    return (
        <AppSkeletonTheme>
            <div className="w-full flex-col flex pb-16 min-h-screen">
                {/* Simulated Header/Navigation space */}
                <div className="mb-8 mt-0 pt-0">
                    <Skeleton className="w-1/3 h-4 mb-2" />
                    <Skeleton className="w-2/3 h-[18px]" />
                </div>

                {/* 2-Column Product Detail Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.2fr_0.8fr] gap-x-8 gap-y-8 items-start w-full">
                    {/* LEFT COLUMN: Image Gallery Stack */}
                    <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
                        {/* Thumbnails */}
                        <div className="flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible max-w-full">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="w-[60px] h-[72px] sm:w-[72px] sm:h-[84px] bg-[var(--surface-color)] border border-[var(--surface-border)] overflow-hidden shrink-0">
                                    <Skeleton className="w-full h-full" height="100%" />
                                </div>
                            ))}
                        </div>

                        {/* Main Big Image */}
                        <div className="flex-1 aspect-[3/4] bg-[var(--surface-color)] border border-[var(--surface-border)] relative overflow-hidden w-full">
                            <Skeleton className="w-full h-full" height="100%" containerClassName="w-full h-full block" />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Buy Panel Details */}
                    <div className="w-full space-y-6">
                        {/* Title & Brand */}
                        <div>
                            <Skeleton className="w-1/4 h-3 mb-2" />
                            <Skeleton className="w-[85%] h-8 sm:h-10 mb-3" />
                            <Skeleton className="w-1/2 h-[18px]" />
                        </div>

                        {/* Price Area */}
                        <div className="py-4 border-y border-[var(--surface-border)]">
                            <Skeleton className="w-1/3 h-8" />
                        </div>

                        {/* Variations Blocks (e.g. Color / Frame variations) */}
                        <div className="space-y-4">
                            <div>
                                <Skeleton className="w-[80px] h-3 mb-2" />
                                <div className="flex gap-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} circle width={32} height={32} />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Skeleton className="w-[100px] h-3 mb-2" />
                                <div className="flex gap-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} width={64} height={32} style={{ borderRadius: '2px' }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quantity Selector and Add to Cart Section */}
                        <div className="pt-4 space-y-3">
                            <Skeleton className="w-1/4 h-3 mb-1" />
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                {/* Quantity Stepper */}
                                <div className="w-32 h-12 bg-[var(--surface-color)] border border-[var(--surface-border)] shrink-0 overflow-hidden">
                                    <Skeleton className="w-full h-full" height="100%" />
                                </div>
                                {/* CTA Button */}
                                <div className="flex-grow h-12">
                                    <Skeleton className="w-full h-full" height="100%" style={{ borderRadius: 0 }} />
                                </div>
                            </div>
                        </div>

                        {/* Additional Info / Shipping text */}
                        <div className="space-y-3 pt-6 border-t border-[var(--surface-border)]">
                            <Skeleton className="w-full h-[14px]" />
                            <Skeleton className="w-[90%] h-[14px]" />
                            <Skeleton className="w-[95%] h-[14px]" />
                        </div>
                    </div>
                </div>
            </div>
        </AppSkeletonTheme>
    );
};

export default ProductDetailSkeleton;
