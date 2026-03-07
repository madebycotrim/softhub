import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { esquemaRetrospectiva, type DadosFormularioRetrospectiva } from './retrospectiva.schema';
import type { Sprint } from './usarBacklog';

interface FormularioRetrospectivaProps {
    sprintAlvo: Sprint | null;
    aberto: boolean;
    aoFechar: (open: boolean) => void;
    aoSalvar: (sprintId: string, dados: DadosFormularioRetrospectiva) => Promise<void>;
}

export function FormularioRetrospectiva({ sprintAlvo, aberto, aoFechar, aoSalvar }: FormularioRetrospectivaProps) {
    const form = useForm<DadosFormularioRetrospectiva>({
        resolver: zodResolver(esquemaRetrospectiva),
        defaultValues: {
            o_que_foi_bem: sprintAlvo?.retrospectiva?.o_que_foi_bem || '',
            o_que_melhorar: sprintAlvo?.retrospectiva?.o_que_melhorar || '',
            acoes_proxima_sprint: sprintAlvo?.retrospectiva?.acoes_proxima_sprint || '',
        }
    });

    const onSubmit = async (dados: DadosFormularioRetrospectiva) => {
        if (!sprintAlvo) return;
        try {
            await aoSalvar(sprintAlvo.id, dados);
            form.reset();
            aoFechar(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={aberto} onOpenChange={aoFechar}>
            <DialogContent className="bg-card border-border shadow-sm text-foreground sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Retrospectiva: {sprintAlvo?.nome}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">

                        <FormField
                            control={form.control}
                            name="o_que_foi_bem"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-emerald-400">O que foi bem</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Pontos positivos da sprint..."
                                            className="bg-background border-input text-foreground resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-destructive" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="o_que_melhorar"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-orange-400">O que melhorar</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Gargalos, impedimentos..."
                                            className="bg-background border-input text-foreground resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-destructive" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="acoes_proxima_sprint"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-blue-400">Ações para a próxima Sprint</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Decisões tomadas para evoluir..."
                                            className="bg-background border-input text-foreground resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-destructive" />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="ghost" className="hover:bg-accent text-muted-foreground" onClick={() => aoFechar(false)} disabled={form.formState.isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Retrospectiva'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
