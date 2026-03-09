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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
                <div className="flex shrink-0 items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm">
                    <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" aria-hidden="true" />
                </div>
                <div>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{descricao}</p>
                </div>
            </div>

            {children && (
                <div className="mb-8 w-full text-left bg-accent/20 p-4 rounded-2xl border border-border/40">
                    {children}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                    type="button"
                    onClick={aoFechar}
                    disabled={carregando}
                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={aoConfirmar}
                    disabled={carregando}
                    className="flex-[2] px-6 py-4 bg-rose-600 text-white hover:bg-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
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
