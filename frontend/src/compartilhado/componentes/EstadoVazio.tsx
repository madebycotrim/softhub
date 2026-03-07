import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';

interface EstadoVazioProps {
    titulo: string;
    descricao?: string;
    acao?: {
        rotulo: string;
        aoClicar: () => void;
    };
    iconeCustom?: ReactNode;
}

/**
 * Tela a ser exibida como fallback amigável quando listas retornarem 0 items.
 */
export function EstadoVazio({ titulo, descricao, acao, iconeCustom }: EstadoVazioProps) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-white/5 bg-slate-900/30 w-full min-h-[300px]">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400">
                {iconeCustom ? iconeCustom : <PackageOpen className="w-8 h-8" strokeWidth={1.5} />}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
                {titulo}
            </h3>

            {descricao && (
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                    {descricao}
                </p>
            )}

            {acao && (
                <button
                    onClick={acao.aoClicar}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-950"
                >
                    {acao.rotulo}
                </button>
            )}
        </div>
    );
}
