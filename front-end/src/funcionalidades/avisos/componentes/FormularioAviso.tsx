import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { api } from '@/compartilhado/servicos/api';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

const esquemaAviso = z.object({
    titulo: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.').max(100, 'Máximo de 100 caracteres.'),
    conteudo: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres.'),
    prioridade: z.enum(['urgente', 'importante', 'info']),
    expira_em: z.string().optional(),
});

type FormularioAvisoDados = z.infer<typeof esquemaAviso>;

interface FormularioAvisoProps {
    aoSalvar: () => void;
}

/**
 * Formulário para criar um novo aviso no mural.
 * Baseado no React Hook Form e Zod.
 */
export function FormularioAviso({ aoSalvar }: FormularioAvisoProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormularioAvisoDados>({
        resolver: zodResolver(esquemaAviso),
        defaultValues: { prioridade: 'info' }
    });

    const [refinando, setRefinando] = useState(false);
    const rascunho = watch('conteudo');

    const handleRefinarIA = async () => {
        if (!rascunho || rascunho.length < 10) return;
        setRefinando(true);
        try {
            const res = await api.post('/api/ia/refinar-aviso', { rascunho });
            if (res.data.titulo) setValue('titulo', res.data.titulo);
            if (res.data.conteudo) setValue('conteudo', res.data.conteudo);
        } catch (e) {
            console.error('Erro ao refinar com IA', e);
        } finally {
            setRefinando(false);
        }
    };

    const onSubmit = async (dados: FormularioAvisoDados) => {
        // API Call simulada pro MOCK
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Dados do Aviso:', dados);
                aoSalvar();
                resolve(true);
            }, 1000);
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-foreground mb-1">
                    Título do Aviso
                </label>
                <input
                    id="titulo"
                    type="text"
                    placeholder="Ex: Prazo de entrega do Módulo 1..."
                    className="w-full bg-background border border-input rounded-2xl px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    {...register('titulo')}
                />
                {errors.titulo && (
                    <p role="alert" className="mt-1 text-xs font-medium text-destructive">{errors.titulo.message}</p>
                )}
            </div>

            <div>
                <div className="flex justify-between items-end mb-1">
                    <label htmlFor="conteudo" className="block text-sm font-medium text-foreground">
                        Conteúdo
                    </label>
                    <button
                        type="button"
                        onClick={handleRefinarIA}
                        disabled={refinando || !rascunho || rascunho.length < 10}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {refinando ? (
                            <Carregando tamanho="sm" Centralizar={false} className="border-primary" />
                        ) : (
                            <Sparkles size={12} />
                        )}
                        Refinar com IA
                    </button>
                </div>
                <textarea
                    id="conteudo"
                    rows={4}
                    placeholder="Descreva o aviso com detalhes..."
                    className="w-full bg-background border border-input rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    {...register('conteudo')}
                />
                {errors.conteudo && (
                    <p role="alert" className="mt-1 text-xs font-medium text-destructive">{errors.conteudo.message}</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="prioridade" className="block text-sm font-medium text-foreground mb-1">
                        Prioridade
                    </label>
                    <select
                        id="prioridade"
                        className="w-full bg-background border border-input rounded-2xl px-4 py-2 shrink-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none"
                        {...register('prioridade')}
                    >
                        <option value="info">💬 Informativo</option>
                        <option value="importante">⚠️ Importante</option>
                        <option value="urgente">🚨 Urgente</option>
                    </select>
                    {errors.prioridade && (
                        <p role="alert" className="mt-1 text-xs font-medium text-destructive">{errors.prioridade.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="expira_em" className="block text-sm font-medium text-foreground mb-1">
                        Data de Expiração <span className="text-muted-foreground text-xs font-normal">(Opcional)</span>
                    </label>
                    <input
                        id="expira_em"
                        type="datetime-local"
                        className="w-full bg-background border border-input rounded-2xl px-4 py-2 shrink-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        {...register('expira_em')}
                    />
                </div>
            </div>

            <div className="pt-6 mt-auto border-t border-border flex flex-col sm:flex-row justify-end gap-3">
                <button
                    type="button"
                    onClick={aoSalvar}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground transition-all transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-primary/20 min-w-32"
                >
                    {isSubmitting ? (
                        <>
                            <Carregando tamanho="sm" className="border-current" /> Publicando...
                        </>
                    ) : (
                        'Publicar Aviso'
                    )}
                </button>
            </div>

        </form>
    );
}
