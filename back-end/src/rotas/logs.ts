import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
const rotasLogs = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar logs paginados
rotasLogs.get('/', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    const pagina = Number(c.req.query('pagina') ?? 1);
    const itensPorPagina = Math.min(Number(c.req.query('itensPorPagina') ?? 20), 100);
    const offset = (pagina - 1) * itensPorPagina;

    const filtroModulo = c.req.query('modulo');
    const filtroAcao = c.req.query('acao');
    const busca = c.req.query('busca');
    const dataInicio = c.req.query('dataInicio');
    const dataFim = c.req.query('dataFim');
    const apenasMeus = c.req.query('meus') === 'true';

    // ── Validação de Permissão Manual ─────────────────────────────────────────
    let temPermissaoGeral = usuarioLogado.role === 'ADMIN';
    let temPermissaoProprios = usuarioLogado.role === 'ADMIN';
    
    if (!temPermissaoGeral) {
        try {
            const resConfig = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?')
                .bind('permissoes_roles')
                .first();
            if (resConfig) {
                const permissoesRoles = JSON.parse((resConfig as any).valor);
                const role = usuarioLogado.role;
                
                const univGeral = permissoesRoles['TODOS']?.['logs:visualizar'] === true;
                const roleGeral = permissoesRoles[role]?.['logs:visualizar'] === true;
                temPermissaoGeral = univGeral || roleGeral;

                const univProprio = permissoesRoles['TODOS']?.['logs:visualizar_proprios'] === true;
                const roleProprio = permissoesRoles[role]?.['logs:visualizar_proprios'] === true;
                temPermissaoProprios = univProprio || roleProprio;
            }
        } catch (e) {
            console.error('[LOGS] Erro ao validar permissão:', e);
        }
    }

    // Se não tem permissão geral E não tem permissão de ver os próprios -> Bloqueia
    if (!temPermissaoGeral && !temPermissaoProprios) {
        return c.json({ erro: 'Você não tem permissão para visualizar logs.' }, 403);
    }

    let whereClause = 'WHERE 1=1';
    const bParams: any[] = [];

    // Se NÃO tem permissão geral OU se pediu explicitamente apenas os seus
    if (!temPermissaoGeral || apenasMeus) {
        whereClause += ' AND l.usuario_id = ?';
        bParams.push(usuarioLogado.id);
    }

    if (filtroModulo) {
        whereClause += ' AND l.modulo = ?';
        bParams.push(filtroModulo);
    }
    if (filtroAcao) {
        whereClause += ' AND l.acao LIKE ?';
        bParams.push(`%${filtroAcao}%`);
    }
    if (busca) {
        whereClause += ' AND (l.descricao LIKE ? OR u.nome LIKE ? OR u.email LIKE ?)';
        const searchPattern = `%${busca}%`;
        bParams.push(searchPattern, searchPattern, searchPattern);
    }
    if (dataInicio) {
        whereClause += ' AND l.criado_em >= ?';
        bParams.push(dataInicio);
    }
    if (dataFim) {
        whereClause += ' AND l.criado_em <= ?';
        bParams.push(dataFim);
    }

    try {
        const queryCount = `SELECT COUNT(*) as total FROM logs l LEFT JOIN usuarios u ON l.usuario_id = u.id ${whereClause}`;
        const stmtCount = DB.prepare(queryCount);
        const resCount = await (bParams.length > 0 ? stmtCount.bind(...bParams) : stmtCount).all();
        const resultsCount = resCount.results as any;
        const total = resultsCount && resultsCount[0] ? resultsCount[0].total : 0;

        const querySelect = `
            SELECT l.id, l.usuario_id, u.nome, u.email, u.role, 
                   l.acao, l.modulo, l.descricao, l.ip, l.entidade_tipo, l.entidade_id, 
                   l.dados_anteriores, l.dados_novos, l.criado_em
            FROM logs l
            LEFT JOIN usuarios u ON l.usuario_id = u.id
            ${whereClause}
            ORDER BY l.criado_em DESC 
            LIMIT ? OFFSET ?
        `;
        const stmtSelect = DB.prepare(querySelect);
        const bindValues = [...bParams, itensPorPagina, offset];
        const resSet = await stmtSelect.bind(...bindValues).all();

        return c.json({
            dados: resSet.results,
            paginacao: {
                total,
                pagina,
                itensPorPagina,
                totalPaginas: Math.ceil(total / itensPorPagina)
            }
        });

    } catch (erro: any) {
        console.error('[ERRO DB] GET /logs', erro.message);
        return c.json({ erro: 'Falha ao buscar logs', detalhe: erro.message }, 500);
    }
});

rotasLogs.get('/estatisticas', autenticacaoRequerida(), verificarPermissao('logs:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    
    try {
        const resModulos = await DB.prepare(`
            SELECT modulo, COUNT(*) as quantidade 
            FROM logs 
            GROUP BY modulo 
            ORDER BY quantidade DESC
        `).all();

        return c.json({
            modulos: resModulos.results || [],
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /logs/estatisticas', erro);
        return c.json({ erro: 'Falha ao gerar estatísticas' }, 500);
    }
});

export default rotasLogs;
