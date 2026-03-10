import { Plus, Trash2, Megaphone } from 'lucide-react';
import { usarAvisos } from './usarAvisos';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { usarPermissao, usarPermissaoAcesso } from '../../compartilhado/hooks/usarPermissao';
import { useState } from 'react';
import { Modal } from '../../compartilhado/componentes/Modal';
import { FormularioAviso } from './FormularioAviso';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
// import { usarAutenticacao } from '../autenticacao/usarAutenticacao';

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

    if (carregando) return <Carregando />;
    if (erro) return <p className="text-destructive text-center py-8">{erro}</p>;

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Mural de Avisos"
                subtitulo="Comunicados importantes para a equipe ou grupos."
                icone={Megaphone}
                variante="destaque"
            >
                {podeCriar && (
                    <button
                        onClick={() => setModalAberto(true)}
                        className="h-11 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-lg hover:bg-black transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Criar Aviso</span>
                    </button>
                )}
            </CabecalhoFuncionalidade>

            <div className="grid grid-cols-1 gap-4">
                {avisosOrdenados.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground border border-border bg-muted/50 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
                        <Megaphone className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg text-foreground font-medium">Nenhum aviso no momento.</p>
                    </div>
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
                                        <button className="p-2 sm:mt-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100">
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
                <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Criar Novo Aviso">
                    <FormularioAviso aoSalvar={() => setModalAberto(false)} />
                </Modal>
            )}

        </div>
    );
}
