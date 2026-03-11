import { AlertTriangle } from 'lucide-react';

interface EstadoErroProps {
    titulo?: string;
    mensagem: string;
    aoTentarNovamente?: () => void;
    textoBotao?: string;
}

export function EstadoErro({ 
    titulo = 'Ocorreu um erro', 
    mensagem, 
    aoTentarNovamente = () => window.location.reload(),
    textoBotao = 'Tentar Novamente'
}: EstadoErroProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-card border border-rose-500/10 rounded-3xl p-10 text-center w-full min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
                 <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-foreground">{titulo}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{mensagem}</p>
            <button 
                onClick={aoTentarNovamente}
                className="mt-4 px-6 py-2.5 bg-foreground text-background rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"
            >
                {textoBotao}
            </button>
        </div>
    );
}
