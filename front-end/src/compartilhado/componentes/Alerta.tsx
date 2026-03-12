import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface AlertaProps {
    tipo: 'erro' | 'sucesso';
    mensagem: string;
    className?: string;
    flutuante?: boolean;
}

/**
 * Componente de Alerta Premium com design glassmorphism e animações suaves.
 * Resolve o problema de truncamento de mensagens longas.
 */
export function Alerta({ tipo, mensagem, className = '', flutuante = false }: AlertaProps) {
    if (!mensagem) return null;

    return (
        <div className={`flex justify-center w-full pointer-events-none ${flutuante ? 'fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-4' : ''} ${className}`}>
            <div className={`
                relative overflow-hidden pointer-events-auto
                flex items-center gap-4 px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
                min-w-[320px] max-w-[min(540px,95vw)]
                text-[11px] font-black uppercase tracking-[0.2em] leading-tight
                transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                animate-in slide-in-from-bottom-8 zoom-in-95 fade-in duration-700
                ${tipo === 'sucesso'
                    ? 'bg-emerald-600/90 backdrop-blur-xl text-white border border-white/20'
                    : 'bg-[#e1003d]/90 backdrop-blur-xl text-white border border-white/20'
                }
            `}>
                {/* 🎇 Efeito de Brilho Dinâmico de Fundo */}
                <div className={`absolute -inset-4 opacity-30 blur-3xl animate-pulse -z-10 ${tipo === 'sucesso' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                
                {/* 🌊 Gradiente de Profundidade */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />

                <div className="relative flex items-center gap-4 w-full">
                    {/* Ícone com Container Estilizado */}
                    <div className={`
                        flex items-center justify-center w-10 h-10 rounded-2xl shrink-0
                        bg-white/10 shadow-inner border border-white/10
                    `}>
                        {tipo === 'sucesso'
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <AlertTriangle className="w-5 h-5" />
                        }
                    </div>
                    
                    {/* Mensagem centralizada e sem corte */}
                    <span className="flex-1 text-center drop-shadow-md font-black">
                        {mensagem}
                    </span>
                </div>
            </div>
        </div>
    );
}
