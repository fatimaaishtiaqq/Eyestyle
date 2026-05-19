import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const AdminDashboardSkeleton = () => {
    return (
        <AppSkeletonTheme>
            <div className="space-y-8 w-full">
                {/* Dashboard stats cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-6 space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="w-[120px] h-3.5" />
                                <Skeleton circle width={36} height={36} />
                            </div>
                            <Skeleton className="w-[180px] h-9" />
                            <Skeleton className="w-[100px] h-3" />
                        </div>
                    ))}
                </div>

                {/* Analytical tables space */}
                <div className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-[var(--surface-border)] pb-4">
                        <Skeleton className="w-[180px] h-5" />
                        <Skeleton className="w-[100px] h-8" />
                    </div>

                    {/* Table row list */}
                    <div className="space-y-4 pt-2">
                        {Array.from({ length: 5 }).map((_, r) => (
                            <div key={r} className="flex gap-4 items-center">
                                <Skeleton className="w-12 h-4 shrink-0" />
                                <Skeleton className="flex-grow h-4" />
                                <Skeleton className="w-24 h-4 shrink-0" />
                                <Skeleton className="w-16 h-4 shrink-0" />
                                <Skeleton className="w-20 h-6 shrink-0" style={{ borderRadius: '12px' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppSkeletonTheme>
    );
};

export default AdminDashboardSkeleton;
