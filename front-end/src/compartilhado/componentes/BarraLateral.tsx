import { FolderKanban, Clock, Users, Megaphone, LayoutDashboard, Database, Settings, LogOut, Sun, Moon, FileText, LayoutGrid, Bell, ListTodo, Layers } from 'lucide-react';
import { useLocation, Link } from 'react-router';
import { Tooltip } from './Tooltip';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarTema } from '@/contexto/ContextoTema';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Avatar } from './Avatar';
import { Modal } from './Modal';
import { usarNotificacoes } from '@/compartilhado/hooks/usarNotificacoes';
import { formatarTempoAtras } from '@/utilitarios/formatadores';
import logoUnieuro from '@/assets/logo-unieuro.png';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../servicos/api';
import { SeletorProjetoGlobal } from './SeletorProjetoGlobal';
import { usarMembrosOnline } from '../hooks/usarMembrosOnline';


interface BarraLateralProps {
    aoNavegar?: () => void;
    aoAbrirScanner?: () => void;
}

/**
 * Barra lateral com navegação principal, notificações, tema e perfil.
 */
export function BarraLateral({ aoNavegar, aoAbrirScanner }: BarraLateralProps) {
    const location = useLocation();
    const currentPath = location.pathname;
    const { usuario, sair, projetoAtivoId } = usarAutenticacao();
    const { tema, setTema } = usarTema();
    const queryClient = useQueryClient();
    const { notificacoes, marcarComoLida, limparTodas } = usarNotificacoes();
    const [modalNotificacoes, setModalNotificacoes] = useState(false);

    const totalNaoLidas = notificacoes.length;

    // Permissões de Visualização
    const podeVerDashboard = usarPermissaoAcesso('dashboard:visualizar');
    const podeVerKanban = usarPermissaoAcesso('tarefas:visualizar_kanban');
    const podeVerBacklog = usarPermissaoAcesso('tarefas:visualizar_backlog');
    const podeVerPonto = usarPermissaoAcesso('ponto:visualizar');

    const podeVerAvisos = usarPermissaoAcesso('avisos:visualizar');
    const podeVerJustificativas = usarPermissaoAcesso('ponto:aprovar_justificativa');
    const podeVerMembrosAdmin = usarPermissaoAcesso('membros:gerenciar');

    const podeVerRelatorios = usarPermissaoAcesso('relatorios:visualizar');
    const podeVerLogs = usarPermissaoAcesso('logs:visualizar');
    const podeVerEquipes = usarPermissaoAcesso('equipes:visualizar');
    const podeVerProjetosAdmin = usarPermissaoAcesso('projetos:visualizar');
    const podeVerProjetoDetalhes = usarPermissaoAcesso('projetos:visualizar_detalhes');
    const podeVerConfiguracoes = usarPermissaoAcesso('configuracoes:visualizar');

    const gruposBrutos = [
        {
            label: 'Visão Geral',
            links: [
                { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, visivel: podeVerDashboard },
                { label: 'Backlog', path: '/app/backlog', icon: ListTodo, visivel: podeVerBacklog },
                { label: 'Avisos', path: '/app/avisos', icon: Megaphone, visivel: podeVerAvisos },
            ],
        },
        {
            label: 'Equipe',
            links: [
                { label: 'Projeto', path: '/app/projeto', icon: Layers, visivel: podeVerProjetoDetalhes },
                { label: 'Kanban', path: '/app/kanban', icon: FolderKanban, visivel: podeVerKanban },
                { label: 'Ponto Eletrônico', path: '/app/ponto', icon: Clock, visivel: podeVerPonto || podeVerJustificativas },
            ],
        },
        {
            label: 'Administração',
            links: [
                { label: 'Membros', path: '/app/admin/membros', icon: Users, visivel: podeVerMembrosAdmin },
                { label: 'Equipes', path: '/app/admin/equipes', icon: LayoutGrid, visivel: podeVerEquipes },
                { label: 'Projetos', path: '/app/admin/projetos', icon: FolderKanban, visivel: podeVerProjetosAdmin },
                { label: 'Relatórios', path: '/app/admin/relatorios', icon: FileText, visivel: podeVerRelatorios },
                { label: 'Logs', path: '/app/admin/logs', icon: Database, visivel: podeVerLogs },
                { label: 'Configurações', path: '/app/admin/configuracoes', icon: Settings, visivel: podeVerConfiguracoes },
            ],
        },
    ];

    // Filtra apenas grupos que possuem pelo menos um link visível
    const grupos = gruposBrutos
        .map(g => ({
            ...g,
            links: g.links.filter(l => l.visivel)
        }))
        .filter(g => {
            if (g.label === 'Administração') {
                return (usuario?.role === 'ADMIN') || g.links.length > 0;
            }
            return g.links.length > 0;
        });

    const NavLink = ({ link }: { link: { label: string; path: string; icon: any } }) => {
        const ativo = currentPath.startsWith(link.path);
        const Icon = link.icon;

        const handlePrefetch = useCallback(() => {
            if (!projetoAtivoId) return;

            if (link.path === '/app/kanban' || link.path === '/app/backlog') {
                queryClient.prefetchQuery({
                    queryKey: ['tarefas', projetoAtivoId, undefined, undefined, undefined],
                    queryFn: async () => {
                        const res = await api.get('/api/tarefas', { params: { projetoId: projetoAtivoId } });
                        return res.data || [];
                    },
                    staleTime: 30000,
                });
            }

            if (link.path === '/app/dashboard') {
                queryClient.prefetchQuery({
                    queryKey: ['dashboard', projetoAtivoId],
                    queryFn: async () => {
                        const res = await api.get(`/api/dashboard/${projetoAtivoId}`);
                        return res.data;
                    },
                    staleTime: 30000,
                });
            }
        }, [link.path]);

        return (
            <Link
                to={link.path}
                onClick={aoNavegar}
                onMouseEnter={handlePrefetch}
                className={`
                    group relative flex items-center gap-3 px-3 py-1.5 text-sm font-medium
                    transition-all duration-200 select-none mx-3 rounded-lg
                    ${ativo
                        ? 'text-primary bg-primary/[0.08] dark:bg-primary/15'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                `}
            >
                {/* Indicador lateral */}
                <div className={`
                    absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-200
                    ${ativo
                        ? 'bg-primary opacity-100'
                        : 'bg-muted-foreground/40 opacity-0 group-hover:opacity-100'
                    }
                `} />

                <div className={`
                    flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-200
                    ${ativo
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                    }
                `}>
                    <Icon
                        size={16}
                        strokeWidth={ativo ? 2.2 : 1.8}
                    />
                </div>

                <span className={`${ativo ? 'font-semibold' : ''} transition-colors`}>
                    {link.label}
                </span>
            </Link>
        );
    };

    return (
        <aside className="w-full h-full flex flex-col relative overflow-hidden animar-entrada bg-sidebar border-r border-sidebar-border/30">
            {/* Brilho decorativo sutil */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/[0.1] blur-[80px] rounded-full pointer-events-none" />

            {/* ── Logo ── */}
            <div className="h-16 flex items-center px-5 shrink-0 relative z-10">
                <div className="flex items-center gap-3.5 w-full">
                    <img src={logoUnieuro} alt="Unieuro" className="w-10 h-10 object-contain" />
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="text-[18px] font-black text-sidebar-foreground tracking-tight truncate">
                            Fábrica de Software
                        </span>
                        <span className="text-[12px] text-primary/50 uppercase tracking-[0.25em] font-black mt-0.5">
                            SoftHub
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Seletor de Projeto Global ── */}
            <div className="p-3 shrink-0 relative z-10">
                <SeletorProjetoGlobal />
            </div>

            {/* ── Navegação ── */}
            <nav className="flex-1 relative z-10 scrollbar-none flex flex-col overflow-hidden">
                {grupos.map((grupo, i) => (
                    <div key={grupo.label}>
                        {/* Label do grupo com linha decorativa */}
                        <div className={`flex items-center gap-3 px-6 ${i === 0 ? 'mt-0.5 mb-0.5' : 'mt-3 mb-0.5'}`}>
                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] shrink-0">
                                {grupo.label}
                            </span>
                            <div className="flex-1 h-px bg-border/30" />
                        </div>

                        {/* Links */}
                        <div className="flex flex-col">
                            {grupo.links.map(link => (
                                <NavLink key={link.path} link={link} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── Rodapé ── */}
            <div className="shrink-0 px-4 pb-3 pt-2 mt-auto relative z-10 space-y-2 border-t border-sidebar-border/20">

                {/* Membros Online */}
                <MembrosOnline />

                {/* Notificações */}
                <button
                    onClick={() => setModalNotificacoes(true)}
                    className="w-full flex items-center justify-between px-2 group/notif"
                >
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                        Notificações
                    </span>
                    <div className="relative p-1.5 text-muted-foreground/30 group-hover/notif:text-primary transition-colors">
                        <Bell size={16} />
                        {totalNaoLidas > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary text-[8px] font-bold text-white rounded-full flex items-center justify-center">
                                {totalNaoLidas}
                            </span>
                        )}
                    </div>
                </button>

                {/* Tema — temporariamente desativado (forçado modo claro) */}

                {/* Perfil do Usuário */}
                <div className="flex items-center gap-3 p-2.5 bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-xl border border-sidebar-border/40">
                    <Avatar nome={usuario?.nome || 'User'} fotoPerfil={usuario?.foto_perfil} tamanho="sm" />
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[12px] font-bold text-sidebar-foreground truncate leading-tight">
                            {usuario?.nome}
                        </span>
                        <span className="text-[10px] text-primary/60 truncate leading-tight mt-0.5">
                            {usuario?.email}
                        </span>
                    </div>
                    <button
                        onClick={sair}
                        className="p-1.5 text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all active:scale-90 shrink-0"
                        title="Sair"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>

            {/* Modal Notificações */}
            <Modal
                aberto={modalNotificacoes}
                aoFechar={() => setModalNotificacoes(false)}
                titulo="Central de Notificações"
            >
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                    {notificacoes.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">Recentes</span>
                                <button
                                    onClick={limparTodas}
                                    className="text-[10px] font-black text-primary hover:underline"
                                >
                                    Limpar Todas
                                </button>
                            </div>
                            <div className="space-y-2">
                                {notificacoes.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => marcarComoLida(n.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer group/item
                                            ${n.lida
                                                ? 'bg-muted/30 border-border/40 opacity-60'
                                                : 'bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.05]'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-background rounded-xl border border-border/50">
                                                <Bell size={14} className="text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground leading-tight">{n.titulo}</p>
                                                <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{n.mensagem}</p>
                                                <span className="text-[10px] font-medium text-muted-foreground/40 mt-2 block">
                                                    {formatarTempoAtras(n.criado_em)}
                                                </span>
                                            </div>
                                            {!n.lida && (
                                                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 bg-muted/30 rounded-full mb-4">
                                <Bell size={32} className="text-muted-foreground/20" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">Tudo limpo por aqui!</h3>
                            <p className="text-xs text-muted-foreground mt-1">Você não tem novas notificações.</p>
                        </div>
                    )}
                </div>
            </Modal>
        </aside>
    );
}

/**
 * Componente interno para exibir membros online (com ponto aberto).
 */
function MembrosOnline() {
    const { membrosOnline, carregando } = usarMembrosOnline();

    if (carregando || membrosOnline.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 p-3 bg-primary/5 border border-primary/10 rounded-2xl animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Online Agora</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center -space-x-2">
                {membrosOnline.slice(0, 5).map((m: any) => (
                    <Tooltip key={m.id} texto={m.nome} posicao="top">
                        <Avatar
                            nome={m.nome}
                            fotoPerfil={m.foto_perfil}
                            tamanho="sm"
                            className="ring-2 ring-sidebar border-none"
                        />
                    </Tooltip>
                ))}
                {membrosOnline.length > 5 && (
                    <div className="h-6 w-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-[8px] font-black text-muted-foreground z-10">
                        +{membrosOnline.length - 5}
                    </div>
                )}
            </div>
        </div>
    );
}
