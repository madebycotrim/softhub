import { useState, useEffect, useCallback } from 'react';
import { api } from '../../compartilhado/servicos/api';
// import { usarAutenticacao } from '../autenticacao/usarAutenticacao';
import type { Tarefa } from '../kanban/usarKanban';

export interface Sprint {
    id: string;
    nome: string;
    objetivo: string | null;
    status: 'planejada' | 'ativa' | 'encerrada';
    data_inicio: string | null;
    data_fim: string | null;
    velocity_planejado: number | null;
    velocity_realizado: number | null;
    retrospectiva?: {
        o_que_foi_bem: string | null;
        o_que_melhorar: string | null;
        acoes_proxima_sprint: string | null;
    } | null;
}

/**
 * Hook para gerenciar as Sprints de um Projeto e o Backlog (tarefas sem sprint)
 */
export function usarBacklog(projetoId?: string) {
    const [backlog, setBacklog] = useState<Tarefa[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function buscar() {
            if (!projetoId) {
                setCarregando(false);
                return;
            }

            try {
                setCarregando(true);
                const [resSprints, resBacklog, resRetros] = await Promise.all([
                    api.get(`/api/sprints`, { params: { projetoId } }),
                    api.get(`/api/tarefas`, { params: { projetoId, sprintId: 'null' } }),
                    api.get(`/api/sprints/retrospectivas`, { params: { projetoId } }).catch(() => ({ data: [] }))
                ]);

                const mergedSprints = resSprints.data.map((spr: any) => {
                    const r = resRetros.data.find((retro: any) => retro.sprint_id === spr.id);
                    return { ...spr, retrospectiva: r || null };
                });

                if (mounted) {
                    setSprints(mergedSprints);
                    setBacklog(resBacklog.data);
                    setErro(null);
                }
            } catch (e: any) {
                if (mounted) setErro(e.response?.data?.erro || 'Não foi possível carregar o backlog.');
            } finally {
                if (mounted) setCarregando(false);
            }
        }

        buscar();

        return () => {
            mounted = false;
        };
    }, [projetoId]);

    /** 
     * Encerra a sprint ativa
     */
    const encerrarSprintLocal = useCallback(async (sprintId: string) => {
        try {
            await api.post(`/api/sprints/${sprintId}/encerrar`);
            // Recarrega atualizar a tela (simplicidade, evitando state des-synced)
            const [resSprints, resBacklog] = await Promise.all([
                api.get(`/api/sprints`, { params: { projetoId } }),
                api.get(`/api/tarefas`, { params: { projetoId, sprintId: 'null' } })
            ]);
            setSprints(resSprints.data);
            setBacklog(resBacklog.data);
        } catch (e) {
            console.error('Falha ao encerrar sprint', e);
        }
    }, [projetoId]);

    /**
     * Cria uma nova tarefa solta no backlog
     */
    const criarTarefa = useCallback(async (dados: { titulo: string; descricao?: string; prioridade: string; pontos?: number }) => {
        try {
            await api.post('/api/tarefas', { ...dados, projetoId });
            // Recarrega o backlog
            const resBacklog = await api.get(`/api/tarefas`, { params: { projetoId, sprintId: 'null' } });
            setBacklog(resBacklog.data);
            return true;
        } catch (e) {
            console.error('Falha ao criar tarefa', e);
            throw e;
        }
    }, [projetoId]);

    const criarSprint = useCallback(async (dados: { nome: string; objetivo?: string; data_inicio: string; data_fim: string; velocity_planejado?: number }) => {
        try {
            await api.post('/api/sprints', { ...dados, projeto_id: projetoId });
            const resSprints = await api.get(`/api/sprints`, { params: { projetoId } });
            setSprints(resSprints.data);
            return true;
        } catch (e) {
            console.error('Falha ao criar sprint', e);
            throw e;
        }
    }, [projetoId]);

    const salvarRetrospectiva = useCallback(async (sprintId: string, dados: any) => {
        try {
            await api.patch(`/api/sprints/${sprintId}/retrospectiva`, dados);
            // Quick reload
            const resSprints = await api.get(`/api/sprints`, { params: { projetoId } });
            setSprints(resSprints.data);
        } catch (e) {
            console.error('Falha na retrospectiva', e);
            throw e;
        }
    }, [projetoId]);

    return { backlog, sprints, carregando, erro, encerrarSprintLocal, criarTarefa, criarSprint, salvarRetrospectiva };
}
