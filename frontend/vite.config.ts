import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
    // Carrega as variáveis .env para substituir nos arquivos HTML estáticos
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            tailwindcss(),
            // Plugin que substitui __VITE_MSAL_CLIENT_ID__ e __VITE_MSAL_TENANT_ID__
            // no auth-callback.html em tempo de build
            {
                name: 'html-env-replace',
                transformIndexHtml(html) {
                    return html
                        .replace(/__VITE_MSAL_CLIENT_ID__/g, env.VITE_MSAL_CLIENT_ID || '')
                        .replace(/__VITE_MSAL_TENANT_ID__/g, env.VITE_MSAL_TENANT_ID || '');
                },
            },
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': [
                            'react', 'react-dom', 'react-router', 'react-router-dom',
                            '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'
                        ],
                        'vendor-auth': ['@azure/msal-browser', '@azure/msal-react'],
                        'vendor-charts': ['recharts'],
                        'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
                        'vendor-ui': ['radix-ui', 'lucide-react', 'clsx', 'tailwind-merge'],
                        'vendor-qr': ['html5-qrcode', 'qrcode.react']
                    }
                }
            }
        },
        server: {
            port: 5173,
        },
    };
});