import { useState, useEffect, useCallback } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface Aviso {
    id: string;
    titulo: string;
    conteudo: string;
    prioridade: 'urgente' | 'importante' | 'info';
    criado_por: {
        id: string;
        nome: string;
        foto?: string;
    };
    criado_em: string;
    expira_em: string | null;
}

/**
 * Hook de gerenciamento do Mural de Avisos da plataforma.
 * Lida com a listagem, criação e remoção de comunicados internos.
 * Implementa blindagem com rollback otimista e suporte a background.
 */
export function usarAvisos() {
    const [avisos, setAvisos] = useState<Aviso[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    /** 
     * Carrega a lista de avisos ativos.
     * @param silencioso Se true, não altera o estado de carregando/erro inicial.
     */
    const carregar = useCallback(async (silencioso = false) => {
        if (!silencioso) {
            setCarregando(true);
            setErro(null);
        }

        try {
            const res = await api.get('/api/avisos');
            setAvisos(res.data || []);
            setErro(null);
        } catch (e: any) {
            console.error('[usarAvisos] Erro ao carregar mural:', e);
            if (!silencioso) {
                setErro(e.response?.data?.erro || 'Não foi possível carregar os avisos do mural.');
            }
        } finally {
            if (!silencioso) setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    /**
     * Cria um novo comunicado no mural.
     * @param dados Título, conteúdo, prioridade e expiração.
     */
    const criarAviso = async (dados: Omit<Aviso, 'id' | 'criado_por' | 'criado_em'>) => {
        setErro(null);
        try {
            await api.post('/api/avisos', dados);
            await carregar(true); // Revalida em background
            return { sucesso: true };
        } catch (e: any) {
            const msg = e.response?.data?.erro || 'Erro ao publicar aviso no mural.';
            setErro(msg);
            return { sucesso: false, erro: msg };
        }
    };

    /**
     * Remove um aviso (soft delete) com rollback otimista.
     * @param id UUID do aviso.
     */
    const removerAviso = async (id: string) => {
        const backupAvisos = [...avisos];
        setErro(null);

        // 1. Optimistic Update
        setAvisos(prev => prev.filter(a => a.id !== id));

        try {
            await api.delete(`/api/avisos/${id}`);
            await carregar(true); // Confirma consistência
            return { sucesso: true };
        } catch (e: any) {
            // 2. Rollback se falhar
            console.error('[usarAvisos] Erro ao remover aviso, revertendo:', e);
            setAvisos(backupAvisos);
            const msg = e.response?.data?.erro || 'Erro ao remover aviso.';
            setErro(msg);
            return { sucesso: false, erro: msg };
        }
    };

    return { 
        avisos, 
        carregando, 
        erro, 
        recarregar: carregar, 
        criarAviso, 
        removerAviso 
    };
}
