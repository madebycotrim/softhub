import { useState, useEffect, useCallback } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface Grupo {
    id: string;
    nome: string;
    descricao: string | null;
    lider_id: string | null;
    lider_nome: string | null;
    sub_lider_id: string | null;
    sub_lider_nome: string | null;
    total_membros: number;
    ativo: number;
    criado_em: string;
}

export interface Equipe {
    id: string;
    nome: string;
    descricao: string | null;
    lider_id: string | null;
    lider_nome: string | null;
    sub_lider_id: string | null;
    sub_lider_nome: string | null;
    total_membros: number;
    ativo: number;
    criado_em: string;
}

export interface MembroSimples {
    id: string;
    nome: string;
    email: string;
    role: string;
    equipe_id: string | null;
    grupo_id: string | null;
}

/**
 * Hook para gerenciar grupos, equipes e alocação de membros.
 * Encapsula todo o estado e as chamadas à API do módulo de organização.
 */
export function usarOrganizacao() {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [membros, setMembros] = useState<MembroSimples[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    /** Carrega grupos, equipes e membros em paralelo. */
    const carregar = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            const [resGrupos, resEquipes, resMembros] = await Promise.all([
                api.get('/api/organizacao/grupos'),
                api.get('/api/organizacao/equipes'),
                api.get('/api/usuarios'),
            ]);
            setGrupos(resGrupos.data.grupos ?? []);
            setEquipes(resEquipes.data.equipes ?? []);
            setMembros(resMembros.data.membros ?? []);
        } catch (e: any) {
            setErro('Não foi possível carregar os dados de organização.');
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    /** Cria um novo grupo. */
    const criarGrupo = async (dados: { nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }) => {
        await api.post('/api/organizacao/grupos', dados);
        await carregar();
    };

    /** Edita um grupo existente. */
    const editarGrupo = async (id: string, dados: { nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }) => {
        await api.patch(`/api/organizacao/grupos/${id}`, dados);
        await carregar();
    };

    /** Desativa um grupo (soft delete). */
    const desativarGrupo = async (id: string) => {
        await api.delete(`/api/organizacao/grupos/${id}`);
        await carregar();
    };

    /** Cria uma nova equipe. */
    const criarEquipe = async (dados: { nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }) => {
        await api.post('/api/organizacao/equipes', dados);
        await carregar();
    };

    /** Edita uma equipe existente. */
    const editarEquipe = async (id: string, dados: { nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }) => {
        await api.patch(`/api/organizacao/equipes/${id}`, dados);
        await carregar();
    };

    /** Desativa uma equipe (soft delete). */
    const desativarEquipe = async (id: string) => {
        await api.delete(`/api/organizacao/equipes/${id}`);
        await carregar();
    };

    /** Aloca um membro em grupo + equipe. Desvincula se null. */
    const alocarMembro = async (membroId: string, equipe_id: string | null, grupo_id: string | null) => {
        await api.patch(`/api/organizacao/membros/${membroId}/alocar`, { equipe_id, grupo_id });
        await carregar();
    };

    return {
        grupos,
        equipes,
        membros,
        carregando,
        erro,
        carregar,
        criarGrupo,
        editarGrupo,
        desativarGrupo,
        criarEquipe,
        editarEquipe,
        desativarEquipe,
        alocarMembro,
    };
}
