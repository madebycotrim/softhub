import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Carregando } from './Carregando'; // Assumindo import do próximo componente a ser criado

interface ConfirmacaoExclusaoProps {
    aberto: boolean;
    aoFechar: () => void;
    aoConfirmar: () => void;
    titulo: string;
    descricao: string;
    textoBotao?: string;
    carregando?: boolean;
    children?: React.ReactNode;
}

/**
 * Modal centralizado para confirmação de ações destrutivas ou críticas.
 * Passa obrigatoriedade por título e descrição bem claros.
 */
export function ConfirmacaoExclusao({
    aberto,
    aoFechar,
    aoConfirmar,
    titulo,
    descricao,
    textoBotao = 'Confirmar',
    carregando = false,
    children
}: ConfirmacaoExclusaoProps) {
    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo} largura="md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
                <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-2xl bg-destructive/10 sm:h-12 sm:w-12 border border-destructive/20 shadow-inner">
                    <AlertTriangle className="h-6 w-6 text-destructive shrink-0" aria-hidden="true" />
                </div>
                <div>
                    <p className="text-muted-foreground text-[13.5px] leading-relaxed font-medium">{descricao}</p>
                </div>
            </div>

            {children && (
                <div className="mb-8 w-full text-left bg-accent/20 p-4 rounded-2xl border border-border/40">
                    {children}
                </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-4">
                <button
                    type="button"
                    onClick={aoFechar}
                    disabled={carregando}
                    className="inline-flex justify-center w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-muted-foreground bg-transparent border border-border/60 rounded-2xl hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={aoConfirmar}
                    disabled={carregando}
                    className="inline-flex justify-center items-center w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-destructive rounded-2xl hover:bg-destructive/90 hover:scale-[1.02] shadow-[0_10px_20px_-5px_rgba(239,68,68,0.3)] focus:outline-none focus:ring-2 focus:ring-destructive/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {carregando ? (
                        <>
                            <Carregando tamanho="sm" className="mr-2 border-white" />
                            Processando...
                        </>
                    ) : (
                        textoBotao
                    )}
                </button>
            </div>
        </Modal>
    );
}
