import { useState, useCallback, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface RelatorioOrganizacao {
    grupos: {
        id: string;
        nome: string;
        ativo: number;
        lider_nome: string | null;
        total_equipes: number;
        total_membros: number;
    }[];
    equipes: {
        id: string;
        nome: string;
        ativo: number;
        lider_nome: string | null;
        grupo_nome: string | null;
        total_membros: number;
    }[];
}

export interface RelatorioFrequenciaGeral {
    tendencia: {
        data: string;
        total_presentes: number;
    }[];
    statusJustificativas: {
        status: string;
        total: number;
    }[];
    tiposJustificativas: {
        tipo: string;
        total: number;
    }[];
}

export interface RelatorioFrequenciaMembro {
    id: string;
    nome: string;
    email: string;
    equipe_nome: string | null;
    grupo_nome: string | null;
    dias_presentes: number;
    justificativas_aprovadas: number;
    ultima_batida: string | null;
}

export function usarRelatorios() {
    const [organizacao, setOrganizacao] = useState<RelatorioOrganizacao | null>(null);
    const [frequenciaGeral, setFrequenciaGeral] = useState<RelatorioFrequenciaGeral | null>(null);
    const [frequenciaMembros, setFrequenciaMembros] = useState<RelatorioFrequenciaMembro[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const carregarRelatorioOrganizacao = useCallback(async () => {
        try {
            const res = await api.get('/api/relatorios/organizacao');
            setOrganizacao(res.data);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar relatório organizacional');
        }
    }, []);

    const carregarRelatorioFrequenciaGeral = useCallback(async () => {
        try {
            const res = await api.get('/api/relatorios/frequencia/geral');
            setFrequenciaGeral(res.data);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar frequência geral');
        }
    }, []);

    const carregarRelatorioFrequenciaMembros = useCallback(async () => {
        try {
            const res = await api.get('/api/relatorios/frequencia/membros');
            setFrequenciaMembros(res.data.membros);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar frequência de membros');
        }
    }, []);

    const carregarTudo = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        await Promise.all([
            carregarRelatorioOrganizacao(),
            carregarRelatorioFrequenciaGeral(),
            carregarRelatorioFrequenciaMembros()
        ]);
        setCarregando(false);
    }, [carregarRelatorioOrganizacao, carregarRelatorioFrequenciaGeral, carregarRelatorioFrequenciaMembros]);

    useEffect(() => {
        carregarTudo();
    }, [carregarTudo]);

    return {
        organizacao,
        frequenciaGeral,
        frequenciaMembros,
        carregando,
        erro,
        recarregar: carregarTudo
    };
}
