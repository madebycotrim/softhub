import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';

export interface Comentario {
    id: string;
    conteudo: string;
    autor_id: string;
    autor_nome: string;
    autor_foto: string | null;
    criado_em: string;
    atualizado_em: string | null;
}

export function usarComentarios(tarefaId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['comentarios', tarefaId];

    const { 
        data: comentarios = [], 
        isLoading: carregando, 
        error 
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const { data } = await api.get(`/tarefas/${tarefaId}/comentarios`);
            return data || [];
        },
        enabled: !!tarefaId,
    });

    const erro = error ? (error as any).response?.data?.erro || 'Erro ao carregar comentários' : null;

    const mutacaoEnviar = useMutation({
        mutationFn: (conteudo: string) => api.post(`/tarefas/${tarefaId}/comentarios`, { conteudo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const mutacaoExcluir = useMutation({
        mutationFn: (id: string) => api.delete(`/tarefas/comentarios/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const mutacaoEditar = useMutation({
        mutationFn: ({ id, conteudo }: { id: string; conteudo: string }) => 
            api.patch(`/tarefas/comentarios/${id}`, { conteudo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        comentarios,
        carregando,
        erro,
        enviarComentario: (conteudo: string) => mutacaoEnviar.mutateAsync(conteudo),
        excluirComentario: (id: string) => mutacaoExcluir.mutateAsync(id),
        editarComentario: (id: string, conteudo: string) => mutacaoEditar.mutateAsync({ id, conteudo }),
        recarregar: () => queryClient.invalidateQueries({ queryKey })
    };
}

