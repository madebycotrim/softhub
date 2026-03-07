import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface ItemChecklist {
    id: string;
    tarefa_id: string;
    texto: string;
    concluido: number;
    ordem: number;
}

export function usarChecklist(tarefaId: string) {
    const [itens, setItens] = useState<ItemChecklist[]>([]);
    const [carregando, setCarregando] = useState(false);

    const buscarItens = async () => {
        if (!tarefaId) return;
        setCarregando(true);
        try {
            const res = await api.get(`/tarefas/${tarefaId}/checklist`);
            setItens(res.data);
        } catch (e) {
            console.error('Falha ao buscar checklist:', e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarItens();
    }, [tarefaId]);

    const adicionarItem = async (texto: string) => {
        try {
            await api.post(`/tarefas/${tarefaId}/checklist`, { texto });
            await buscarItens();
        } catch (e) {
            console.error('Falha ao adicionar item:', e);
            throw e;
        }
    };

    const alternarItem = async (itemId: string, concluido: boolean) => {
        try {
            // Otimismo imediato na UI
            setItens(prev => prev.map(it => it.id === itemId ? { ...it, concluido: concluido ? 1 : 0 } : it));
            await api.patch(`/tarefas/${tarefaId}/checklist/${itemId}`, { concluido });
        } catch (e) {
            console.error('Falha ao alternar item:', e);
            await buscarItens(); // Fallback se falhar
        }
    };

    const removerItem = async (itemId: string) => {
        try {
            await api.delete(`/tarefas/${tarefaId}/checklist/${itemId}`);
            await buscarItens();
        } catch (e) {
            console.error('Falha ao remover item:', e);
        }
    };

    const totalConcluidos = itens.filter(it => it.concluido === 1).length;
    const totalItens = itens.length;

    return {
        itens,
        carregando,
        adicionarItem,
        alternarItem,
        removerItem,
        totalConcluidos,
        totalItens,
        progresso: totalItens > 0 ? (totalConcluidos / totalItens) * 100 : 0
    };
}
