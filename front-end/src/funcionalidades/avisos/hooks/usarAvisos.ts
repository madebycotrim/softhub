import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';

export interface Aviso {
    id: string;
    titulo: string;
    conteudo: string;
    prioridade: 'info' | 'importante' | 'urgente';
    criado_por: {
        id: string;
        nome: string;
        foto?: string;
    };
    criado_em: string;
    expira_em: string | null;
}

/**
 * Hook de gerenciamento do Mural de Avisos da plataforma.
 * Lida com a listagem, criação e remoção de comunicados internos.
 * Implementa blindagem com React Query e suporte a background.
 */
export function usarAvisos() {
    const queryClient = useQueryClient();
    const queryKey = ['avisos'];

    const { 
        data: avisos = [], 
        isLoading: carregando, 
        error 
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await api.get('/api/avisos');
            return res.data || [];
        },
        staleTime: 60000, // 1 minuto
    });

    const erro = error ? (error as any).response?.data?.erro || 'Erro ao carregar avisos' : null;

    // Mutação para criar aviso
    const mutacaoCriar = useMutation({
        mutationFn: (dados: Omit<Aviso, 'id' | 'criado_por' | 'criado_em'>) => api.post('/api/avisos', dados),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Mutação para remover aviso (Optimistic Update)
    const mutacaoRemover = useMutation({
        mutationFn: (id: string) => api.delete(`/api/avisos/${id}`),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey });
            const estadoAnterior = queryClient.getQueryData<Aviso[]>(queryKey);
            queryClient.setQueryData<Aviso[]>(queryKey, (antigo) => antigo?.filter(a => a.id !== id));
            return { estadoAnterior };
        },
        onError: (_err, _id, contexto) => {
            if (contexto?.estadoAnterior) {
                queryClient.setQueryData(queryKey, contexto.estadoAnterior);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return { 
        avisos, 
        carregando, 
        erro, 
        recarregar: () => queryClient.invalidateQueries({ queryKey }), 
        criarAviso: (dados: any) => mutacaoCriar.mutateAsync(dados), 
        removerAviso: (id: string) => mutacaoRemover.mutateAsync(id) 
    };
}

