import { Hono, Context } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { validarRedeLocal } from '../middleware/rede';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasPonto = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// ... (GET / omitido para clareza no diff, mas mantido no arquivo)

// Bater ponto - Requer Rede Local (Workflow 9)
const BaterPontoSchema = z.object({
    tipo: z.enum(['entrada', 'saida'])
});

rotasPonto.post('/', autenticacaoRequerida(), verificarPermissao('ponto:registrar'), validarRedeLocal, zValidator('json', BaterPontoSchema), async (c: Context) => {
    const { DB } = c.env;
    const { tipo } = (c.req as any).valid('json');

    // Validação de horário: 13:00 às 17:00 (Brasília - UTC-3)
    const agora = new Date();
    const horaBrasilia = (agora.getUTCHours() - 3 + 24) % 24;

    if (horaBrasilia < 13 || horaBrasilia >= 17) {
        return c.json({ erro: 'O sistema de ponto só funciona das 13:00 às 17:00.' }, 403);
    }

    try {
        const usuario = c.get('usuario') as any;
        const ipOrigem = c.req.header('CF-Connecting-IP') || '127.0.0.1';

        // Workflow 9 - Verificar sequência (Blindado)
        const ultimo = await DB.prepare(`
            SELECT tipo FROM ponto_registros
            WHERE usuario_id = ? AND DATE(registrado_em) = DATE('now', '-3 hours') AND ativo = 1
            ORDER BY registrado_em DESC LIMIT 1
        `).bind(usuario.id).first() as any;

        if (ultimo?.tipo === tipo) {
            return c.json({ erro: `Você já registrou sua ${tipo} hoje.` }, 400);
        }

        // Inserção no banco provisória para Etapa 5
        await DB.prepare(`
      INSERT INTO ponto_registros (id, usuario_id, tipo, ip_origem)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), usuario.id, tipo, ipOrigem).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: tipo === 'entrada' ? 'PONTO_ENTRADA' : 'PONTO_SAIDA',
            modulo: 'ponto',
            descricao: `Batida de ${tipo} registrada IP: ${ipOrigem}`,
            ip: ipOrigem,
            entidadeTipo: 'ponto_registros'
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        return c.json({ erro: 'Falha ao registrar ponto' }, 500);
    }
});

export default rotasPonto;
