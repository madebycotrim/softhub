import { memo } from 'react';
import { Square, CheckSquare, ChevronDown, Trash2, Eye } from 'lucide-react';
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
    rolesDisponiveis: string[];
}

export const LinhaMembro = memo(({ membro, salvando, selecionado, onToggleSelect, onAlterarRole, onRemover, onVerPerfil, rolesDisponiveis }: LinhaMembroProps) => {
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
                        <div className="flex flex-col">
                            <span className="text-[12px] font-black uppercase text-foreground/90 leading-tight">
                                {membro.nome || <span className="italic opacity-30">Pendente</span>}
                                {ehOMesmoUsuario && <span className="ml-2 text-[8px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">VOCÊ</span>}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground lowercase mt-0.5">{membro.email}</span>
                        </div>
                    </div>
                </div>
            </td>

            {/* Role / Cargo */}
            <td className="px-6 py-4 border-b border-border/40">
                <div className="relative group/sel">
                    <select
                        className={`appearance-none bg-muted/20 border border-transparent rounded-xl px-3 py-1.5 pr-8 text-[10px] font-black uppercase tracking-widest text-foreground outline-none transition-all ${podeAlterarRole ? 'hover:bg-muted/40 hover:border-border cursor-pointer focus:ring-4 focus:ring-primary/5' : 'cursor-not-allowed opacity-50'}`}
                        value={membro.role}
                        onChange={e => onAlterarRole(membro, e.target.value)}
                        disabled={!podeAlterarRole}
                    >
                        {rolesDisponiveis.map(r => <option key={r} value={r} className="bg-card">{r}</option>)}
                    </select>
                    {podeAlterarRole && <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/sel:opacity-100 transition-opacity" />}
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
