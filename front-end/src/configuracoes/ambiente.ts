const meta = import.meta;

// A URL de fallback não deve ter a barra no final para evitar o problema da "barra dupla".
const url = meta.env.VITE_API || 'https://api.softhub.workers.dev';

if (!url) {
    console.error(
        '❌ Erro de configuração (Environment Variables):\n' +
        '   - VITE_API: URL da API inválida'
    );
    throw new Error('Variáveis de ambiente inválidas. Verifique o arquivo .env');
}

export const ambiente = {
    VITE_API: url,
    IS_DEV: meta.env.DEV,
    IS_PROD: meta.env.PROD,
    IS_TEST: meta.env.VITEST_WORKER_ID !== undefined,
};
