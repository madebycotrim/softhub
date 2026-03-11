import { Hono, Context } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';
const rotasAvisos = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar avisos ativos
rotasAvisos.get('/', autenticacaoRequerida(), verificarPermissao('avisos:visualizar'), async (c: Context) => {
    // Fase 1 - Cacheamento nativo
    const cache = await caches.open('avisos-cache');
    const cacheKey = c.req.url;
    const cachedRes = await cache.match(cacheKey);
    if (cachedRes) return cachedRes;

    const { DB } = c.env;

    try {
        const { results } = await DB.prepare(`
      SELECT a.id, a.titulo, a.conteudo, a.prioridade, a.criado_em, a.expira_em,
             u.id as criador_id, u.nome as criador_nome, u.foto_perfil as criador_foto
      FROM avisos a
      JOIN usuarios u ON a.criado_por = u.id
      WHERE (a.expira_em IS NULL OR datetime(a.expira_em) >= datetime('now'))
      ORDER BY a.criado_em DESC
    `).all();

        // Map para o formato esperado pelo frontend
        const formatado = results.map((r: any) => ({
            id: r.id,
            titulo: r.titulo,
            conteudo: r.conteudo,
            prioridade: r.prioridade,
            criado_em: r.criado_em,
            expira_em: r.expira_em,
            criado_por: {
                id: r.criador_id,
                nome: r.criador_nome,
                foto: r.criador_foto
            }
        }));

        const resposta = c.json(formatado);
        // Obriga o Workers Cache API a respeitar 10 min de vida para o cache de borda
        resposta.headers.set('Cache-Control', 'max-age=600');
        await cache.put(cacheKey, resposta.clone());

        return resposta;
    } catch (erro) {
        console.error('[ERRO DB] GET /avisos', erro);
        return c.json({ erro: 'Falha ao buscar avisos' }, 500);
    }
});

// Criar aviso (Requer líder ou admin, validado em Etapa Superior ou frontend mock)
const CriarAvisoSchema = z.object({
    titulo: z.string().min(3),
    conteudo: z.string().optional().default(''),
    prioridade: z.enum(['info', 'importante', 'urgente']),
    expira_em: z.string().nullable().optional()
});

rotasAvisos.post('/', autenticacaoRequerida(), verificarPermissao('avisos:criar'), zValidator('json', CriarAvisoSchema), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;
    const { titulo, conteudo, prioridade, expira_em } = (c.req as any).valid('json');

    try {
        const novoId = crypto.randomUUID();

        await DB.prepare(`
            INSERT INTO avisos (id, titulo, conteudo, prioridade, expira_em, criado_por)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(novoId, titulo, conteudo, prioridade, expira_em || null, usuario.id).run();

        // Workflow 12 - Notificações
        // Simplificado para 'todosOsUsuarios' já que backend da tabela Grupos/Equipes precisaria expansão (e schema atual de avisos não suporta)
        await criarNotificacoes(c.env.DB, {
            todosOsUsuarios: true,
            titulo: `Novo Aviso: ${titulo}`,
            mensagem: conteudo,
            tipo: 'aviso',
            link: '/app/avisos' // Exemplo 
        });

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'AVISO_CRIADO',
            modulo: 'avisos',
            descricao: `Aviso "${titulo}" criado para todos os membros`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'avisos',
            entidadeId: novoId,
            dadosNovos: { titulo, prioridade, expira_em }
        });

        return c.json({ sucesso: true, id: novoId });
    } catch (erro) {
        return c.json({ erro: 'Falha ao criar aviso' }, 500);
    }
});

// Remover aviso (Hard delete)
rotasAvisos.delete('/:id', autenticacaoRequerida(), verificarPermissao('avisos:remover'), async (c: Context) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario') as any;

    try {
        await DB.prepare('DELETE FROM avisos WHERE id = ?').bind(id).run();
        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'AVISO_REMOVIDO',
            modulo: 'avisos',
            descricao: `Aviso ${id} removido do mural`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'avisos',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        return c.json({ erro: 'Falha ao remover aviso' }, 500);
    }
});

export default rotasAvisos;
