import { memo } from 'react';
import { ExternalLink, Github, Code2, Rocket, Globe, Boxes, ChevronRight, Figma, BookText } from 'lucide-react';
import { usarPortfolio } from '../hooks/usarPortfolio';
import { Skeleton } from '@/compartilhado/componentes/Skeleton';

/**
 * Landing Page do Portfolio Público da Fábrica de Software.
 * Exibe projetos desenvolvidos para visitantes externos sem necessidade de login.
 */
export const PaginaPortfolio = memo(() => {
    const { projetos, carregando, erro } = usarPortfolio();

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-primary/30 selection:text-primary-foreground">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Rocket className="text-primary-foreground" size={22} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black tracking-tighter uppercase leading-none">Fábrica de Software</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Portfolio Público</span>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#projetos" className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors">Projetos</a>
                        <a href="https://unieuro.edu.br" className="text-[11px] font-black uppercase tracking-widest hover:text-primary transition-colors">Instituição</a>
                        <a 
                            href="/login" 
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.03] active:scale-[0.98] transition-all"
                        >
                            Acesso Interno
                        </a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-24 md:py-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />
                <div className="container mx-auto px-6 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest animar-entrada">
                        <Globe size={12} /> Engenharia de Software em Ação
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9] max-w-4xl mx-auto animar-entrada" style={{ animationDelay: '100ms' }}>
                        Transformando ideias em <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">código de alto nível.</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium animar-entrada" style={{ animationDelay: '200ms' }}>
                        Conheça os sistemas desenvolvidos pelos estudantes da Fábrica de Software. Inovação, técnica e foco em resolver problemas reais.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 animar-entrada" style={{ animationDelay: '300ms' }}>
                        <a href="#projetos" className="flex items-center gap-2 group px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                            Ver Galeria <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=dev${i}`} alt="Dev" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-[#020617] bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground">
                                +30
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Projetos Section */}
            <section id="projetos" className="py-20 md:py-32 bg-slate-950/50">
                <div className="container mx-auto px-6 space-y-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Nossas Produções</h2>
                            <p className="text-slate-400 max-w-md font-medium">Sistemas ativos, modulares e focados em experiência do usuário.</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <Boxes size={14} /> {projetos.length} Projetos Publicados
                        </div>
                    </div>

                    {carregando ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-card/30 border border-border/10 rounded-3xl p-6 space-y-6 animate-pulse">
                                    <Skeleton className="h-48 w-full rounded-2xl" />
                                    <div className="space-y-4">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : erro ? (
                        <div className="py-20 text-center space-y-4">
                            <p className="text-destructive font-bold">{erro}</p>
                            <button onClick={() => window.location.reload()} className="text-xs font-black uppercase tracking-widest text-primary underline">Tentar novamente</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {projetos.map((p, idx) => (
                                <div 
                                    key={p.id} 
                                    className="group bg-card/20 hover:bg-card/40 border border-border/10 hover:border-primary/30 rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 animar-entrada"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                        <Code2 size={48} className="text-primary/20 group-hover:scale-125 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[9px] font-black uppercase tracking-widest">Produção</span>
                                                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg text-[9px] font-black uppercase tracking-widest">React v19</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 space-y-4">
                                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{p.nome}</h3>
                                        <p className="text-sm text-slate-400 font-medium line-clamp-2 leading-relaxed h-10">
                                            {p.descricao || 'Este projeto demonstra excelência em arquitetura e escalabilidade técnica.'}
                                        </p>
                                        <div className="flex items-center justify-between pt-4 border-t border-border/5">
                                            <div className="flex items-center gap-3">
                                                {p.github_repo && (
                                                    <a href={`https://github.com/madebycotrim/${p.github_repo}`} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors" title="Ver código no GitHub">
                                                        <Github size={18} />
                                                    </a>
                                                )}
                                                {p.figma_url && (
                                                    <a href={p.figma_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors" title="Visualizar Design">
                                                        <Figma size={18} />
                                                    </a>
                                                )}
                                                {p.documentacao_url && (
                                                    <a href={p.documentacao_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-sky-400 transition-colors" title="Abrir Documentação">
                                                        <BookText size={18} />
                                                    </a>
                                                )}
                                            </div>
                                            <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 group/btn">
                                                Explorar Case <ExternalLink size={12} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-border/10 bg-black">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                        <Rocket size={24} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">Fábrica de Software — Unieuro</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        © {new Date().getFullYear()} — Todos os direitos reservados
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="p-2.5 bg-slate-900 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all">
                            <Github size={18} />
                        </a>
                        <a href="#" className="p-2.5 bg-slate-900 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all">
                            <Globe size={18} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
});

export default PaginaPortfolio;
