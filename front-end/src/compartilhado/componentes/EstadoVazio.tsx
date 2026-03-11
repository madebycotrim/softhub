import type { ReactNode } from 'react';
import { Ghost, SearchX, X } from 'lucide-react';

interface EstadoVazioProps {
    tipo?: 'vazio' | 'pesquisa';
    titulo: string;
    descricao?: string;
    acao?: {
        rotulo: string;
        aoClicar: () => void;
    };
    iconeCustom?: ReactNode;
    compacto?: boolean;
}

/**
 * Tela a ser exibida como fallback amigável quando listas retornarem 0 items.
 * Agora com design premium padronizado para todo o sistema.
 */
export function EstadoVazio({ 
    tipo = 'vazio', 
    titulo, 
    descricao, 
    acao, 
    iconeCustom,
    compacto = false 
}: EstadoVazioProps) {
    return (
        <div className={`flex flex-col items-center justify-center px-6 h-full text-center animate-in fade-in zoom-in-95 duration-500 w-full ${compacto ? 'py-6 min-h-[200px]' : 'py-20 min-h-[400px]'}`}>
            {/* Design do Ícone */}
            <div className={`${compacto ? 'mb-3' : 'mb-6'} relative`}>
                {iconeCustom ? (
                    <div className={`${compacto ? 'w-12 h-12' : 'w-20 h-20'} bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-sm transition-all`}>
                        {iconeCustom}
                    </div>
                ) : tipo === 'pesquisa' ? (
                    <div className={`${compacto ? 'w-12 h-12' : 'w-20 h-20'} bg-slate-100 rounded-full flex items-center justify-center relative border border-slate-200 shadow-sm transition-all`}>
                        <SearchX className={`${compacto ? 'w-6 h-6' : 'w-10 h-10'} text-slate-400`} strokeWidth={1.5} />
                        <div className={`absolute top-0 right-0 ${compacto ? 'w-4 h-4 border-2' : 'w-6 h-6 border-4'} bg-rose-500 rounded-full border-white flex items-center justify-center`}>
                            <X size={compacto ? 8 : 10} className="text-white" strokeWidth={3} />
                        </div>
                    </div>
                ) : (
                    <div className={`${compacto ? 'w-12 h-12' : 'w-20 h-20'} bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner transition-all`}>
                        <Ghost className={`${compacto ? 'w-6 h-6' : 'w-10 h-10'} text-slate-300 animate-bounce transition-all duration-1000`} strokeWidth={1} />
                    </div>
                )}
            </div>

            <h3 className={`${compacto ? 'text-sm' : 'text-xl'} font-bold text-slate-800 mb-2`}>
                {titulo}
            </h3>

            {descricao && (
                <p className={`text-slate-500 ${compacto ? 'text-[11px] max-w-[200px]' : 'text-sm max-w-sm'} mx-auto ${compacto ? 'mb-4' : 'mb-8'} leading-relaxed`}>
                    {descricao}
                </p>
            )}

            {acao && (
                <button
                    onClick={acao.aoClicar}
                    className={`inline-flex items-center gap-2 ${compacto ? 'h-9 px-4' : 'h-11 px-8'} bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 hover:shadow-primary/20`}
                >
                    {tipo === 'pesquisa' && <X size={compacto ? 12 : 14} />}
                    {acao.rotulo}
                </button>
            )}

            {tipo === 'vazio' && !acao && (
                <div className={`${compacto ? 'mt-4' : 'mt-8'} flex gap-1.5`}>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                </div>
            )}
        </div>
    );
}
