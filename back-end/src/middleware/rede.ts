import { Context, Next } from 'hono';
import { registrarLog } from '../servicos/servico-logs';

/**
 * Middleware para validar se o acesso vem da rede física da UNIEURO
 */
export const validarRedeLocal = async (c: Context, next: Next) => {
    // Pegar o IP real enviado pela Cloudflare ou pelo proxy
    const ipClient = c.req.header('CF-Connecting-IP') || 
                     c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
                     'desconhecido';

    console.log('[REDE] Tentativa de acesso do IP:', ipClient);

    // IP Público da UNIEURO (identificado por você)
    const IP_PUBLICO_UNIEURO = '200.252.1.35';

    // Regras de validação:
    // 1. É o IP Público da Unieuro?
    const isPublicCampusIp = ipClient === IP_PUBLICO_UNIEURO;
    
    // 2. É um IP da rede interna (caso o servidor esteja rodando localmente na rede)?
    const isInternalIp = /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipClient);
    
    // 3. É localhost (desenvolvimento)?
    const isLocalhost = ipClient === '127.0.0.1' || ipClient === '::1';

    // Se atender a QUALQUER uma das condições acima, o acesso é liberado
    const isOnCampus = isPublicCampusIp || isInternalIp || isLocalhost;

    if (!isOnCampus) {
        // @ts-ignore - Injeção do DB em tempo de execução
        const db = c.env?.DB;
        const usuario = c.get('usuario') as any;

        if (db) {
            await registrarLog(db, {
                usuarioId: usuario?.id,
                acao: 'PONTO_FORA_DA_REDE',
                modulo: 'ponto',
                descricao: `Bloqueado: IP ${ipClient} não reconhecido como rede UNIEURO.`,
                ip: ipClient
            });
        }

        return c.json({ 
            erro: 'Ponto só pode ser registrado na rede da UNIEURO.',
            detalhes: `Seu IP atual (${ipClient}) não está autorizado.` 
        }, 403);
    }

    await next();
};
