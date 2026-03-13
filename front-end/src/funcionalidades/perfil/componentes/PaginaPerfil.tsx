import { memo, useState } from 'react';
import { User, Mail, Shield, Briefcase, Calendar, Target, Clock, Trophy, Pencil, Camera, Save, X } from 'lucide-react';
import { usarPerfil } from '../hooks/usarPerfil';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Skeleton, SkeletonCard } from '@/compartilhado/componentes/Skeleton';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { formatarDataHora } from '@/utilitarios/formatadores';

/**
 * Página de Perfil do Usuário (Self-Service).
 * Exibe dados pessoais, estatísticas de trabalho e permite edição básica.
 */
export const PaginaPerfil = memo(() => {
    const { perfil, stats, carregando, erro, atualizarPerfil, salvando } = usarPerfil();
    const [editando, setEditando] = useState(false);
    
    // Estados Locais para Edição
    const [nome, setNome] = useState('');
    const [bio, setBio] = useState('');
    const [fotoPerfil, setFotoPerfil] = useState('');

    const handleIniciarEdicao = () => {
        if (!perfil) return;
        setNome(perfil.nome || '');
        setBio(perfil.bio || '');
        setFotoPerfil(perfil.foto_perfil || '');
        setEditando(true);
    };

    const handleSalvar = async () => {
        await atualizarPerfil({ nome, bio, foto_perfil: fotoPerfil });
        setEditando(false);
    };

    if (carregando) return (
        <div className="space-y-8 animate-pulse">
            <div className="h-32 bg-muted/20 rounded-3xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <Skeleton className="h-[400px] w-full rounded-2xl" />
                </div>
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                    <Skeleton className="h-[300px] w-full rounded-2xl" />
                </div>
            </div>
        </div>
    );

    if (erro) return (
        <div className="p-10 text-center text-destructive">{erro}</div>
    );

    if (!perfil) return null;

    return (
        <div className="w-full space-y-8 pb-20 animar-entrada">
            <CabecalhoFuncionalidade
                titulo="Meu Perfil"
                subtitulo="Gerencie seus dados e acompanhe seu desempenho na Fábrica."
                icone={User}
            >
                {!editando ? (
                    <button
                        onClick={handleIniciarEdicao}
                        className="flex items-center gap-2 px-5 py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                    >
                        <Pencil size={14} /> Editar Perfil
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setEditando(false)}
                            className="px-5 py-2.5 text-muted-foreground hover:text-foreground font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            <X size={14} /> Cancelar
                        </button>
                        <button
                            onClick={handleSalvar}
                            disabled={salvando}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <Save size={14} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                )}
            </CabecalhoFuncionalidade>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Coluna 1: Cartão de Identidade */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-sm">
                        <div className="h-24 bg-gradient-to-r from-primary/20 to-indigo-500/20" />
                        <div className="px-6 pb-8 -mt-12 flex flex-col items-center text-center">
                            <div className="relative group">
                                <Avatar nome={perfil.nome} fotoPerfil={perfil.foto_perfil} tamanho="lg" />
                                {editando && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="text-white" size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 space-y-1">
                                <h2 className="text-xl font-black tracking-tight">{perfil.nome}</h2>
                                <p className="text-[12px] text-muted-foreground font-medium">{perfil.email}</p>
                            </div>
                            <div className="mt-4">
                                <Emblema texto={perfil.role} variante="azul" />
                            </div>

                            <div className="w-full h-px bg-border/40 my-6" />

                            <div className="w-full space-y-4 text-left">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Briefcase size={16} className="text-primary" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Equipe</span>
                                        <span className="text-xs font-bold text-foreground">{perfil.equipe_nome || 'Livre'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Shield size={16} className="text-primary" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Grupo</span>
                                        <span className="text-xs font-bold text-foreground">{perfil.grupo_nome || 'Sem Grupo'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Calendar size={16} className="text-primary" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Membro desde</span>
                                        <span className="text-xs font-bold text-foreground">{formatarDataHora(perfil.criado_em)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="bg-card border border-border/60 rounded-3xl p-6 space-y-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Sobre Mim</h3>
                        {editando ? (
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                placeholder="Conte um pouco sobre suas habilidades e o que você faz na Fábrica..."
                                className="w-full h-32 bg-muted/40 border border-border/40 rounded-xl p-3 text-xs font-medium outline-none focus:bg-background focus:border-primary/30 transition-all resize-none"
                            />
                        ) : (
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                {perfil.bio || 'Este membro ainda não adicionou uma biografia.'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Coluna 2: Stats e Habilidades */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Grid de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card border border-border/60 rounded-3xl p-6 flex items-center gap-5 group hover:border-primary/20 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Target size={28} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Demandas Concluídas</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black">{stats?.tarefas.concluidas || 0}</span>
                                    <span className="text-[10px] font-bold text-emerald-500/60 leading-none">+{stats?.tarefas.aproveitamento}% Taxa</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border/60 rounded-3xl p-6 flex items-center gap-5 group hover:border-primary/20 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <Clock size={28} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Horas no Mês</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black">{stats?.ponto.estimativaHoras || 0}h</span>
                                    <span className="text-[10px] font-bold text-amber-500/60 leading-none">{stats?.ponto.batidasMes} Batidas</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Habilidades / Funções */}
                    <div className="bg-card border border-border/60 rounded-3xl p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                <Trophy size={18} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest">Especialidades Técnicas</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {perfil.funcoes.length > 0 ? (
                                perfil.funcoes.map(f => (
                                    <span key={f} className="px-4 py-2 bg-muted/50 border border-border/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/20 transition-all">
                                        {f}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-muted-foreground opacity-50 italic">Nenhuma especialidade listada.</span>
                            )}
                        </div>
                    </div>

                    {/* Link de Foto de Perfil (Apenas em Edição) */}
                    {editando && (
                        <div className="bg-card border border-border/60 rounded-3xl p-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Configurações de Identidade</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">URL da Foto de Perfil</label>
                                <div className="relative group/ph">
                                    <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/ph:text-primary transition-colors" size={16} />
                                    <input
                                        type="url"
                                        placeholder="https://exemplo.com/minha-foto.jpg"
                                        value={fotoPerfil}
                                        onChange={e => setFotoPerfil(e.target.value)}
                                        className="w-full h-11 bg-muted/40 border border-border/40 rounded-xl pl-11 pr-4 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-muted-foreground/50 ml-1 italic">* Use um link direto para sua imagem (ex: LinkedIn, GitHub ou Gravatar).</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default PaginaPerfil;
