import { memo } from 'react';
import { LayoutDashboard, Clock } from 'lucide-react';
import type { RegistroPonto } from '@/funcionalidades/ponto/hooks/usarPonto';

interface PainelStatusJornadaProps {
    ultimoRegistro: RegistroPonto | null;
    cronometroJornada: { texto: string; finalizadoAuto: boolean } | null;
}

export const PainelStatusJornada = memo(({ ultimoRegistro, cronometroJornada }: PainelStatusJornadaProps) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            {/* TILE 2: STATUS */}
            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between gap-4 group hover:border-emerald-500/20 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] transition-all">
                <div className="flex items-start justify-between">
                    <div className="p-3 bg-slate-950/[0.03] text-slate-950 rounded-2xl border border-slate-950/5 group-hover:bg-emerald-500/5 group-hover:text-emerald-600 transition-colors">
                        <LayoutDashboard size={22} strokeWidth={2.5} />
                    </div>
                    <div className={`w-3 h-3 rounded-full mt-2 ring-4 ${ultimoRegistro?.tipo === 'entrada' ? 'bg-emerald-500 ring-emerald-500/10 animate-pulse' : 'bg-slate-200 ring-slate-100'}`} />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Estado Atual</p>
                    <p className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                        {ultimoRegistro?.tipo === 'entrada' ? 'Em Jornada' : 'Em Pausa'}
                    </p>
                </div>
            </div>

            {/* TILE 3: JORNADA */}
            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between gap-4 group hover:border-amber-500/20 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] transition-all">
                <div className="flex items-start justify-between">
                    <div className="p-3 bg-amber-500/5 text-amber-600 rounded-2xl border border-amber-500/5">
                        <Clock size={22} strokeWidth={2.5} />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tempo Decorrido</p>
                    <p className="text-2xl font-black text-slate-900 leading-tight tabular-nums tracking-tight">
                        {cronometroJornada?.texto || '00:00:00'}
                    </p>
                </div>
            </div>
        </div>
    );
});
