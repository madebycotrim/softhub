import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Configuração de emergência: Foco total em estabilidade.
// Removida toda a complexidade de build (PWA, manualChunks).
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // Nenhuma configuração de build. O Vite usará sua estratégia padrão e mais segura.
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'autoUpdate',
                manifest: {
                    name: 'SoftHub - Fábrica de Software',
                    short_name: 'SoftHub',
                    description: 'Sistema de Gestão da Fábrica de Software Unieuro',
                    theme_color: '#020617',
                    background_color: '#020617',
                    display: 'standalone',
                    icons: [
                        {
                            src: 'icons/icon-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'icons/icon-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
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
            // Proxy mantido por ser essencial para o desenvolvimento.
            proxy: {
                '/api': {
                    target: env.VITE_API || 'https://api.softhub.workers.dev',
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});