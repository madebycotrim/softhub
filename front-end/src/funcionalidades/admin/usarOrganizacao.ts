import { useState, useEffect, useCallback } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface Grupo {
    id: string;
    nome: string;
    descricao: string | null;
    ativo: number;
}

export interface Equipe {
    id: string;
    grupo_id: string;
    grupo_nome?: string;
    nome: string;
    descricao: string | null;
    ativo: number;
}

export function usarOrganizacao() {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const carregarDados = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            const [resGrupos, resEquipes] = await Promise.all([
                api.get('/organizacao/grupos'),
                api.get('/organizacao/equipes')
            ]);
            setGrupos(resGrupos.data);
            setEquipes(resEquipes.data);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Falha ao carregar dados organizacionais');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const criarGrupo = async (dados: { nome: string, descricao?: string }) => {
        try {
            await api.post('/organizacao/grupos', dados);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao criar grupo');
        }
    };

    const criarEquipe = async (dados: { grupo_id: string, nome: string, descricao?: string }) => {
        try {
            await api.post('/organizacao/equipes', dados);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao criar equipe');
        }
    };

    const excluirGrupo = async (id: string) => {
        try {
            await api.delete(`/organizacao/grupos/${id}`);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao excluir grupo');
        }
    };

    const excluirEquipe = async (id: string) => {
        try {
            await api.delete(`/organizacao/equipes/${id}`);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao excluir equipe');
        }
    };

    const alocarUsuario = async (usuarioId: string, equipeId: string | null) => {
        try {
            await api.patch(`/organizacao/alocacao/${usuarioId}`, { equipe_id: equipeId });
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao alocar usuário');
        }
    };

    return {
        grupos,
        equipes,
        carregando,
        erro,
        criarGrupo,
        criarEquipe,
        excluirGrupo,
        excluirEquipe,
        alocarUsuario,
        recarregar: carregarDados
    };
}
