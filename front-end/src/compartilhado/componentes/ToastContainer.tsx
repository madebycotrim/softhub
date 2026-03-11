import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ToastState } from '@/compartilhado/hooks/usarToast';

interface ToastContainerProps {
    toasts: ToastState[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    role="status"
                    aria-live="polite"
                    className={`
                        flex items-center justify-center gap-2 px-6 py-2.5 rounded-full shadow-xl text-[11px] font-black uppercase tracking-widest
                        animate-in slide-in-from-bottom-4 fade-in duration-300
                        ${toast.tipo === 'sucesso'
                            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                            : 'bg-[#e1003d] text-white shadow-[#e1003d]/20'
                        }
                    `}
                >
                    {toast.tipo === 'sucesso'
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <AlertTriangle className="w-4 h-4 shrink-0" />
                    }
                    {toast.mensagem}
                </div>
            ))}
        </div>
    );
}
