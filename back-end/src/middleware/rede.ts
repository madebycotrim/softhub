import { Context, Next } from 'hono';
import { registrarLog } from '../servicos/servico-logs';

/**
 * Middleware para simular/verificar IP e Tráfego Seguro da UNIEURO
 * Aplicado nas rotas de Ponto Eletrônico (Workflow 9)
 */
export const validarRedeLocal = async (c: Context, next: Next) => {
    const ipClient = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || 'desconhecido';

    // Logar pra ver de onde veio na Cloudflare
    console.log('[REDE] Requisição do IP:', ipClient);

    // Regra de rede interna da UNIEURO para o Ponto Eletrônico
    const isOnCampus = ipClient.startsWith('192.168.') || ipClient.startsWith('10.') || ipClient === '127.0.0.1' || ipClient === '::1';

    if (!isOnCampus) {
        // @ts-ignore pois a injeção do c.env.DB aontece em execução do worker
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
        return c.json({ erro: 'Ponto só pode ser registrado na rede da UNIEURO.' }, 403);
    }

    await next();
};
