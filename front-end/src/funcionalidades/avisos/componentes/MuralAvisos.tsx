import { Plus, Trash2, Megaphone } from 'lucide-react';
import { usarAvisos } from '@/funcionalidades/avisos/hooks/usarAvisos';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { usarPermissao, usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { useState } from 'react';
import { Modal } from '@/compartilhado/componentes/Modal';
import { FormularioAviso } from './FormularioAviso';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
// import { usarAutenticacao } from '@/funcionalidades/avisos/autenticacao/usarAutenticacao';

export function MuralAvisos() {
    const { avisos, carregando, erro } = usarAvisos();
    const podeCriar = usarPermissaoAcesso('avisos:criar');
    const podeRemoverGeral = usarPermissaoAcesso('avisos:remover');
    const isAdmin = usarPermissao('ADMIN');
    const [modalAberto, setModalAberto] = useState(false);
    // const { usuario } = usarAutenticacao();
    const usuarioIdMock = 'u1';

    // Ordenamos os avisos para Urgente aparecer primeiro (Z-A simples usando string compare de prioridade funciona aqui via mock)
    const avisosOrdenados = [...avisos].sort((a, b) => {
        const pVal = { urgente: 3, importante: 2, info: 1 };
        return pVal[b.prioridade] - pVal[a.prioridade];
    });

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
                    <div className="py-24 flex flex-col items-center justify-center gap-4 bg-card/20 border border-border/40 rounded-3xl">
                        <Carregando Centralizar={false} tamanho="lg" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Buscando Comunicados</span>
                    </div>
                ) : erro ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-card/10 border border-red-500/10 rounded-3xl">
                         <p className="text-destructive font-black uppercase tracking-widest text-[10px]">{erro}</p>
                    </div>
                ) : avisosOrdenados.length === 0 ? (
                    <EstadoVazio 
                        titulo="Mural Silencioso"
                        descricao="Nenhum comunicado importante foi publicado recentemente. Aproveite o foco!"
                        compacto={true}
                    />
                ) : (
                    avisosOrdenados.map(aviso => {
                        // Lideres podem apagar os próprios
                        const podeDeletar = isAdmin || podeRemoverGeral || usuarioIdMock === aviso.criado_por.id;
                        const IconePrioridade = aviso.prioridade === 'urgente' ? Megaphone : null; // Destaque extra

                        return (
                            <div key={aviso.id} className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col sm:flex-row gap-6 shadow-sm h-full transition-all group hover:border-primary/50">

                                {aviso.prioridade === 'urgente' && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive" />
                                )}

                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <Emblema
                                            texto={aviso.prioridade === 'importante' || aviso.prioridade === 'urgente' ? 'Importante' : 'Normal'}
                                            variante={aviso.prioridade === 'urgente' ? 'vermelho' : (aviso.prioridade === 'importante' ? 'amarelo' : 'azul')}
                                        />
                                        <span className="text-muted-foreground text-xs">Postado em {formatarDataHora(aviso.criado_em)}</span>
                                        {aviso.expira_em && (
                                            <span className="text-muted-foreground text-xs border-l border-border pl-3">
                                                Expira em {formatarDataHora(aviso.expira_em)}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                                        {IconePrioridade && <IconePrioridade className="inline w-5 h-5 text-destructive mr-2 -mt-1" />}
                                        {aviso.titulo}
                                    </h3>

                                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                        {aviso.conteudo}
                                    </p>
                                </div>

                                <div className="sm:w-48 shrink-0 flex flex-row sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-6">
                                    <div className="flex items-center sm:items-end flex-row-reverse sm:flex-col gap-3">
                                        <Avatar nome={aviso.criado_por.nome} fotoPerfil={aviso.criado_por.foto} tamanho="sm" />
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs text-muted-foreground">Publicado por</p>
                                            <p className="text-sm font-medium text-foreground">{aviso.criado_por.nome}</p>
                                        </div>
                                    </div>

                                        {podeDeletar && (
                                            <button className="p-2 sm:mt-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
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
}
