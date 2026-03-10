import { useState, useEffect, useCallback } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface RegistroPonto {
    id: string;
    tipo: 'entrada' | 'saida';
    registrado_em: string; // ISO 8601
    ip_origem: string;
}

/**
 * Hook de gerenciamento do Ponto Eletrônico da Fábrica.
 * Lida com o registro atualizado de entradas e saídas e a consistência da rede da instituição.
 * Implementa blindagem com revalidação automática e suporte a background.
 */
export function usarPonto() {
    const [registrosHoje, setRegistrosHoje] = useState<RegistroPonto[]>([]);
    const [historico, setHistorico] = useState<RegistroPonto[]>([]); // ideal seria lista paginada
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    /** 
     * Carrega os dados de ponto do usuário de forma centralizada.
     * @param silencioso Se true, não reseta o estado de carregando/erro inicial.
     */
    const carregarPonto = useCallback(async (silencioso = false) => {
        if (!silencioso) {
            setCarregando(true);
            setErro(null);
        }

        try {
            const res = await api.get('/api/ponto');
            if (res.data) {
                setRegistrosHoje(res.data.hoje || []);
                setHistorico(res.data.historico || []);
                setErro(null);
            }
        } catch (e: any) {
            console.error('[usarPonto] Falha ao carregar registros:', e);
            if (!silencioso) {
                setErro(e.response?.data?.erro || 'Não foi possível carregar os registros de ponto.');
            }
        } finally {
            if (!silencioso) setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarPonto();
    }, [carregarPonto]);

    /**
     * Registra uma nova batida de ponto (entrada ou saída).
     * @param tipo Tipo da batida ('entrada' ou 'saida').
     * @throws Erro com a mensagem do backend em caso de falha.
     */
    const baterPonto = async (tipo: 'entrada' | 'saida') => {
        setErro(null);
        try {
            // Regra 9: Backend valida IP, frontend apenas tenta e trata o erro.
            await api.post('/api/ponto', { tipo });

            // Revalidação em background para garantir consistência visual imediata
            await carregarPonto(true);
            return true;
        } catch (e: any) {
            const msgErro = e.response?.data?.erro || 'Erro ao registrar ponto. Verifique sua conexão ou se está na rede autorizada.';
            setErro(msgErro);
            throw new Error(msgErro);
        }
    };

    return { 
        registrosHoje, 
        historico, 
        carregando, 
        erro, 
        baterPonto, 
        recarregar: carregarPonto 
    };
}
