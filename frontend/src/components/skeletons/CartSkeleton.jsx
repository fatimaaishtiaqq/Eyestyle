import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const CartSkeleton = () => {
    return (
        <AppSkeletonTheme>
            <div className="w-full flex-col flex pb-16 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-[var(--surface-border)] pb-4">
                    <div>
                        <Skeleton className="w-[120px] h-8 mb-2" />
                        <Skeleton className="w-[60px] h-4" />
                    </div>
                    <Skeleton className="w-[140px] h-[18px]" />
                </div>

                {/* 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_400px] gap-6 md:gap-8 lg:gap-12 items-start w-full">
                    {/* LEFT COLUMN: Shimmering Cart Items List */}
                    <div className="w-full min-w-0 space-y-6">
                        {/* Desktop Header row placeholder */}
                        <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto] gap-6 pb-3 border-b border-[var(--surface-border)]">
                            <Skeleton className="w-[80px] h-3" />
                            <Skeleton className="w-[80px] h-3" />
                            <Skeleton className="w-[80px] h-3" />
                            <Skeleton className="w-[30px] h-3" />
                        </div>

                        {/* Stacked Item rows */}
                        {Array.from({ length: 2 }).map((_, idx) => (
                            <div key={idx} className="grid grid-cols-[72px_1fr] sm:grid-cols-[94px_1fr] md:flex md:items-center gap-x-4 gap-y-2 sm:gap-x-6 py-5 sm:py-6 border-b border-[var(--surface-border)] w-full">
                                {/* Thumbnail */}
                                <div className="w-[72px] h-[84px] sm:w-[94px] sm:h-[110px] bg-[var(--surface-color)] border border-[var(--surface-border)] shrink-0">
                                    <Skeleton className="w-full h-full" height="100%" />
                                </div>

                                {/* Text info */}
                                <div className="flex-1 min-w-0">
                                    <Skeleton className="w-3/4 h-[16px] mb-2" />
                                    <Skeleton className="w-1/4 h-[14px] mb-2" />
                                    <Skeleton className="w-1/3 h-[11px] opacity-60" />
                                </div>

                                {/* Stepper & Action buttons */}
                                <div className="flex items-center gap-4 shrink-0 mt-2 md:mt-0">
                                    <div className="w-24 h-9 border border-[var(--surface-border)] overflow-hidden">
                                        <Skeleton className="w-full h-full" height="100%" />
                                    </div>
                                    <Skeleton className="w-16 h-[14px] hidden sm:block" />
                                    <Skeleton circle width={24} height={24} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT COLUMN: Shimmering Order Summary Card */}
                    <div className="w-full">
                        <div className="border border-[var(--surface-border)] p-5 sm:p-6 bg-[var(--card-bg)] space-y-6">
                            <div className="border-b border-[var(--surface-border)] pb-3">
                                <Skeleton className="w-1/2 h-4" />
                            </div>

                            {/* Free Shipping Tracker */}
                            <div className="p-3 bg-[var(--surface-color)] border border-[var(--surface-border)] space-y-2">
                                <Skeleton className="w-full h-[6px]" style={{ borderRadius: '4px' }} />
                                <Skeleton className="w-4/5 h-[12px]" />
                            </div>

                            {/* Subtotal, tax, grand total rows */}
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Skeleton className="w-[80px] h-[14px]" />
                                    <Skeleton className="w-[60px] h-[14px]" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="w-[90px] h-[14px]" />
                                    <Skeleton className="w-[60px] h-[14px]" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="w-[60px] h-[14px]" />
                                    <Skeleton className="w-[80px] h-[14px]" />
                                </div>
                                <div className="border-t border-[var(--surface-border)] pt-4 flex justify-between">
                                    <Skeleton className="w-[100px] h-5" />
                                    <Skeleton className="w-[120px] h-6" />
                                </div>
                            </div>

                            {/* Button */}
                            <Skeleton className="w-full h-12" style={{ borderRadius: 0 }} />
                        </div>
                    </div>
                </div>
            </div>
        </AppSkeletonTheme>
    );
};

export default CartSkeleton;
