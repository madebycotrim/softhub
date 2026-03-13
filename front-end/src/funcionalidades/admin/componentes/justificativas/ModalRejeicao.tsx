import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/compartilhado/componentes/Modal';

interface ModalRejeicaoProps {
    aberto: boolean;
    motivo: string;
    processando: boolean;
    onChangeMotivo: (motivo: string) => void;
    onFechar: () => void;
    onConfirmar: () => void;
}

export const ModalRejeicao = memo(({
    aberto,
    motivo,
    processando,
    onChangeMotivo,
    onFechar,
    onConfirmar
}: ModalRejeicaoProps) => {
    return (
        <Modal
            titulo="Reprovar Justificativa"
            aberto={aberto}
            aoFechar={onFechar}
            largura="sm"
        >
            <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Para manter a transparência, descreva o motivo da reprovação.
                </p>
                <textarea
                    placeholder="Motivo obrigatório de rejeição..."
                    required
                    className="w-full h-28 bg-background border border-border rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    value={motivo}
                    onChange={(e) => onChangeMotivo(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-auto border-t border-border/50">
                    <button
                        type="button"
                        onClick={onFechar}
                        className="w-full sm:w-auto h-11 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmar}
                        disabled={processando || !motivo.trim()}
                        className="w-full sm:w-auto h-11 bg-rose-600 text-white px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-rose-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {processando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Reprovação'}
                    </button>
                </div>
            </div>
        </Modal>
    );
});
