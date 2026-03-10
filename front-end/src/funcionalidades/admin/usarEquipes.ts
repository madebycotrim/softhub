import { useState, useEffect, useCallback } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface Grupo {
    id: string;
    nome: string;
    descricao: string | null;
    equipe_id: string | null;
    equipe_nome: string | null;
    lider_nome: string | null;
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
    grupos_nomes: string | null;
    ativo: number;
    criado_em: string;
}

export interface MembroSimples {
    id: string;
    nome: string;
    email: string;
    role: string;
    foto_perfil: string | null;
    equipe_id: string | null;
    grupo_id: string | null;
    grupos_ids?: string | null; // Lista de IDs de grupos (separados por vírgula)
}

/**
 * Hook para gerenciar grupos, equipes e alocação de membros.
 * Encapsula todo o estado e as chamadas à API do módulo de equipes.
 */
export function usarEquipes() {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [membros, setMembros] = useState<MembroSimples[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    /** Carrega grupos, equipes e membros de forma centralizada. */
    const carregar = useCallback(async (silencioso = false) => {
        if (!silencioso) {
            setCarregando(true);
            setErro(null);
        }
        
        try {
            const [resGrupos, resEquipes, resMembros] = await Promise.all([
                api.get('/api/equipes/grupos'),
                api.get('/api/equipes/equipes'),
                api.get('/api/usuarios'),
            ]);
            setGrupos(resGrupos.data.grupos ?? []);
            setEquipes(resEquipes.data.equipes ?? []);
            setMembros(resMembros.data.membros ?? []);
        } catch (e: any) {
            console.error('[usarEquipes] Erro ao carregar dados:', e);
            if (!silencioso) setErro('Não foi possível carregar os dados de equipes.');
        } finally {
            if (!silencioso) setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    /** 
     * Cria um novo grupo vinculado a uma equipe.
     * @param dados Objeto com nome, descricao e equipe_id.
     */
    const criarGrupo = async (dados: { nome: string; descricao: string | null; equipe_id: string | null }) => {
        setErro(null);
        try {
            await api.post('/api/equipes/grupos', dados);
            await carregar(true);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Falha ao criar o grupo.');
            throw e;
        }
    };

    /** 
     * Edita campos de um grupo.
     * @param id UUID do grupo.
     * @param dados Campos parciais para atualização.
     */
    const editarGrupo = async (id: string, dados: Partial<{ nome: string; descricao: string | null; equipe_id: string | null }>) => {
        const anterior = [...grupos];
        setErro(null);
        // Update local state immediately for perceived speed
        setGrupos(prev => prev.map(g => g.id === id ? { ...g, ...dados } : g));
        
        try {
            await api.patch(`/api/equipes/grupos/${id}`, dados);
            await carregar(true);
        } catch (e: any) {
            setGrupos(anterior); // Rollback
            setErro(e.response?.data?.erro || 'Falha ao editar o grupo.');
            throw e;
        }
    };

    /** 
     * Remove (desativa) um grupo.
     * @param id UUID do grupo.
     */
    const desativarGrupo = async (id: string) => {
        const anterior = [...grupos];
        setErro(null);
        setGrupos(prev => prev.filter(g => g.id !== id));
        
        try {
            await api.delete(`/api/equipes/grupos/${id}`);
            await carregar(true);
        } catch (e: any) {
            setGrupos(anterior); // Rollback
            setErro(e.response?.data?.erro || 'Falha ao remover o grupo.');
            throw e;
        }
    };

    /** 
     * Cria uma nova equipe de comando.
     * @param dados Objeto com nome, lider e sub-lider.
     */
    const criarEquipe = async (dados: { nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }) => {
        setErro(null);
        try {
            await api.post('/api/equipes/equipes', dados);
            await carregar(true);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Falha ao criar a equipe.');
            throw e;
        }
    };

    /** 
     * Edita campos de uma equipe.
     * @param id UUID da equipe.
     * @param dados Campos parciais para atualização.
     */
    const editarEquipe = async (id: string, dados: Partial<{ nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }>) => {
        const anterior = [...equipes];
        setErro(null);
        setEquipes(prev => prev.map(e => e.id === id ? { ...e, ...dados } : e));
        
        try {
            await api.patch(`/api/equipes/equipes/${id}`, dados);
            await carregar(true);
        } catch (e: any) {
            setEquipes(anterior); // Rollback
            setErro(e.response?.data?.erro || 'Falha ao editar a equipe.');
            throw e;
        }
    };

    /** 
     * Remove (desativa) uma equipe e seus grupos vinculados.
     * @param id UUID da equipe.
     */
    const desativarEquipe = async (id: string) => {
        const anteriorE = [...equipes];
        const anteriorG = [...grupos];
        setErro(null);
        
        // Optimistic remove
        setEquipes(prev => prev.filter(e => e.id !== id));
        setGrupos(prev => prev.filter(g => g.equipe_id !== id));
        
        try {
            await api.delete(`/api/equipes/equipes/${id}`);
            await carregar(true);
        } catch (e: any) {
            setEquipes(anteriorE);
            setGrupos(anteriorG);
            setErro(e.response?.data?.erro || 'Falha ao remover a equipe.');
            throw e;
        }
    };

    /** 
     * Aloca um membro em uma equipe e grupo.
     * @param membroId UUID do membro.
     * @param equipe_id UUID da equipe.
     * @param grupo_id UUID do grupo.
     */
    const alocarMembro = async (membroId: string, equipe_id: string | null, grupo_id: string | null) => {
        const anterior = [...membros];
        setErro(null);

        // Optimistic local update
        setMembros(prev => prev.map(m => {
            if (m.id !== membroId) return m;
            
            let novosGrupos = m.grupos_ids ? m.grupos_ids.split(',').filter(id => id !== grupo_id) : [];
            if (equipe_id && grupo_id) {
                if (!novosGrupos.includes(grupo_id)) novosGrupos.push(grupo_id);
            }
            
            return { 
                ...m, 
                equipe_id, 
                grupo_id, 
                grupos_ids: novosGrupos.join(',') 
            };
        }));

        try {
            await api.patch(`/api/equipes/membros/${membroId}/alocar`, { equipe_id, grupo_id });
            await carregar(true); // Confirma estado real do banco
        } catch (e: any) {
            setMembros(anterior); // Rollback
            console.error('[usarEquipes] Erro ao alocar membro:', e);
            setErro(e.response?.data?.erro || 'Falha ao alocar membro.');
            throw e;
        }
    };

    /** 
     * Move um membro entre grupos dentro da mesma ou outra equipe.
     * @param membroId UUID do membro.
     * @param equipe_id UUID da equipe destino.
     * @param grupo_id UUID do grupo destino.
     * @param origem_grupo_id UUID do grupo anterior.
     */
    const moverMembro = async (membroId: string, equipe_id: string, grupo_id: string, origem_grupo_id: string) => {
        setErro(null);
        try {
            await api.patch(`/api/equipes/membros/${membroId}/mover`, { equipe_id, grupo_id, origem_grupo_id });
            await carregar(true);
        } catch (e: any) {
            console.error('[usarEquipes] Erro ao mover membro:', e);
            setErro(e.response?.data?.erro || 'Falha ao mover membro.');
            throw e;
        }
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
        moverMembro,
    };
}
