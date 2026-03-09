import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';
import type { Aviso } from '../avisos/usarAvisos';

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

/**
 * Hook de gerenciamento dos dados do Dashboard Principal.
 * Na API Real (Etapa 4) fará uma única chamada `/dashboard` agregando tudo.
 */
export function usarDashboard(projetoId?: string) {
    const [metricas, setMetricas] = useState<MetricaDashboard | null>(null);
    const [avisos, setAvisos] = useState<Aviso[]>([]);
    const [minhasTarefas, setMinhasTarefas] = useState<TarefaDashboard[]>([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function buscar() {
            try {
                setCarregando(true);
                // GET /api/dashboard?projetoId=...
                const res = await api.get('/api/dashboard', { params: { projetoId } });
                if (mounted && res.data.metricas) {
                    setMetricas(res.data.metricas);
                    setAvisos(res.data.avisos || []);
                    setMinhasTarefas(res.data.minhasTarefas || []);
                    setErro(null);
                }
            } catch (e: any) {
                if (mounted) setErro(e.response?.data?.erro || 'Não foi possível carregar os dados do dashboard.');
            } finally {
                if (mounted) setCarregando(false);
            }
        }

        buscar();

        return () => {
            mounted = false;
        };
    }, [projetoId]);

    return { metricas, avisos, minhasTarefas, carregando, erro };
}
