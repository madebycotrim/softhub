import { MiddlewareHandler } from 'hono';
import { Env } from '../index';

/**
 * Middleware para validar se o acesso vem da rede física da UNIEURO.
 * A tipagem MiddlewareHandler com 'Variables: any' garante compatibilidade com 
 * qualquer cadeia de tipos do Hono, aceite ou não variáveis de contexto.
 */
export const validarRedeLocal: MiddlewareHandler<{ Bindings: Env, Variables: any }> = async (c, next) => {
    // Pegar o IP real enviado pela Cloudflare ou pelo proxy
    const ipClient = c.req.header('CF-Connecting-IP') || 
                     c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
                     'desconhecido';

    console.log('[REDE] Tentativa de acesso do IP:', ipClient);

    // IPs e redes autorizadas da UNIEURO
    const IP_PUBLICO_UNIEURO = '200.252.1.35';
    const REDE_INTERNA_LAB = '10.9.';
    const REDE_INTERNA_INTRANET = '10.7.'; 

    // Regras de validação:
    const isPublicCampusIp = ipClient === IP_PUBLICO_UNIEURO;
    const isInternalLabIp = ipClient.startsWith(REDE_INTERNA_LAB);
    const isInternalIntranetIp = ipClient.startsWith(REDE_INTERNA_INTRANET);

    if (isPublicCampusIp || isInternalLabIp || isInternalIntranetIp) {
        console.log(`[REDE] Acesso permitido para o IP ${ipClient} (Rede UNIEURO)`);
        await next();
    } else {
        console.warn(`[REDE] Acesso NEGADO para o IP ${ipClient}. Fora da rede UNIEURO.`);
        return c.json({ erro: 'Acesso permitido apenas dentro da rede física da UNIEURO.' }, 403);
    }
};