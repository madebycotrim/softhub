import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
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
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                    runtimeCaching: [
                        {
                            urlPattern: /\.(?:png|jpg|jpeg|svg|woff2?|ttf)$/,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'assets-estaticos',
                                expiration: {
                                    maxEntries: 50,
                                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
                                },
                            },
                        },
                    ],
                },
                manifest: {
                    name: 'SoftHub - Fábrica de Software',
                    short_name: 'SoftHub',
                    description: 'Sistema de gestão da Fábrica de Software UNIEURO',
                    theme_color: '#020617',
                    background_color: '#020617',
                    display: 'standalone',
                    start_url: '/',
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