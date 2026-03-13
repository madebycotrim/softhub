import { Database, Trash2 } from 'lucide-react';

export function SecaoDados() {
    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit animar-entrada atraso-1">
            <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
                <div className="p-2.5 bg-slate-500/10 rounded-xl text-slate-500 shadow-sm shadow-slate-500/5">
                    <Database size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground leading-none">Dados</h3>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Compliance & Retenção</span>
                </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
                <button 
                    className="w-full h-12 flex items-center justify-center gap-3 px-4 bg-muted/20 border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-all rounded-xl group/exp"
                    onClick={() => alert('Esta funcionalidade requer confirmação via token de segurança.')}
                >
                    <Trash2 size={14} className="group-hover/exp:scale-110 transition-transform" />
                    Limpar Auditoria ({'>'} 6 meses)
                </button>
                <p className="text-[8.5px] text-muted-foreground/60 leading-relaxed text-center px-4">
                    Conforme Marco Civil da Internet (Art. 15), logs de acesso devem ser mantidos por 6 meses.
                </p>
            </div>
        </div>
    );
}
