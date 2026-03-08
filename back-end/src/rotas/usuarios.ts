import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';

const rotasUsuarios = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

// ─── Health Check ─────────────────────────────────────────────────────────────

rotasUsuarios.get('/ping', async (c) => {
    const { DB } = c.env;
    try {
        const res = await DB.prepare('SELECT COUNT(*) as n FROM usuarios').first();
        return c.json({
            status: 'ok',
            versao: '2.5',
            banco_usuarios: (res as any)?.n ?? 0,
            timestamp: new Date().toISOString(),
        });
    } catch (e: any) {
        return c.json({ status: 'erro_banco', detalhes: e.message, versao: '2.5' }, 500);
    }
});

// ─── GET / — Listar Diretório de Membros ──────────────────────────────────────

rotasUsuarios.get('/', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;

    try {
        const query = `
            SELECT
                u.*,
                e.nome  AS equipe_nome,
                g.nome  AS grupo_nome,
                g.id    AS grupo_id
            FROM usuarios u
            LEFT JOIN equipes e ON u.equipe_id = e.id
            LEFT JOIN grupos  g ON e.grupo_id  = g.id
            WHERE u.visivel = 1
            ORDER BY u.nome ASC
        `;

        const { results } = await DB.prepare(query).all();

        console.log(`[AUDITORIA] GET /api/usuarios - Membros encontrados: ${results?.length ?? 0}`);
        if (results) {
            console.log(`[AUDITORIA] Emails: ${results.map((u: any) => u.email).join(', ')}`);
        }

        return c.json({
            membros: results ?? [],
            metadata: {
                total: results?.length ?? 0,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (erro: any) {
        console.error('[ERRO DB] GET /api/usuarios', erro);
        return c.json({ erro: 'Falha ao buscar membros', detalhe: erro.message }, 500);
    }
});

// ─── PATCH /perfil — Editar Próprio Perfil ────────────────────────────────────

rotasUsuarios.patch('/perfil', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    let bio: string | null = null;
    let foto_perfil: string | null = null;

    try {
        const body = await c.req.json();
        bio = body.bio ?? null;
        foto_perfil = body.foto_perfil ?? null;
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    try {
        await DB.prepare('UPDATE usuarios SET bio = ?, foto_perfil = ? WHERE id = ?')
            .bind(bio, foto_perfil, usuario.id)
            .run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            usuarioRole: usuario.role,
            acao: 'PERFIL_ATUALIZADO',
            modulo: 'membros',
            descricao: 'Usuário atualizou o próprio perfil (bio/foto)',
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: usuario.id,
            dadosNovos: { bio, foto_perfil },
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /api/usuarios/perfil', erro);
        return c.json({ erro: 'Falha ao atualizar perfil.' }, 500);
    }
});

// ─── PATCH /:id/role — Alterar Role (apenas ADMIN) ───────────────────────────

rotasUsuarios.patch('/:id/role', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    if (usuarioLogado.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado. Apenas administradores podem alterar papéis.' }, 403);
    }

    let role: string;
    try {
        ({ role } = await c.req.json());
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    if (!role) {
        return c.json({ erro: 'O campo "role" é obrigatório.' }, 400);
    }

    try {
        await DB.prepare('UPDATE usuarios SET role = ? WHERE id = ?').bind(role, id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'MEMBRO_ROLE_ALTERADA',
            modulo: 'admin',
            descricao: `Role do membro ${id} alterada para ${role}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id,
            dadosNovos: { role },
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /api/usuarios/:id/role', erro);
        return c.json({ erro: 'Não foi possível alterar a role.' }, 500);
    }
});

// ─── PATCH /:id/status — Ativar / Desativar (apenas ADMIN) ───────────────────

rotasUsuarios.patch('/:id/status', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    if (usuarioLogado.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado. Apenas administradores podem alterar o status.' }, 403);
    }

    if (usuarioLogado.id === id) {
        return c.json({ erro: 'Você não pode desativar ou excluir sua própria conta.' }, 400);
    }

    let ativo: boolean;
    try {
        ({ ativo } = await c.req.json());
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    if (typeof ativo !== 'boolean') {
        return c.json({ erro: 'O campo "ativo" deve ser um booleano.' }, 400);
    }

    try {
        await DB.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').bind(ativo ? 1 : 0, id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: ativo ? 'MEMBRO_ATIVADO' : 'MEMBRO_DESATIVADO',
            modulo: 'admin',
            descricao: `Membro ${id} marcado como ${ativo ? 'ATIVO' : 'INATIVO'}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id,
            dadosNovos: { ativo },
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /api/usuarios/:id/status', erro);
        return c.json({ erro: 'Não foi possível alterar o status.' }, 500);
    }
});

// ─── PATCH /:id/limpar — Ocultar Permanentemente (apenas ADMIN) ────────────────

rotasUsuarios.patch('/:id/limpar', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    if (usuarioLogado.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado.' }, 403);
    }

    if (usuarioLogado.id === id) {
        return c.json({ erro: 'Você não pode excluir sua própria conta.' }, 400);
    }

    try {
        await DB.prepare('UPDATE usuarios SET visivel = 0, ativo = 0 WHERE id = ?').bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'MEMBRO_OCULTADO_DEFINITIVO',
            modulo: 'admin',
            descricao: `Membro ${id} foi removido permanentemente da interface (limpeza)`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /api/usuarios/:id/limpar', erro);
        return c.json({ erro: 'Erro ao realizar limpeza definitiva.' }, 500);
    }
});

// ─── POST /limpeza-geral — Esvaziar Lixeira (apenas ADMIN) ────────────────────

rotasUsuarios.post('/limpeza-geral', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    if (usuarioLogado.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado.' }, 403);
    }

    try {
        // Oculta todos que já estão inativos (arquivados)
        const { meta } = await DB.prepare('UPDATE usuarios SET visivel = 0 WHERE ativo = 0 AND id != ?')
            .bind(usuarioLogado.id)
            .run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'LIMPEZA_GERAL_MEMBROS',
            modulo: 'admin',
            descricao: `Realizada limpeza geral. ${meta.changes} membros movidos para o limbo.`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
        });

        return c.json({ sucesso: true, removidos: meta.changes });
    } catch (erro) {
        console.error('[ERRO DB] POST /api/usuarios/limpeza-geral', erro);
        return c.json({ erro: 'Erro ao realizar limpeza geral.' }, 500);
    }
});

// ─── POST / — Pré-cadastro de Membro (apenas ADMIN) ──────────────────────────

rotasUsuarios.post('/', async (c, next) => {
    console.log('[POST /usuarios] >>> ROTA ATINGIDA, headers:', JSON.stringify(Object.fromEntries(c.req.raw.headers)));
    await next();
}, autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    if (usuarioLogado.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado. Apenas administradores podem cadastrar membros.' }, 403);
    }

    let email: string;
    let role: string;

    try {
        ({ email, role } = await c.req.json());
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    if (!email || !role) {
        return c.json({ erro: 'E-mail e Role são obrigatórios.' }, 400);
    }

    const emailLimpo = email.toLowerCase().trim();

    // Validação de domínio obrigatória (Regra de Negócio)
    if (!emailLimpo.endsWith('@unieuro.com.br') && !emailLimpo.endsWith('@unieuro.edu.br')) {
        return c.json({ erro: 'Apenas e-mails @unieuro.com.br ou @unieuro.edu.br são permitidos.' }, 400);
    }

    try {
        const existente = await DB.prepare('SELECT id FROM usuarios WHERE email = ?')
            .bind(emailLimpo)
            .first();

        if (existente) {
            return c.json({ erro: 'Este e-mail já está cadastrado no sistema.' }, 409);
        }

        const novoId = crypto.randomUUID();

        const nomePadrao = emailLimpo.split('@')[0];

        const insertResult = await DB.prepare(
            'INSERT INTO usuarios (id, nome, email, role, ativo) VALUES (?, ?, ?, ?, 1)'
        )
            .bind(novoId, nomePadrao, emailLimpo, role)
            .run();

        console.log('[POST /usuarios] INSERT meta:', JSON.stringify(insertResult.meta));

        // Confirma que o registro foi gravado
        const confirmacao = await DB.prepare('SELECT id, email FROM usuarios WHERE id = ?')
            .bind(novoId)
            .first();

        console.log('[POST /usuarios] SELECT confirmação:', JSON.stringify(confirmacao));

        if (!confirmacao) {
            console.error('[POST /usuarios] CRÍTICO: INSERT não persistiu o registro!');
            return c.json({ erro: 'Falha ao persistir membro no banco de dados.' }, 500);
        }

        // Log de auditoria — não bloqueia a resposta em caso de falha
        try {
            await registrarLog(DB, {
                usuarioId: usuarioLogado.id,
                usuarioNome: usuarioLogado.nome,
                usuarioEmail: usuarioLogado.email,
                usuarioRole: usuarioLogado.role,
                acao: 'MEMBRO_PRE_CADASTRADO',
                modulo: 'admin',
                descricao: `Admin pré-cadastrou ${emailLimpo} com a role ${role}`,
                ip: c.req.header('CF-Connecting-IP') ?? '',
                entidadeTipo: 'usuarios',
                entidadeId: novoId,
            });
        } catch (logErro) {
            console.warn('[POST /usuarios] Falha ao registrar log (não crítico):', logErro);
        }

        return c.json({
            sucesso: true,
            usuario: {
                id: novoId,
                nome: nomePadrao,
                email: emailLimpo,
                role,
                ativo: true,
                foto_perfil: null,
                bio: null,
                criado_em: new Date().toISOString(),
                equipe_id: null,
                equipe_nome: null,
                grupo_id: null,
                grupo_nome: null,
                funcoes: [],
            },
        }, 201);
    } catch (erro) {
        console.error('[ERRO DB] POST /api/usuarios', erro);
        return c.json({ erro: 'Falha ao cadastrar membro.' }, 500);
    }
});

// ─── PATCH /:id/funcoes — Alterar Funções (apenas ADMIN) ─────────────────────

rotasUsuarios.patch('/:id/funcoes', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    if (usuarioLogado.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado.' }, 403);
    }

    let funcoes: string[];
    try {
        const body = await c.req.json();
        funcoes = body.funcoes;
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    if (!Array.isArray(funcoes)) {
        return c.json({ erro: 'O campo "funcoes" deve ser um array.' }, 400);
    }

    try {
        const funcoesJson = JSON.stringify(funcoes);
        await DB.prepare('UPDATE usuarios SET funcoes = ? WHERE id = ?').bind(funcoesJson, id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'MEMBRO_FUNCOES_ALTERADAS',
            modulo: 'admin',
            descricao: `Funções do membro ${id} atualizadas: ${funcoes.join(', ')}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id,
            dadosNovos: { funcoes },
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /api/usuarios/:id/funcoes', erro);
        return c.json({ erro: 'Não foi possível alterar as funções.' }, 500);
    }
});

export default rotasUsuarios;