import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ModalEditarPerfilProps {
    editando: boolean;
    setEditando: (valor: boolean) => void;
    form: any;
    aoSubmeterPerfil: (dados: any) => void;
    salvando: boolean;
}

export function ModalEditarPerfil({ editando, setEditando, form, aoSubmeterPerfil, salvando }: ModalEditarPerfilProps) {
    return (
        <Dialog open={editando} onOpenChange={setEditando}>
            <DialogContent className="bg-card border-border text-foreground shadow-sm">
                <DialogHeader>
                    <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(aoSubmeterPerfil)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="foto_perfil"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">URL da Foto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://github.com/usuario.png" className="bg-background border-input text-foreground" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-muted-foreground">
                                        Apenas URLs de imagens externas são aceitas.
                                    </FormDescription>
                                    <FormMessage className="text-destructive" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">Biografia</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Conte um pouco sobre você..."
                                            className="bg-background border-input text-foreground resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-destructive" />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="ghost" className="hover:bg-accent text-accent-foreground" onClick={() => setEditando(false)} disabled={salvando}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
