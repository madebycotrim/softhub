import { useState, useEffect, useCallback } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface Grupo {
    id: string;
    nome: string;
    descricao: string | null;
    lider_id: string | null;
    sub_lider_id: string | null;
    lider_nome?: string;
    sub_lider_nome?: string;
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
                api.get('/api/organizacao/grupos'),
                api.get('/api/organizacao/equipes')
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

    const criarGrupo = async (dados: { nome: string, descricao?: string, lider_id?: string, sub_lider_id?: string }) => {
        try {
            await api.post('/api/organizacao/grupos', dados);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao criar grupo');
        }
    };

    const editarGrupo = async (id: string, dados: { nome: string, descricao?: string, lider_id?: string, sub_lider_id?: string }) => {
        try {
            await api.patch(`/api/organizacao/grupos/${id}`, dados);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao editar grupo');
        }
    };

    const criarEquipe = async (dados: { grupo_id: string, nome: string, descricao?: string }) => {
        try {
            await api.post('/api/organizacao/equipes', dados);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao criar equipe');
        }
    };

    const excluirGrupo = async (id: string) => {
        try {
            await api.delete(`/api/organizacao/grupos/${id}`);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao excluir grupo');
        }
    };

    const excluirEquipe = async (id: string) => {
        try {
            await api.delete(`/api/organizacao/equipes/${id}`);
            await carregarDados();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao excluir equipe');
        }
    };

    const alocarUsuario = async (usuarioId: string, equipeId: string | null) => {
        try {
            await api.patch(`/api/organizacao/alocacao/${usuarioId}`, { equipe_id: equipeId });
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
        editarGrupo,
        criarEquipe,
        excluirGrupo,
        excluirEquipe,
        alocarUsuario,
        recarregar: carregarDados
    };
}
