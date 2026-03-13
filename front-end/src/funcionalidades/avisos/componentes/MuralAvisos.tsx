import { useState, useMemo, memo } from 'react';
import { Plus, Trash2, Megaphone } from 'lucide-react';
import { usarAvisos } from '@/funcionalidades/avisos/hooks/usarAvisos';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { usarPermissao, usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Modal } from '@/compartilhado/componentes/Modal';
import { FormularioAviso } from './FormularioAviso';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';

export const MuralAvisos = memo(() => {
    const { avisos, carregando, erro, removerAviso } = usarAvisos();
    const podeCriar = usarPermissaoAcesso('avisos:criar');
    const podeRemoverGeral = usarPermissaoAcesso('avisos:remover');
    const isAdmin = usarPermissao('ADMIN');
    const [modalAberto, setModalAberto] = useState(false);
    const { usuario } = usarAutenticacao();

    // Ordenamos os avisos para Urgente aparecer primeiro
    const avisosOrdenados = useMemo(() => {
        return [...avisos].sort((a, b) => {
            const pVal: Record<string, number> = { urgente: 3, importante: 2, info: 1 };
            return (pVal[b.prioridade] || 0) - (pVal[a.prioridade] || 0);
        });
    }, [avisos]);

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Mural de Avisos"
                subtitulo="Comunicados importantes para a equipe ou grupos."
                icone={Megaphone}
                variante="destaque"
            >
                <div className="flex items-center gap-4">
                    {carregando && avisos.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse transition-all">
                            <Carregando Centralizar={false} tamanho="sm" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Sincronizando...</span>
                        </div>
                    )}
                    {podeCriar && (
                        <button
                            onClick={() => setModalAberto(true)}
                            className="h-11 px-5 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus size={18} />
                            <span>Criar Aviso</span>
                        </button>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            <div className={`grid grid-cols-1 gap-4 transition-opacity duration-300 ${carregando && avisos.length > 0 ? 'opacity-70' : 'opacity-100'}`}>
                {carregando && avisos.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4 bg-card/20 border border-border/40 rounded-2xl">
                        <Carregando Centralizar={false} tamanho="lg" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Buscando Comunicados</span>
                    </div>
                ) : erro ? (
                    <div className="py-24 max-w-lg mx-auto w-full">
                         <EstadoErro titulo="Erro no Mural" mensagem={erro} />
                    </div>
                ) : avisosOrdenados.length === 0 ? (
                    <EstadoVazio 
                        titulo="Mural Silencioso"
                        descricao="Nenhum comunicado importante foi publicado recentemente. Aproveite o foco!"
                    />
                ) : (
                    avisosOrdenados.map(aviso => {
                        // Lideres podem apagar os próprios
                        const podeDeletar = isAdmin || podeRemoverGeral || usuario?.id === aviso.criado_por.id;
                        const IconePrioridade = aviso.prioridade === 'urgente' ? Megaphone : null; // Destaque extra

                        return (
                            <div key={aviso.id} className="bg-card border border-border rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row gap-6 shadow-sm h-full transition-all group hover:border-primary/30">

                                {aviso.prioridade === 'urgente' && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
                                )}

                                {/* Lado Esquerdo - Conteúdo Principal */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-2xl ${
                                            aviso.prioridade === 'urgente' ? 'bg-rose-50 text-rose-600 border border-rose-200/50' :
                                            aviso.prioridade === 'importante' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' :
                                            'bg-blue-50 text-blue-600 border border-blue-200/50'
                                        }`}>
                                            {aviso.prioridade === 'urgente' ? 'Urgente' : aviso.prioridade === 'importante' ? 'Importante' : 'Normal'}
                                        </span>
                                        <span className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-wider pl-2">
                                            {formatarDataHora(aviso.criado_em)}
                                        </span>
                                        {aviso.expira_em && (
                                            <span className="text-muted-foreground/50 text-[10px] uppercase font-bold tracking-wider border-l border-border pl-3 ml-1">
                                                Exp. {formatarDataHora(aviso.expira_em)}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className={`text-[17px] font-bold text-foreground tracking-tight ${aviso.conteudo ? 'mb-2' : 'mb-0'}`}>
                                        {IconePrioridade && <IconePrioridade className="inline w-5 h-5 text-destructive mr-2 -mt-1" />}
                                        {aviso.titulo}
                                    </h3>

                                    {aviso.conteudo && (
                                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-[15px]">
                                            {aviso.conteudo}
                                        </p>
                                    )}
                                </div>

                                {/* Lado Direito - Autor e Ações */}
                                <div className="sm:w-56 shrink-0 flex flex-row sm:flex-col justify-between items-center sm:items-stretch border-t sm:border-t-0 sm:border-l border-border pt-5 sm:pt-0 sm:pl-6 relative">
                                    
                                    {/* Lixeira (Topo direita no Desktop, visível caso passe o mouse. Em mobile, direita) */}
                                    <div className="order-2 sm:order-1 flex justify-end min-h-[32px]">
                                        {podeDeletar && (
                                            <button 
                                                onClick={() => removerAviso(aviso.id)}
                                                className="p-2 sm:-mt-2 sm:-mr-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-colors sm:opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
                                                title="Apagar Aviso"
                                            >
                                                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Autor (Inferior no Desktop, Esquerda no Mobile) */}
                                    <div className="order-1 sm:order-2 flex items-center justify-start sm:justify-end gap-3 mt-auto flex-1 sm:flex-initial min-w-0">
                                        <div className="text-left sm:text-right min-w-0">
                                            <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-0.5">Publicado por</p>
                                            <p className="text-[13px] font-bold text-foreground leading-tight sm:line-clamp-2">{aviso.criado_por.nome || 'Sistema'}</p>
                                        </div>
                                        <div className="shrink-0">
                                            {/* Foto ou Iniciais */}
                                            <Avatar nome={aviso.criado_por.nome || 'S'} fotoPerfil={aviso.criado_por.foto} tamanho="md" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {modalAberto && (
                <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Criar Novo Aviso" largura="sm">
                    <FormularioAviso aoSalvar={() => setModalAberto(false)} />
                </Modal>
            )}

        </div>
    );
});
 
export default MuralAvisos;
