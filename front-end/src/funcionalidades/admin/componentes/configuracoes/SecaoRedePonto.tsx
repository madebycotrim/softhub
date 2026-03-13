import { Database, Plus, Trash2 } from 'lucide-react';
import type { ConfiguracoesSistema } from '@/funcionalidades/admin/hooks/usarConfiguracoes';

interface Props {
    configuracoes: ConfiguracoesSistema | null;
    atualizarConfiguracao: (chave: keyof ConfiguracoesSistema, valor: any) => Promise<any>;
    podeEditar: boolean;
}

export function SecaoRedePonto({ configuracoes, atualizarConfiguracao, podeEditar }: Props) {
    return (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit animar-entrada atraso-3">
            <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shadow-sm shadow-amber-500/5">
                    <Database size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground leading-none">Rede Ponto</h3>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Whitelist de IPs</span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="space-y-2">
                    {(configuracoes?.ips_autorizados_ponto || []).length === 0 ? (
                        <span className="text-[10px] text-muted-foreground/50 italic px-1 block">Nenhuma restrição de IP configurada.</span>
                    ) : (
                        (configuracoes?.ips_autorizados_ponto || []).map(ip => (
                            <div key={ip} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40 group/ip hover:bg-muted/40 transition-colors">
                                <span className="text-[11px] font-mono font-bold text-foreground/80 tracking-widest">{ip}</span>
                                {podeEditar && (
                                    <button 
                                        onClick={async () => {
                                            if (!configuracoes) return;
                                            const novos = configuracoes.ips_autorizados_ponto.filter(i => i !== ip);
                                            await atualizarConfiguracao('ips_autorizados_ponto', novos);
                                        }}
                                        className="opacity-0 group-hover/ip:opacity-100 p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {podeEditar && (
                    <form 
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const ip = formData.get('ip') as string;
                            if (!ip || !configuracoes) return;
                            if (configuracoes.ips_autorizados_ponto?.includes(ip)) return;
                            const novos = [...(configuracoes.ips_autorizados_ponto || []), ip];
                            await atualizarConfiguracao('ips_autorizados_ponto', novos);
                            (e.target as HTMLFormElement).reset();
                        }}
                        className="flex gap-2"
                    >
                        <input 
                            name="ip"
                            placeholder="Ex: 192.168.1.1"
                            className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none focus:bg-background focus:border-amber-500/30 transition-all placeholder:text-muted-foreground/30 font-mono"
                        />
                        <button className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all hover:bg-amber-600 flex items-center justify-center">
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
