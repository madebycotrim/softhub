import { Context, Next } from 'hono';
import { registrarLog } from '../servicos/servico-logs';

/**
 * Middleware para simular/verificar IP e Tráfego Seguro da UNIEURO
 * Aplicado nas rotas de Ponto Eletrônico (Workflow 9)
 */
export const validarRedeLocal = async (c: Context, next: Next) => {

    // Captura IP real considerando Cloudflare e proxies
    const cfIp = c.req.header('CF-Connecting-IP');
    const forwarded = c.req.header('x-forwarded-for');

    let ipClient =
        cfIp ||
        forwarded?.split(',')[0].trim() ||
        '0.0.0.0';

    console.log('[REDE] Requisição do IP:', ipClient);

    // Rede interna UNIEURO: 10.9.0.0/16
    const isOnCampus =
        /^10\.9\.\d{1,3}\.\d{1,3}$/.test(ipClient) ||
        ipClient === '127.0.0.1' ||
        ipClient === '::1';

    if (!isOnCampus) {
        // @ts-ignore pois a injeção do c.env.DB acontece em execução do worker
        const db = c.env?.DB;
        const usuario = c.get('usuario') as any;

        if (db) {
            await registrarLog(db, {
                usuarioId: usuario?.id,
                acao: 'PONTO_FORA_DA_REDE',
                modulo: 'ponto',
                descricao: `Tentativa de ponto bloqueada via ${ipClient}`,
                ip: ipClient
            });
        }

        return c.json(
            { erro: 'Ponto só pode ser registrado na rede da UNIEURO.' },
            403
        );
    }

    await next();
};
