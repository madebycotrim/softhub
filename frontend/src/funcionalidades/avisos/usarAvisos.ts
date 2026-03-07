import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';
// import { usarAutenticacao } from '../autenticacao/usarAutenticacao';

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
 */
export function usarAvisos() {
    const [avisos, setAvisos] = useState<Aviso[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
        try {
            setCarregando(true);
            const res = await api.get('/api/avisos');
            setAvisos(res.data);
            setErro(null);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Não foi possível carregar os avisos.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregar();
    }, []);

    const criarAviso = async (dados: Omit<Aviso, 'id' | 'criado_por' | 'criado_em'>) => {
        try {
            await api.post('/api/avisos', dados);
            await carregar();
            return { sucesso: true };
        } catch (e: any) {
            return { sucesso: false, erro: e.response?.data?.erro || 'Erro ao criar aviso.' };
        }
    };

    const removerAviso = async (id: string) => {
        try {
            await api.delete(`/api/avisos/${id}`);
            await carregar();
            return { sucesso: true };
        } catch (e: any) {
            console.error('Erro ao remover aviso:', e);
            return { sucesso: false, erro: 'Erro ao remover aviso.' };
        }
    };

    return { avisos, carregando, erro, recarregar: carregar, criarAviso, removerAviso };
}
