import { useEffect, useState, useCallback } from 'react';
import { api } from '../servicos/api';
import { usarAutenticacao } from '../../funcionalidades/autenticacao/usarAutenticacao';

export interface Notificacao {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: 'tarefa' | 'ponto' | 'aviso' | 'sistema';
    link_acao?: string;
    lida: boolean;
    criado_em: string;
}

/**
 * Faz polling de notificações não lidas a cada 30 segundos.
 */
export function usarNotificacoes() {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const { usuario } = usarAutenticacao();
    const estaAutenticado = !!usuario;

    const buscar = useCallback(async () => {
        if (!estaAutenticado) return;
        try {
            const { data } = await api.get('/api/notificacoes');
            setNotificacoes(data.notificacoes ?? []);
        } catch (e) {
            console.error('Falha temporária ao buscar notificações');
        } finally {
            setCarregando(false);
        }
    }, [estaAutenticado]);

    useEffect(() => {
        buscar();
        const timer = setInterval(buscar, 30 * 1000);
        return () => clearInterval(timer);
    }, [buscar]);

    /**
     * Marca uma notificação como "lida".
     */
    const marcarComoLida = async (id: string) => {
        try {
            // Update local otimista
            setNotificacoes((prev) => prev.filter((n) => n.id !== id));
            await api.patch(`/api/notificacoes/${id}/lida`);
        } catch (e) {
            console.error('Falha ao limpar notificação');
            buscar(); // Reverte em caso de erro
        }
    };

    /**
     * Marca todas como lidas.
     */
    const limparTodas = async () => {
        try {
            setNotificacoes([]);
            await api.delete('/api/notificacoes/limpar-todas');
        } catch (e) {
            console.error('Falha ao limpar notificações');
            buscar();
        }
    };

    return { notificacoes, carregando, marcarComoLida, limparTodas, recarregar: buscar };
}
