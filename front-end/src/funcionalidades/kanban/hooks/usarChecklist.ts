import { useState, useEffect, useCallback } from 'react';
import { api } from '@/compartilhado/servicos/api';

export interface ItemChecklist {
    id: string;
    tarefa_id: string;
    texto: string;
    concluido: number;
    ordem: number;
}

/**
 * Hook para gerenciar o checklist de uma tarefa.
 * Implementa rollback otimista e sincronização em background.
 */
export function usarChecklist(tarefaId: string) {
    const [itens, setItens] = useState<ItemChecklist[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    /**
     * Busca os itens do checklist da API.
     * @param silencioso Se true, não ativa o estado de loading visual.
     */
    const buscarItens = useCallback(async (silencioso = false) => {
        if (!tarefaId) return;
        if (!silencioso) {
            setCarregando(true);
            setErro(null);
        }

        try {
            const res = await api.get(`/tarefas/${tarefaId}/checklist`);
            setItens(res.data || []);
        } catch (e: any) {
            console.error('[usarChecklist] Erro ao buscar itens:', e);
            if (!silencioso) {
                setErro(e.response?.data?.erro || 'Falha ao buscar checklist.');
            }
        } finally {
            if (!silencioso) setCarregando(false);
        }
    }, [tarefaId]);

    useEffect(() => {
        buscarItens();
    }, [buscarItens]);

    /**
     * Adiciona um novo item ao checklist.
     */
    const adicionarItem = async (texto: string) => {
        try {
            await api.post(`/tarefas/${tarefaId}/checklist`, { texto });
            await buscarItens(true);
        } catch (e: any) {
            console.error('[usarChecklist] Erro ao adicionar item:', e);
            throw e;
        }
    };

    /**
     * Alterna o estado de conclusão de um item com rollback otimista.
     */
    const alternarItem = async (itemId: string, concluido: boolean) => {
        const backupItens = [...itens];
        
        // Optimistic Update
        setItens(prev => prev.map(it => 
            it.id === itemId ? { ...it, concluido: concluido ? 1 : 0 } : it
        ));

        try {
            await api.patch(`/tarefas/${tarefaId}/checklist/${itemId}`, { concluido });
            // Revalidação silenciosa para garantir ordem e dados reais
            await buscarItens(true);
        } catch (e: any) {
            console.error('[usarChecklist] Erro ao alternar item, revertendo:', e);
            setItens(backupItens);
        }
    };

    /**
     * Remove um item do checklist com rollback otimista.
     */
    const removerItem = async (itemId: string) => {
        const backupItens = [...itens];
        setItens(prev => prev.filter(it => it.id !== itemId));

        try {
            await api.delete(`/tarefas/${tarefaId}/checklist/${itemId}`);
            await buscarItens(true);
        } catch (e: any) {
            console.error('[usarChecklist] Erro ao remover item, revertendo:', e);
            setItens(backupItens);
        }
    };

    const totalConcluidos = itens.filter(it => it.concluido === 1).length;
    const totalItens = itens.length;

    return {
        itens,
        carregando,
        erro,
        adicionarItem,
        alternarItem,
        removerItem,
        totalConcluidos,
        totalItens,
        progresso: totalItens > 0 ? (totalConcluidos / totalItens) * 100 : 0
    };
}
