import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Esquema de validação com Zod
const esquemaCriarSprint = z.object({
    nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
    objetivo: z.string().optional(),
    data_inicio: z.string().min(1, 'A data de início é obrigatória.'),
    data_fim: z.string().min(1, 'A data de fim é obrigatória.'),
    velocity_planejado: z.union([
        z.coerce.number().min(1, 'Mínimo de 1 ponto'),
        z.literal('')
    ]).optional(),
});

export type DadosCriarSprint = z.infer<typeof esquemaCriarSprint>;

interface FormularioCriarSprintProps {
    aoSalvar: (dados: any) => Promise<void>;
    aoCancelar: () => void;
}

export function FormularioCriarSprint({ aoSalvar, aoCancelar }: FormularioCriarSprintProps) {
    const form = useForm<any>({
        resolver: zodResolver(esquemaCriarSprint) as any,
        defaultValues: { nome: '', objetivo: '', data_inicio: '', data_fim: '', velocity_planejado: '' }
    });

    const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

    const onSubmit = async (dados: any) => {
        // Conversão de `velocity_planejado` de string vazia para undefined se omitido
        const payload = {
            ...dados,
            velocity_planejado: dados.velocity_planejado === '' ? undefined : Number(dados.velocity_planejado)
        };

        // Conversao de datas para ISO format ou deixar como YYYY-MM-DD
        // Se a date vier do input type=date, ela eh YYYY-MM-DD. O backend suporta isso ou precisa do T00:00:00Z?
        // Vamos formatar colocando um Z no final caso necessario, mas enviar YYYY-MM-DD eh comum.
        const payloadCompleto = {
            ...payload,
            data_inicio: dados.data_inicio + 'T00:00:00Z',
            data_fim: dados.data_fim + 'T23:59:59Z'
        };

        await aoSalvar(payloadCompleto);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="nome" className="text-foreground">Nome da Sprint</Label>
                <Input
                    id="nome"
                    placeholder="Ex: Sprint 12 - Autenticação"
                    {...register('nome')}
                    autoFocus
                    className="bg-background border-input text-foreground"
                />
                {errors.nome && <span className="text-destructive text-xs">{errors.nome.message as string}</span>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="objetivo" className="text-foreground">Objetivo Principal <span className="text-muted-foreground">(Opcional)</span></Label>
                <Input
                    id="objetivo"
                    placeholder="Resuma o foco da equipe nesta sprint"
                    {...register('objetivo')}
                    className="bg-background border-input text-foreground"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="data_inicio" className="text-foreground">Data de Início</Label>
                    <Input
                        id="data_inicio"
                        type="date"
                        {...register('data_inicio')}
                        className="bg-background border-input text-foreground"
                    />
                    {errors.data_inicio && <span className="text-destructive text-xs">{errors.data_inicio.message as string}</span>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="data_fim" className="text-foreground">Data de Fim</Label>
                    <Input
                        id="data_fim"
                        type="date"
                        {...register('data_fim')}
                        className="bg-background border-input text-foreground"
                    />
                    {errors.data_fim && <span className="text-destructive text-xs">{errors.data_fim.message as string}</span>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="velocity_planejado" className="text-foreground">Velocity Planejado <span className="text-muted-foreground">(Opcional)</span></Label>
                <Input
                    id="velocity_planejado"
                    type="number"
                    placeholder="Ex: 40"
                    {...register('velocity_planejado')}
                    className="bg-background border-input text-foreground"
                />
                {errors.velocity_planejado && <span className="text-destructive text-xs">{errors.velocity_planejado.message as string}</span>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={aoCancelar} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isSubmitting ? 'Iniciando...' : 'Iniciar Sprint'}
                </Button>
            </div>
        </form>
    );
}
