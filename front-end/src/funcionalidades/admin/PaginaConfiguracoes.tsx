import { useState } from 'react';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { usarConfiguracoes } from './usarConfiguracoes';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Settings, Save, Plus, X, Lock, Users, Briefcase } from 'lucide-react';

export function PaginaConfiguracoes() {
    const { configuracoes, carregando, erro, atualizarConfiguracao } = usarConfiguracoes();
    const [novaFuncao, setNovaFuncao] = useState('');
    const [salvando, setSalvando] = useState<string | null>(null);

    if (carregando) return <Carregando />;
    if (erro) return <div className="p-10 text-center text-red-500">{erro}</div>;

    const handleSalvarSistema = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const nome = formData.get('nome_sistema') as string;
        setSalvando('sistema');
        await atualizarConfiguracao('nome_sistema', nome);
        setSalvando(null);
    };

    const handleAddFuncao = async () => {
        if (!novaFuncao.trim() || !configuracoes) return;
        const novas = [...configuracoes.funcoes_tecnicas, novaFuncao.trim()];
        setSalvando('funcoes');
        await atualizarConfiguracao('funcoes_tecnicas', novas);
        setNovaFuncao('');
        setSalvando(null);
    };

    const handleRemoveFuncao = async (funcao: string) => {
        if (!configuracoes) return;
        const novas = configuracoes.funcoes_tecnicas.filter(f => f !== funcao);
        setSalvando('funcoes');
        await atualizarConfiguracao('funcoes_tecnicas', novas);
        setSalvando(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <CabecalhoFuncionalidade
                titulo="Configurações Globais"
                subtitulo="Gerencie as regras de negócio e parâmetros do sistema."
                icone={Settings}
            />

            {/* Seção 1: Identidade do Sistema */}
            <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Identidade do Sistema</h2>
                </div>
                <form onSubmit={handleSalvarSistema} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Nome da Instância</label>
                        <div className="flex gap-3">
                            <input
                                name="nome_sistema"
                                defaultValue={configuracoes?.nome_sistema}
                                className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={salvando === 'sistema'}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                                {salvando === 'sistema' ? <Carregando /> : <Save className="w-4 h-4" />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </form>
            </section>

            {/* Seção 2: Funções Técnicas */}
            <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Funções Técnicas Disponíveis</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-2">
                        {configuracoes?.funcoes_tecnicas.map(funcao => (
                            <div key={funcao} className="group flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full border border-border">
                                <span className="text-xs font-medium">{funcao}</span>
                                <button
                                    onClick={() => handleRemoveFuncao(funcao)}
                                    className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <input
                            value={novaFuncao}
                            onChange={e => setNovaFuncao(e.target.value)}
                            placeholder="Nova função (ex: Engenheiro de Prompt)"
                            className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button
                            onClick={handleAddFuncao}
                            disabled={salvando === 'funcoes' || !novaFuncao.trim()}
                            className="px-4 py-2 bg-accent text-accent-foreground border border-border rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent/80 transition-all disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar
                        </button>
                    </div>
                </div>
            </section>

            {/* Seção 3: Permissões de Acesso */}
            <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Permissões Específicas</h2>
                </div>
                <div className="p-6">
                    <div className="space-y-6">
                        {(configuracoes as any)?.permissoes_roles && Object.keys((configuracoes as any).permissoes_roles).map(role => (
                            <div key={role} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <h3 className="text-xs font-bold uppercase text-foreground">{role}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                                    {Object.keys((configuracoes as any).permissoes_roles[role]).map(permissao => (
                                        <label key={`${role}-${permissao}`} className="flex items-center justify-between p-3 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/40 cursor-pointer transition-all">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {permissao.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={(configuracoes as any).permissoes_roles[role][permissao]}
                                                onChange={async (e) => {
                                                    const novasPermissoes = { ...(configuracoes as any).permissoes_roles };
                                                    novasPermissoes[role] = { ...novasPermissoes[role], [permissao]: e.target.checked };
                                                    await atualizarConfiguracao('permissoes_roles' as any, novasPermissoes);
                                                }}
                                                className="w-4 h-4 appearance-none border border-border rounded bg-background checked:bg-primary checked:border-primary transition-all cursor-pointer relative after:content-[''] after:absolute after:left-[5px] after:top-[2px] after:w-[4px] after:h-[7px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:hidden checked:after:block"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Seção 4: Hierarquia de Cargos (Visualização) */}

            {/* Seção 4: Atalhos Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="/app/admin/organizacao" className="flex items-center gap-4 p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all group shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Gestão de Equipes</h3>
                        <p className="text-xs text-muted-foreground">Grupos, equipes e alocação.</p>
                    </div>
                </a>
            </div>
        </div>
    );
}
