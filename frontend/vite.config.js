import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
                    'vendor-gsap': ['gsap', '@gsap/react'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth'],
                    'vendor-charts': ['recharts'],
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
