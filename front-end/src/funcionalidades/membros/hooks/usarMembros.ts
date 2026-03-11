import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Membro {
    id: string;
    nome: string;
    email: string;
    role: string;
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

function normalizarMembro(m: unknown): Membro {
    const raw = m as Record<string, unknown>;
    return {
        id: String(raw.id ?? ''),
        nome: String(raw.nome ?? ''),
        email: String(raw.email ?? ''),
        role: String(raw.role ?? 'MEMBRO'),
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

function extrairLista(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).membros)) {
        return (data as { membros: unknown[] }).membros;
    }
    return [];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usarMembros() {
    const queryClient = useQueryClient();

    // 1. Fetching com React Query
    const { 
        data: membros = [], 
        isLoading: carregando, 
        error 
    } = useQuery({
        queryKey: ['membros'],
        queryFn: async () => {
            const res = await api.get('/api/usuarios');
            return extrairLista(res.data).map(normalizarMembro);
        }
    });

    const erro = error instanceof Error ? error.message : null;

    // 2. Mutations
    const mutationAdicionar = useMutation({
        mutationFn: async (dados: { email: string; role: string; funcoes?: string[] }) => {
            const res = await api.post('/api/usuarios', dados);
            return res.data?.usuario ?? res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['membros'] });
        }
    });

    const mutationDeletar = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/usuarios/${id}`);
        },
        // Optimistic Update
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['membros'] });
            const snapshot = queryClient.getQueryData<Membro[]>(['membros']);
            
            queryClient.setQueryData<Membro[]>(['membros'], old => 
                old ? old.filter(m => m.id !== id) : []
            );

            return { snapshot };
        },
        onError: (_err, _id, context) => {
            if (context?.snapshot) {
                queryClient.setQueryData(['membros'], context.snapshot);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['membros'] });
        }
    });

    // ─── Adaptação para a interface antiga ───────────────────────────────────

    const carregar = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ['membros'] });
    }, [queryClient]);

    const adicionarMembro = useCallback(async (dados: { email: string; role: string; funcoes?: string[] }): Promise<ResultadoOperacao> => {
        try {
            await mutationAdicionar.mutateAsync(dados);
            return { sucesso: true };
        } catch (e: any) {
            return { sucesso: false, erro: e.message || 'Erro ao cadastrar membro.' };
        }
    }, [mutationAdicionar]);

    const deletarMembro = useCallback(async (id: string): Promise<ResultadoOperacao> => {
        try {
            await mutationDeletar.mutateAsync(id);
            return { sucesso: true };
        } catch (e: any) {
            return { sucesso: false, erro: e.message || 'Erro ao remover membro.' };
        }
    }, [mutationDeletar]);

    const atualizarMembro = useCallback((membroAtualizado: Membro) => {
        queryClient.setQueryData<Membro[]>(['membros'], old => 
            old ? old.map(m => m.id === membroAtualizado.id ? membroAtualizado : m) : []
        );
    }, [queryClient]);

    return {
        membros,
        carregando,
        erro: erro || (mutationAdicionar.error?.message) || (mutationDeletar.error?.message) || null,
        recarregar: carregar,
        adicionarMembro,
        deletarMembro,
        atualizarMembro,
    };
}
