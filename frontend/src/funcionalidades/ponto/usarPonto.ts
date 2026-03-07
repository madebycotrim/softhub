import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';
// import { usarAutenticacao } from '../autenticacao/usarAutenticacao';

export interface RegistroPonto {
    id: string;
    tipo: 'entrada' | 'saida';
    registrado_em: string; // ISO 8601
    ip_origem: string;
}

/**
 * Hook de gerenciamento do Ponto Eletrônico da Fábrica.
 * Lida com o registro atualizado de entradas e saídas e a consistência da rede da instituição.
 */
export function usarPonto() {
    const [registrosHoje, setRegistrosHoje] = useState<RegistroPonto[]>([]);
    const [historico, setHistorico] = useState<RegistroPonto[]>([]); // ideal seria lista paginada
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregarPonto = async () => {
        try {
            setCarregando(true);
            const res = await api.get('/api/ponto');

            if (res.data) {
                setRegistrosHoje(res.data.hoje || []);
                setHistorico(res.data.historico || []);
                setErro(null);
            }
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Não foi possível carregar os registros de ponto.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarPonto();
    }, []);

    /**
     * Registra uma nova batida de ponto
     */
    const baterPonto = async (tipo: 'entrada' | 'saida') => {
        try {
            // Regra 9: Backend valida IP, frontend apenas tenta e trata o erro.
            await api.post('/api/ponto', { tipo });

            // Atualiza otimisticamente (para refletir a mudança imediata) ou recarrega a lista
            await carregarPonto();
            return true;
        } catch (e: any) {
            const msgErro = e.response?.data?.erro || 'Erro desconhecido ao bater ponto.';
            throw new Error(msgErro);
        }
    };

    return { registrosHoje, historico, carregando, erro, baterPonto, recarregar: carregarPonto };
}
