import { AlertTriangle, RotateCw } from 'lucide-react';

interface EstadoErroProps {
    titulo?: string;
    mensagem: string;
    aoTentarNovamente?: () => void;
    textoBotao?: string;
    children?: React.ReactNode;
}

export function EstadoErro({ 
    mensagem, 
    aoTentarNovamente,
    children
}: EstadoErroProps) {
    return (
        <div className="flex-1 w-full flex items-end justify-center pb-24 px-8 min-h-[400px]">
            <div className={`
                flex items-center min-w-[200px] max-w-lg justify-center gap-2 px-6 py-2.5 rounded-full shadow-2xl text-[11px] font-black uppercase tracking-[0.15em]
                animate-in zoom-in-95 fade-in duration-300
                bg-[#e1003d] text-white shadow-[#e1003d]/30
            `}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">{mensagem}</span>
                {aoTentarNovamente && (
                    <button 
                        onClick={aoTentarNovamente}
                        className="ml-2 hover:opacity-80 transition-opacity p-1 bg-white/10 rounded-full"
                        title="Tentar Novamente"
                    >
                        <RotateCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}
