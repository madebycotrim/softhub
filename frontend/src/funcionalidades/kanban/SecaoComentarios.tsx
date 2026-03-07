import React, { useState } from 'react';
import { usarComentarios } from './usarComentarios';
import { CartaoComentario } from './CartaoComentario';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Send, MessageSquare } from 'lucide-react';
import { useContext } from 'react';
import { ContextoAutenticacao } from '../../contexto/ContextoAutenticacao';

interface SecaoComentariosProps {
    tarefaId: string;
}

export function SecaoComentarios({ tarefaId }: SecaoComentariosProps) {
    const { comentarios, carregando, erro, enviarComentario, excluirComentario, editarComentario } = usarComentarios(tarefaId);
    const contextoAuth = useContext(ContextoAutenticacao);
    const usuario = contextoAuth?.usuario;
    const [novoComentario, setNovoComentario] = useState('');
    const [enviando, setEnviando] = useState(false);

    const ehLiderOuAdmin = usuario?.role === 'ADMIN' || usuario?.role === 'LIDER_GRUPO' || usuario?.role === 'LIDER_EQUIPE';

    const handleEnviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoComentario.trim()) return;

        setEnviando(true);
        try {
            await enviarComentario(novoComentario);
            setNovoComentario('');
        } catch (error) {
            console.error(error);
        } finally {
            setEnviando(false);
        }
    };

    if (erro) {
        return <div className="text-sm text-destructive p-4 border border-destructive/20 rounded-lg bg-destructive/10 mb-4">Falha ao carregar comentários: {erro}</div>;
    }

    return (
        <div className="flex flex-col h-full bg-card border border-border shadow-sm rounded-xl mt-6">
            <div className="p-4 border-b border-border bg-muted/50 rounded-t-xl shrink-0">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Comentários da Tarefa ({comentarios.length})
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6 min-h-[150px] max-h-[300px]">
                {carregando && comentarios.length === 0 ? (
                    <div className="flex justify-center py-8"><Carregando tamanho="sm" /></div>
                ) : comentarios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <MessageSquare className="w-8 h-8 mb-3 opacity-20" />
                        <p className="text-sm">Nenhum comentário. Seja o primeiro!</p>
                    </div>
                ) : (
                    comentarios.map(c => (
                        <CartaoComentario
                            key={c.id}
                            comentario={c}
                            usuarioLogadoId={usuario?.id || ''}
                            ehLider={ehLiderOuAdmin}
                            aoExcluir={excluirComentario}
                            aoEditar={editarComentario}
                        />
                    ))
                )}
            </div>

            <div className="p-4 border-t border-border bg-muted/50 rounded-b-xl shrink-0">
                <form onSubmit={handleEnviar} className="relative flex items-end gap-2">
                    <textarea
                        value={novoComentario}
                        onChange={(e) => setNovoComentario(e.target.value)}
                        placeholder="Adicione um comentário..."
                        className="w-full bg-background border border-input rounded-xl p-3 pr-12 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-shadow min-h-[60px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleEnviar(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!novoComentario.trim() || enviando}
                        className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center"
                    >
                        {enviando ? <Carregando tamanho="sm" className="border-white" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
