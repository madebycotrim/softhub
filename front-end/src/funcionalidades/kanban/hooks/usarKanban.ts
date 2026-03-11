import { useState, useEffect, useCallback } from 'react';
import { api } from '@/compartilhado/servicos/api';
// import { usarAutenticacao } from '@/funcionalidades/funcionalidades/autenticacao/usarAutenticacao';

export interface Tarefa {
    id: string;
    titulo: string;
    descricao: string | null;
    status: 'a_fazer' | 'em_andamento' | 'em_revisao' | 'concluido';
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
 * Hook com responsabilidade única de gerenciar as tarefas do Kanban de um Projeto.
 * Encapsula lógica de busca, filtros, movimentação e blindagem de estado (rollback).
 */
export function usarKanban(projetoId?: string, filtros?: FiltrosKanban) {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const filtroBusca = filtros?.busca;
    const filtroPrioridades = filtros?.prioridades?.join(',') || undefined;
    const filtroResponsavelId = filtros?.responsavelId;

    /** 
     * Carrega as tarefas do Kanban de forma centralizada.
     * @param silencioso Se true, não altera o estado de carregando/erro inicial.
     */
    const carregar = useCallback(async (silencioso = false) => {
        if (!projetoId) {
            setCarregando(false);
            return;
        }

        if (!silencioso) {
            setCarregando(true);
            setErro(null);
        }

        try {
            const params: Record<string, any> = { projetoId };
            if (filtroBusca) params.busca = filtroBusca;
            if (filtroPrioridades) params.prioridade = filtroPrioridades;
            if (filtroResponsavelId) params.responsavelId = filtroResponsavelId;

            const res = await api.get('/api/tarefas', { params });
            setTarefas(res.data || []);
            setErro(null);
        } catch (e: any) {
            console.error('[usarKanban] Erro ao carregar tarefas:', e);
            if (!silencioso) setErro(e.response?.data?.erro || 'Não foi possível carregar as tarefas do Kanban.');
        } finally {
            if (!silencioso) setCarregando(false);
        }
    }, [projetoId, filtroBusca, filtroPrioridades, filtroResponsavelId]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    /**
     * Move uma tarefa localmente (optimistic update) e depois chama a API.
     * Em caso de falha, faz rollback do estado para a última versão válida.
     * 
     * @param tarefaId UUID da tarefa.
     * @param colunaDestino Status de destino no Kanban.
     */
    const moverCard = async (tarefaId: string, colunaDestino: Tarefa['status']) => {
        const backupTarefas = [...tarefas];
        setErro(null);

        // 1. Optimistic Update (Feedback Instantâneo)
        setTarefas((prev) =>
            prev.map(t => t.id === tarefaId ? { ...t, status: colunaDestino } : t)
        );

        try {
            // 2. Chamar API
            await api.patch(`/api/tarefas/${tarefaId}/mover`, { status: colunaDestino });
            // 3. Revalidação em background para garantir consistência (metadados, histórico, etc)
            await carregar(true);
        } catch (e: any) {
            // 4. Rollback se falhar
            console.error('[usarKanban] Falha ao mover card, revertendo:', e);
            setTarefas(backupTarefas);
            setErro(e.response?.data?.erro || 'Não foi possível mover a tarefa.');
            throw e;
        }
    };

    /**
     * Atualiza uma tarefa específica no estado local.
     * Útil para edições rápidas sem recarga total.
     */
    const atualizarTarefaLocal = useCallback((tarefa: Tarefa) => {
        setTarefas(prev => prev.map(t => t.id === tarefa.id ? tarefa : t));
    }, []);

    return { 
        tarefas, 
        carregando, 
        erro, 
        moverCard, 
        recarregar: carregar,
        atualizarTarefaLocal 
    };
}
