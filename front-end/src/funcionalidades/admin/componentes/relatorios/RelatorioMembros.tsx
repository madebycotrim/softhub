import { memo } from 'react';
import { formatarDataHora } from '@/utilitarios/formatadores';

interface RelatorioMembrosProps {
    membrosFiltrados: any[];
}

export const RelatorioMembros = memo(({ membrosFiltrados }: RelatorioMembrosProps) => {
    return (
        <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="p-10 border-b border-slate-50 bg-slate-50/10">
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Histórico Técnico de Assiduidade</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Conferência individual detalhada de cada membro ativo.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro</th>
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe / Cargo</th>
                            <th className="px-10 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessões</th>
                            <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Acesso</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-nowrap">
                        {membrosFiltrados.map((m: any) => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {m.nome.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{m.nome}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{m.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{m.equipe_nome || 'Liderança'}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.grupo_nome || 'Geral'}</p>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center">
                                    <span className="text-2xl font-black text-slate-900 leading-none">{m.dias_presentes}</span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <p className="text-[11px] font-black text-slate-600">
                                        {m.ultima_batida ? formatarDataHora(m.ultima_batida).split('às')[0] : '--'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400">{m.ultima_batida ? formatarDataHora(m.ultima_batida).split('às')[1] : ''}</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});
