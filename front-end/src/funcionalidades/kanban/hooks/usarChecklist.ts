import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';

export interface ItemChecklist {
    id: string;
    tarefa_id: string;
    texto: string;
    concluido: number;
    ordem: number;
}

/**
 * Hook para gerenciar o checklist de uma tarefa com React Query.
 * Implementa revalidação inteligente e sincronização em background.
 */
export function usarChecklist(tarefaId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['checklist', tarefaId];

    const { 
        data: itens = [], 
        isLoading: carregando, 
        error 
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await api.get(`/api/tarefas/${tarefaId}/checklist`);
            return res.data || [];
        },
        enabled: !!tarefaId,
    });

    const erro = error ? (error as any).response?.data?.erro || 'Erro ao carregar checklist' : null;

    const mutacaoAdicionar = useMutation({
        mutationFn: (texto: string) => api.post(`/api/tarefas/${tarefaId}/checklist`, { texto }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const mutacaoAlternar = useMutation({
        mutationFn: ({ itemId, concluido }: { itemId: string; concluido: boolean }) => 
            api.patch(`/api/tarefas/${tarefaId}/checklist/${itemId}`, { concluido }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const mutacaoRemover = useMutation({
        mutationFn: (itemId: string) => api.delete(`/api/tarefas/${tarefaId}/checklist/${itemId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const totalConcluidos = itens.filter((it: ItemChecklist) => it.concluido === 1).length;
    const totalItens = itens.length;

    return {
        itens,
        carregando,
        erro,
        adicionarItem: (texto: string) => mutacaoAdicionar.mutateAsync(texto),
        alternarItem: (itemId: string, concluido: boolean) => mutacaoAlternar.mutateAsync({ itemId, concluido }),
        removerItem: (itemId: string) => mutacaoRemover.mutateAsync(itemId),
        totalConcluidos,
        totalItens,
        progresso: totalItens > 0 ? (totalConcluidos / totalItens) * 100 : 0
    };
}

