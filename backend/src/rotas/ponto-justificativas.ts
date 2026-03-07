import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasPontoJustificativas = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// ==========================================
// WORKFLOW 24: Justificativas de Ponto
// ==========================================

// 1. Membro enviando justificativa
rotasPontoJustificativas.post('/justificativas', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const { data, tipo, motivo } = await c.req.json();
    const usuario = c.get('usuario') as any;

    if (!data || !tipo || !motivo) {
        return c.json({ erro: 'Data, tipo e motivo são obrigatórios.' }, 400);
    }

    try {
        // Regra de Duplicata
        const ext = await DB.prepare(`SELECT id FROM justificativas_ponto WHERE usuario_id = ? AND data = ?`)
            .bind(usuario.id, data).first();

        if (ext) {
            return c.json({ erro: 'Já existe uma justificativa pendente para esta data.' }, 400);
        }

        const justId = crypto.randomUUID();
        await DB.prepare(`
            INSERT INTO justificativas_ponto (id, usuario_id, data, tipo, motivo)
            VALUES (?, ?, ?, ?, ?)
        `).bind(justId, usuario.id, data, tipo, motivo).run();

        // Notificar Lideres (Pegamos ADMINs e Lideres de Equipe/Grupo)
        const lideres = await DB.prepare(`
            SELECT id FROM usuarios WHERE role IN ('LIDER_EQUIPE', 'LIDER_GRUPO', 'ADMIN') AND ativo = 1
        `).all<{ id: string }>();

        if (lideres.results.length > 0) {
            for (const l of lideres.results) {
                await criarNotificacoes(DB, {
                    usuarioId: l.id,
                    tipo: 'sistema',
                    titulo: 'Nova justificativa de ponto',
                    mensagem: `${usuario.nome} enviou uma justificativa para ${data}.`,
                    link: '/app/admin/justificativas'
                });
            }
        }

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_ENVIADA',
            modulo: 'ponto',
            descricao: `Justificativa enviada para o dia ${data}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: justId
        });

        return c.json({ id: justId }, 201);
    } catch (e) {
        console.error('ERRO POST /justificativas', e);
        return c.json({ erro: 'Falha ao enviar justificativa' }, 500);
    }
});

// 2. Membro buscando suas próprias justificativas
rotasPontoJustificativas.get('/justificativas', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    const pagina = Number(c.req.query('pagina') ?? 1);
    const limite = 20;
    const offset = (pagina - 1) * limite;

    try {
        const resContagem = await DB.prepare(`SELECT COUNT(*) as total FROM justificativas_ponto WHERE usuario_id = ?`)
            .bind(usuario.id).first<{ total: number }>();
        const total = resContagem?.total || 0;

        const { results } = await DB.prepare(`
            SELECT * FROM justificativas_ponto 
            WHERE usuario_id = ?
            ORDER BY criado_em DESC LIMIT ? OFFSET ?
        `).bind(usuario.id, limite, offset).all();

        return c.json({
            dados: results,
            paginacao: { total, pagina, totalPaginas: Math.ceil(total / limite) }
        });
    } catch (e) {
        return c.json({ erro: 'Falha ao buscar justificativas' }, 500);
    }
});

// 3. Admin listando todas as justificativas pendentes ou filtradas
rotasPontoJustificativas.get('/admin/justificativas', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    if (usuario.role === 'MEMBRO' || usuario.role === 'VISITANTE') {
        return c.json({ erro: 'Acesso negado' }, 403);
    }

    const { results } = await DB.prepare(`
        SELECT j.*, u.nome as usuario_nome, u.email as usuario_email, u.foto_perfil as usuario_foto 
        FROM justificativas_ponto j
        JOIN usuarios u ON j.usuario_id = u.id
        ORDER BY j.status DESC, j.criado_em DESC
        LIMIT 100
    `).all();

    return c.json(results);
});

// 4. Admin Aprovando Justificativa
rotasPontoJustificativas.patch('/admin/justificativas/:id/aprovar', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const justificativaId = c.req.param('id');
    const usuario = c.get('usuario') as any;

    if (usuario.role === 'MEMBRO' || usuario.role === 'VISITANTE') return c.json({ erro: 'Acesso negado' }, 403);

    const alvar = await DB.prepare(`SELECT * FROM justificativas_ponto WHERE id = ?`).bind(justificativaId).first<any>();
    if (!alvar) return c.json({ erro: 'Justificativa não encontrada.' }, 404);
    if (alvar.status !== 'pendente') return c.json({ erro: 'Justificativa já foi processada.' }, 400);

    try {
        await DB.prepare(`
            UPDATE justificativas_ponto 
            SET status = 'aprovada', avaliado_por = ?, avaliado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') 
            WHERE id = ?
        `).bind(usuario.id, justificativaId).run();

        await criarNotificacoes(DB, {
            usuarioId: alvar.usuario_id,
            tipo: 'sistema',
            titulo: 'Justificativa aprovada',
            mensagem: `Sua justificativa para ${alvar.data} foi aprovada.`,
            link: '/app/ponto'
        });

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_APROVADA',
            modulo: 'ponto',
            descricao: `Aprovada justificativa ID: ${justificativaId} do usuário ${alvar.usuario_id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: justificativaId
        });

        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha interna' }, 500);
    }
});

// 5. Admin Rejeitando Justificativa
rotasPontoJustificativas.patch('/admin/justificativas/:id/rejeitar', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const justificativaId = c.req.param('id');
    const { motivoRejeicao } = await c.req.json();
    const usuario = c.get('usuario') as any;

    if (usuario.role === 'MEMBRO' || usuario.role === 'VISITANTE') return c.json({ erro: 'Acesso negado' }, 403);

    const alvar = await DB.prepare(`SELECT * FROM justificativas_ponto WHERE id = ?`).bind(justificativaId).first<any>();
    if (!alvar) return c.json({ erro: 'Justificativa não encontrada.' }, 404);
    if (alvar.status !== 'pendente') return c.json({ erro: 'Justificativa já foi processada.' }, 400);

    try {
        await DB.prepare(`
            UPDATE justificativas_ponto 
            SET status = 'rejeitada', motivo_rejeicao = ?, avaliado_por = ?, avaliado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') 
            WHERE id = ?
        `).bind(motivoRejeicao, usuario.id, justificativaId).run();

        await criarNotificacoes(DB, {
            usuarioId: alvar.usuario_id,
            tipo: 'sistema',
            titulo: 'Justificativa rejeitada',
            mensagem: `Sua justificativa para ${alvar.data} foi rejeitada. Motivo: ${motivoRejeicao}`,
            link: '/app/ponto'
        });

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_REJEITADA',
            modulo: 'ponto',
            descricao: `Rejeitada justificativa ID: ${justificativaId} do usuário ${alvar.usuario_id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: justificativaId
        });

        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha interna' }, 500);
    }
});

// 6. Exportação de Relatório CSV (Workflow 30)
rotasPontoJustificativas.get('/exportar', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    if (!['ADMIN', 'LIDER_GRUPO', 'LIDER_EQUIPE'].includes(usuario.role)) {
        return c.json({ erro: 'Acesso negado. Apenas líderes podem exportar relatórios.' }, 403);
    }

    const { dataInicio, dataFim, usuarioId, equipeId } = c.req.query();

    if (!dataInicio || !dataFim) {
        return c.json({ erro: 'Data de início e fim são obrigatórias.' }, 400);
    }

    // Validação de período (máx 31 dias)
    const dIni = new Date(dataInicio);
    const dFim = new Date(dataFim);
    const diffDias = Math.ceil(Math.abs(dFim.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias > 31) {
        return c.json({ erro: 'O período máximo para exportação é de 31 dias.' }, 400);
    }

    try {
        // Query base para registros
        let queryRegistros = `
            SELECT u.nome, u.email, p.registrado_em, p.tipo, p.usuario_id
            FROM ponto_registros p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE date(p.registrado_em) BETWEEN date(?) AND date(?)
        `;
        const params: any[] = [dataInicio, dataFim];

        if (usuarioId) {
            queryRegistros += ` AND p.usuario_id = ?`;
            params.push(usuarioId);
        } else if (equipeId) {
            queryRegistros += ` AND u.equipe_id = ?`;
            params.push(equipeId);
        }

        queryRegistros += ` ORDER BY u.nome ASC, p.registrado_em ASC`;

        const { results: registros } = await DB.prepare(queryRegistros).bind(...params).all();

        // Busca justificativas aprovadas
        let queryJust = `
            SELECT u.nome, u.email, j.data, j.motivo
            FROM justificativas_ponto j
            JOIN usuarios u ON j.usuario_id = u.id
            WHERE j.status = 'aprovada' AND date(j.data) BETWEEN date(?) AND date(?)
        `;
        const paramsJust: any[] = [dataInicio, dataFim];

        if (usuarioId) {
            queryJust += ` AND j.usuario_id = ?`;
            paramsJust.push(usuarioId);
        } else if (equipeId) {
            queryJust += ` AND u.equipe_id = ?`;
            paramsJust.push(equipeId);
        }

        const { results: justificativas } = await DB.prepare(queryJust).bind(...paramsJust).all();

        // Processamento dos dados para CSV
        const linhas: string[] = ['Nome,Email,Data,Entrada,Saída,Horas Trabalhadas,Observação'];

        // Agrupar por usuário e data
        const mapa: Record<string, any> = {};

        registros.forEach((r: any) => {
            const dia = r.registrado_em.split('T')[0];
            const chave = `${r.usuario_id}_${dia}`;
            if (!mapa[chave]) {
                mapa[chave] = { nome: r.nome, email: r.email, data: dia, entrada: null, saida: null, obs: '' };
            }
            if (r.tipo === 'entrada' && !mapa[chave].entrada) mapa[chave].entrada = r.registrado_em;
            if (r.tipo === 'saída' || r.tipo === 'saida') mapa[chave].saida = r.registrado_em;
        });

        justificativas.forEach((j: any) => {
            const chave = `${j.usuario_id || ''}_${j.data}`; // Ajuste caso falte o ID na query de j
            // Como a query de j não tem usuario_id, vamos usar email para o mapa se necessário
            // Mas melhor ajustar a query de justificativas para ter o usuario_id
        });

        // Re-buscando justificativas com ID
        const { results: justComId } = await DB.prepare(`
            SELECT usuario_id, data, motivo FROM justificativas_ponto 
            WHERE status = 'aprovada' AND date(data) BETWEEN date(?) AND date(?)
        `).bind(dataInicio, dataFim).all();

        justComId.forEach((j: any) => {
            const chave = `${j.usuario_id}_${j.data}`;
            if (mapa[chave]) {
                mapa[chave].obs = `Justificativa: ${j.motivo}`;
            }
        });

        // Montar linhas do CSV
        Object.values(mapa).forEach((v: any) => {
            let horas = '0h 0min';
            if (v.entrada && v.saida) {
                const diff = new Date(v.saida).getTime() - new Date(v.entrada).getTime();
                const totalMin = Math.floor(diff / (1000 * 60));
                const h = Math.floor(totalMin / 60);
                const m = totalMin % 60;
                horas = `${h}h ${m}min`;
            }

            const entradaFmt = v.entrada ? new Date(v.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';
            const saidaFmt = v.saida ? new Date(v.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '';
            const dataFmt = v.data.split('-').reverse().join('/');

            linhas.push(`"${v.nome}","${v.email}","${dataFmt}","${entradaFmt}","${saidaFmt}","${horas}","${v.obs}"`);
        });

        const csvContent = linhas.join('\n');

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="ponto_${dataInicio}_${dataFim}.csv"`
            }
        });

    } catch (e) {
        console.error('ERRO EXPORTAR CSV', e);
        return c.json({ erro: 'Falha ao gerar relatório CSV' }, 500);
    }
});

export default rotasPontoJustificativas;
