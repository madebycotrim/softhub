import { memo } from 'react';
import { Network, Users as UsersIcon } from 'lucide-react';

interface RelatorioMapeamentoProps {
    equipesRelatorio: any;
}

export const RelatorioMapeamento = memo(({ equipesRelatorio }: RelatorioMapeamentoProps) => {
    if (!equipesRelatorio) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start px-2">
            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 bg-indigo-50/10 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Mapa de Equipes</h3>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Network size={18} /></div>
                </div>
                <div className="p-6 space-y-4">
                    {equipesRelatorio.equipes?.map((e: any) => (
                        <div key={e.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                        <Network size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{e.nome}</p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Responsável: {e.lider_nome || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <p className="text-lg font-black text-slate-900 leading-none">{e.total_membros}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Time</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-50 bg-emerald-50/10 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Grupos Operativos</h3>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><UsersIcon size={18} /></div>
                </div>
                <div className="p-6 space-y-4">
                    {equipesRelatorio.grupos?.map((g: any) => (
                        <div key={g.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                                <div>
                                    <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{g.nome}</p>
                                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight">Vínculo: {g.equipe_nome || '--'}</p>
                                </div>
                            </div>
                            <div className="bg-white px-5 py-2 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-base font-black text-slate-900">{g.total_membros}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
