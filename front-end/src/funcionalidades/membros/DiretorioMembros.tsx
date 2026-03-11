import { useState, useMemo } from 'react';
import { Mail, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router';
import { usarMembros } from './usarMembros';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { EstadoVazio } from '../../compartilhado/componentes/EstadoVazio';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { BarraBusca } from '../../compartilhado/componentes/BarraBusca';
import type { Membro } from './usarMembros';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleLabel(role: string) {
    return role.toUpperCase();
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
                bg-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col transition-all
                hover:border-primary/30
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
        const ordem = ['ADMIN', 'COORDENADOR', 'GESTOR', 'LIDER', 'SUBLIDER', 'MEMBRO'];

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

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Diretório de Membros"
                subtitulo="Conheça as equipes e líderes da Fábrica de Software."
                icone={Users}
            >
                <div className="relative w-full sm:w-72">
                    <BarraBusca 
                        valor={busca}
                        aoMudar={setBusca}
                        placeholder="Buscar por nome ou email..."
                    />
                </div>
            </CabecalhoFuncionalidade>

            {carregando ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Carregando Centralizar={false} tamanho="lg" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Sincronizando Diretório</span>
                </div>
            ) : erro ? (
                <div className="py-20 text-center">
                    <p className="text-destructive font-bold uppercase tracking-widest text-xs">{erro}</p>
                </div>
            ) : membros.length === 0 ? (
                <EstadoVazio titulo="Nenhum membro registrado" descricao="O sistema ainda não possui membros ativos ou inativos." iconeCustom={<Users className="w-10 h-10 text-slate-300" />} />
            ) : gruposHierarquia.length === 0 ? (
                <EstadoVazio
                    tipo="pesquisa"
                    titulo="Membro não encontrado"
                    descricao={`Não encontramos nenhum membro ativo com o termo "${busca}".`}
                    acao={{
                        rotulo: "Limpar busca",
                        aoClicar: () => setBusca('')
                    }}
                />
            ) : (
                <div className="space-y-12">
                    {gruposHierarquia.map(grupo => (
                        <div key={grupo.role} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                                    {grupo.titulo}
                                </h3>
                                <div className="h-px w-full bg-border/40" />
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