import { z } from 'zod';

/**
 * 1. Definimos o esquema com os nomes originais (VITE_...)
 * 2. Usamos .transform() para mapear para camelCase automaticamente
 */
const esquemaAmbiente = z.object({
    VITE_MSAL_CLIENT_ID: z.string().min(1, 'ID do Cliente MSAL é obrigatório'),
    VITE_MSAL_TENANT_ID: z.string().min(1, 'ID do Tenant MSAL é obrigatório'),
    VITE_API_URL: z.string().url('URL da API inválida').default('https://api.softhub.workers.dev/'),
}).transform((dados) => ({
    msalClientId: dados.VITE_MSAL_CLIENT_ID,
    msalTenantId: dados.VITE_MSAL_TENANT_ID,
    apiUrl: dados.VITE_API_URL,
}));

// Validamos o import.meta.env
const resultado = esquemaAmbiente.safeParse(import.meta.env);

if (!resultado.success) {
    // Melhoramos a legibilidade do erro no console
    const mensagensDeErro = resultado.error.issues
        .map((issue) => `   - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

    console.error(`❌ Erro de configuração (Environment Variables):\n${mensagensDeErro}`);

    // Em desenvolvimento, é bom lançar erro para parar a aplicação
    throw new Error('Variáveis de ambiente inválidas. Verifique o arquivo .env');
}

export const ambiente = resultado.data;

// Exportamos o tipo para usar em outras partes do projeto se necessário
export type Ambiente = z.infer<typeof esquemaAmbiente>;