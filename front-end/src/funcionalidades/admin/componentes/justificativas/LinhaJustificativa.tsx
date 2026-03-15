import { memo } from 'react';
import { Bot, CheckCircle, XCircle, Loader2, Wand2 } from 'lucide-react';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Tooltip } from '@/compartilhado/componentes/Tooltip';
import { formatarDataHora } from '@/utilitarios/formatadores';
import type { JustificativaAdmin } from '@/funcionalidades/admin/hooks/usarJustificativasAdmin';

interface LinhaJustificativaProps {
    justificativa: JustificativaAdmin;
    index: number;
    formatarTipo: (tipo: string) => string;
    analiseIA?: { sugestao: string; analise: string };
    carregandoIA: boolean;
    processandoAcao: boolean;
    onAnalisarIA: (id: string, motivo: string) => void;
    onAprovar: (id: string) => void;
    onInciarRejeicao: (id: string) => void;
}

export const LinhaJustificativa = memo(({
    justificativa: just,
    index,
    formatarTipo,
    analiseIA,
    carregandoIA,
    processandoAcao,
    onAnalisarIA,
    onAprovar,
    onInciarRejeicao
}: LinhaJustificativaProps) => {
    return (
        <tr className={`hover:bg-muted/10 transition-colors group/row border-b border-border/20 last:border-none animar-entrada atraso-${(index % 5) + 1}`}>
            {/* Membro */}
            <td className="px-6 py-5 align-top">
                <div className="flex items-center gap-4">
                    <Avatar nome={just.usuario_nome} fotoPerfil={just.usuario_foto} tamanho="md" />
                    <div className="min-w-0">
                        <p className="font-black text-foreground text-[11px] uppercase tracking-wide truncate mb-0.5">
                            {just.usuario_nome}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 truncate tracking-tight">
                            {just.usuario_email}
                        </p>
                    </div>
                </div>
            </td>

            {/* Status & Data */}
            <td className="px-4 py-5 align-top">
                <div className="flex flex-col items-start gap-2">
                    <div className="scale-90 origin-left">
                        {just.status === 'pendente' && <Emblema texto="Pendente" variante="amarelo" />}
                        {just.status === 'aprovada' && <Emblema texto="Aprovada" variante="verde" />}
                        {just.status === 'rejeitada' && <Emblema texto="Rejeitada" variante="vermelho" />}
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50 w-fit">
                            {just.data}
                        </span>
                        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                            Protocolo: {formatarDataHora(just.criado_em)}
                        </span>
                    </div>
                </div>
            </td>

            {/* Tipo & Motivo */}
            <td className="px-4 py-5 align-top">
                <div className="flex flex-col gap-2 max-w-lg">
                    <span className="text-[10px] font-black tracking-[0.1em] text-primary uppercase bg-primary/5 px-2 py-0.5 rounded w-fit">
                        {formatarTipo(just.tipo)}
                    </span>
                    <span className="text-[12px] text-muted-foreground/80 leading-relaxed font-medium">
                        {just.motivo}
                    </span>
                    
                    {analiseIA && (
                        <div className={`mt-3 p-4 rounded-xl border-2 shadow-sm animate-in slide-in-from-top-2 duration-300 ${
                            analiseIA.sugestao === 'aprovar' 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' 
                            : analiseIA.sugestao === 'rejeitar'
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-600'
                            : 'bg-amber-500/5 border-amber-500/20 text-amber-600'
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-1 rounded-md ${
                                    analiseIA.sugestao === 'aprovar' ? 'bg-emerald-500/10' :
                                    analiseIA.sugestao === 'rejeitar' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                                }`}>
                                    <Bot size={14} strokeWidth={3} />
                                </div>
                                <span className="font-black uppercase tracking-[0.2em] text-[9px]">Análise por IA</span>
                            </div>
                            <p className="text-[11px] leading-relaxed font-semibold">{analiseIA.analise}</p>
                        </div>
                    )}

                    {just.status === 'rejeitada' && just.motivo_rejeicao && (
                        <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <div className="flex items-center gap-1.5 mb-1 text-rose-500">
                                <XCircle size={12} strokeWidth={3} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Motivo da Reprovação</span>
                            </div>
                            <p className="text-[11px] text-rose-600/80 font-medium">{just.motivo_rejeicao}</p>
                        </div>
                    )}
                </div>
            </td>

            {/* Ações */}
            <td className="px-6 py-5 align-middle">
                <div className="flex items-center justify-end gap-3">
                    {just.status === 'pendente' ? (
                        <div className="flex items-center gap-2 bg-muted/10 p-1.5 rounded-2xl border border-border/30">
                            <Tooltip texto="Consultar IA">
                                <button
                                    onClick={() => onAnalisarIA(just.id, just.motivo)}
                                    disabled={carregandoIA || !!analiseIA}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-background text-primary hover:bg-primary hover:text-white transition-all border border-border hover:shadow-lg disabled:opacity-30 active:scale-90"
                                >
                                    {carregandoIA ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <Wand2 className="w-5 h-5" strokeWidth={2.5} />}
                                </button>
                            </Tooltip>
                            
                            <div className="w-px h-6 bg-border/40 mx-1" />

                            <Tooltip texto="Aprovar">
                                <button
                                    onClick={() => onAprovar(just.id)}
                                    disabled={processandoAcao}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-90 disabled:opacity-30"
                                >
                                    {processandoAcao ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <CheckCircle className="w-5 h-5" strokeWidth={2.5} />}
                                </button>
                            </Tooltip>
                            <Tooltip texto="Rejeitar">
                                <button
                                    onClick={() => onInciarRejeicao(just.id)}
                                    disabled={processandoAcao}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-90 disabled:opacity-30"
                                >
                                    <XCircle className="w-5 h-5" strokeWidth={2.5} />
                                </button>
                            </Tooltip>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border border-border/50 rounded-xl">
                            <CheckCircle size={14} className="text-muted-foreground/30" strokeWidth={3} />
                            <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">
                                Finalizado
                            </span>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
});
