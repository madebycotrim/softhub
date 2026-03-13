import { FolderKanban, Clock, Users, Megaphone, LayoutDashboard, Database, Settings, LogOut, Sun, Moon, QrCode, FileText, LayoutGrid, Bell, Trash2, CheckCircle2, ListTodo, Layers } from 'lucide-react';
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
import { Emblema } from './Emblema';
import { useState } from 'react';
import { SeletorProjetoGlobal } from './SeletorProjetoGlobal';


interface BarraLateralProps {
    aoNavegar?: () => void;
    aoAbrirScanner?: () => void;
}

export function BarraLateral({ aoNavegar, aoAbrirScanner }: BarraLateralProps) {
    const location = useLocation();
    const currentPath = location.pathname;
    const { usuario, sair } = usarAutenticacao();
    const { tema, setTema } = usarTema();
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
            // Regra especial: O grupo 'Gestão' aparece se houver links visíveis ou for ADMIN
            if (g.label === 'Gestão') {
                return (usuario?.role === 'ADMIN') || g.links.length > 0;
            }
            return g.links.length > 0;
        });

    const NavLink = ({ link }: { link: { label: string; path: string; icon: any } }) => {
        const ativo = currentPath.startsWith(link.path);
        const Icon = link.icon;

        return (
            <Link
                to={link.path}
                onClick={aoNavegar}
                className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13.5px] font-medium
                    transition-all duration-200 select-none
                    ${ativo
                        ? 'text-primary'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }
                `}
            >
                {ativo && (
                    <span className="absolute inset-0 rounded-2xl bg-primary/[0.12] border border-primary/20" />
                )}
                {ativo && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <Icon
                    size={17}
                    strokeWidth={ativo ? 2.5 : 1.75}
                    className={`relative shrink-0 transition-all duration-200
                        ${ativo ? 'text-primary' : 'text-sidebar-foreground/30 group-hover:text-sidebar-foreground/70'}
                    `}
                />
                <span className="relative truncate">
                    {link.label}
                    {!ativo && (
                        <span className="absolute bottom-0 left-0 w-0 h-px bg-sidebar-foreground/20 transition-all duration-300 group-hover:w-full" />
                    )}
                </span>
            </Link>
        );
    };

    return (
        <aside className="w-full h-full flex flex-col relative overflow-hidden animar-entrada">

            {/* Fundo */}
            <div className="absolute inset-0 bg-sidebar" />
            <div className="absolute right-0 inset-y-0 w-px bg-sidebar-border/30" />

            {/* ── Logo ── */}
            <div className="h-16 flex items-center px-4 shrink-0 relative z-10">
                <div className="flex items-center gap-3 w-full">
                    <img src={logoUnieuro} alt="Unieuro" className="w-10 h-10 object-contain" />
                    <div className="flex flex-col leading-none min-w-0">
                        <span className="text-[16px] font-bold text-sidebar-foreground tracking-tight truncate">
                            Fábrica de Software
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-primary/60 uppercase tracking-[0.22em] font-black">
                                SoftHub
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Seletor de Projeto Global ── */}
            <div className="px-3 pb-3 shrink-0 relative z-10">
                 <SeletorProjetoGlobal />
            </div>

            {/* ── Navegação ── */}
            <nav className="flex-1 overflow-y-auto relative z-10 scrollbar-none py-3 px-3 flex flex-col gap-1">
                {grupos.map((grupo, i) => (
                    <div key={grupo.label}>

                        {/* Separador entre grupos (exceto o primeiro) */}
                        {i > 0 && (
                            <div className="flex items-center gap-2 px-2 my-3">
                                <div className="h-px flex-1 bg-gradient-to-r from-sidebar-border/50 to-transparent" />
                            </div>
                        )}

                        {/* Label do grupo */}
                        <div className="flex items-center gap-2 px-3 mb-1.5">
                            <span className="text-[10px] font-black text-sidebar-foreground/30 uppercase tracking-[0.22em]">
                                {grupo.label}
                            </span>
                        </div>

                        {/* Links */}
                        <div className="flex flex-col gap-0.5">
                            {grupo.links.map(link => (
                                <NavLink key={link.path} link={link} />
                            ))}
                        </div>

                    </div>
                ))}
            </nav>

            {/* ── Footer / Usuário ── */}
            <div className="relative z-10 p-3">
                {/* Login via QR Code - Apenas Mobile */}
                <div className="flex items-center justify-between px-2 mb-2 lg:hidden">
                    <span className="text-[10px] font-black text-sidebar-foreground/20 uppercase tracking-[0.22em]">
                        Login via QR
                    </span>
                    <Tooltip texto="Conectar via QR Code">
                        <button
                            onClick={() => {
                                aoAbrirScanner?.();
                                aoNavegar?.();
                            }}
                            className="p-1.5 rounded-2xl text-sidebar-foreground/30 hover:text-primary hover:bg-primary/10 transition-all duration-300"
                        >
                            <QrCode size={14} />
                        </button>
                    </Tooltip>
                </div>

                {/* Notificações */}
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-black text-sidebar-foreground/20 uppercase tracking-[0.22em]">
                        Notificações
                    </span>
                    <Tooltip texto="Ver notificações">
                        <button
                            onClick={() => setModalNotificacoes(true)}
                            className="relative p-1.5 rounded-2xl text-sidebar-foreground/30 hover:text-primary hover:bg-primary/10 transition-all duration-300 group/notif"
                        >
                            <Bell size={14} className={totalNaoLidas > 0 ? "animate-pulse text-primary" : ""} />
                            {totalNaoLidas > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[9px] font-black text-white rounded-full flex items-center justify-center ring-2 ring-sidebar shadow-lg shadow-primary/20">
                                    {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
                                </span>
                            )}
                        </button>
                    </Tooltip>
                </div>

                {/* Alternar Tema */}
                <div className="flex items-center justify-between px-2 mb-3">
                    <span className="text-[10px] font-black text-sidebar-foreground/20 uppercase tracking-[0.22em]">
                        Tema
                    </span>
                    <Tooltip texto={tema === 'dark' ? "Modo Claro" : "Modo Escuro"}>
                        <button
                            onClick={() => {
                                setTema(tema === 'dark' ? 'light' : 'dark');
                                aoNavegar?.();
                            }}
                            className="p-1.5 rounded-2xl text-sidebar-foreground/30 hover:text-primary hover:bg-primary/10 transition-all duration-300 group/theme"
                        >
                            {tema === 'dark' ? (
                                <Sun size={14} className="group-hover/theme:rotate-90 transition-transform duration-500" />
                            ) : (
                                <Moon size={14} className="group-hover/theme:-rotate-12 transition-transform duration-500" />
                            )}
                        </button>
                    </Tooltip>
                </div>

                {usuario && (
                    <>

                        {/* Divisor com gradiente */}
                        <div className="h-px mb-3 bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

                        <div className="flex items-center gap-2.5 px-2 py-2 rounded-2xl hover:bg-sidebar-accent/50 transition-colors duration-200">

                            {/* Avatar */}
                            <div className="relative shrink-0 group">
                                <Avatar nome={usuario.nome} fotoPerfil={usuario.foto_perfil || null} tamanho="md" />
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-sidebar" />
                            </div>

                            {/* Texto */}
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[13px] font-semibold text-sidebar-foreground truncate leading-none tracking-tight">
                                    {usuario.nome}
                                </span>
                                <span className="text-[11px] text-sidebar-foreground/40 lowercase truncate leading-none mt-1">
                                    {usuario.email}
                                </span>
                            </div>

                            {/* Sair */}
                            <Tooltip texto="Sair">
                                <button
                                    onClick={() => {
                                        sair();
                                        aoNavegar?.();
                                    }}
                                    className="shrink-0 p-1.5 rounded-2xl text-sidebar-foreground/20 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 group/logout"
                                >
                                    <LogOut size={14} className="transition-transform duration-200 group-hover/logout:translate-x-0.5" />
                                </button>
                            </Tooltip>

                        </div>
                    </>
                )}
            </div>

            {/* Modal de Notificações */}
            <Modal
                aberto={modalNotificacoes}
                aoFechar={() => setModalNotificacoes(false)}
                titulo="Central de Notificações"
                largura="md"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                            {totalNaoLidas} Pendentes
                        </p>
                        {totalNaoLidas > 0 && (
                            <button
                                onClick={limparTodas}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                            >
                                <Trash2 size={12} />
                                Limpar Tudo
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {notificacoes.map((n) => (
                            <div
                                key={n.id}
                                className="group relative bg-card border border-border/50 p-4 rounded-2xl hover:border-primary/30 transition-all hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Emblema
                                                texto={n.tipo}
                                                variante={n.tipo === 'ponto' ? 'amarelo' : n.tipo === 'tarefa' ? 'azul' : 'roxo'}
                                            />
                                            <span className="text-[10px] text-muted-foreground/40 font-medium">
                                                {formatarTempoAtras(n.criado_em)}
                                            </span>
                                        </div>
                                        <h4 className="text-[13px] font-bold text-foreground leading-tight mb-1">{n.titulo}</h4>
                                        <p className="text-[12px] text-muted-foreground/70 leading-relaxed">{n.mensagem}</p>
                                    </div>
                                    <button
                                        onClick={() => marcarComoLida(n.id)}
                                        className="shrink-0 p-1.5 rounded-2xl text-muted-foreground/20 hover:text-primary hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100"
                                        title="Marcar como lida"
                                    >
                                        <CheckCircle2 size={16} />
                                    </button>
                                </div>
                                {n.link_acao && (
                                    <Link
                                        to={n.link_acao}
                                        onClick={() => { marcarComoLida(n.id); setModalNotificacoes(false); }}
                                        className="inline-flex mt-3 text-[10px] font-black text-primary uppercase tracking-[0.1em] hover:underline"
                                    >
                                        Ver detalhes →
                                    </Link>
                                )}
                            </div>
                        ))}

                        {totalNaoLidas === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Bell size={24} className="text-muted-foreground/30" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Tudo limpo por aqui</p>
                                <p className="text-[11px] text-muted-foreground/30 mt-1 italic">Você não tem notificações pendentes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </aside>
    );
}
