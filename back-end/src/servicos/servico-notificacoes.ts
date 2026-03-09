import { D1Database } from '@cloudflare/workers-types';

/**
 * Cria uma notificação para o usuário. 
 * As notificações são sempre geradas pelo backend.
 */
export interface ParamsNotificacao {
    usuarioId?: string;
    equipeId?: string;
    grupoId?: string;
    todosDoProjetoId?: string;
    todosOsUsuarios?: boolean; // Para avisos globais
    titulo: string;
    mensagem: string;
    tipo: 'tarefa' | 'ponto' | 'aviso' | 'sistema';
    link?: string;
}

export async function criarNotificacoes(db: any, params: ParamsNotificacao): Promise<void> {
    const idsToNotify = new Set<string>();

    if (params.usuarioId) {
        idsToNotify.add(params.usuarioId);
    }

    if (params.todosOsUsuarios) {
        const { results } = await db.prepare('SELECT id FROM usuarios WHERE ativo = 1').all();
        results?.forEach((u: any) => idsToNotify.add(u.id));
    }

    if (params.todosDoProjetoId) {
        const { results } = await db.prepare('SELECT usuario_id FROM projetos_membros WHERE projeto_id = ?').bind(params.todosDoProjetoId).all();
        results?.forEach((u: any) => idsToNotify.add(u.usuario_id));
    }

    // Processa batches de inserção
    if (idsToNotify.size > 0) {
        const statements = Array.from(idsToNotify).map(id =>
            db.prepare(`
                INSERT INTO notificacoes (id, usuario_id, tipo, titulo, mensagem, link_acao)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(crypto.randomUUID(), id, params.tipo, params.titulo, params.mensagem, params.link || null)
        );

        // D1 executa mutations em batch para evitar limitação de requisições separadas
        if (statements.length > 0) {
            await db.batch(statements);
        }
    }
}
