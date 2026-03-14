import { memo } from 'react';
import { Square, CheckSquare, Trash2, Eye, LayoutGrid, ChevronRight } from 'lucide-react';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import type { Membro } from '@/funcionalidades/membros/hooks/usarMembros';

interface MembroCardMobileProps {
    membro: Membro;
    salvando: boolean;
    selecionado: boolean;
    onToggleSelect: (id: string) => void;
    onAlterarRole: (membro: Membro, role: string) => void;
    onRemover: (membro: Membro) => void;
    onVerPerfil: (id: string) => void;
    onAlocar: (membro: Membro) => void;
    rolesDisponiveis: string[];
}

/**
 * Versão Card para Mobile dos membros.
 * Focado em toque e legibilidade em telas pequenas.
 */
export const MembroCardMobile = memo(({ 
    membro, salvando, selecionado, onToggleSelect, onAlterarRole, 
    onRemover, onVerPerfil, onAlocar, rolesDisponiveis 
}: MembroCardMobileProps) => {
    const { usuario } = usarAutenticacao();
    const ehOMesmoUsuario = usuario?.id === membro.id;
    const podeAlterarRole = usarPermissaoAcesso('membros:alterar_role');
    const podeDesativar = usarPermissaoAcesso('membros:desativar');

    return (
        <div className={`
            relative p-5 bg-card border border-border/50 rounded-3xl transition-all
            ${salvando ? 'opacity-40 grayscale pointer-events-none' : ''}
            ${selecionado ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:border-primary/20'}
        `}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="md" coroa={ehOMesmoUsuario} />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black uppercase text-foreground truncate max-w-[150px]">
                                {membro.nome || "Pendente"}
                            </span>
                            {ehOMesmoUsuario && (
                                <span className="text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/10">VOCÊ</span>
                            )}
                        </div>
                        <span className="text-[11px] text-muted-foreground/60 truncate">{membro.email}</span>
                    </div>
                </div>

                <button
                    onClick={() => !ehOMesmoUsuario && onToggleSelect(membro.id)}
                    className={`p-2 rounded-xl border transition-all ${selecionado ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-muted/10 border-border text-muted-foreground/30'}`}
                    disabled={ehOMesmoUsuario}
                >
                    {selecionado ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Cargo</p>
                    <div className="relative">
                        <select
                            className="w-full h-9 bg-muted/20 border border-border/40 rounded-xl px-3 text-[10px] font-bold uppercase tracking-wider text-primary outline-none appearance-none"
                            value={membro.role}
                            onChange={e => onAlterarRole(membro, e.target.value)}
                            disabled={!podeAlterarRole}
                        >
                            {rolesDisponiveis.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-primary/40 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Equipe</p>
                    <div className="h-9 flex items-center px-3 bg-muted/10 rounded-xl border border-border/40 overflow-hidden">
                        <span className="text-[10px] font-bold text-muted-foreground truncate italic">
                            {membro.equipe_nome || "Sem alocação"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border/10">
                <button
                    onClick={() => onVerPerfil(membro.id)}
                    className="flex-1 h-10 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <Eye size={14} />
                    <span>Ver Perfil</span>
                </button>
                
                {usarPermissaoAcesso('equipes:editar_equipe') && (
                    <button
                        onClick={() => onAlocar(membro)}
                        className="w-10 h-10 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center transition-all"
                    >
                        <LayoutGrid size={16} />
                    </button>
                )}

                {!ehOMesmoUsuario && podeDesativar && (
                    <button
                        onClick={() => onRemover(membro)}
                        className="w-10 h-10 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
});
