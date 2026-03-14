import { useQuery } from '@tanstack/react-query';
import { api } from '../servicos/api';
import { useMemo } from 'react';

/**
 * Hook para buscar em tempo real os membros que estão com o ponto aberto (online).
 */
export function usarMembrosOnline() {
    const { data: membrosOnline = [], isLoading } = useQuery({
        queryKey: ['membros-online'],
        queryFn: async () => {
            const res = await api.get('/api/ponto/online');
            return res.data.online || [];
        },
        refetchInterval: 30000, // Refresh a cada 30 segundos
        staleTime: 25000,
    });

    const mapaOnline = useMemo(() => {
        const mapa = new Set<string>();
        membrosOnline.forEach((m: any) => mapa.add(m.id));
        return mapa;
    }, [membrosOnline]);

    /**
     * Verifica se um usuário específico está online.
     */
    const estaOnline = (usuarioId: string) => mapaOnline.has(usuarioId);

    return { 
        membrosOnline, 
        estaOnline,
        carregando: isLoading 
    };
}
