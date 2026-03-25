import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider, GlobalStyles } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../theme/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check localStorage or default to light
    const [mode, setMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme : 'light';
    });

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme) => {
        if (newTheme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setMode(systemPrefersDark ? 'dark' : 'light');
        } else {
            setMode(newTheme);
        }
    };

    useEffect(() => {
        localStorage.setItem('theme', mode);
        // We still toggle classes on root just in case any 3rd party relies on it, but MUI handles core UI now
        const root = window.document.documentElement;
        if (mode === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [mode]);

    const theme = React.useMemo(() => getTheme(mode), [mode]);

    // Inject our generated MUI palette straight into CSS variables our app expects
    const globalStyles = {
        ':root': {
            '--bg-color': theme.palette.background.default,
            '--card-bg': theme.palette.background.paper,
            '--surface-color': theme.palette.background.paper,
            '--color-bg-section': theme.palette.background.paper,
            '--text-primary': theme.palette.text.primary,
            '--text-secondary': theme.palette.mode === 'dark' ? '#CFCFCF' : '#555555',
            '--text-body': theme.palette.text.primary,
            '--text-muted': theme.palette.text.secondary,
            '--placeholder-color': theme.palette.mode === 'dark' ? '#9CA3AF' : '#777777',
            '--color-primary': theme.palette.primary.main,
            '--surface-border': theme.palette.divider,
            '--color-electric-blue': theme.palette.primary.main,
        }
    };

    return (
        <ThemeContext.Provider value={{ theme: mode, toggleTheme, setTheme }}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                <GlobalStyles styles={globalStyles} />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
