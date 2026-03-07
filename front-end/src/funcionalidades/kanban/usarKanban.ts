import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';
// import { usarAutenticacao } from '../../funcionalidades/autenticacao/usarAutenticacao';

export interface Tarefa {
    id: string;
    titulo: string;
    descricao: string | null;
    status: 'backlog' | 'a_fazer' | 'em_andamento' | 'em_revisao' | 'concluido' | 'testando';
    prioridade: 'urgente' | 'alta' | 'media' | 'baixa';
    pontos: number | null;
    responsaveis: Array<{
        id: string;
        nome: string;
        foto?: string;
        nivel?: string;
    }>;
}

export interface FiltrosKanban {
    busca?: string;
    prioridades?: string[];
    responsavelId?: string;
}

/**
 * Hook com responsabilidade única de gerenciar as tarefas do Kanban de uma Sprint/Projeto.
 */
export function usarKanban(sprintId?: string, projetoId?: string, filtros?: FiltrosKanban) {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const filtroBusca = filtros?.busca;
    const filtroPrioridades = filtros?.prioridades?.join(',') || undefined;
    const filtroResponsavelId = filtros?.responsavelId;

    useEffect(() => {
        let mounted = true;

        async function buscar() {
            if (!sprintId && !projetoId) {
                setCarregando(false);
                return;
            }

            try {
                setCarregando(true);

                // Construindo Query Params via axios params
                const params: Record<string, any> = { sprintId, projetoId };
                if (filtroBusca) params.busca = filtroBusca;
                if (filtroPrioridades) params.prioridade = filtroPrioridades;
                if (filtroResponsavelId) params.responsavelId = filtroResponsavelId;

                const res = await api.get('/api/tarefas', { params });

                if (mounted) {
                    setTarefas(res.data);
                    setErro(null);
                }
            } catch (e: any) {
                if (mounted) setErro(e.response?.data?.erro || 'Não foi possível carregar as tarefas do Kanban.');
            } finally {
                if (mounted) setCarregando(false);
            }
        }

        buscar();

        return () => {
            mounted = false;
        };
    }, [sprintId, projetoId, filtroBusca, filtroPrioridades, filtroResponsavelId]);

    /**
     * Move uma tarefa localmente (optimistic update) e depois chama a API.
     * Em caso de falha, faz rollback do estado.
     */
    const moverCard = async (tarefaId: string, colunaDestino: Tarefa['status']) => {
        const backupTarefas = [...tarefas];

        // 1. Optimistic Update
        setTarefas((prev) =>
            prev.map(t => t.id === tarefaId ? { ...t, status: colunaDestino } : t)
        );

        try {
            // 2. Chamar API
            await api.patch(`/api/tarefas/${tarefaId}/mover`, { status: colunaDestino });
        } catch (e) {
            // 3. Rollback se falhar
            console.error('Falha ao mover card, revertendo:', e);
            setTarefas(backupTarefas);
            // Opcional: toastar erro global aqui (fora do escopo deste script, usarNotificacoes)
        }
    };

    return { tarefas, carregando, erro, moverCard };
}
