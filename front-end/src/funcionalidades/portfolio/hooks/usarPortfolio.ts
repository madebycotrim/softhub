import { useQuery } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';

/**
 * Hook para buscar dados do portfólio público (projetos com flag publico=1).
 */
export interface ProjetoPublico {
    id: string;
    nome: string;
    descricao: string;
    criado_em: string;
}

export function usarPortfolio() {
    const { data: projetos, isLoading: carregando, error } = useQuery<ProjetoPublico[]>({
        queryKey: ['portfolio_publico'],
        queryFn: async () => {
            const res = await api.get('/api/projetos/publicos');
            return res.data;
        }
    });

    return {
        projetos: projetos || [],
        carregando,
        erro: error ? 'Falha ao conectar com a Fábrica' : null
    };
}
