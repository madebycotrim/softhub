import { memo } from 'react';
import { Modal } from '@/compartilhado/componentes/Modal';
import { Bell } from 'lucide-react';
import { formatarTempoAtras } from '@/utilitarios/formatadores';

interface ModalNotificacoesProps {
    aberto: boolean;
    aoFechar: () => void;
    notificacoes: any[];
    marcarComoLida: (id: string) => void;
    limparTodas: () => void;
}

export const ModalNotificacoes = memo(({
    aberto,
    aoFechar,
    notificacoes,
    marcarComoLida,
    limparTodas
}: ModalNotificacoesProps) => {
    return (
        <Modal
            aberto={aberto}
            aoFechar={aoFechar}
            titulo="Central de Notificações"
        >
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                {notificacoes.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Recentes</span>
                            <button
                                onClick={limparTodas}
                                className="text-[10px] font-black text-primary hover:underline"
                            >
                                Limpar Todas
                            </button>
                        </div>
                        <div className="space-y-2">
                            {notificacoes.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => marcarComoLida(n.id)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer group/item
                                        ${n.lida
                                            ? 'bg-muted/30 border-border/40 opacity-60'
                                            : 'bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.05]'
                                        }
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-background rounded-xl border border-border/50">
                                            <Bell size={14} className="text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground leading-tight">{n.titulo}</p>
                                            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{n.mensagem}</p>
                                            <span className="text-[10px] font-medium text-muted-foreground/40 mt-2 block">
                                                {formatarTempoAtras(n.criado_em)}
                                            </span>
                                        </div>
                                        {!n.lida && (
                                            <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 bg-muted/30 rounded-full mb-4">
                            <Bell size={32} className="text-muted-foreground/20" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Tudo limpo por aqui!</h3>
                        <p className="text-xs text-muted-foreground mt-1">Você não tem novas notificações.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
});
