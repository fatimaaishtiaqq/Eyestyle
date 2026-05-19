import React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { useTheme } from '../../context/ThemeContext';

export const AppSkeletonTheme = ({ children }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <SkeletonTheme
            baseColor={isDark ? '#1d2d50' : '#e5e7eb'}
            highlightColor={isDark ? '#2a3d66' : '#f3f4f6'}
        >
            {children}
        </SkeletonTheme>
    );
};

export default AppSkeletonTheme;
