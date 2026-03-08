import { useState, useMemo } from 'react';
import { Search, Mail, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router';
import { usarMembros } from './usarMembros';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { EstadoVazio } from '../../compartilhado/componentes/EstadoVazio';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import type { Membro } from './usarMembros';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleLabel(role: string) {
    switch (role) {
        case 'ADMIN': return "Administração";
        case 'LIDER_GRUPO': return "Liderança de Grupo";
        case 'LIDER_EQUIPE': return "Liderança de Equipe";
        case 'MEMBRO': return "Membros";
        default: return "Visitantes";
    }
}

function formatarDataEntrada(dataHora: string): string {
    return formatarDataHora(dataHora).split(' às')[0];
}

// ─── Componente: CardMembro ───────────────────────────────────────────────────

function CardMembro({ membro }: { membro: Membro }) {
    return (
        <Link
            to={`/app/membro/${membro.id}`}
            className={`
                bg-card border border-border rounded-2xl p-6 flex flex-col transition-all shadow-sm
                hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10
                ${membro.ativo ? '' : 'opacity-60'}
            `}
        >
            <div className="flex items-start justify-between mb-4">
                <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="lg" />
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-bold text-card-foreground leading-tight">
                    {membro.nome}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{membro.email}</span>
                </div>
            </div>

            {membro.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {membro.bio}
                </p>
            )}

            <div className="mt-auto pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Na plataforma desde {formatarDataEntrada(membro.criado_em)}</span>
            </div>
        </Link>
    );
}

// ─── Componente Principal: DiretorioMembros ───────────────────────────────────

/**
 * Diretório visual de todos os membros do sistema.
 * Contém busca por nome/e-mail e filtro visual de ativo/inativo.
 */
export function DiretorioMembros() {
    const { membros, carregando, erro } = usarMembros();
    const [busca, setBusca] = useState('');

    const gruposHierarquia = useMemo(() => {
        const ordem = ['ADMIN', 'LIDER_GRUPO', 'LIDER_EQUIPE', 'MEMBRO', 'VISITANTE'];

        // 1. Filtrar Ativos e por Busca
        const ativos = membros.filter(m => m.ativo);
        const filtrados = busca.trim()
            ? ativos.filter(m =>
                m.nome.toLowerCase().includes(busca.toLowerCase()) ||
                m.email.toLowerCase().includes(busca.toLowerCase())
            )
            : ativos;

        // 2. Agrupar por Role
        const grupos: Record<string, Membro[]> = {};
        filtrados.forEach(m => {
            if (!grupos[m.role]) grupos[m.role] = [];
            grupos[m.role].push(m);
        });

        // 3. Ordenar chaves pela hierarquia
        return ordem
            .filter(role => grupos[role] && grupos[role].length > 0)
            .map(role => ({
                role,
                titulo: getRoleLabel(role),
                membros: grupos[role]
            }));
    }, [membros, busca]);

    if (carregando) return <Carregando />;
    if (erro) return <p className="text-destructive text-center py-8">{erro}</p>;
    if (membros.length === 0) return <EstadoVazio titulo="Nenhum membro encontrado." />;

    return (
        <div className="space-y-6">
            <CabecalhoFuncionalidade
                titulo="Diretório de Membros"
                subtitulo="Conheça as equipes e líderes da Fábrica de Software."
                icone={Users}
            >
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        aria-label="Buscar membro por nome ou e-mail"
                        className="block w-full pl-9 pr-3 py-2 border border-border rounded-xl leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                        placeholder="Buscar por nome ou email..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                    />
                </div>
            </CabecalhoFuncionalidade>

            {gruposHierarquia.length === 0 ? (
                <EstadoVazio
                    titulo="Nenhum resultado"
                    descricao={membros.filter(m => m.ativo).length === 0 ? "Nenhum membro ativo no sistema." : `Nenhum membro encontrado com o termo "${busca}".`}
                />
            ) : (
                <div className="space-y-12">
                    {gruposHierarquia.map(grupo => (
                        <div key={grupo.role} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                                    {grupo.titulo}
                                </h3>
                                <div className="h-px w-full bg-gradient-to-r from-border/60 to-transparent" />
                                <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-bold text-muted-foreground">
                                    {grupo.membros.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {grupo.membros.map(membro => (
                                    <CardMembro key={membro.id} membro={membro} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}