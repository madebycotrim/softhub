import { useState, useCallback, useEffect } from 'react';
import { api } from '@/compartilhado/servicos/api';

export interface Comentario {
    id: string;
    conteudo: string;
    autor_id: string;
    autor_nome: string;
    autor_foto: string | null;
    criado_em: string;
    atualizado_em: string | null;
}

export function usarComentarios(tarefaId: string) {
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const carregarComentarios = useCallback(async () => {
        if (!tarefaId) return;
        setCarregando(true);
        setErro(null);
        try {
            const { data } = await api.get(`/tarefas/${tarefaId}/comentarios`);
            setComentarios(data);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar comentários');
        } finally {
            setCarregando(false);
        }
    }, [tarefaId]);

    useEffect(() => {
        carregarComentarios();
    }, [carregarComentarios]);

    const enviarComentario = async (conteudo: string) => {
        try {
            await api.post(`/tarefas/${tarefaId}/comentarios`, { conteudo });
            await carregarComentarios();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao enviar comentário');
        }
    };

    const excluirComentario = async (id: string) => {
        try {
            await api.delete(`/tarefas/comentarios/${id}`);
            setComentarios(prev => prev.filter(c => c.id !== id));
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao excluir comentário');
        }
    };

    const editarComentario = async (id: string, conteudo: string) => {
        try {
            await api.patch(`/tarefas/comentarios/${id}`, { conteudo });
            await carregarComentarios();
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Falha ao editar comentário');
        }
    };

    return {
        comentarios,
        carregando,
        erro,
        enviarComentario,
        excluirComentario,
        editarComentario,
        recarregar: carregarComentarios
    };
}
