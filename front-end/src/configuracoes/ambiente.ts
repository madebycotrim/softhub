import { z } from 'zod';

const esquemaAmbiente = z
    .object({
        VITE_MSAL_CLIENT_ID: z.string().min(1, 'VITE_MSAL_CLIENT_ID é obrigatório'),
        VITE_MSAL_TENANT_ID: z.string().min(1, 'VITE_MSAL_TENANT_ID é obrigatório'),
        VITE_API_URL: z
            .string()
            .url('VITE_API_URL deve ser uma URL válida')
            .default('https://softhub.madebycotrim-67c.workers.dev'),
        VITE_DOMINIO_INSTITUCIONAL: z
            .string()
            .min(1, 'VITE_DOMINIO_INSTITUCIONAL é obrigatório')
            .default('unieuro.edu.br'),
    })
    .readonly();

const resultadoAmbiente = esquemaAmbiente.safeParse(import.meta.env);

if (!resultadoAmbiente.success) {
    const erros = resultadoAmbiente.error.flatten().fieldErrors;
    console.error('❌ Variáveis de ambiente inválidas:', erros);
    throw new Error(
        `Variáveis de ambiente inválidas:\n${JSON.stringify(erros, null, 2)}`
    );
}

/**
 * Variáveis de ambiente validadas e tipadas.
 * Nunca acessar import.meta.env diretamente fora deste arquivo.
 */
export const ambiente = {
    msalClientId: resultadoAmbiente.data.VITE_MSAL_CLIENT_ID,
    msalTenantId: resultadoAmbiente.data.VITE_MSAL_TENANT_ID,
    apiUrl: resultadoAmbiente.data.VITE_API_URL,
    dominioInstitucional: resultadoAmbiente.data.VITE_DOMINIO_INSTITUCIONAL,
} as const;
