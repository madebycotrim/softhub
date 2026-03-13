import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const rotasUsuarios = new Hono<{ Bindings: Env; Variables: { usuario: any } }>({ strict: false });

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

// ─── GET / — Listar Membros ───────────────────────────────────────────────────
rotasUsuarios.get('/', autenticacaoRequerida(), verificarPermissao('membros:gerenciar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const query = `
            SELECT
                u.id, u.nome, u.email, u.role, u.foto_perfil, u.foto_banner, u.bio, u.criado_em,
                u.github_url, u.linkedin_url, u.website_url,
                (SELECT GROUP_CONCAT(grupo_id) FROM usuarios_organizacao WHERE usuario_id = u.id) as grupos_ids,
                (SELECT GROUP_CONCAT(e.nome) FROM usuarios_organizacao uo JOIN equipes e ON e.id = uo.equipe_id WHERE uo.usuario_id = u.id) as equipe_nome
            FROM usuarios u
            ORDER BY u.nome ASC
        `;

        const res = await DB.prepare(query).all();
        const results = res.results as any[];


        
        return c.json({
            membros: results || [],
            metadata: {
                total: results?.length ?? 0,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (erro: any) {
        console.error('[ERRO CONSTANTE] GET /api/usuarios:', erro.message);
        return c.json({
            erro: 'Falha ao buscar membros no banco de dados',
            detalhe: erro.message,
            contexto: 'rotas/usuarios.ts'
        }, 500);
    }
});



// ─── PATCH /:id/role — Alterar Role ──────────────────────────────────────────

const RoleSchema = z.object({
    role: z.enum(['ADMIN', 'COORDENADOR', 'GESTOR', 'LIDER', 'SUBLIDER', 'MEMBRO']),
});

rotasUsuarios.patch('/:id/role', autenticacaoRequerida(), verificarPermissao('membros:alterar_role'), zValidator('json', RoleSchema), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');
    const { role } = (c.req as any).valid('json');

    try {
        // Buscar estado atual para o log "Antes/Depois"
        const atual = await DB.prepare('SELECT role FROM usuarios WHERE id = ?').bind(id).first() as any;
        if (!atual) return c.json({ erro: 'Usuário não encontrado.' }, 404);

        await DB.prepare('UPDATE usuarios SET role = ? WHERE id = ?').bind(role, id).run();

        await criarNotificacoes(DB, {
            usuarioId: id,
            tipo: 'sistema',
            titulo: 'Cargo Atualizado',
            mensagem: `Seu cargo foi atualizado para ${role} pela administração.`,
            link: '/app/membros'
        });

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'MEMBRO_ROLE_ALTERADA',
            modulo: 'admin',
            descricao: `Role do membro ${id} alterada de ${atual.role} para ${role}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id,
            dadosAnteriores: { role: atual.role },
            dadosNovos: { role },
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /api/usuarios/:id/role', erro);
        return c.json({ erro: 'Não foi possível alterar a role.' }, 500);
    }
});

// ─── DELETE /:id — Remoção Permanente (Hard Delete) ───────────
rotasUsuarios.delete('/:id', autenticacaoRequerida(), verificarPermissao('membros:desativar'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    if (usuarioLogado.id === id) {
        return c.json({ erro: 'Você não pode excluir sua própria conta.' }, 400);
    }

    try {
        const atual = await DB.prepare('SELECT nome, email FROM usuarios WHERE id = ?').bind(id).first() as any;
        if (!atual) return c.json({ erro: 'Usuário não encontrado.' }, 404);

        await DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'MEMBRO_REMOVIDO_HARD',
            modulo: 'admin',
            descricao: `Membro ${atual.nome} (${atual.email}) removido permanentemente do sistema (Hard Delete).`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] DELETE /api/usuarios/:id', erro);
        return c.json({ erro: 'Não foi possível remover o membro.' }, 500);
    }
});





// ─── POST / — Pré-cadastro de Membro ──────────────────────────

const PreCadastroSchema = z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'COORDENADOR', 'GESTOR', 'LIDER', 'SUBLIDER', 'MEMBRO'])
});

rotasUsuarios.post('/', autenticacaoRequerida(), verificarPermissao('membros:gerenciar'), zValidator('json', PreCadastroSchema), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const { email, role } = (c.req as any).valid('json');

    const emailLimpo = email.toLowerCase().trim();

    // ── Governança de Domínios (D1/KV) ────────────────────────
    const { softhub_kv } = c.env;
    let dominiosAutorizados = ['unieuro.com.br', 'unieuro.edu.br'];
    try {
        let v = await softhub_kv?.get('dominios_autorizados');
        if (!v) {
            const row = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind('dominios_autorizados').first() as any;
            if (row) v = row.valor;
        }
        if (v) dominiosAutorizados = JSON.parse(v);
    } catch (e) {
        console.warn('[Membros] Falha ao carregar domínios autorizados, usando fallback.');
    }

    const { BOOTSTRAP_ADMIN_EMAIL } = c.env;
    const listaBootstrap = (BOOTSTRAP_ADMIN_EMAIL || '').toLowerCase().split(',').map((e: any) => e.trim());
    const isBootstrapAdmin = listaBootstrap.includes(emailLimpo);

    const roleFinal = isBootstrapAdmin ? 'ADMIN' : role;

    const possuiDominioValido = dominiosAutorizados.some(d => emailLimpo.endsWith(`@${d.toLowerCase()}`));

    if (!possuiDominioValido) {
        return c.json({ erro: `O domínio do e-mail ${emailLimpo} não é autorizado. Domínios permitidos: ${dominiosAutorizados.join(', ')}` }, 400);
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
            'INSERT INTO usuarios (id, nome, email, role) VALUES (?, ?, ?, ?)'
        )
            .bind(novoId, nomePadrao, emailLimpo, roleFinal)
            .run();


        // Confirma que o registro foi gravado
        const confirmacao = await DB.prepare('SELECT id, email FROM usuarios WHERE id = ?')
            .bind(novoId)
            .first();



        if (!confirmacao) {
            console.error('[POST /usuarios] CRÍTICO: INSERT não persistiu o registro!');
            return c.json({ erro: 'Falha ao persistir membro no banco de dados.' }, 500);
        }

        // Log de auditoria — não bloqueia a resposta em caso de falha
        try {
            await registrarLog(DB, {
                usuarioId: usuarioLogado.id,
                acao: 'MEMBRO_PRE_CADASTRADO',
                modulo: 'admin',
                descricao: `Admin pré-cadastrou ${emailLimpo} com a role ${roleFinal}${isBootstrapAdmin ? ' (Elevado via Bootstrap)' : ''}`,
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
                role: roleFinal,
                foto_perfil: null,
                bio: null,
                criado_em: new Date().toISOString()
            },
        }, 201);
    } catch (erro) {
        console.error('[ERRO DB] POST /api/usuarios', erro);
        return c.json({ erro: 'Falha ao cadastrar membro.' }, 500);
    }
});

// ─── POST /lote — Registro em Lote ────────────────────────────

const LoteCadastroSchema = z.object({
    emails: z.array(z.string().email()),
    role: z.enum(['ADMIN', 'COORDENADOR', 'GESTOR', 'LIDER', 'SUBLIDER', 'MEMBRO'])
});

rotasUsuarios.post('/lote', autenticacaoRequerida(), verificarPermissao('membros:gerenciar'), zValidator('json', LoteCadastroSchema), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const { emails, role } = (c.req as any).valid('json');

    const { softhub_kv } = c.env;
    let dominiosAutorizados = ['unieuro.com.br', 'unieuro.edu.br'];
    try {
        let v = await softhub_kv?.get('dominios_autorizados');
        if (!v) {
            const row = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind('dominios_autorizados').first() as any;
            if (row) v = row.valor;
        }
        if (v) dominiosAutorizados = JSON.parse(v);
    } catch (e) {}

    const resultados = { criados: 0, pulados: 0, erros: [] as string[] };

    for (const email of emails) {
        const emailLimpo = email.toLowerCase().trim();
        const possuiDominioValido = dominiosAutorizados.some(d => emailLimpo.endsWith(`@${d.toLowerCase()}`));

        if (!possuiDominioValido) {
            resultados.erros.push(`${emailLimpo}: Domínio inválido`);
            continue;
        }

        try {
            const existente = await DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(emailLimpo).first();
            if (existente) {
                resultados.pulados++;
                continue;
            }

            const novoId = crypto.randomUUID();
            const nomePadrao = emailLimpo.split('@')[0];

            await DB.prepare('INSERT INTO usuarios (id, nome, email, role) VALUES (?, ?, ?, ?)')
                .bind(novoId, nomePadrao, emailLimpo, role)
                .run();

            resultados.criados++;
        } catch (e: any) {
            resultados.erros.push(`${emailLimpo}: ${e.message}`);
        }
    }

    if (resultados.criados > 0) {
        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'MEMBROS_LOTE_PRE_CADASTRO',
            modulo: 'admin',
            descricao: `Admin pré-cadastrou ${resultados.criados} membros em lote com role ${role}. (Pulados: ${resultados.pulados}, Erros: ${resultados.erros.length})`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios'
        });
    }

    return c.json({ sucesso: true, ...resultados });
});


export default rotasUsuarios;