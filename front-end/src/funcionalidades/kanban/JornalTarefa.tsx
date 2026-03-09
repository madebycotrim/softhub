import React, { useState } from 'react';
import { usarJornalTarefa } from './usarJornalTarefa';
import { usarComentarios } from './usarComentarios';
import { formatarTempoAtras, formatarEventoHistorico } from '../../utilitarios/formatadores';
import { usarPermissaoAcesso } from '../../compartilhado/hooks/usarPermissao';
import { History, Send, Layout, UserPlus, Tag, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { useContext } from 'react';
import { ContextoAutenticacao } from '../../contexto/ContextoAutenticacao';

interface JornalTarefaProps {
    tarefaId: string;
}

export function JornalTarefa({ tarefaId }: JornalTarefaProps) {
    const { entradas, carregando, erro, recarregar } = usarJornalTarefa(tarefaId);
    const { enviarComentario } = usarComentarios(tarefaId);
    const contextoAuth = useContext(ContextoAutenticacao);
    const podeComentar = usarPermissaoAcesso('tarefas:comentar');
    const [novoComentario, setNovoComentario] = useState('');
    const [enviando, setEnviando] = useState(false);

    const handleEnviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoComentario.trim()) return;

        setEnviando(true);
        try {
            await enviarComentario(novoComentario);
            setNovoComentario('');
            recarregar(); // Recarrega o jornal para mostrar o novo comentário
        } catch (error) {
            console.error(error);
        } finally {
            setEnviando(false);
        }
    };

    if (erro) return <div className="text-sm text-red-500 py-4">{erro}</div>;

    return (
        <div className="flex flex-col gap-6 mt-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Linha do Tempo
            </h3>

            {/* Formulário de Comentário Estilo Social */}
            {podeComentar && (
                <div className="flex gap-3">
                    <Avatar 
                        nome={contextoAuth?.usuario?.nome || ''} 
                        fotoPerfil={contextoAuth?.usuario?.foto_perfil || null} 
                        tamanho="md"
                    />
                    <form onSubmit={handleEnviar} className="flex-1 relative">
                        <textarea
                            value={novoComentario}
                            onChange={(e) => setNovoComentario(e.target.value)}
                            placeholder="Escreva um comentário ou atualização..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 pr-12 text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]"
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
                            className="absolute right-2 bottom-2 p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-30 flex items-center justify-center shadow-lg"
                        >
                            {enviando ? <Carregando tamanho="sm" /> : <Send className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            )}

            {/* Feed Chronológico */}
            <div className="relative space-y-8 pl-1">
                {/* Linha vertical centralizada nos avatares */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100" />

                {carregando && entradas.length === 0 ? (
                    <div className="flex justify-center py-10"><Carregando /></div>
                ) : entradas.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm italic">Nenhuma atividade registrada ainda.</div>
                ) : (
                    entradas.map((entrada) => (
                        <div key={entrada.id} className="relative flex gap-4 group">
                            {/* Avatar / Ícone */}
                            <div className="relative z-10 shrink-0">
                                {entrada.tipo === 'comentario' ? (
                                    <Avatar 
                                        nome={entrada.usuario.nome} 
                                        fotoPerfil={entrada.usuario.foto} 
                                        tamanho="md"
                                        className="ring-4 ring-white"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 shadow-sm ring-4 ring-white">
                                        <IconeEvento campo={entrada.conteudo.campo} />
                                    </div>
                                )}
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 pt-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold text-slate-900">{entrada.usuario.nome}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {formatarTempoAtras(entrada.data)}
                                    </span>
                                </div>

                                {entrada.tipo === 'comentario' ? (
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed shadow-sm group-hover:bg-white transition-colors">
                                        {entrada.conteudo}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 font-medium">
                                        {formatarEventoHistorico(entrada.conteudo.campo, entrada.conteudo.antigo, entrada.conteudo.novo)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function IconeEvento({ campo }: { campo: string }) {
    switch (campo) {
        case 'status': return <Layout size={14} />;
        case 'responsavel': return <UserPlus size={14} />;
        case 'prioridade': return <Tag size={14} />;
        case 'concluido': return <CheckCircle2 size={14} className="text-green-500" />;
        default: return <History size={14} />;
    }
}
