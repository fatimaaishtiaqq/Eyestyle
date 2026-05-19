import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const AccountSkeleton = () => {
    return (
        <AppSkeletonTheme>
            <div className="w-full space-y-8">
                {/* Profile Banner / Welcome Shimmer */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[var(--surface-border)]">
                    <div>
                        <Skeleton className="w-[180px] h-8 mb-2" />
                        <Skeleton className="w-[240px] h-4" />
                    </div>
                    <Skeleton className="w-[120px] h-10" />
                </div>

                {/* Tabs bar */}
                <div className="flex gap-4 border-b border-[var(--surface-border)] pb-1">
                    <Skeleton className="w-[100px] h-8" />
                    <Skeleton className="w-[120px] h-8" />
                </div>

                {/* Order Logs Stack */}
                <div className="space-y-6">
                    {Array.from({ length: 2 }).map((_, idx) => (
                        <div key={idx} className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 sm:p-6 space-y-4">
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3 pb-3 border-b border-[var(--surface-border)]">
                                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
                                    <div>
                                        <Skeleton className="w-[70px] h-3 mb-1" />
                                        <Skeleton className="w-[110px] h-4" />
                                    </div>
                                    <div>
                                        <Skeleton className="w-[80px] h-3 mb-1" />
                                        <Skeleton className="w-[90px] h-4" />
                                    </div>
                                    <div>
                                        <Skeleton className="w-[60px] h-3 mb-1" />
                                        <Skeleton className="w-[80px] h-4" />
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center">
                                    <Skeleton className="w-[90px] h-6" style={{ borderRadius: '12px' }} />
                                </div>
                            </div>

                            {/* Card Items */}
                            <div className="space-y-4 pt-1">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-14 bg-[var(--surface-color)] border border-[var(--surface-border)] shrink-0">
                                        <Skeleton className="w-full h-full" height="100%" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Skeleton className="w-1/2 h-[14px] mb-1.5" />
                                        <Skeleton className="w-1/4 h-[11px]" />
                                    </div>
                                    <Skeleton className="w-16 h-[14px] shrink-0" />
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex justify-end pt-3 border-t border-[var(--surface-border)]">
                                <Skeleton className="w-[120px] h-9" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppSkeletonTheme>
    );
};

export default AccountSkeleton;
