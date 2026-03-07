/**
 * Utilitários para processar e descrever declarações (claims) do token de ID.
 * Baseado no tutorial da Microsoft, adaptado para TypeScript.
 */

/**
 * Cria um objeto mapeando cada claim para seu nome, valor formatado e descrição.
 */
export const criarTabelaClaims = (claims: Record<string, any>) => {
    const objetoClaims: Record<number, [string, string, string]> = {};
    let index = 0;

    Object.keys(claims).forEach((key) => {
        const valorRaw = claims[key];

        // Ignora valores complexos para exibição simples na tabela
        if (typeof valorRaw !== 'string' && typeof valorRaw !== 'number') return;

        const valor = String(valorRaw);

        switch (key) {
            case 'aud':
                popularClaim(
                    key,
                    valor,
                    "Identifica o destinatário pretendido do token. Nos tokens de ID, a audiência é o ID do Aplicativo (Application ID).",
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'iss':
                popularClaim(
                    key,
                    valor,
                    'Identifica o emissor ou servidor de autorização que construiu e retornou o token.',
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'iat':
                popularClaim(
                    key,
                    formatarDataUnix(valorRaw),
                    'Emitido Em: indica quando ocorreu a autenticação para este token.',
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'nbf':
                popularClaim(
                    key,
                    formatarDataUnix(valorRaw),
                    'Não antes de (nbf): identifica o horário antes do qual o token não deve ser aceito.',
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'exp':
                popularClaim(
                    key,
                    formatarDataUnix(valorRaw),
                    "Expiração (exp): identifica o horário em que o token expira e não deve mais ser aceito.",
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'name':
                popularClaim(
                    key,
                    valor,
                    "O nome completo do usuário para fins de exibição.",
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'preferred_username':
                popularClaim(
                    key,
                    valor,
                    'O nome de usuário primário (geralmente o email institucional).',
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'oid':
                popularClaim(
                    key,
                    valor,
                    'ID do Objeto (oid): identificador único e imutável do usuário no Azure AD.',
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'tid':
                popularClaim(
                    key,
                    valor,
                    'ID do Locatário (Tenant ID): identifica a organização UNIEURO no Azure AD.',
                    index,
                    objetoClaims
                );
                index++;
                break;
            case 'ver':
                popularClaim(
                    key,
                    valor,
                    'Versão do token emitida pela plataforma Microsoft.',
                    index,
                    objetoClaims
                );
                index++;
                break;
            default:
                popularClaim(key, valor, 'Informação técnica do token.', index, objetoClaims);
                index++;
        }
    });

    return objetoClaims;
};

/**
 * Popula o objeto de claims com array de [nome, valor, descrição]
 */
const popularClaim = (claim: string, valor: string, descricao: string, index: number, objetoClaims: Record<number, [string, string, string]>) => {
    objetoClaims[index] = [claim, valor, descricao];
};

/**
 * Transforma timestamp Unix em data legível
 */
const formatarDataUnix = (dataUnix: string | number) => {
    const timestamp = typeof dataUnix === 'string' ? parseInt(dataUnix, 10) : dataUnix;
    const d = new Date(timestamp * 1000);
    return `${timestamp} - [${d.toLocaleString('pt-BR')}]`;
};
