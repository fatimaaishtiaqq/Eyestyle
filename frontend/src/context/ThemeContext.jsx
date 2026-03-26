import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider, GlobalStyles } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '../theme/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
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
    const isDark = theme.palette.mode === 'dark';

    /* ── CSS variable bridge ──────────────────────────────────────
       Every CSS variable the app uses is derived from the MUI
       palette so light ↔ dark stays perfectly in sync.           */
    const globalStyles = {
        ':root': {
            /* 60 % — backgrounds */
            '--bg-color': theme.palette.background.default,
            '--color-bg-section': theme.palette.background.paper,

            /* 30 % — surfaces / cards */
            '--surface-color': theme.palette.background.paper,
            '--card-bg': theme.palette.background.paper,

            /* 10 % — accent / CTA */
            '--color-primary': theme.palette.primary.main,
            '--color-primary-hover': theme.palette.primary.dark,
            '--color-primary-active': theme.palette.primary.light,
            '--accent': theme.palette.primary.main,

            /* Borders */
            '--surface-border': theme.palette.divider,
            '--color-border': theme.palette.divider,

            /* Text hierarchy */
            '--text-primary': theme.palette.text.primary,
            '--text-secondary': theme.palette.text.secondary,
            '--text-body': theme.palette.text.primary,
            '--text-muted': theme.palette.text.disabled,
            '--placeholder-color': theme.palette.text.disabled,

            /* Legacy aliases (keeps 3rd-party / old components happy) */
            '--color-electric-blue': theme.palette.primary.main,

            /* Smooth theme transitions */
            transition: 'background-color 0.3s ease, color 0.3s ease',
        },
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
