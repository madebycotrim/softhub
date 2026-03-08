import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useSearchParams, useNavigate } from 'react-router';
import { AlertCircle, Globe, Code, Info } from 'lucide-react';
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

    const erroRedirect = searchParams.get('erro');
    const mensagemErroRedirect: Record<string, string> = {
        'dominio': `Conta não autorizada. Use seu email @${ambiente.dominioInstitucional} ou @unieuro.com.br.`,
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
                        const dominiosValidos = [`@${ambiente.dominioInstitucional}`, '@unieuro.com.br'];
                        const ehValido = dominiosValidos.some(d => emailMinusculo.endsWith(d));

                        if (!ehValido) {
                            await instance.logoutRedirect({ account: response.account });
                            setErroLocal(`Use seu email @${ambiente.dominioInstitucional} ou @unieuro.com.br.`);
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-red-500/20">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col lg:flex-row min-h-[700px] border border-slate-100 animate-in fade-in zoom-in-95 duration-700">

                {/* Lado Esquerdo Institucional */}
                <div className="lg:w-[40%] bg-gradient-to-br from-[#003366] via-[#002244] to-[#001a33] p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden group">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-[3s]" />
                    <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10 space-y-12">
                        <div className="flex items-center gap-5">
                            <img src={logoUnieuro} alt="Logo Unieuro" className="w-16 h-16 object-contain" />
                            <div className="space-y-1">
                                <h1 className="text-[22px] font-black leading-none tracking-tight">FÁBRICA DE SOFTWARE</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] tracking-[0.2em] text-red-500 font-black uppercase">SoftHub</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <h2 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter">
                                Sua Ideia, <br />
                                <span className="text-white/40">Nosso Código.</span>
                            </h2>
                            <p className="text-white/50 text-base leading-relaxed max-w-sm font-medium">
                                Transformamos o conhecimento acadêmico em soluções tecnológicas de alto impacto para o mundo real.
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="h-1 w-16 bg-red-600 rounded-full" />
                                <div className="h-1 w-4 bg-white/20 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                    <Globe size={14} className="opacity-40" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30">Campus Águas Claras</span>
                            </div>
                            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                                <Code size={16} className="text-red-100/20" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Acesso (Login Microsoft + QR Code) */}
                <div className="flex-1 flex flex-col lg:flex-row items-stretch">

                    {/* Lado Esquerdo: Acesso Microsoft */}
                    <div className="flex-1 p-12 flex flex-col items-center justify-center bg-white">
                        <div className="space-y-12 w-full max-w-sm">
                            <div className="space-y-4 text-center">
                                <div className="inline-flex py-1 px-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Bem-vindo de volta
                                </div>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Inicie agora.</h3>
                                <p className="text-slate-400 font-bold text-sm leading-relaxed">
                                    Acesse a plataforma da Fábrica de Software, utilize seu login institucional.
                                </p>
                            </div>

                            {erro && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-[11px] font-bold animate-in shake duration-500">
                                    <AlertCircle size={16} />
                                    <span>{erro}</span>
                                </div>
                            )}

                            <div className="space-y-8">
                                <button
                                    onClick={handleLogin}
                                    disabled={carregando || inProgress !== 'none'}
                                    className="w-full flex items-center justify-center h-[41px] bg-[#2F2F2F] hover:bg-[#3F3F3F] active:bg-[#1F1F1F] transition-colors shadow-lg shadow-black/10 disabled:opacity-50 group px-3"
                                    style={{ fontFamily: "Segoe UI, Frutiger, Frutiger Linotype, Dejavu Sans, Helvetica Neue, Arial, sans-serif" }}
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-[21px] h-[21px]" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="0" y="0" width="10" height="10" fill="#F25022" />
                                            <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
                                            <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
                                            <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
                                        </svg>
                                        <span className="text-[15px] font-[600] text-white whitespace-nowrap">Entrar com a Microsoft</span>
                                    </div>
                                </button>

                                <div className="flex items-center gap-1.5 text-slate-400 text-[11.5px] animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
                                    <Info size={11} className="shrink-0" />
                                    <span>
                                        Use o e-mail <span className="text-slate-500">@{ambiente.dominioInstitucional}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divisor Vertical Ultra Sutil */}
                    <div className="hidden lg:block w-[1px] bg-slate-100 self-stretch my-24 opacity-50" />

                    {/* Lado Direito: QR Code Integrado */}
                    {!isMobile && (
                        <div className="flex-1 p-12 flex flex-col items-center justify-center bg-white/50 animate-in fade-in duration-700">
                            <PainelQRCode />

                            <div className="mt-8 text-center space-y-4 px-4 max-w-[340px]">
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Entrar com QR Code</h4>
                                <p className="text-[13px] text-slate-400 font-bold leading-relaxed text-center opacity-80">
                                    No celular, acesse o site ou app da <strong className="text-slate-600 font-black">Fábrica de Software</strong>, escaneie o QR code e faça login em segundos — sem digitar nada.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
