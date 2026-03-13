import { useState } from 'react';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LayoutPrincipal } from '@/compartilhado/componentes/LayoutPrincipal';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { Alerta } from '@/compartilhado/componentes/Alerta';
import { Modal } from '@/compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { DocumentosProjetoModal } from '@/funcionalidades/projetos/componentes/DocumentosProjetoModal';
import { githubStorage } from '@/funcionalidades/projetos/servicos/github-storage';
import { 
    FolderKanban, 
    Plus, 
    Globe, 
    Lock, 
    Trash2, 
    Edit, 
    CheckCircle2, 
    BarChart3,
    Github,
    FileText
} from 'lucide-react';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { usarProjetos, Projeto } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { usarEquipes } from '@/funcionalidades/admin/hooks/usarEquipes';

const esquemaProjeto = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 letras').max(100),
    descricao: z.string(),
    publico: z.boolean(),
    github_repo: z.string().optional(),
    equipes: z.array(z.object({
        equipe_id: z.string().min(1, 'Selecione uma equipe'),
        acesso: z.enum(['LEITURA', 'EDICAO', 'GESTAO'])
    })).optional()
});

type FormProjeto = z.infer<typeof esquemaProjeto>;

export default function GerenciarProjetos() {
    const { projetos, carregando, erro, criarProjeto, editarProjeto, excluirProjeto } = usarProjetos();
    const { equipes } = usarEquipes();
    const podeCriar = usarPermissaoAcesso('projetos:criar');
    const podeEditar = usarPermissaoAcesso('projetos:editar');
    const podeExcluir = usarPermissaoAcesso('projetos:excluir');
    const podeVerDocumentos = usarPermissaoAcesso('projetos:documentos');
    const [modalAberto, setModalAberto] = useState(false);
    const [projetoEditando, setProjetoEditando] = useState<string | null>(null);
    const [projetoExcluindo, setProjetoExcluindo] = useState<Projeto | null>(null);
    const [excluirRepoGithub, setExcluirRepoGithub] = useState(false);
    const [projetoDocs, setProjetoDocs] = useState<Projeto | null>(null);
    const [processando, setProcessando] = useState(false);

    const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormProjeto>({
        resolver: zodResolver(esquemaProjeto),
        defaultValues: {
            nome: '',
            descricao: '',
            publico: false,
            github_repo: '',
            equipes: []
        }
    });

    const { fields: camposEquipes, append: adicionarEquipe, remove: removerEquipe } = useFieldArray({
        control,
        name: 'equipes'
    });

    const publicoAtivo = watch('publico');

    const handleAbrirCriar = () => {
        setProjetoEditando(null);
        reset({ nome: '', descricao: '', publico: false, github_repo: '', equipes: [] });
        setModalAberto(true);
    };

    const handleAbrirEditar = (p: Projeto) => {
        setProjetoEditando(p.id);
        reset({ 
            nome: p.nome, 
            descricao: p.descricao || '', 
            publico: Boolean(p.publico),
            github_repo: p.github_repo || '',
            equipes: p.equipes || []
        });
        setModalAberto(true);
    };

    const onSubmit: SubmitHandler<FormProjeto> = async (dados) => {
        setProcessando(true);
        try {
            if (dados.github_repo) {
                try {
                    await githubStorage.garantirRepositorio(
                        dados.github_repo, 
                        dados.descricao || 'Repositório criado via SoftHub'
                    );
                } catch (e) {
                    console.warn('[GitHub Storage] Não foi possível garantir o repositório.', e);
                }
            }

            if (projetoEditando) {
                await editarProjeto(projetoEditando, dados);
            } else {
                await criarProjeto(dados);
            }
            setModalAberto(false);
        } catch (e) {
            // Logger já trata o erro
        } finally {
            setProcessando(false);
        }
    };

    const confirmarExclusao = async () => {
        if (!projetoExcluindo) return;
        setProcessando(true);
        try {
            if (projetoExcluindo.github_repo && excluirRepoGithub) {
                try {
                    await githubStorage.deletarRepositorio(projetoExcluindo.github_repo);
                } catch (e) {
                    console.warn('[GitHub Storage] Erro ao deletar repositório', e);
                }
            }
            await excluirProjeto(projetoExcluindo.id);
            setProjetoExcluindo(null);
            setExcluirRepoGithub(false);
        } catch (e) {} finally {
            setProcessando(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-6">
                <CabecalhoFuncionalidade
                    titulo="Gestão de Projetos"
                    subtitulo="Crie novos espaços de trabalho para organizar demandas e squads."
                    icone={FolderKanban}
                >
                    {podeCriar && (
                        <button 
                            onClick={handleAbrirCriar}
                            className="h-10 px-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <Plus size={14} /> Novo Projeto
                        </button>
                    )}
                </CabecalhoFuncionalidade>

                {erro && <Alerta tipo="erro" mensagem={erro} />}

                {carregando && projetos.length === 0 ? (
                    <div className="flex justify-center py-20"><Carregando /></div>
                ) : projetos.length === 0 ? (
                    <div className="bg-card border border-border rounded-3xl p-12 text-center">
                        <FolderKanban className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
                        <h3 className="text-foreground font-black uppercase tracking-widest mb-2">Sem Projetos</h3>
                        <p className="text-muted-foreground text-sm mb-6">Comece criando o primeiro projeto da sua fábrica.</p>
                        {podeCriar && (
                            <button 
                                onClick={handleAbrirCriar}
                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest"
                            >
                                Criar Primeiro Projeto
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projetos.map((p, index) => (
                            <div key={p.id} className={`group relative bg-card hover:bg-muted/30 border border-border rounded-3xl p-6 transition-all duration-300 animar-entrada atraso-${(index % 5) + 1}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-muted rounded-2xl text-primary">
                                        <FolderKanban size={20} />
                                    </div>
                                    <div className="flex gap-2">
                                        {podeVerDocumentos && (
                                            <button onClick={() => setProjetoDocs(p)} className="p-2 hover:bg-background rounded-xl text-muted-foreground hover:text-primary transition-colors" title="Documentos (GitHub)">
                                                <FileText size={14} />
                                            </button>
                                        )}
                                        {podeEditar && (
                                            <button onClick={() => handleAbrirEditar(p)} className="p-2 hover:bg-background rounded-xl text-muted-foreground hover:text-primary transition-colors">
                                                <Edit size={14} />
                                            </button>
                                        )}
                                        {podeExcluir && (
                                            <button onClick={() => setProjetoExcluindo(p)} className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                                    {p.nome}
                                    {p.publico ? (
                                        <div className="p-1 bg-green-500/10 text-green-500 rounded-full" title="Público (Portfólio)">
                                            <Globe size={10} />
                                        </div>
                                    ) : (
                                        <div className="p-1 bg-muted text-muted-foreground rounded-full" title="Privado">
                                            <Lock size={10} />
                                        </div>
                                    )}
                                </h3>
                                
                                {p.github_repo && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                        <Github size={12} />
                                        <a href={`https://github.com/${import.meta.env.VITE_GITHUB_STORAGE_OWNER}/${p.github_repo}`} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline transition-colors">
                                            {p.github_repo}
                                        </a>
                                    </div>
                                )}

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
                                    {p.descricao || 'Sem descrição definida.'}
                                </p>

                                <div className="pt-4 border-t border-border flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <BarChart3 size={12} />
                                        {p.total_tarefas || 0} Tarefas
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/60 uppercase font-black">
                                        {formatarDataHora(p.criado_em)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
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
                            onClick={() => setModalAberto(false)}
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

            <ConfirmacaoExclusao
                aberto={!!projetoExcluindo}
                aoFechar={() => { setProjetoExcluindo(null); setExcluirRepoGithub(false); }}
                aoConfirmar={confirmarExclusao}
                titulo="Excluir Projeto Permanentemente"
                descricao="Esta ação excluirá o projeto e TODAS as tarefas vinculadas a ele. Não há como desfazer."
                carregando={carregando || processando}
            >
                {projetoExcluindo?.github_repo && (
                    <div className="flex items-start gap-3 mt-2">
                        <input
                            type="checkbox"
                            disabled={carregando || processando}
                            id="check-excluir-repo"
                            checked={excluirRepoGithub}
                            onChange={(e) => setExcluirRepoGithub(e.target.checked)}
                            className="mt-1 flex-shrink-0 cursor-pointer w-4 h-4 rounded border-border"
                        />
                        <label htmlFor="check-excluir-repo" className="text-xs text-foreground cursor-pointer font-medium leading-relaxed">
                            Excluir permanentemente o repositório GitHub vinculado (<span className="font-bold text-primary">{projetoExcluindo.github_repo}</span>). <br/>
                            <span className="text-destructive font-bold">Aviso:</span> Esta ação apagará todo o código e não pode ser desfeita.
                        </label>
                    </div>
                )}
            </ConfirmacaoExclusao>

            <DocumentosProjetoModal
                projeto={projetoDocs}
                aberto={!!projetoDocs}
                aoFechar={() => setProjetoDocs(null)}
            />
        </>
    );
}
