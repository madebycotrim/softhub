import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface LogSistema {
    id: string;
    acao: string;
    modulo: string;
    descricao: string;
    entidade_tipo: string | null;
    entidade_id: string | null;
    criado_em: string;
    usuario_id: string | null;
    nome: string | null;
    email: string | null;
    role: string | null;
    ip: string | null;
}

export interface EstatisticaLog {
    modulo: string;
    quantidade: number;
}

/**
 * Hook de gerenciamento para leitura de Logs (Exclusivo Admin).
 */
export function usarLogs() {
    const [logs, setLogs] = useState<LogSistema[]>([]);
    const [stats, setStats] = useState<EstatisticaLog[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const [pagina, setPagina] = useState(1);
    const [itensPorPagina, setItensPorPagina] = useState(20);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    const [filtroModulo, setFiltroModulo] = useState('');
    const [filtroAcao, setFiltroAcao] = useState('');
    const [busca, setBusca] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');

    const carregar = async () => {
        try {
            setCarregando(true);
            const params: any = { pagina, itensPorPagina };
            if (filtroModulo) params.modulo = filtroModulo;
            if (filtroAcao) params.acao = filtroAcao;
            if (busca) params.busca = busca;
            if (dataInicio) params.dataInicio = dataInicio;
            if (dataFim) params.dataFim = dataFim;

            const [resLogs, resStats] = await Promise.all([
                api.get('/api/logs', { params }).catch(() => ({ data: { dados: [], paginacao: { totalPaginas: 1, total: 0 } } })),
                api.get('/api/logs/estatisticas').catch(() => ({ data: { modulos: [] } }))
            ]);

            setLogs(resLogs.data.dados || []);
            setStats(resStats.data.modulos || []);
            setTotalPaginas(resLogs.data.paginacao?.totalPaginas || 1);
            setTotalRegistros(resLogs.data.paginacao?.total || 0);
            setErro(null);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar os logs do sistema.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregar();
    }, [pagina, itensPorPagina, filtroModulo, filtroAcao, busca, dataInicio, dataFim]);

    return {
        logs,
        stats,
        carregando,
        erro,
        recarregar: carregar,
        pagina,
        setPagina,
        itensPorPagina,
        setItensPorPagina,
        totalPaginas,
        totalRegistros,
        filtroModulo,
        setFiltroModulo,
        filtroAcao,
        setFiltroAcao,
        busca,
        setBusca,
        dataInicio,
        setDataInicio,
        dataFim,
        setDataFim
    };
}
