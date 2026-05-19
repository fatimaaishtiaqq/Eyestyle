import React from 'react';
import Skeleton from 'react-loading-skeleton';
import AppSkeletonTheme from './AppSkeletonTheme';

export const AdminTableSkeleton = ({ rows = 5, cols = 5 }) => {
    return (
        <AppSkeletonTheme>
            <div className="w-full overflow-hidden border border-[var(--surface-border)] rounded-sm bg-[var(--card-bg)]">
                {/* Table Header shimmer row */}
                <div className="flex bg-[var(--surface-color)]/50 px-6 py-4 border-b border-[var(--surface-border)] gap-4">
                    {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="flex-1">
                            <Skeleton className="w-3/4 h-3.5" />
                        </div>
                    ))}
                </div>

                {/* Table Row shimmers */}
                <div className="divide-y divide-[var(--surface-border)]">
                    {Array.from({ length: rows }).map((_, r) => (
                        <div key={r} className="flex px-6 py-5 gap-4 items-center hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                            {Array.from({ length: cols }).map((_, c) => (
                                <div key={c} className="flex-1 min-w-0">
                                    {c === 0 ? (
                                        <div className="flex items-center gap-3">
                                            <Skeleton circle width={32} height={32} className="shrink-0" />
                                            <div className="flex-grow">
                                                <Skeleton className="w-[85%] h-3.5 mb-1.5" />
                                                <Skeleton className="w-[45%] h-[10px]" />
                                            </div>
                                        </div>
                                    ) : c === cols - 1 ? (
                                        <div className="flex gap-2 justify-start items-center">
                                            <Skeleton className="w-16 h-8" style={{ borderRadius: '2px' }} />
                                            <Skeleton circle width={28} height={28} />
                                        </div>
                                    ) : (
                                        <Skeleton className="w-2/3 h-3.5" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </AppSkeletonTheme>
    );
};

export default AdminTableSkeleton;
