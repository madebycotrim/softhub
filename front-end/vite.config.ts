import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
                manifest: {
                    name: 'SoftHub - Fábrica de Software',
                    short_name: 'SoftHub',
                    description: 'Sistema de gestão da Fábrica de Software UNIEURO',
                    theme_color: '#020617',
                    background_color: '#020617',
                    display: 'standalone',
                    lang: 'pt-BR',
                    icons: [
                        { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                        { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
                        { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                    ]
                }
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            proxy: {
                '/api': {
                    target: env.VITE_PROXY_TARGET || 'https://softhub.madebycotrim-67c.workers.dev',
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});