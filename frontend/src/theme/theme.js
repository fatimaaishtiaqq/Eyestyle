import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => {
    return createTheme({
        palette: {
            mode,
            ...(mode === 'light'
                ? {
                    // ── Light Mode ──────────────────────────
                    background: {
                        default: '#ffffff',   // 60 %  –  page bg
                        paper: '#f5f5f5',     // 30 %  –  surfaces
                    },
                    primary: {
                        main: '#ff9800',      // 10 %  –  accent / CTA
                        dark: '#fb8c00',      //        –  hover
                        light: '#ef6c00',     //        –  active / pressed
                    },
                    text: {
                        primary: '#000000',   //  headings, high-contrast
                        secondary: '#555555', //  body copy
                        disabled: '#777777',  //  muted / helper
                    },
                    divider: '#e6e6e6',
                }
                : {
                    // ── Dark Mode ───────────────────────────
                    background: {
                        default: '#0a192f',   // 60 %  –  page bg
                        paper: '#112240',     // 30 %  –  surfaces
                    },
                    primary: {
                        main: '#ff9800',      // 10 %  –  accent / CTA
                        dark: '#fb8c00',      //        –  hover
                        light: '#ef6c00',     //        –  active / pressed
                    },
                    text: {
                        primary: '#e6f1ff',   //  headings, high-contrast
                        secondary: '#B8C1EC', //  body copy
                        disabled: '#7A86A8',  //  muted / helper
                    },
                    divider: '#2c3e63',
                }),
        },
        typography: {
            fontFamily: '"Segoe UI", "Inter", sans-serif',
            h1: { fontFamily: '"Playfair Display", serif' },
            h2: { fontFamily: '"Playfair Display", serif' },
            h3: { fontFamily: '"Playfair Display", serif' },
            h4: { fontFamily: '"Playfair Display", serif' },
            h5: { fontFamily: '"Playfair Display", serif' },
            h6: { fontFamily: '"Playfair Display", serif' },
        },
    });
};
