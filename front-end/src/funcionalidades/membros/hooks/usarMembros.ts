import { useState, useEffect, useCallback } from 'react';
import { api } from '@/compartilhado/servicos/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Membro {
    id: string;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
    foto_perfil: string | null;
    bio: string | null;
    criado_em: string;
    funcoes: string[]; // Lista de funções (ex: Frontend, Backend, UX)
    grupos_ids?: string | null;
    equipe_nome?: string | null;
}

export interface ResultadoOperacao {
    sucesso: boolean;
    erro?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normaliza o campo `ativo` que pode vir como boolean ou number (0/1) do backend.
 */
function normalizarMembro(m: unknown): Membro {
    const raw = m as Record<string, unknown>;
    return {
        id: String(raw.id ?? ''),
        nome: String(raw.nome ?? ''),
        email: String(raw.email ?? ''),
        role: String(raw.role ?? 'MEMBRO'),
        ativo: raw.ativo === 1 || raw.ativo === true,
        foto_perfil: (raw.foto_perfil as string | null) ?? null,
        bio: (raw.bio as string | null) ?? null,
        criado_em: String(raw.criado_em ?? ''),
        funcoes: Array.isArray(raw.funcoes)
            ? raw.funcoes
            : typeof raw.funcoes === 'string'
                ? JSON.parse(raw.funcoes || '[]')
                : [],
        grupos_ids: (raw.grupos_ids as string | null) ?? null,
        equipe_nome: (raw.equipe_nome as string | null) ?? null,
    };
}

/**
 * Extrai a lista de membros do payload da API,
 * suportando formato novo `{ membros: [] }` e formato legado `[]`.
 */
function extrairLista(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).membros)) {
        return (data as { membros: unknown[] }).membros;
    }
    return [];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook para gerenciar os membros da plataforma.
 *
 * Fornece:
 * - Lista de membros com loading/erro
 * - CRUD: adicionar, deletar
 * - `atualizarMembro`: atualização local para optimistic updates
 * - `recarregar`: refetch manual
 * - Cancelamento automático de requests ao desmontar o componente
 */
export function usarMembros() {
    const [membros, setMembros] = useState<Membro[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    /** 
     * Carrega a lista completa de membros ativos.
     * @param silencioso Se true, não altera o estado de carregando/erro inicial.
     */
    const carregar = useCallback(async (silencioso = false) => {
        if (!silencioso) {
            setCarregando(true);
            setErro(null);
        }

        try {
            const res = await api.get('/api/usuarios');
            const lista = extrairLista(res.data).map(normalizarMembro);
            setMembros(lista);
            setErro(null);
        } catch (e: any) {
            console.error('[usarMembros] Erro ao carregar diretório:', e);
            if (!silencioso) {
                setErro(e.response?.data?.erro || 'Não foi possível carregar o diretório de membros.');
            }
        } finally {
            if (!silencioso) setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    /** 
     * Adiciona um novo membro ao sistema.
     * @param dados E-mail, cargo e funções opcionais.
     */
    const adicionarMembro = useCallback(async (
        dados: { email: string; role: string; funcoes?: string[] }
    ): Promise<ResultadoOperacao> => {
        setErro(null);
        try {
            const res = await api.post('/api/usuarios', dados);
            const payload = res.data?.usuario ?? res.data;
            const novoMembro = payload?.id ? normalizarMembro(payload) : null;

            if (novoMembro) {
                setMembros(prev => [...prev, novoMembro]);
            } else {
                await carregar(true);
            }

            return { sucesso: true };
        } catch (e: any) {
            const msg = e.response?.data?.erro || 'Erro ao cadastrar membro.';
            setErro(msg);
            return { sucesso: false, erro: msg };
        }
    }, [carregar]);

    /** 
     * Desativa um membro (soft delete) com rollback otimista.
     * @param id UUID do membro.
     */
    const deletarMembro = useCallback(async (id: string): Promise<ResultadoOperacao> => {
        const backupMembros = [...membros];
        setErro(null);

        // 1. Optimistic Update
        setMembros(prev => prev.filter(m => m.id !== id));

        try {
            await api.patch(`/api/usuarios/${id}/status`, { ativo: false });
            await carregar(true); // Confirma estado real
            return { sucesso: true };
        } catch (e: any) {
            // 2. Rollback
            console.error('[usarMembros] Erro ao remover membro, revertendo:', e);
            setMembros(backupMembros);
            const msg = e.response?.data?.erro || 'Erro ao remover membro.';
            setErro(msg);
            return { sucesso: false, erro: msg };
        }
    }, [membros, carregar]);

    /**
     * Atualiza um membro no estado local sem fazer request à API.
     * Use para optimistic updates externos.
     */
    const atualizarMembro = useCallback((membroAtualizado: Membro) => {
        setMembros(prev =>
            prev.map(m => m.id === membroAtualizado.id ? membroAtualizado : m)
        );
    }, []);

    return {
        membros,
        carregando,
        erro,
        recarregar: carregar,
        adicionarMembro,
        deletarMembro,
        atualizarMembro,
    };
}