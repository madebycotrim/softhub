import { useQuery } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';
import type { Aviso } from '@/funcionalidades/avisos/hooks/usarAvisos';

export interface MetricaDashboard {
    totalTarefas: number;
    tarefasConcluidas: number;
    tarefasAtrasadas: number;
    horasRegistradasHoje: number;
    progressoGeral: number; // 0 a 100
}

export interface TarefaDashboard {
    id: string;
    titulo: string;
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    status: string;
}

export interface DadosDashboard {
    metricas: MetricaDashboard;
    avisos: Aviso[];
    minhasTarefas: TarefaDashboard[];
}

/**
 * Hook de gerenciamento dos dados do Dashboard Principal.
 * Utiliza React Query para cache e gerenciamento de estado de carregamento.
 */
export function usarDashboard(projetoId?: string) {
    const { 
        data, 
        isLoading: carregando, 
        error 
    } = useQuery<DadosDashboard>({
        queryKey: ['dashboard', projetoId],
        queryFn: async () => {
            const res = await api.get('/api/dashboard', { params: { projetoId } });
            return res.data;
        },
        staleTime: 300000, // 5 minutos de cache para o Dashboard
    });

    const erro = error ? (error as any).response?.data?.erro || 'Erro ao carregar dashboard' : null;

    return { 
        metricas: data?.metricas || null, 
        avisos: data?.avisos || [], 
        minhasTarefas: data?.minhasTarefas || [], 
        carregando, 
        erro 
    };
}

export interface DadoBurndown {
    dia: string;
    real: number;
    ideal: number;
}

export function usarBurndown(projetoId?: string) {
    const { data: burndown = [], isLoading: carregando } = useQuery<DadoBurndown[]>({
        queryKey: ['burndown', projetoId],
        queryFn: async () => {
            if (!projetoId) return [];
            const res = await api.get('/api/dashboard/burndown', { params: { projetoId } });
            return res.data;
        },
        enabled: !!projetoId,
        staleTime: 1800000, 
    });

    return { burndown, carregando };
}

