import { memo } from 'react';
import { Bot, Calendar, MessageSquare, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { formatarDataHora } from '@/utilitarios/formatadores';

interface JustificativaCardMobileProps {
    justificativa: any;
    formatarTipo: (tipo: string) => string;
    analiseIA?: { sugestao: string, analise: string };
    carregandoIA: boolean;
    processandoAcao: boolean;
    onAnalisarIA: (id: string, motivo: string) => void;
    onAprovar: (id: string) => void;
    onInciarRejeicao: (id: string) => void;
}

/**
 * Card mobile para auditoria de justificativas.
 */
export const JustificativaCardMobile = memo(({
    justificativa, formatarTipo, analiseIA, carregandoIA, processandoAcao,
    onAnalisarIA, onAprovar, onInciarRejeicao
}: JustificativaCardMobileProps) => {
    return (
        <div className="p-5 bg-card border border-border/50 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
                <Avatar nome={justificativa.usuario_nome} fotoPerfil={justificativa.usuario_foto} tamanho="md" />
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black uppercase text-foreground truncate">{justificativa.usuario_nome}</span>
                    <span className="text-[10px] text-muted-foreground/60">{justificativa.equipe_nome || 'Sem Equipe'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-muted/5 p-3 rounded-2xl border border-border/20">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/40">
                        <Calendar size={10} />
                        <span>Data Alvo</span>
                    </div>
                    <p className="text-[10px] font-bold text-foreground">{formatarDataHora(justificativa.data_alvo)}</p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/40">
                        <Bot size={10} />
                        <span>Natureza</span>
                    </div>
                    <p className="text-[10px] font-bold text-primary">{formatarTipo(justificativa.tipo)}</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/40">
                    <MessageSquare size={10} />
                    <span>Explicação do Membro</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground italic bg-muted/10 p-3 rounded-2xl border border-border/20">
                    "{justificativa.motivo}"
                </p>
            </div>

            {analiseIA && (
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-2 animar-entrada">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-primary">
                        <BrainCircuit size={14} />
                        <span>Sugestão da IA: {analiseIA.sugestao}</span>
                    </div>
                    <p className="text-[10px] text-primary/70 leading-relaxed">{analiseIA.analise}</p>
                </div>
            )}

            <div className="flex items-center gap-2 pt-2">
                {!analiseIA && (
                    <button
                        onClick={() => onAnalisarIA(justificativa.id, justificativa.motivo)}
                        disabled={carregandoIA || processandoAcao}
                        className="h-10 px-4 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                    >
                        {carregandoIA ? <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <BrainCircuit size={14} />}
                        <span>Analisar com IA</span>
                    </button>
                )}
                
                <button
                    onClick={() => onAprovar(justificativa.id)}
                    disabled={processandoAcao}
                    className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:grayscale"
                >
                    <CheckCircle2 size={14} />
                    <span>Aprovar</span>
                </button>

                <button
                    onClick={() => onInciarRejeicao(justificativa.id)}
                    disabled={processandoAcao}
                    className="h-10 w-10 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:grayscale"
                >
                    <XCircle size={14} />
                </button>
            </div>
        </div>
    );
});
