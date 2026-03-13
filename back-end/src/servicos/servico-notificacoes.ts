import { D1Database } from '@cloudflare/workers-types';

/**
 * Cria uma notificação para o usuário. 
 * As notificações são sempre geradas pelo backend.
 */
export interface ParamsNotificacao {
    usuarioId?: string;
    usuariosIds?: string[]; // Para múltiplos destinatários específicos
    equipeId?: string;
    grupoId?: string;
    todosDoProjetoId?: string;
    todosOsUsuarios?: boolean; // Para avisos globais
    titulo: string;
    mensagem: string;
    tipo: 'tarefa' | 'ponto' | 'aviso' | 'sistema';
    link?: string;
    entidadeId?: string;
}

export async function criarNotificacoes(db: any, params: ParamsNotificacao): Promise<void> {
    const idsToNotify = new Set<string>();

    if (params.usuarioId) {
        idsToNotify.add(params.usuarioId);
    }

    if (params.usuariosIds && Array.from(params.usuariosIds).length > 0) {
        params.usuariosIds.forEach(id => idsToNotify.add(id));
    }

    if (params.todosOsUsuarios) {
        const { results } = await db.prepare('SELECT id FROM usuarios').all();
        results?.forEach((u: any) => idsToNotify.add(u.id));
    }

    if (params.todosDoProjetoId) {
        const { results } = await db.prepare(`
            SELECT DISTINCT uo.usuario_id 
            FROM projetos_equipes pe
            JOIN usuarios_organizacao uo ON uo.equipe_id = pe.equipe_id
            WHERE pe.projeto_id = ?
        `).bind(params.todosDoProjetoId).all();
        results?.forEach((u: any) => idsToNotify.add(u.usuario_id));
    }

    // Processa batches de inserção
    if (idsToNotify.size > 0) {
        const statements = Array.from(idsToNotify).map(id =>
            db.prepare(`
                INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, link_acao, entidade_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(
                crypto.randomUUID(), 
                id, 
                params.tipo, 
                params.titulo, 
                params.mensagem, 
                params.link || null,
                params.entidadeId || null
            )
        );

        // D1 executa mutations em batch para evitar limitação de requisições separadas
        if (statements.length > 0) {
            await db.batch(statements);
        }
    }
}

/**
 * Remove todas as notificações vinculadas a uma entidade específica.
 * Útil para quando um aviso ou tarefa é excluído.
 */
export async function removerNotificacoesPorEntidade(db: any, entidadeId: string): Promise<void> {
    if (!entidadeId) return;
    await db.prepare('DELETE FROM notificacoes WHERE entidade_id = ?').bind(entidadeId).run();
}
