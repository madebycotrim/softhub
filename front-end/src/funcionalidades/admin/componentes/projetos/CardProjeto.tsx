import { memo } from 'react';
import { FolderKanban, Globe, Lock, Github, FileText, Edit, Trash2, BarChart3, Figma, BookText, Link2 } from 'lucide-react';
import { formatarDataHora } from '@/utilitarios/formatadores';
import type { Projeto } from '@/funcionalidades/projetos/hooks/usarProjetos';

interface CardProjetoProps {
    projeto: Projeto;
    index: number;
    podeVerDocumentos: boolean;
    podeEditar: boolean;
    podeExcluir: boolean;
    onVerDocumentos: (p: Projeto) => void;
    onEditar: (p: Projeto) => void;
    onExcluir: (p: Projeto) => void;
}

export const CardProjeto = memo(({ 
    projeto: p, 
    index, 
    podeVerDocumentos, 
    podeEditar, 
    podeExcluir, 
    onVerDocumentos, 
    onEditar, 
    onExcluir 
}: CardProjetoProps) => {
    return (
        <div className={`group relative bg-card hover:bg-muted/30 border border-border rounded-3xl p-6 transition-all duration-300 animar-entrada atraso-${(index % 5) + 1}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-2xl text-primary">
                    <FolderKanban size={20} />
                </div>
                <div className="flex gap-2">
                    {podeVerDocumentos && (
                        <button onClick={() => onVerDocumentos(p)} className="p-2 hover:bg-background rounded-xl text-muted-foreground hover:text-primary transition-colors" title="Documentos (GitHub)">
                            <FileText size={14} />
                        </button>
                    )}
                    {podeEditar && (
                        <button onClick={() => onEditar(p)} className="p-2 hover:bg-background rounded-xl text-muted-foreground hover:text-primary transition-colors" title="Editar Projeto">
                            <Edit size={14} />
                        </button>
                    )}
                    {podeExcluir && (
                        <button onClick={() => onExcluir(p)} className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors" title="Excluir Projeto">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                {p.nome}
                {p.publico ? (
                    <div className="p-1 bg-green-500/10 text-green-500 rounded-full" title="Público (Portfólio)">
                        <Globe size={10} />
                    </div>
                ) : (
                    <div className="p-1 bg-muted text-muted-foreground rounded-full" title="Privado">
                        <Lock size={10} />
                    </div>
                )}
            </h3>
            
            {(p.github_repo || p.documentacao_url || p.figma_url || p.setup_url) && (
                <div className="flex flex-wrap gap-3 mb-3">
                    {p.github_repo && (
                        <a 
                            href={`https://github.com/${import.meta.env.VITE_GITHUB_STORAGE_OWNER}/${p.github_repo}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
                            title="Repositório no GitHub"
                        >
                            <Github size={12} />
                            Code
                        </a>
                    )}
                    {p.figma_url && (
                        <a 
                            href={p.figma_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-indigo-500 transition-colors"
                            title="Design no Figma"
                        >
                            <Figma size={12} />
                            Design
                        </a>
                    )}
                    {p.documentacao_url && (
                        <a 
                            href={p.documentacao_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-sky-500 transition-colors"
                            title="Documentação do Projeto"
                        >
                            <BookText size={12} />
                            Docs
                        </a>
                    )}
                    {p.setup_url && (
                        <a 
                            href={p.setup_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-amber-500 transition-colors"
                            title="Setup / Wiki"
                        >
                            <Link2 size={12} />
                            Wiki
                        </a>
                    )}
                </div>
            )}

            <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
                {p.descricao || 'Sem descrição definida.'}
            </p>

            <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <BarChart3 size={12} />
                    {p.total_tarefas || 0} Tarefas
                </div>
                <div className="text-[10px] text-muted-foreground/60 uppercase font-black">
                    {formatarDataHora(p.criado_em)}
                </div>
            </div>
        </div>
    );
});
