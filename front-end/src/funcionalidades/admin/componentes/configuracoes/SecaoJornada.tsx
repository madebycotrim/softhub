import { Clock, Info } from 'lucide-react';
import type { ConfiguracoesSistema } from '@/funcionalidades/admin/hooks/usarConfiguracoes';

interface Props {
    configuracoes: ConfiguracoesSistema | null;
    atualizarConfiguracao: (chave: keyof ConfiguracoesSistema, valor: any) => Promise<any>;
    podeEditar: boolean;
}

export function SecaoJornada({ configuracoes, atualizarConfiguracao, podeEditar }: Props) {
    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit animar-entrada atraso-4">
            <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-500 shadow-sm shadow-sky-500/5">
                    <Clock size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground leading-none">Jornada</h3>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Janela do Ponto</span>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Início</label>
                        <input 
                            type="time"
                            disabled={!podeEditar}
                            value={configuracoes?.hora_inicio_ponto || '13:00'}
                            onClick={(e) => (e.target as any).showPicker?.()}
                            onChange={(e) => atualizarConfiguracao('hora_inicio_ponto', e.target.value)}
                            className="w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-[13px] font-black text-foreground outline-none focus:bg-background focus:border-sky-500/30 transition-all cursor-pointer"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Término</label>
                        <input 
                            type="time"
                            disabled={!podeEditar}
                            value={configuracoes?.hora_fim_ponto || '17:00'}
                            onClick={(e) => (e.target as any).showPicker?.()}
                            onChange={(e) => atualizarConfiguracao('hora_fim_ponto', e.target.value)}
                            className="w-full bg-muted/40 border border-border/50 rounded-xl px-4 py-3 text-[13px] font-black text-foreground outline-none focus:bg-background focus:border-sky-500/30 transition-all cursor-pointer"
                        />
                    </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed bg-sky-500/[0.03] border border-sky-500/10 p-3 rounded-xl">
                    <Info size={12} className="inline mr-2 text-sky-500" />
                    Membros só poderão registrar ponto dentro deste intervalo.
                </p>
            </div>
        </div>
    );
}
