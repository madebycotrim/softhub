import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../compartilhado/servicos/api';

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
    equipe_id: string | null;
    equipe_nome: string | null;
    grupo_id: string | null;
    grupo_nome: string | null;
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
        equipe_id: (raw.equipe_id as string | null) ?? null,
        equipe_nome: (raw.equipe_nome as string | null) ?? null,
        grupo_id: (raw.grupo_id as string | null) ?? null,
        grupo_nome: (raw.grupo_nome as string | null) ?? null,
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

    // Ref para cancelar requests em andamento ao desmontar
    const abortControllerRef = useRef<AbortController | null>(null);

    // ── Carregar ──────────────────────────────────────────────────────────────

    const carregar = useCallback(async () => {
        // Cancela request anterior se ainda estiver em andamento
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setCarregando(true);
        setErro(null);

        try {
            const res = await api.get('/api/usuarios', {
                signal: controller.signal,
            });

            const lista = extrairLista(res.data).map(normalizarMembro);
            setMembros(lista);
        } catch (e: unknown) {
            // Ignora erro de cancelamento (componente desmontado)
            if (
                e instanceof Error &&
                (e.name === 'CanceledError' || e.name === 'AbortError')
            ) return;

            const axiosError = e as { response?: { data?: { erro?: string } } };
            setErro(
                axiosError.response?.data?.erro ??
                'Não foi possível carregar o diretório de membros.'
            );
        } finally {
            // Só atualiza o estado se este controller ainda for o ativo
            if (abortControllerRef.current === controller) {
                setCarregando(false);
            }
        }
    }, []);

    // ── Adicionar ─────────────────────────────────────────────────────────────

    const adicionarMembro = useCallback(async (
        dados: { email: string; role: string }
    ): Promise<ResultadoOperacao> => {
        try {
            const res = await api.post('/api/usuarios', dados);

            // Suporta resposta com `{ usuario }` ou o objeto diretamente
            const payload = res.data?.usuario ?? res.data;
            const novoMembro = payload?.id ? normalizarMembro(payload) : null;

            if (novoMembro) {
                setMembros(prev => [...prev, novoMembro]);
            } else {
                // Fallback: refetch completo se a API não devolveu o objeto criado
                await carregar();
            }

            return { sucesso: true };
        } catch (e: unknown) {
            const axiosError = e as { response?: { data?: { erro?: string } } };
            return {
                sucesso: false,
                erro: axiosError.response?.data?.erro ?? 'Erro ao cadastrar membro.',
            };
        }
    }, [carregar]);

    // ── Deletar (Soft Delete) ─────────────────────────────────────────────────

    const deletarMembro = useCallback(async (id: string): Promise<ResultadoOperacao> => {
        try {
            await api.patch(`/api/usuarios/${id}/status`, { ativo: false });
            setMembros(prev => prev.filter(m => m.id !== id));
            return { sucesso: true };
        } catch (e: unknown) {
            const axiosError = e as { response?: { data?: { erro?: string } } };
            return {
                sucesso: false,
                erro: axiosError.response?.data?.erro ?? 'Erro ao remover membro.',
            };
        }
    }, []);

    // ── Atualizar localmente (Optimistic Update) ──────────────────────────────

    /**
     * Atualiza um membro no estado local sem fazer request à API.
     * Use para optimistic updates: aplique antes do request e reverta em caso de erro.
     *
     * @example
     * atualizarMembro({ ...membro, role: 'ADMIN' }); // aplica
     * try { await api.patch(...) } catch { atualizarMembro(membro); } // reverte
     */
    const atualizarMembro = useCallback((membroAtualizado: Membro) => {
        setMembros(prev =>
            prev.map(m => m.id === membroAtualizado.id ? membroAtualizado : m)
        );
    }, []);

    // ── Efeitos ───────────────────────────────────────────────────────────────

    useEffect(() => {
        carregar();

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [carregar]);

    // ── Retorno ───────────────────────────────────────────────────────────────

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