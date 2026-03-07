import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';
import type { Aviso } from '../avisos/usarAvisos';

export interface MetricaDashboard {
    totalTarefas: number;
    tarefasConcluidas: number;
    tarefasAtrasadas: number;
    horasRegistradasHoje: number;
    progressoSprint: number; // 0 a 100
    diasRestantesSprint: number;
}

export interface PontoBurndown {
    dia: string;
    planejado: number;
    realizado: number;
}

export interface PontoVelocity {
    sprint: string;
    pontos: number;
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
    const [burndown, setBurndown] = useState<PontoBurndown[]>([]);
    const [velocity, setVelocity] = useState<PontoVelocity[]>([]);
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
                // Mockando o retorno para visualização imediata do design premium
                try {
                    const res = await api.get('/api/dashboard', { params: { projetoId } });
                    if (mounted && res.data.metricas) {
                        setMetricas(res.data.metricas);
                        setBurndown(res.data.burndown || []);
                        setVelocity(res.data.velocity || []);
                        setAvisos(res.data.avisos || []);
                        setMinhasTarefas(res.data.minhasTarefas || []);
                        setErro(null);
                        setCarregando(false);
                        return;
                    }
                } catch (e) {
                    console.log('API sem dados, usando mocks para demonstração.');
                }

                if (mounted) {
                    setMetricas({
                        progressoSprint: 65,
                        tarefasConcluidas: 12,
                        totalTarefas: 18,
                        tarefasAtrasadas: 2,
                        horasRegistradasHoje: 6,
                        diasRestantesSprint: 4
                    });
                    setBurndown([
                        { dia: '01/03', planejado: 50, realizado: 48 },
                        { dia: '02/03', planejado: 42, realizado: 40 },
                        { dia: '03/03', planejado: 35, realizado: 30 },
                        { dia: '04/03', planejado: 28, realizado: 22 },
                        { dia: '05/03', planejado: 20, realizado: 15 }
                    ]);
                    setAvisos([
                        {
                            id: 'a1',
                            titulo: 'Manutenção do Servidor D1',
                            conteudo: 'Teremos uma breve interrupção para atualização de segurança hoje às 23h. Salve seu progresso.',
                            prioridade: 'urgente',
                            criado_por: { id: 'u1', nome: 'Admin' },
                            criado_em: new Date().toISOString(),
                            expira_em: null
                        },
                        {
                            id: 'a2',
                            titulo: 'Review da Sprint #42',
                            conteudo: 'A review será realizada amanhã na sala Águas Claras. Favor atualizar o status de todas as tarefas até as 9h.',
                            prioridade: 'importante',
                            criado_por: { id: 'u2', nome: 'Mateus' },
                            criado_em: new Date().toISOString(),
                            expira_em: null
                        }
                    ]);
                    setMinhasTarefas([
                        { id: 't1', titulo: 'Refinar Layout do Dashboard', prioridade: 'alta', status: 'em_andamento' },
                        { id: 't2', titulo: 'Corrigir Bug de MSAL no Safari', prioridade: 'urgente', status: 'a_fazer' },
                        { id: 't3', titulo: 'Documentar Fluxo de Gamificação', prioridade: 'baixa', status: 'a_fazer' }
                    ]);
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

    return { metricas, burndown, velocity, avisos, minhasTarefas, carregando, erro };
}
