import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Esquema de validação com Zod
const esquemaCriarTarefa = z.object({
    titulo: z.string().min(3, 'O título deve ter no mínimo 3 caracteres.'),
    descricao: z.string().optional(),
    prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
    pontos: z.union([
        z.coerce.number().min(1, 'Mínimo de 1 ponto'),
        z.literal('')
    ]).optional(),
});

export type DadosCriarTarefa = z.infer<typeof esquemaCriarTarefa>;

interface FormularioCriarTarefaProps {
    aoSalvar: (dados: DadosCriarTarefa) => Promise<void>;
    aoCancelar: () => void;
}

export function FormularioCriarTarefa({ aoSalvar, aoCancelar }: FormularioCriarTarefaProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
        resolver: zodResolver(esquemaCriarTarefa) as any,
        defaultValues: { prioridade: 'media', titulo: '', descricao: '', pontos: '' }
    });

    const onSubmit = async (dados: any) => {
        // Conversão de `pontos` de string vazia para undefined se omitido
        const payload = {
            ...dados,
            pontos: dados.pontos === '' ? undefined : Number(dados.pontos)
        };
        await aoSalvar(payload);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="titulo" className="text-foreground">Título da Tarefa</Label>
                <Input
                    id="titulo"
                    placeholder="Ex: Corrigir bug no login"
                    {...register('titulo')}
                    autoFocus
                    className="bg-background border-input text-foreground"
                />
                {errors.titulo && <span className="text-destructive text-xs">{errors.titulo.message as string}</span>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="descricao" className="text-foreground">Descrição <span className="text-muted-foreground">(Opcional)</span></Label>
                <Input
                    id="descricao"
                    placeholder="Mais detalhes sobre a tarefa..."
                    {...register('descricao')}
                    className="bg-background border-input text-foreground"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="prioridade" className="text-foreground">Prioridade</Label>
                    <select
                        id="prioridade"
                        {...register('prioridade')}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="urgente">Urgente</option>
                    </select>
                    {errors.prioridade && <span className="text-destructive text-xs">{errors.prioridade.message as string}</span>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pontos" className="text-foreground">Story Points</Label>
                    <Input
                        id="pontos"
                        type="number"
                        placeholder="Ex: 5"
                        {...register('pontos')}
                        className="bg-background border-input text-foreground"
                    />
                    {errors.pontos && <span className="text-destructive text-xs">{errors.pontos.message as string}</span>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={aoCancelar} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isSubmitting ? 'Salvando...' : 'Criar Tarefa'}
                </Button>
            </div>
        </form>
    );
}
