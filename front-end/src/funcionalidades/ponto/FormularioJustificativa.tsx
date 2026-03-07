import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const esquemaJustificativa = z.object({
    data: z.string().min(1, 'A data é obrigatória.'),
    tipo: z.enum(['ausencia', 'esquecimento', 'problema_sistema']),
    motivo: z.string().min(10, 'O motivo precisa ter pelo menos 10 caracteres.')
});

type DadosJustificativa = z.infer<typeof esquemaJustificativa>;

interface FormularioJustificativaProps {
    aberto: boolean;
    aoFechar: (Aberto: boolean) => void;
    aoSalvar: (dados: DadosJustificativa) => Promise<void>;
}

export function FormularioJustificativa({ aberto, aoFechar, aoSalvar }: FormularioJustificativaProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<DadosJustificativa>({
        resolver: zodResolver(esquemaJustificativa),
        defaultValues: { data: '', tipo: 'esquecimento', motivo: '' }
    });

    const [erroGlobal, setErroGlobal] = useState<string | null>(null);

    const onSubmit = async (dados: DadosJustificativa) => {
        try {
            setErroGlobal(null);
            await aoSalvar(dados);
            reset();
            aoFechar(false);
        } catch (e: any) {
            setErroGlobal(e.message || 'Falha ao salvar a justificativa.');
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={aoFechar}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground shadow-sm">
                <DialogHeader>
                    <DialogTitle>Enviar Justificativa de Ponto</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    {erroGlobal && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                            {erroGlobal}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Data da Ocorrência</label>
                            <Input
                                type="date"
                                {...register('data')}
                                className="mt-1 bg-background border-input text-foreground"
                            />
                            {errors.data && <span className="text-xs text-destructive mt-1">{errors.data.message}</span>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Tipo da Justificativa</label>
                            <div className="mt-1">
                                <Select onValueChange={(valor: string) => setValue('tipo', valor as 'ausencia')} defaultValue="esquecimento">
                                    <SelectTrigger className="w-full bg-background border-input text-foreground">
                                        <SelectValue placeholder="Selecione o tipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        <SelectItem value="esquecimento">Esquecimento de Bater</SelectItem>
                                        <SelectItem value="problema_sistema">Problema/Falha no Sistema</SelectItem>
                                        <SelectItem value="ausencia">Ausência (Atestado/Falta)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {errors.tipo && <span className="text-xs text-destructive mt-1">{errors.tipo.message}</span>}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Motivo e Detalhes</label>
                            <Textarea
                                placeholder="Explique com detalhes o ocorrido para embasar sua justificativa."
                                {...register('motivo')}
                                className="mt-1 h-24 bg-background border-input text-foreground resize-none"
                            />
                            {errors.motivo && <span className="text-xs text-destructive mt-1">{errors.motivo.message}</span>}
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => aoFechar(false)}
                            className="bg-accent text-accent-foreground hover:bg-accent/80"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Justificativa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
