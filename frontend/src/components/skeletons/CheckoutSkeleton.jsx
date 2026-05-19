import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const CheckoutSkeleton = () => {
    return (
        <AppSkeletonTheme>
            <div className="w-full flex-col flex pb-20 min-h-screen">
                {/* Header */}
                <div className="mb-8 border-b border-[var(--surface-border)] pb-4">
                    <Skeleton className="w-[180px] h-8 mb-2" />
                    <Skeleton className="w-[120px] h-4" />
                </div>

                {/* Main 2-Column layout */}
                <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                    {/* LEFT COLUMN: Shimmering Forms */}
                    <div className="w-full lg:flex-1 space-y-6">
                        {/* 1. Contact Panel */}
                        <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6 space-y-4">
                            <div className="flex items-center gap-3 border-b border-[var(--surface-border)] pb-3">
                                <Skeleton circle width={24} height={24} />
                                <Skeleton className="w-[100px] h-4" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Skeleton className="w-[80px] h-3 mb-2" />
                                    <Skeleton className="w-full h-11" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Shipping Address Panel */}
                        <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6 space-y-4">
                            <div className="flex items-center gap-3 border-b border-[var(--surface-border)] pb-3">
                                <Skeleton circle width={24} height={24} />
                                <Skeleton className="w-[150px] h-4" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className={i === 2 ? 'md:col-span-2' : ''}>
                                        <Skeleton className="w-[90px] h-3 mb-2" />
                                        <Skeleton className="w-full h-11" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Payment Method Panel */}
                        <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6 space-y-4">
                            <div className="flex items-center gap-3 border-b border-[var(--surface-border)] pb-3">
                                <Skeleton circle width={24} height={24} />
                                <Skeleton className="w-[140px] h-4" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Skeleton className="flex-1 h-14" />
                                <Skeleton className="flex-1 h-14" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Order Summary (Desktop) */}
                    <div className="hidden lg:block w-[360px] xl:w-[400px] shrink-0">
                        <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-6 space-y-6">
                            <div className="border-b border-[var(--surface-border)] pb-3">
                                <Skeleton className="w-[120px] h-4" />
                            </div>

                            {/* Cart Item rows list */}
                            <div className="space-y-4">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-14 h-16 bg-[var(--surface-color)] border border-[var(--surface-border)] shrink-0">
                                            <Skeleton className="w-full h-full" height="100%" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Skeleton className="w-4/5 h-[14px] mb-1.5" />
                                            <Skeleton className="w-1/3 h-[11px]" />
                                        </div>
                                        <Skeleton className="w-16 h-[14px] shrink-0" />
                                    </div>
                                ))}
                            </div>

                            {/* Calculations */}
                            <div className="border-t border-[var(--surface-border)] pt-4 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="w-[60px] h-[14px]" />
                                    <Skeleton className="w-[70px] h-[14px]" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="w-[80px] h-[14px]" />
                                    <Skeleton className="w-[50px] h-[14px]" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="w-[90px] h-[14px]" />
                                    <Skeleton className="w-[60px] h-[14px]" />
                                </div>
                            </div>

                            {/* Total Due */}
                            <div className="border-t border-[var(--surface-border)] pt-4 flex justify-between">
                                <Skeleton className="w-[100px] h-5" />
                                <Skeleton className="w-[110px] h-7" />
                            </div>

                            {/* Buttons shimmers */}
                            <div className="space-y-3">
                                <Skeleton className="w-full h-12" style={{ borderRadius: 0 }} />
                                <Skeleton className="w-full h-12" style={{ borderRadius: 0 }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppSkeletonTheme>
    );
};

export default CheckoutSkeleton;
