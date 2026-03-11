import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface AlertaProps {
    tipo: 'erro' | 'sucesso';
    mensagem: string;
    className?: string;
    flutuante?: boolean;
}

export function Alerta({ tipo, mensagem, className = '', flutuante = false }: AlertaProps) {
    if (!mensagem) return null;

    return (
        <div className={`flex justify-center w-full ${flutuante ? 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-4' : ''} ${className}`}>
            <div className={`
                flex items-center min-w-44 max-w-sm justify-center gap-2 px-6 py-2.5 rounded-full shadow-2xl text-[11px] font-black uppercase tracking-[0.15em]
                animate-in zoom-in-95 fade-in duration-300
                ${tipo === 'sucesso'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-[#e1003d] text-white shadow-[#e1003d]/30'
                }
            `}>
                {tipo === 'sucesso'
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 shrink-0" />
                }
                <span className="truncate">{mensagem}</span>
            </div>
        </div>
    );
}
