import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
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
                    target: env.VITE_PROXY_TARGET || 'https://softhub.madebycotrim-67c.workers.dev',
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});