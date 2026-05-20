import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) {
                        return 'vendor-three';
                    }
                    if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap')) {
                        return 'vendor-gsap';
                    }
                    if (id.includes('node_modules/firebase')) {
                        return 'vendor-firebase';
                    }
                    if (id.includes('node_modules/recharts')) {
                        return 'vendor-charts';
                    }
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                timeout: 60000
            }
        }
    }
})
