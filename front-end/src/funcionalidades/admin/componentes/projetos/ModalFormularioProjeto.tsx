import { memo, useEffect } from 'react';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle2, Github } from 'lucide-react';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { Modal } from '@/compartilhado/componentes/Modal';
import type { Projeto } from '@/funcionalidades/projetos/hooks/usarProjetos';
import type { Equipe } from '@/funcionalidades/admin/hooks/usarEquipes';

export const esquemaProjeto = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 letras').max(100),
    descricao: z.string(),
    publico: z.boolean(),
    github_repo: z.string().optional(),
    equipes: z.array(z.object({
        equipe_id: z.string().min(1, 'Selecione uma equipe'),
        acesso: z.enum(['LEITURA', 'EDICAO', 'GESTAO'])
    })).optional()
});

export type FormProjeto = z.infer<typeof esquemaProjeto>;

interface ModalFormularioProjetoProps {
    aberto: boolean;
    aoFechar: () => void;
    projetoEditando: string | null;
    projetoInicial: FormProjeto;
    equipes: Equipe[];
    onSubmit: SubmitHandler<FormProjeto>;
    carregando: boolean;
    processando: boolean;
}

export const ModalFormularioProjeto = memo(({ 
    aberto, 
    aoFechar, 
    projetoEditando, 
    projetoInicial, 
    equipes, 
    onSubmit, 
    carregando, 
    processando 
}: ModalFormularioProjetoProps) => {
    const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormProjeto>({
        resolver: zodResolver(esquemaProjeto),
        defaultValues: projetoInicial
    });

    // Reset fields when the modal opens with new expected values
    useEffect(() => {
        if (aberto) {
            reset(projetoInicial);
        }
    }, [aberto, projetoInicial, reset]);

    const { fields: camposEquipes, append: adicionarEquipe, remove: removerEquipe } = useFieldArray({
        control,
        name: 'equipes'
    });

    const publicoAtivo = watch('publico');

    return (
        <Modal
            aberto={aberto}
            aoFechar={aoFechar}
            titulo={projetoEditando ? 'Editar Projeto' : 'Novo Projeto'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Nome do Projeto</label>
                    <input
                        {...register('nome')}
                        className="w-full h-12 bg-background border border-border rounded-2xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Ex: App de Delivery, ERP Escolar..."
                    />
                    {errors.nome && <p className="text-xs text-destructive mt-2">{errors.nome.message}</p>}
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Descrição</label>
                    <textarea
                        {...register('descricao')}
                        rows={3}
                        className="w-full bg-background border border-border rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        placeholder="Sobre o que é este projeto?"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Repositório GitHub (Opcional)</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Github size={14} className="text-muted-foreground" />
                       </div>
                       <input
                           {...register('github_repo')}
                           className="w-full h-12 bg-background border border-border rounded-2xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                           placeholder="Ex: meu-projeto-api"
                       />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Apenas o nome do repositório. O dono será {import.meta.env.VITE_GITHUB_STORAGE_OWNER || '(configurado no .env)'}.</p>
                </div>

                <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h4 className="text-sm font-bold text-foreground">Equipes Envolvidas</h4>
                            <p className="text-xs text-muted-foreground">Quem tem acesso a este projeto (se não for público)</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => adicionarEquipe({ equipe_id: '', acesso: 'EDICAO' })}
                            className="h-8 px-3 bg-secondary/30 hover:bg-secondary/50 text-secondary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                            <Plus size={14} /> Vincular Equipe
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {camposEquipes.length === 0 ? (
                            <div className="text-center p-4 border border-dashed border-border rounded-2xl bg-muted/20">
                                <p className="text-xs text-muted-foreground">Nenhuma equipe vinculada exclusivamente.</p>
                            </div>
                        ) : (
                            camposEquipes.map((campo, index) => (
                                <div key={campo.id} className="flex gap-2 items-center p-2 border border-border bg-muted/10 rounded-2xl">
                                    <select
                                        {...register(`equipes.${index}.equipe_id`)}
                                        className="flex-1 h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="">Selecione uma equipe...</option>
                                        {equipes.map(eq => (
                                            <option key={eq.id} value={eq.id}>{eq.nome}</option>
                                        ))}
                                    </select>
                                    
                                    <select
                                        {...register(`equipes.${index}.acesso`)}
                                        className="w-32 h-10 bg-background border border-border rounded-xl px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="LEITURA">Leitura</option>
                                        <option value="EDICAO">Edição</option>
                                        <option value="GESTAO">Gestão</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => removerEquipe(index)}
                                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    {errors.equipes && <p className="text-[10px] text-destructive mt-1">Verifique as equipes duplicadas ou não selecionadas.</p>}
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-2xl cursor-pointer hover:bg-muted/50 transition-colors"
                     onClick={() => setValue('publico', !publicoAtivo)}>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${publicoAtivo ? 'bg-primary border-primary' : 'bg-background border-border'}`}>
                        {publicoAtivo && <CheckCircle2 size={12} className="text-primary-foreground" />}
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-foreground">Exibir no Portfólio Público</h4>
                        <p className="text-xs text-muted-foreground">Projetos públicos aparecem na Home sem necessidade de login.</p>
                    </div>
                    <input
                        type="checkbox"
                        {...register('publico')}
                        className="hidden"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={aoFechar}
                        className="flex-1 h-12 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={carregando || processando}
                        className="flex-[2] h-12 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center"
                    >
                        {carregando || processando ? <Carregando tamanho="sm" Centralizar={false} /> : (projetoEditando ? 'Salvar Alterações' : 'Criar Projeto')}
                    </button>
                </div>
            </form>
        </Modal>
    );
});
