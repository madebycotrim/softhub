import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../compartilhado/componentes/Modal';
import { Fingerprint, Calendar, Info, AlertCircle } from 'lucide-react';
import { Carregando } from '../../compartilhado/componentes/Carregando';

const esquemaJustificativa = z.object({
    data: z.string().optional().or(z.literal('')),
    tipo: z.enum(['ausencia', 'esquecimento', 'problema_sistema']),
    motivo: z.string().min(10, 'O motivo precisa ter pelo menos 10 caracteres.')
});

type DadosJustificativa = z.infer<typeof esquemaJustificativa>;

interface FormularioJustificativaProps {
    aberto: boolean;
    aoFechar: (aberto: boolean) => void;
    aoSalvar: (dados: { data: string; tipo: string; motivo: string }) => Promise<void>;
    justificativaAtual?: { id: string; data: string; tipo: string; motivo: string } | null;
}

export function FormularioJustificativa({ aberto, aoFechar, aoSalvar, justificativaAtual }: FormularioJustificativaProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<DadosJustificativa>({
        resolver: zodResolver(esquemaJustificativa),
        defaultValues: { data: '', tipo: 'esquecimento', motivo: '' }
    });

    const [erroGlobal, setErroGlobal] = useState<string | null>(null);

    // Preenche para edição
    useEffect(() => {
        if (aberto) {
            if (justificativaAtual) {
                reset({
                    data: justificativaAtual.data,
                    tipo: justificativaAtual.tipo as any,
                    motivo: justificativaAtual.motivo
                });
            } else {
                reset({ data: '', tipo: 'esquecimento', motivo: '' });
            }
            setErroGlobal(null);
        }
    }, [aberto, justificativaAtual, reset]);

    const onSubmit = async (dados: DadosJustificativa) => {
        try {
            setErroGlobal(null);

            let dataEnvio = dados.data;
            if (!dataEnvio) {
                const hoje = new Date();
                const opcoes: Intl.DateTimeFormatOptions = { 
                    timeZone: 'America/Sao_Paulo', 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                };
                const dataFormatada = new Intl.DateTimeFormat('pt-BR', opcoes).format(hoje);
                const [dia, mes, ano] = dataFormatada.split('/');
                dataEnvio = `${ano}-${mes}-${dia}`;
            }

            await aoSalvar({
                data: dataEnvio,
                tipo: dados.tipo,
                motivo: dados.motivo
            });

            reset({ data: '', tipo: 'esquecimento', motivo: '' });
            aoFechar(false);
        } catch (e: any) {
            setErroGlobal(e.message || 'Falha ao salvar a justificativa.');
        }
    };

    return (
        <Modal 
            aberto={aberto} 
            aoFechar={() => aoFechar(false)} 
            titulo={justificativaAtual ? "Editar Justificativa" : "Justificar Ponto"} 
            largura="sm"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {erroGlobal && (
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold uppercase tracking-widest border border-rose-100 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4" />
                        {erroGlobal}
                    </div>
                )}

                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Data da Ocorrência</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="date"
                                    {...register('data')}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-sans"
                                />
                            </div>
                            {errors.data && <span className="text-[10px] font-bold text-rose-500 mt-2 block ml-1">{errors.data.message}</span>}
                        </div>

                        <div className="group">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Tipo da Justificativa</label>
                            <div className="relative">
                                <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <select 
                                    {...register('tipo')}
                                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="esquecimento">Esquecimento</option>
                                    <option value="problema_sistema">Erro Sistema</option>
                                    <option value="ausencia">Ausência</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            {errors.tipo && <span className="text-[10px] font-bold text-rose-500 mt-2 block ml-1">{errors.tipo.message}</span>}
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Motivo e Detalhes</label>
                        <textarea
                            placeholder="Explique com detalhes o ocorrido..."
                            {...register('motivo')}
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium h-32 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all resize-none placeholder:text-slate-300"
                        />
                        {errors.motivo && <span className="text-[10px] font-bold text-rose-500 mt-2 block ml-1">{errors.motivo.message}</span>}
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 mt-auto border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => aoFechar(false)}
                        className="w-full sm:flex-1 h-12 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        CANCELAR
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:flex-[2] h-12 bg-blue-600 text-white hover:bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:grayscale active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Carregando /> : (
                            <>
                                <Fingerprint className="w-4 h-4" />
                                Enviar Justificativa
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
