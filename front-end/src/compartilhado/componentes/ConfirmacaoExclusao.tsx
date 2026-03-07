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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-full bg-destructive/10 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-destructive shrink-0" aria-hidden="true" />
                </div>
                <div>
                    <p className="text-muted-foreground text-sm">{descricao}</p>
                </div>
            </div>

            {children && (
                <div className="mb-6 w-full text-left">
                    {children}
                </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6">
                <button
                    type="button"
                    onClick={aoFechar}
                    disabled={carregando}
                    className="inline-flex justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={aoConfirmar}
                    disabled={carregando}
                    className="inline-flex justify-center items-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive focus:ring-offset-background transition-colors disabled:opacity-50"
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
