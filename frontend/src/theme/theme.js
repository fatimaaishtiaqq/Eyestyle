import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => {
    return createTheme({
        palette: {
            mode,
            ...(mode === 'light'
                ? {
                    // Light Mode Palette
                    background: {
                        default: '#ffffff',
                        paper: '#f5f5f5',
                    },
                    primary: {
                        main: '#ff9800', // Orange CTA
                    },
                    text: {
                        primary: '#000000',
                        secondary: '#999990', // Muted text equivalent
                    },
                    divider: '#e6e6e6',
                }
                : {
                    // Dark Mode Palette
                    background: {
                        default: '#0a192f',
                        paper: '#112240',
                    },
                    primary: {
                        main: '#ff9800', // Orange CTA
                    },
                    text: {
                        primary: '#e6f1ff',
                        secondary: '#8892b0',
                    },
                    divider: '#233554',
                }),
        },
        typography: {
            fontFamily: '"Inter", sans-serif',
            h1: { fontFamily: '"Playfair Display", serif' },
            h2: { fontFamily: '"Playfair Display", serif' },
            h3: { fontFamily: '"Playfair Display", serif' },
            h4: { fontFamily: '"Playfair Display", serif' },
            h5: { fontFamily: '"Playfair Display", serif' },
            h6: { fontFamily: '"Playfair Display", serif' },
        },
    });
};
