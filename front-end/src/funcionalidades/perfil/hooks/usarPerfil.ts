import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';
import { usarToast } from '@/compartilhado/hooks/usarToast';

/**
 * Hook para gerenciar os dados do perfil do usuário logado e suas estatísticas.
 * Permite buscar dados e atualizar informações básicas.
 */
export interface PerfilData {
    perfil: {
        id: string;
        nome: string;
        email: string;
        role: string;
        foto_perfil: string | null;
        bio: string | null;
        funcoes: string[];
        criado_em: string;
        equipe_nome: string | null;
        grupo_nome: string | null;
    };
    stats: {
        tarefas: {
            total: number;
            concluidas: number;
            pendentes: number;
            aproveitamento: number;
        };
        ponto: {
            batidasMes: number;
            estimativaHoras: number;
        };
    };
}

export function usarPerfil() {
    const queryClient = useQueryClient();
    const { exibirToast } = usarToast();

    const { data, isLoading: carregando, error, refetch } = useQuery<PerfilData>({
        queryKey: ['perfil_me'],
        queryFn: async () => {
            const res = await api.get('/api/perfil/me');
            return res.data;
        }
    });

    const mutacao = useMutation({
        mutationFn: async (dados: { nome?: string; bio?: string; foto_perfil?: string }) => {
            return api.patch('/api/perfil/me', dados);
        },
        onSuccess: () => {
            exibirToast('Perfil atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['perfil_me'] });
        },
        onError: (err: any) => {
            exibirToast(err.response?.data?.erro || 'Erro ao atualizar perfil', 'erro');
        }
    });

    return {
        perfil: data?.perfil,
        stats: data?.stats,
        carregando,
        erro: error ? (error as any).response?.data?.erro || 'Falha ao carregar perfil' : null,
        atualizarPerfil: mutacao.mutateAsync,
        salvando: mutacao.isPending,
        refetch
    };
}
