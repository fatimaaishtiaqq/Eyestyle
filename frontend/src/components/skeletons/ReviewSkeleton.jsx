import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const ReviewSkeleton = () => {
    return (
        <AppSkeletonTheme>
            <div className="space-y-6 w-full">
                {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="border border-[var(--surface-border)] bg-[var(--card-bg)] p-5 md:p-6 space-y-4 w-full">
                        {/* Rating stars outline outline + userName shim */}
                        <div className="flex flex-col gap-2.5">
                            {/* Stars block */}
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} width={12} height={12} className="shrink-0" />
                                ))}
                            </div>

                            {/* userName */}
                            <Skeleton className="w-[100px] h-3" />

                            {/* Date info */}
                            <Skeleton className="w-[80px] h-[10px]" />
                        </div>

                        {/* Comment Paragraph lines */}
                        <div className="space-y-2 pt-1">
                            <Skeleton className="w-full h-[14px]" />
                            <Skeleton className="w-[92%] h-[14px]" />
                            <Skeleton className="w-[40%] h-[14px]" />
                        </div>
                    </div>
                ))}
            </div>
        </AppSkeletonTheme>
    );
};

export default ReviewSkeleton;
