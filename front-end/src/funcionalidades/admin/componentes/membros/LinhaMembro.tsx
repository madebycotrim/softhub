import { memo } from 'react';
import { Square, CheckSquare, ChevronDown, Trash2, Eye, LayoutGrid } from 'lucide-react';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import type { Membro } from '@/funcionalidades/membros/hooks/usarMembros';


interface LinhaMembroProps {
    membro: Membro;
    salvando: boolean;
    selecionado: boolean;
    onToggleSelect: (id: string, isShift?: boolean) => void;
    onAlterarRole: (membro: Membro, role: string) => void;
    onRemover: (membro: Membro) => void;
    onVerPerfil: (id: string) => void;
    onAlocar: (membro: Membro) => void;
    rolesDisponiveis: string[];
}

export const LinhaMembro = memo(({ membro, salvando, selecionado, onToggleSelect, onAlterarRole, onRemover, onVerPerfil, onAlocar, rolesDisponiveis }: LinhaMembroProps) => {
    const { usuario } = usarAutenticacao();
    const ehOMesmoUsuario = usuario?.id === membro.id;
    const podeAlterarRole = usarPermissaoAcesso('membros:alterar_role');
    const podeDesativar = usarPermissaoAcesso('membros:desativar');

    return (
        <tr className={`group transition-all ${salvando ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-muted/10'} ${selecionado ? 'bg-primary/5' : ''}`}>
            {/* Seleção + Membro */}
            <td className="px-6 py-4 border-b border-border/40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => !ehOMesmoUsuario && onToggleSelect(membro.id, e.shiftKey)}
                        className={`p-1 rounded-lg transition-colors ${selecionado ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary'}`}
                        disabled={ehOMesmoUsuario}
                    >
                        {selecionado ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    <div className="flex items-center gap-3">
                        <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="md" coroa={ehOMesmoUsuario} />
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] font-black uppercase text-foreground/90 whitespace-nowrap">
                                    {membro.nome || <span className="italic opacity-30 italic">Pendente</span>}
                                </span>
                                {ehOMesmoUsuario && (
                                    <span className="shrink-0 text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/10">
                                        VOCÊ
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground/50 lowercase mt-0.5 truncate">{membro.email}</span>
                        </div>
                    </div>
                </div>
            </td>

            {/* Role / Cargo */}
            <td className="px-6 py-4 border-b border-border/40">
                <div className="inline-flex relative group/sel">
                    {/* Background Dinâmico do Badge/Select */}
                    <div className={`
                        absolute inset-0 rounded-full transition-all duration-300
                        ${membro.role === 'ADMIN' ? 'bg-rose-500/5 group-hover/sel:bg-rose-500/10' : 
                          membro.role === 'COORDENADOR' || membro.role === 'GESTOR' ? 'bg-blue-500/5 group-hover/sel:bg-blue-500/10' :
                          membro.role === 'LIDER' ? 'bg-indigo-500/5 group-hover/sel:bg-indigo-500/10' :
                          membro.role === 'SUBLIDER' ? 'bg-amber-500/5 group-hover/sel:bg-amber-500/10' :
                          'bg-emerald-500/5 group-hover/sel:bg-emerald-500/10'}
                    `} />
                    
                    <select
                        className={`
                            relative appearance-none bg-transparent border-none 
                            rounded-full px-4 py-1.5 pr-8 text-[9px] font-black uppercase tracking-[0.1em] 
                            outline-none transition-all z-10
                            ${membro.role === 'ADMIN' ? 'text-rose-600' : 
                              membro.role === 'COORDENADOR' || membro.role === 'GESTOR' ? 'text-blue-600' :
                              membro.role === 'LIDER' ? 'text-indigo-600' :
                              membro.role === 'SUBLIDER' ? 'text-amber-600' :
                              'text-emerald-600'}
                            ${podeAlterarRole ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                        `}
                        value={membro.role}
                        onChange={e => onAlterarRole(membro, e.target.value)}
                        disabled={!podeAlterarRole}
                    >
                        {rolesDisponiveis.map(r => (
                            <option key={r} value={r} className="bg-white text-slate-900 font-bold">
                                {r}
                            </option>
                        ))}
                    </select>

                    {podeAlterarRole && (
                        <ChevronDown 
                            size={12} 
                            className={`
                                absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-20 transition-all duration-300
                                ${membro.role === 'ADMIN' ? 'text-rose-400' : 
                                  membro.role === 'COORDENADOR' || membro.role === 'GESTOR' ? 'text-blue-400' :
                                  membro.role === 'LIDER' ? 'text-indigo-400' :
                                  membro.role === 'SUBLIDER' ? 'text-amber-400' :
                                  'text-emerald-400'}
                                group-hover/sel:translate-y-[-40%]
                            `} 
                        />
                    )}
                </div>
            </td>

            {/* Equipes */}
            <td className="px-6 py-4 border-b border-border/40 hidden xl:table-cell">
                <div className="flex flex-wrap gap-1.5">
                    {membro.equipe_nome ? (
                        membro.equipe_nome.split(',').map((eq, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-lg bg-background border border-border/40 text-[9px] font-black uppercase tracking-tight text-muted-foreground/70">
                                {eq.trim()}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-muted-foreground/20 italic">— Sem equipe</span>
                    )}
                </div>
            </td>

            {/* Último Acesso */}
            <td className="px-6 py-4 border-b border-border/40 hidden lg:table-cell">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                    {membro.criado_em ? new Date(membro.criado_em).toLocaleDateString('pt-BR') : 'Desconhecido'}
                </span>
            </td>

            {/* Ações */}
            <td className="px-6 py-4 border-b border-border/40 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => onVerPerfil(membro.id)}
                        className="p-2 rounded-xl text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Ver Perfil"
                    >
                        <Eye size={16} />
                    </button>

                    {usarPermissaoAcesso('equipes:editar_equipe') && (
                        <button
                            onClick={() => onAlocar(membro)}
                            className="p-2 rounded-xl text-muted-foreground/30 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Alocação Rápida"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    )}

                    {!ehOMesmoUsuario && podeDesativar && (
                        <button
                            onClick={() => onRemover(membro)}
                            className="p-2 rounded-xl text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Remover acesso"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
});
