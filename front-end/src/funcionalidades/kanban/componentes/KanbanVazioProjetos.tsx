import { memo } from 'react';
import { FolderKanban } from 'lucide-react';

interface KanbanVazioProjetosProps {
    podeGerenciarProjetos: boolean;
}

export const KanbanVazioProjetos = memo(({ podeGerenciarProjetos }: KanbanVazioProjetosProps) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 rounded-[32px] bg-muted/30 border border-border flex items-center justify-center mb-8 shadow-2xl shadow-primary/5">
                <FolderKanban className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-3">Fábrica Vazia</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
                Parece que ainda não existem projetos cadastrados. Você precisa criar um projeto antes de gerenciar tarefas.
            </p>
            {podeGerenciarProjetos ? (
                <a href="/app/admin/projetos" className="h-12 px-8 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center">
                    Criar Primeiro Projeto
                </a>
            ) : (
                <p className="text-[10px] font-black uppercase tracking-widest text-destructive/60 bg-destructive/5 px-4 py-2 rounded-xl border border-destructive/10">
                    Contate um administrador para criar projetos
                </p>
            )}
        </div>
    );
});
