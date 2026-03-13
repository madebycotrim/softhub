import { useState } from 'react';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { FolderKanban, Globe, Lock, Github, FileText, BarChart3, Layers } from 'lucide-react';
import { DocumentosProjetoModal } from './DocumentosProjetoModal';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { Carregando } from '@/compartilhado/componentes/Carregando';

export default function PaginaVisaoProjeto() {
    const { projetoAtivoId } = usarAutenticacao();
    const { projetos, carregando } = usarProjetos();
    const [modalDocsAberto, setModalDocsAberto] = useState(false);
    
    const podeVerDocumentos = usarPermissaoAcesso('projetos:documentos');

    const projeto = projetos.find(p => p.id === projetoAtivoId);

    if (carregando && !projeto) {
        return <div className="flex justify-center py-20"><Carregando /></div>;
    }

    if (!projeto) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Layers size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-black uppercase tracking-widest mb-2">Nenhum Projeto Selecionado</h3>
                <p className="text-muted-foreground text-sm">Selecione um projeto na barra lateral para ver seus detalhes.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animar-entrada">
            <CabecalhoFuncionalidade
                titulo={projeto.nome}
                subtitulo="Visão geral e artefatos deste projeto."
                icone={FolderKanban}
            >
                <div className="flex gap-2">
                    {podeVerDocumentos && (
                        <button 
                            onClick={() => setModalDocsAberto(true)}
                            className="h-10 px-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <FileText size={14} /> Arquivos e Docs
                        </button>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card Principal - Detalhes */}
                <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        {projeto.publico ? (
                            <div className="p-2 bg-green-500/10 text-green-500 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                <Globe size={14} /> Público
                            </div>
                        ) : (
                            <div className="p-2 bg-muted text-muted-foreground rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                <Lock size={14} /> Privado
                            </div>
                        )}
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            Criado em {formatarDataHora(projeto.criado_em)}
                        </span>
                    </div>

                    <h2 className="text-xl font-black text-foreground mb-4">Sobre o Projeto</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {projeto.descricao || 'Nenhuma descrição fornecida para este projeto.'}
                    </p>
                </div>

                {/* Coluna Direita - Informações e Links */}
                <div className="flex flex-col gap-6">
                    
                    {/* Github Repo */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Github size={16} className="text-muted-foreground" />
                            Repositório
                        </h3>
                        {projeto.github_repo ? (
                            <div>
                                <a 
                                    href={`https://github.com/${import.meta.env.VITE_GITHUB_STORAGE_OWNER}/${projeto.github_repo}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-primary hover:underline font-bold text-sm block mb-1 break-all"
                                >
                                    {projeto.github_repo}
                                </a>
                                <p className="text-xs text-muted-foreground">Repositório vinculado para armazenamento de documentos.</p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground/60 italic">Nenhum repositório GitHub vinculado a este projeto.</p>
                        )}
                    </div>

                    {/* Stats (Pode ser estendido no futuro) */}
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-muted-foreground" />
                            Estatísticas
                        </h3>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Total Tarefas</span>
                                <span className="text-lg font-black text-foreground">{projeto.total_tarefas || 0}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <DocumentosProjetoModal
                projeto={projeto}
                aberto={modalDocsAberto}
                aoFechar={() => setModalDocsAberto(false)}
            />
        </div>
    );
}
