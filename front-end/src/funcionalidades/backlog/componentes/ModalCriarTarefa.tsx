import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/compartilhado/componentes/Modal';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { api } from '@/compartilhado/servicos/api';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';
import { LABELS_PRIORIDADE } from '@/utilitarios/constantes';

const esquemaTarefa = z.object({
    titulo: z.string().min(3, 'Mínimo 3 caracteres').max(100),
    descricao: z.string().min(5, 'Mínimo 5 caracteres'),
    prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
});

type TarefaFormData = z.infer<typeof esquemaTarefa>;

interface ModalCriarTarefaProps {
    aberto: boolean;
    aoFechar: () => void;
    aoCriar: (dados: any) => Promise<void>;
}

export function ModalCriarTarefa({ aberto, aoFechar, aoCriar }: ModalCriarTarefaProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TarefaFormData>({
        resolver: zodResolver(esquemaTarefa),
        defaultValues: { prioridade: 'media', descricao: '' }
    });

    const [processandoIA, setProcessandoIA] = useState(false);
    const [carregandoCriacao, setCarregandoCriacao] = useState(false);
    const descricao = watch('descricao');

    const handleSugerirIA = async () => {
        if (!descricao || descricao.length < 10) return;
        setProcessandoIA(true);
        try {
            const res = await api.post('/api/ia/prioridade', { texto: descricao });
            if (res.data.prioridade) setValue('prioridade', res.data.prioridade);
            // Opcional: toast com a justificativa da IA
        } catch (e) {
            console.error('Erro IA:', e);
        } finally {
            setProcessandoIA(false);
        }
    };

    const onSubmit = async (dados: TarefaFormData) => {
        setCarregandoCriacao(true);
        try {
            await aoCriar(dados);
            aoFechar();
        } catch (e) {
            console.error(e);
        } finally {
            setCarregandoCriacao(false);
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Nova Demanda">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Título da Tarefa</label>
                    <input
                        {...register('titulo')}
                        placeholder="Ex: Refatorar middleware de autenticação..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    {errors.titulo && <p className="text-xs text-destructive mt-1">{errors.titulo.message}</p>}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição Detalhada</label>
                        <button
                            type="button"
                            onClick={handleSugerirIA}
                            disabled={processandoIA || !descricao || descricao.length < 10}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary hover:text-primary/70 transition-all disabled:opacity-30"
                        >
                            {processandoIA ? <Carregando tamanho="sm" Centralizar={false} /> : <Wand2 size={12} />}
                            Sugerir Prioridade com IA
                        </button>
                    </div>
                    <textarea
                        {...register('descricao')}
                        rows={4}
                        placeholder="Descreva o que precisa ser feito..."
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                    {errors.descricao && <p className="text-xs text-destructive mt-1">{errors.descricao.message}</p>}
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Prioridade</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(LABELS_PRIORIDADE).map(([key, label]) => (
                            <label
                                key={key}
                                className={`
                                    flex-1 min-w-[80px] cursor-pointer group
                                    ${watch('prioridade') === key ? 'opacity-100' : 'opacity-60 hover:opacity-100'}
                                `}
                            >
                                <input
                                    type="radio"
                                    value={key}
                                    {...register('prioridade')}
                                    className="hidden"
                                />
                                <div className={`
                                    py-2 text-center rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all
                                    ${watch('prioridade') === key 
                                        ? 'bg-primary border-primary text-primary-foreground shadow-md' 
                                        : 'bg-muted/30 border-border md:hover:bg-muted/50'}
                                `}>
                                    {label}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={aoFechar}
                        className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border hover:bg-muted transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={carregandoCriacao}
                        className="flex-[2] h-12 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {carregandoCriacao ? <Carregando tamanho="sm" Centralizar={false} /> : <Plus size={14} />}
                        Criar Tarefa
                    </button>
                </div>
            </form>
        </Modal>
    );
}

import { Plus } from 'lucide-react';
