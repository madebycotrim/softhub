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
 * Encapsula todo o estado e as chamadas à API do módulo de organização.
 */
export function usarOrganizacao() {
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [equipes, setEquipes] = useState<Equipe[]>([]);
    const [membros, setMembros] = useState<MembroSimples[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    /** Carrega grupos, equipes e membros. */
    const carregar = useCallback(async (silencioso = false) => {
        if (!silencioso) {
            setCarregando(true);
            setErro(null);
        }
        
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
            if (!silencioso) setErro('Não foi possível carregar os dados de organização.');
        } finally {
            if (!silencioso) setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    /** Ações com Revalidação Silenciosa - Melhora percepção de velocidade */
    const criarGrupo = async (dados: { nome: string; descricao: string | null; equipe_id: string | null }) => {
        await api.post('/api/organizacao/grupos', dados);
        carregar(true); // Atualiza em background
    };

    const editarGrupo = async (id: string, dados: Partial<{ nome: string; descricao: string | null; equipe_id: string | null }>) => {
        // Update local state immediately for perceived speed
        setGrupos(prev => prev.map(g => g.id === id ? { ...g, ...dados } : g));
        await api.patch(`/api/organizacao/grupos/${id}`, dados);
        carregar(true);
    };

    const desativarGrupo = async (id: string) => {
        setGrupos(prev => prev.filter(g => g.id !== id));
        await api.delete(`/api/organizacao/grupos/${id}`);
        carregar(true);
    };

    const criarEquipe = async (dados: { nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }) => {
        await api.post('/api/organizacao/equipes', dados);
        carregar(true);
    };

    const editarEquipe = async (id: string, dados: Partial<{ nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }>) => {
        setEquipes(prev => prev.map(e => e.id === id ? { ...e, ...dados } : e));
        await api.patch(`/api/organizacao/equipes/${id}`, dados);
        carregar(true);
    };

    const desativarEquipe = async (id: string) => {
        setEquipes(prev => prev.filter(e => e.id !== id));
        await api.delete(`/api/organizacao/equipes/${id}`);
        carregar(true);
    };

    const alocarMembro = async (membroId: string, equipe_id: string | null, grupo_id: string | null) => {
        // Optimistic local update
        setMembros(prev => prev.map(m => {
            if (m.id !== membroId) return m;
            
            let novosGrupos = m.grupos_ids ? m.grupos_ids.split(',') : [];
            if (equipe_id && grupo_id) {
                // Adiciona se não existir
                if (!novosGrupos.includes(grupo_id)) novosGrupos.push(grupo_id);
            } else if (equipe_id && !grupo_id) {
                // Se removeu grupo, nesse novo modelo (melhor) removemos de todos os grupos daquela equipe
                // Mas para simplicidade agora, vamos apenas esperar o refresh do background carregar(true)
            }
            
            return { 
                ...m, 
                equipe_id, 
                grupo_id, 
                grupos_ids: novosGrupos.join(',') 
            };
        }));

        try {
            await api.patch(`/api/organizacao/membros/${membroId}/alocar`, { equipe_id, grupo_id });
            await carregar(true); // Confirma estado real do banco
        } catch (e) {
            console.error('Erro ao alocar membro:', e);
            carregar(); 
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
    };
}
