import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const rotasPerfil = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

// ─── GET /me ──────────────────────────────────────────────────────────────────
rotasPerfil.get('/me', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario');

    try {
        // 1. Dados Básicos do Usuário
        const usuario = await DB.prepare(`
            SELECT 
                u.id, u.nome, u.email, u.role, u.foto_perfil, u.bio, u.funcoes, u.criado_em,
                e.nome as equipe_nome,
                g.nome as grupo_nome
            FROM usuarios u
            LEFT JOIN usuarios_organizacao uo ON uo.usuario_id = u.id
            LEFT JOIN equipes e ON e.id = uo.equipe_id
            LEFT JOIN grupos g ON g.id = uo.grupo_id
            WHERE u.id = ?
        `).bind(usuarioLogado.id).first() as any;

        if (!usuario) return c.json({ erro: 'Usuário não encontrado.' }, 404);

        // 2. Estatísticas de Tarefas
        const statsTarefas = await DB.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) as concluidas,
                SUM(CASE WHEN status != 'concluida' THEN 1 ELSE 0 END) as pendentes
            FROM tarefas t
            JOIN tarefas_responsaveis tr ON tr.tarefa_id = t.id
            WHERE tr.usuario_id = ?
        `).bind(usuarioLogado.id).first() as any;

        // 3. Estatísticas de Ponto (Total de Horas)
        // Simplificação: Cada par Entrada/Saída concluído no mês atual
        const statsPonto = await DB.prepare(`
            SELECT COUNT(*) as batidas
            FROM ponto_registros
            WHERE usuario_id = ? AND strftime('%m', registrado_em) = strftime('%m', 'now')
        `).bind(usuarioLogado.id).first() as any;

        return c.json({
            perfil: {
                ...usuario,
                funcoes: JSON.parse(usuario.funcoes || '[]')
            },
            stats: {
                tarefas: {
                    total: Number(statsTarefas?.total || 0),
                    concluidas: Number(statsTarefas?.concluidas || 0),
                    pendentes: Number(statsTarefas?.pendentes || 0),
                    aproveitamento: statsTarefas?.total > 0 ? Math.round((statsTarefas.concluidas / statsTarefas.total) * 100) : 0
                },
                ponto: {
                    batidasMes: Number(statsPonto?.batidas || 0),
                    estimativaHoras: Math.floor(Number(statsPonto?.batidas || 0) * 4) // Estimativa simples
                }
            }
        });
    } catch (e: any) {
        console.error('[PERFIL] Erro ao buscar dados:', e);
        return c.json({ erro: 'Falha ao carregar perfil.' }, 500);
    }
});

// ─── PATCH /me ────────────────────────────────────────────────────────────────
const UpdatePerfilSchema = z.object({
    nome: z.string().min(3).optional(),
    bio: z.string().max(500).optional(),
    foto_perfil: z.string().url().optional().or(z.literal(''))
});

rotasPerfil.patch('/me', autenticacaoRequerida(), zValidator('json', UpdatePerfilSchema), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario');
    const dados = await c.req.json();

    try {
        const sets: string[] = [];
        const values: any[] = [];

        if (dados.nome) { sets.push('nome = ?'); values.push(dados.nome); }
        if (dados.bio !== undefined) { sets.push('bio = ?'); values.push(dados.bio); }
        if (dados.foto_perfil !== undefined) { sets.push('foto_perfil = ?'); values.push(dados.foto_perfil || null); }

        if (sets.length === 0) return c.json({ erro: 'Nenhum dado para atualizar.' }, 400);

        values.push(usuarioLogado.id);
        const query = `UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`;
        
        await DB.prepare(query).bind(...values).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'PERFIL_ATUALIZADO',
            modulo: 'perfil',
            descricao: `Usuário atualizou seus próprios dados de perfil.`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: usuarioLogado.id
        });

        return c.json({ sucesso: true });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao atualizar perfil.' }, 500);
    }
});

export default rotasPerfil;
