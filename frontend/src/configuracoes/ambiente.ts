import { z } from 'zod';

const esquemaAmbiente = z.object({
    VITE_MSAL_CLIENT_ID: z.string().min(1, 'VITE_MSAL_CLIENT_ID é obrigatório'),
    VITE_MSAL_TENANT_ID: z.string().min(1, 'VITE_MSAL_TENANT_ID é obrigatório'),
    VITE_API_URL: z.string().url('VITE_API_URL deve ser uma URL válida'),
    // 🔴 CORRIGIDO: unificado para 'unieuro.com.br'.
    // Unificado para 'unieuro.com.br' — deve bater EXATAMENTE com DOMINIO_INSTITUCIONAL do backend.
    VITE_DOMINIO_INSTITUCIONAL: z
        .string()
        .min(1, 'VITE_DOMINIO_INSTITUCIONAL é obrigatório')
        .default('unieuro.com.br'),
});

const _ambiente = esquemaAmbiente.safeParse(import.meta.env);

if (!_ambiente.success) {
    console.error('❌ Variáveis de ambiente inválidas:', _ambiente.error.format());
    throw new Error('Variáveis de ambiente inválidas ou ausentes. Verifique o arquivo .env');
}

/**
 * Variáveis de ambiente validadas e tipadas.
 * Nunca acessar import.meta.env diretamente fora deste arquivo.
 */
export const ambiente = {
    msalClientId: _ambiente.data.VITE_MSAL_CLIENT_ID,
    msalTenantId: _ambiente.data.VITE_MSAL_TENANT_ID,
    apiUrl: _ambiente.data.VITE_API_URL,
    dominioInstitucional: _ambiente.data.VITE_DOMINIO_INSTITUCIONAL,
} as const;