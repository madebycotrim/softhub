import { FolderKanban, Clock, Users, Megaphone, LayoutDashboard, Database, Settings, LogOut, Layers } from 'lucide-react';
import { useLocation, Link } from 'react-router';
import { usarAutenticacao } from '../../funcionalidades/autenticacao/usarAutenticacao';
import { Avatar } from './Avatar';
import logoUnieuro from '../../assets/logo-unieuro.png';
import { useState } from 'react';
import { Modal } from './Modal';
import ScannerQR from '../../funcionalidades/autenticacao/ScannerQR';

export function BarraLateral() {
    const location = useLocation();
    const currentPath = location.pathname;
    const { usuario, sair } = usarAutenticacao();
    const [scannerAberto, setScannerAberto] = useState(false);

    const grupos = [
        {
            label: 'Visão Geral',
            links: [
                { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
            ],
        },
        {
            label: 'Projetos',
            links: [
                { label: 'Kanban', path: '/app/kanban', icon: FolderKanban },
                { label: 'Backlog & Sprints', path: '/app/backlog', icon: Layers },
            ],
        },
        {
            label: 'Equipe',
            links: [
                { label: 'Ponto Eletrônico', path: '/app/ponto', icon: Clock },
                { label: 'Diretório', path: '/app/membros', icon: Users },
                { label: 'Avisos', path: '/app/avisos', icon: Megaphone },
            ],
        },
        {
            label: 'Gestão',
            links: [
                { label: 'Administração', path: '/app/admin/membros', icon: Settings },
                { label: 'Painel de Logs', path: '/app/logs', icon: Database },
            ],
        },
    ];

    const NavLink = ({ link }: { link: { label: string; path: string; icon: any } }) => {
        const ativo = currentPath.startsWith(link.path);
        const Icon = link.icon;

        return (
            <Link
                to={link.path}
                className={`
                    group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                    transition-all duration-200 select-none
                    ${ativo
                        ? 'text-primary'
                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/90 hover:bg-white/[0.04]'
                    }
                `}
            >
                {ativo && (
                    <span className="absolute inset-0 rounded-xl bg-primary/[0.12] border border-primary/20" />
                )}
                {ativo && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.7)]" />
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
        <aside className="w-64 hidden lg:flex flex-col shrink-0 h-full relative">

            {/* Fundo */}
            <div className="absolute inset-0 bg-sidebar" />
            <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
            <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-primary/[0.05] to-transparent pointer-events-none" />

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

            {/* ── Navegação ── */}
            <nav className="flex-1 overflow-y-auto relative z-10 scrollbar-none py-3 px-3 flex flex-col gap-1">
                {grupos.map((grupo, i) => (
                    <div key={grupo.label}>

                        {/* Separador entre grupos (exceto o primeiro) */}
                        {i > 0 && (
                            <div className="flex items-center gap-2 px-2 my-3">
                                <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                            </div>
                        )}

                        {/* Label do grupo */}
                        <div className="flex items-center gap-2 px-3 mb-1.5">
                            <span className="text-[10px] font-black text-sidebar-foreground/20 uppercase tracking-[0.22em]">
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
            {usuario && (
                <div className="relative z-10 p-3">

                    {/* Divisor com gradiente */}
                    <div className="h-px mb-3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors duration-200">

                        {/* Avatar */}
                        <div className="relative shrink-0 group">
                            <Avatar nome={usuario.nome} fotoPerfil={usuario.foto_perfil || null} tamanho="md" />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-sidebar shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                        </div>

                        {/* Texto */}
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[13px] font-semibold text-sidebar-foreground truncate leading-none tracking-tight">
                                {usuario.nome}
                            </span>
                            <span className="text-[11px] text-sidebar-foreground/35 lowercase truncate leading-none mt-1">
                                {usuario.email}
                            </span>
                        </div>

                        {/* Sair */}
                        <button
                            onClick={sair}
                            title="Sair"
                            className="shrink-0 p-1.5 rounded-lg text-sidebar-foreground/20 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 group/logout"
                        >
                            <LogOut size={14} className="transition-transform duration-200 group-hover/logout:translate-x-0.5" />
                        </button>

                    </div>
                </div>
            )}

            {/* Modal Scanner */}
            <Modal
                aberto={scannerAberto}
                aoFechar={() => setScannerAberto(false)}
                titulo="Conectar via QR Code"
                largura="sm"
            >
                <ScannerQR aoFechar={() => setScannerAberto(false)} />
            </Modal>
        </aside>
    );
}