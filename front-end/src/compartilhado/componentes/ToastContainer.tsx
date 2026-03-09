import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { ToastState } from '../hooks/usarToast';

interface ToastContainerProps {
    toasts: ToastState[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    role="status"
                    aria-live="polite"
                    className={`
                        flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium
                        animate-in slide-in-from-bottom-2 fade-in duration-300
                        ${toast.tipo === 'sucesso'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }
                    `}
                >
                    {toast.tipo === 'sucesso'
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <AlertCircle className="w-4 h-4 shrink-0" />
                    }
                    {toast.mensagem}
                </div>
            ))}
        </div>
    );
}
