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
        foto_banner: string | null;
        bio: string | null;
        criado_em: string;
        equipe_nome: string | null;
        grupo_nome: string | null;
        github_url: string | null;
        linkedin_url: string | null;
        website_url: string | null;
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
        mutationFn: async (dados: { 
            nome?: string; 
            bio?: string; 
            foto_perfil?: string;
            foto_banner?: string;
            github_url?: string;
            linkedin_url?: string;
            website_url?: string;
        }) => {
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

    const erro = error ? (error as any).response?.data?.erro || 'Falha ao carregar perfil' : null;

    if (error) {
        console.error('[PERFIL_HOOK] Erro ao buscar perfil:', {
            status: (error as any).response?.status,
            dados: (error as any).response?.data
        });
    }

    return {
        perfil: data?.perfil,
        stats: data?.stats,
        carregando,
        erro,
        atualizarPerfil: mutacao.mutateAsync,
        salvando: mutacao.isPending,
        refetch
    };
}
