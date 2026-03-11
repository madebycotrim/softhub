import { useState, useCallback, useEffect } from 'react';
import { api } from '@/compartilhado/servicos/api';

export interface EventoHistorico {
    id: string;
    tarefa_id: string;
    usuario_id: string;
    usuario_nome: string;
    usuario_foto: string | null;
    campo_alterado: string;
    valor_antigo: string | null;
    valor_novo: string;
    alterado_em: string;
}

export type TipoEntradaJornal = 'comentario' | 'historico';

export interface EntradaJornal {
    id: string;
    tipo: TipoEntradaJornal;
    data: string;
    usuario: {
        id: string;
        nome: string;
        foto: string | null;
    };
    conteudo: any; // Se for comentário é string, se for histórico são os dados do evento
}

export function usarJornalTarefa(tarefaId: string) {
    const [entradas, setEntradas] = useState<EntradaJornal[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregarDados = useCallback(async () => {
        if (!tarefaId) return;
        setCarregando(true);
        setErro(null);

        try {
            const [respComentarios, respHistorico] = await Promise.all([
                api.get(`/api/tarefas/${tarefaId}/comentarios`),
                api.get(`/api/tarefas/${tarefaId}/historico`)
            ]);

            const comentariosArr: EntradaJornal[] = respComentarios.data.map((c: any) => ({
                id: c.id,
                tipo: 'comentario' as const,
                data: c.criado_em,
                usuario: {
                    id: c.autor_id,
                    nome: c.autor_nome,
                    foto: c.autor_foto
                },
                conteudo: c.conteudo
            }));

            const historicoArr: EntradaJornal[] = respHistorico.data.map((h: any) => ({
                id: h.id,
                tipo: 'historico' as const,
                data: h.alterado_em,
                usuario: {
                    id: h.usuario_id,
                    nome: h.usuario_nome,
                    foto: h.usuario_foto
                },
                conteudo: {
                    campo: h.campo_alterado,
                    antigo: h.valor_antigo,
                    novo: h.valor_novo
                }
            }));

            // Mesclar e ordenar por data decrescente (mais recente primeiro)
            const todas = [...comentariosArr, ...historicoArr].sort(
                (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
            );

            setEntradas(todas);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar o jornal da tarefa');
        } finally {
            setCarregando(false);
        }
    }, [tarefaId]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    return {
        entradas,
        carregando,
        erro,
        recarregar: carregarDados
    };
}
