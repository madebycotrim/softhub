import { MiddlewareHandler } from 'hono';
import { Env } from '../index';

/**
 * Middleware para validar se o acesso vem da rede física da UNIEURO.
 * A tipagem MiddlewareHandler com 'Variables: any' garante compatibilidade com 
 * qualquer cadeia de tipos do Hono, aceite ou não variáveis de contexto.
 */
export const validarRedeLocal: MiddlewareHandler<{ Bindings: Env, Variables: any }> = async (c, next) => {
    const { DB, softhub_kv } = c.env;
    
    // Pegar o IP real enviado pela Cloudflare ou pelo proxy
    const ipClient = c.req.header('CF-Connecting-IP') || 
                     c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
                     'desconhecido';

    // 1. Buscar IPs Autorizados na Governança
    let ipsAutorizados: string[] = [];
    try {
        const chave = 'ips_autorizados_ponto';
        let v = await softhub_kv?.get(chave);

        if (!v) {
            const row = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind(chave).first() as any;
            if (row) {
                v = row.valor;
                if (softhub_kv) await softhub_kv.put(chave, v!, { expirationTtl: 3600 });
            }
        }

        if (v) {
            ipsAutorizados = JSON.parse(v);
        }
    } catch (e) {
        console.error('[REDE] Falha ao carregar IPs autorizados:', e);
    }

    // Se não houver IPs configurados, permite todos (ou define um padrão de segurança)
    if (ipsAutorizados.length === 0) {
        return await next();
    }

    // Regras de validação:
    const permitido = ipsAutorizados.some(regra => {
        // Suporte a IP exato ou prefixos (ex: 10.9.)
        return ipClient === regra || ipClient.startsWith(regra);
    });

    if (permitido) {
        await next();
    } else {
        console.warn(`[REDE] Acesso NEGADO para o IP ${ipClient}. Fora da whitelist configurada.`);
        return c.json({ 
            erro: 'Acesso bloqueado por restrição de rede.', 
            detalhe: 'Este dispositivo não está na lista de IPs autorizados para registro de ponto.' 
        }, 403);
    }
};