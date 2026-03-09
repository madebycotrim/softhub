import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useSearchParams, useNavigate } from 'react-router';
import { AlertCircle, Globe, Code, Info, Download } from 'lucide-react';
import { ambiente } from '../../configuracoes/ambiente';
import { api } from '../../compartilhado/servicos/api';
import { usarAutenticacaoContexto } from '../../contexto/ContextoAutenticacao';
import logoUnieuro from '../../assets/logo-unieuro-branca.png';
import { loginRequest } from '../../configuracoes/msal';
import PainelQRCode from './PainelQRCode';
import { usarDispositivo } from '../../compartilhado/hooks/usarDispositivo';

/**
 * Tela de login com estética Discord-Style (Minimalista e Funcional).
 */
export default function TelaLogin() {
    const { instance, accounts, inProgress } = useMsal();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { entrar } = usarAutenticacaoContexto();
    const { isMobile } = usarDispositivo();

    const [carregando, setCarregando] = useState(false);
    const [erroLocal, setErroLocal] = useState<string | null>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const erroRedirect = searchParams.get('erro');
    const mensagemErroRedirect: Record<string, string> = {
        'dominio': `Conta não autorizada. Use seu email @${ambiente.dominioInstitucional}.`,
        'nao-autorizado': 'Acesso negado. Conta não cadastrada ou desativada.',
        'backend': 'Falha ao validar sua conta. Tente novamente.',
    };
    const erro = erroLocal ?? (erroRedirect ? mensagemErroRedirect[erroRedirect] : null);

    useEffect(() => {
        const processarRedirect = async () => {
            if (inProgress === 'none') {
                try {
                    const response = await instance.handleRedirectPromise();
                    if (response && response.account) {
                        const emailUsuario = response.account.username ?? '';
                        const emailMinusculo = emailUsuario.toLowerCase();
                        const ehValido = emailMinusculo.endsWith(`@${ambiente.dominioInstitucional}`);

                        if (!ehValido) {
                            await instance.logoutRedirect({ account: response.account });
                            setErroLocal(`Use seu email @${ambiente.dominioInstitucional}.`);
                            return;
                        }
                        setCarregando(true);
                        const respostaMsal = await instance.acquireTokenSilent({
                            ...loginRequest,
                            account: response.account
                        });
                        const res = await api.post('/api/auth/msal', {
                            accessToken: respostaMsal.accessToken,
                            idToken: respostaMsal.idToken,
                        });
                        entrar(res.data.usuario, res.data.token);
                        navigate('/app/dashboard', { replace: true });
                    }
                } catch (e: any) {
                    console.error('[Login] Erro no redirect/auth:', e);
                    const mensagem = e.response?.data?.erro || e.response?.data?.detalhe || 'Falha ao autenticar no servidor.';
                    setErroLocal(mensagem);
                    setCarregando(false);
                }
            }
        };
        processarRedirect();
    }, [instance, accounts, inProgress, navigate, entrar]);

    const handleLogin = async () => {
        setCarregando(true);
        setErroLocal(null);
        try {
            await instance.loginRedirect(loginRequest);
        } catch (e) {
            setCarregando(false);
            setErroLocal('Falha ao iniciar autenticação.');
        }
    };

    return (
        <div className="light min-h-screen bg-slate-50 flex items-center justify-center p-0 sm:p-6 lg:p-8 selection:bg-red-500/20 transition-colors duration-500">
            <div className="w-full max-w-7xl bg-white sm:rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col lg:flex-row min-h-screen sm:min-h-[750px] border-none sm:border border-border animate-in fade-in zoom-in-95 duration-700">

                {/* Lado Esquerdo Institucional */}
                <div className="lg:w-[42%] bg-[#001a33] p-8 pt-12 pb-14 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden group shrink-0">
                    {/* Imagem do Campus em Background Cinematico */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#001a33] via-[#001a33]/60 to-transparent" />
                        <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
                    </div>

                    <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none group-hover:opacity-60 transition-opacity duration-1000" />
                    <div className="absolute bottom-[0%] right-[-5%] w-96 h-96 bg-blue-400/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10 space-y-12 lg:space-y-16">
                        <div className="flex items-center gap-5">
                            <img src={logoUnieuro} alt="Logo Unieuro" className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
                            <div className="space-y-1.5">
                                <h1 className="text-xl lg:text-[24px] font-[900] leading-none tracking-tight">FÁBRICA DE SOFTWARE</h1>
                                <div className="inline-flex items-center px-2 py-0.5 bg-red-600/20 rounded-md border border-red-500/20">
                                    <span className="text-[10px] lg:text-[11px] tracking-[0.3em] text-red-500 font-black uppercase">SoftHub</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 lg:space-y-10">
                            <h2 className="text-[42px] lg:text-[72px] font-[900] leading-[0.95] lg:leading-[0.9] tracking-tighter mix-blend-difference">
                                Sua Ideia, <br />
                                <span className="text-white/30 group-hover:text-white/50 transition-colors duration-1000">Nosso Código.</span>
                            </h2>
                            <p className="text-white/60 text-sm lg:text-[18px] leading-relaxed max-w-xs lg:max-w-md font-medium">
                                Transformamos o conhecimento acadêmico em soluções tecnológicas de alto impacto.
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="h-1.5 w-16 lg:w-24 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                                <div className="h-1.5 w-6 bg-white/20 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 lg:mt-0 relative z-10 hidden sm:block">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                                    <Globe size={14} className="opacity-40" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30">Campus Águas Claras</span>
                            </div>
                            <div className="p-2 bg-white/5 rounded-2xl border border-white/10">
                                <Code size={16} className="text-red-100/20" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Acesso (Login Microsoft + Prompt PWA) */}
                <div className="flex-1 flex flex-col lg:flex-row items-stretch bg-white -mt-8 lg:mt-0 rounded-t-[32px] lg:rounded-none relative z-20">

                    {/* Lado Central: Acesso Microsoft */}
                    <div className="flex-1 p-8 lg:p-12 flex flex-col items-center justify-center">
                        <div className="space-y-8 lg:space-y-12 w-full max-w-sm">
                            <div className="space-y-4 text-center lg:text-left">
                                <div className="inline-flex py-1 px-3 bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full leading-none">
                                    Bem-vindo de volta
                                </div>
                                <h3 className="text-[28px] lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">Inicie agora.</h3>
                                <p className="text-slate-600 font-bold text-xs lg:text-sm leading-relaxed max-w-[280px] lg:max-w-none mx-auto lg:mx-0 pr-0 lg:pr-8">
                                    Acesse a plataforma da Fábrica de Software com seu login institucional.
                                </p>
                            </div>

                            {erro && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-600 text-[11px] font-bold animate-in shake duration-500">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{erro}</span>
                                </div>
                            )}

                            <div className="space-y-6 lg:space-y-8">
                                <button
                                    onClick={handleLogin}
                                    disabled={carregando || inProgress !== 'none'}
                                    className="w-full flex items-center h-[41px] bg-[#2F2F2F] hover:bg-[#3F3F3F] active:bg-[#1F1F1F] transition-all disabled:opacity-50 group rounded-none active:scale-[0.98] px-[12px] gap-[12px] border border-transparent"
                                    style={{ 
                                        fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif" 
                                    }}
                                >
                                    <div className="flex shrink-0">
                                        <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="0" y="0" width="10" height="10" fill="#F25022" />
                                            <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
                                            <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
                                            <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
                                        </svg>
                                    </div>
                                    <span className="text-[15px] font-semibold text-white leading-none whitespace-nowrap">Entrar com Microsoft</span>
                                </button>

                                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-slate-500 text-[11px] lg:text-[11.5px] font-medium">
                                    <Info size={11} className="shrink-0" />
                                    <span>
                                        Use seu e-mail <span className="text-slate-900 font-bold">@{ambiente.dominioInstitucional}</span>
                                    </span>
                                </div>

                                {isMobile && deferredPrompt && (
                                    <div className="pt-8 border-t border-border/10">
                                        <button
                                            onClick={handleInstallClick}
                                            className="w-full flex items-center justify-center h-14 bg-accent/5 hover:bg-accent/10 rounded-2xl transition-all active:scale-[0.98] group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-xl text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Download size={18} />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground">Instalar Aplicativo</span>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Divisor Vertical Ultra Sutil */}
                    <div className="hidden lg:block w-[1px] bg-border self-stretch my-24 opacity-50" />

                    {/* Lado Direito: Accesso Integrado (QR Code) */}
                    {!isMobile && (
                        <div className="flex-1 flex flex-col items-center justify-center bg-accent/[0.03] dark:bg-card/30 p-12 relative animate-in fade-in duration-1000">
                            <div className="w-full flex flex-col items-center space-y-12">
                                <PainelQRCode />

                                <div className="text-center space-y-3 max-w-[280px]">
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Entrar com QR Code</h4>
                                    <p className="text-[13px] text-slate-600 font-bold leading-relaxed">
                                        Abra o app ou site da plataforma no celular, escaneie o código e faça login em segundos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
