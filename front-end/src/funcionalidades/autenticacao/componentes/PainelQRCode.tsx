import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '@/compartilhado/servicos/api';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { useNavigate } from 'react-router';
import { usarDispositivo } from '../../../compartilhado/hooks/usarDispositivo';
import { Avatar } from '../../../compartilhado/componentes/Avatar';

/**
 * Componente que gera e exibe o QR Code na tela de login desktop.
 * Monitora o status da sessão via polling.
 */
export default function PainelQRCode() {
    const [sessao, setSessao] = useState<{ id: string; expiraEm: string; usuario?: any } | null>(null);
    const [status, setStatus] = useState<'gerando' | 'pendente' | 'identificado' | 'autorizado' | 'expirado' | 'erro'>('gerando');
    const { entrar } = usarAutenticacao();
    const navigate = useNavigate();
    const { isMobile } = usarDispositivo();

    const gerarNovoQR = async () => {
        if (isMobile) return;
        try {
            setStatus('gerando');
            const res = await api.post('/api/auth/qr/gerar');
            setSessao({ id: res.data.sessaoId, expiraEm: res.data.expiraEm });
            setStatus('pendente');
        } catch (erro) {
            console.error('[QR] Erro ao gerar:', erro);
            setStatus('erro');
        }
    };

    useEffect(() => {
        if (!isMobile) {
            gerarNovoQR();
        }
    }, [isMobile]);

    useEffect(() => {
        if ((status !== 'pendente' && status !== 'identificado') || !sessao) return;

        // Limpa o polling ao mudar de estado ou desmontar
        let polling: any;

        const verificarStatus = async () => {
            try {
                const res = await api.get(`/api/auth/qr/verificar/${sessao.id}`);

                if (res.data.status === 'identificado') {
                    setSessao(s => s ? ({ ...s, usuario: res.data.usuario }) : null);
                    setStatus('identificado');
                } else if (res.data.status === 'autorizado') {
                    setSessao(s => s ? ({ ...s, usuario: res.data.usuario }) : null);
                    setStatus('autorizado');
                    clearInterval(polling);

                    setTimeout(() => {
                        entrar(res.data.usuario, res.data.token);
                        navigate('/app/dashboard', { replace: true });
                    }, 300); 
                } else if (res.data.status === 'expirado' || res.data.status === 'erro' || res.data.status === 'consumido') {
                    setStatus(res.data.status === 'expirado' ? 'expirado' : 'erro');
                    clearInterval(polling);
                }
            } catch (erro) {
                console.error('[QR] Erro no polling:', erro);
                clearInterval(polling); // Para o polling em caso de erro de rede para evitar spam
                setStatus('erro');
            }
        };

        polling = setInterval(verificarStatus, 800); // Polling mais rápido (800ms) para resposta instantânea

        return () => clearInterval(polling);
    }, [status, sessao, entrar, navigate]);

    return (
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Label discreta mas legível acima do QR */}
            <div className="mb-10">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] whitespace-nowrap">
                    ACESSO INSTANTÂNEO
                </span>
            </div>

            {/* Container QR - Ultra Minimalist & Large */}
            <div className="relative group mb-4">
                <div className="relative flex items-center justify-center overflow-hidden">

                    {status === 'gerando' && (
                        <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Iniciando</span>
                        </div>
                    )}

                    {status === 'pendente' && sessao?.id && (
                        <div className="relative animate-in zoom-in duration-1000 flex items-center justify-center group/qr p-6 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100">
                            <div className="relative overflow-hidden rounded-xl">
                                <QRCodeSVG
                                    value={sessao.id}
                                    size={210}
                                    level="H"
                                    fgColor="#0f172a"
                                    marginSize={0}
                                    includeMargin={false}
                                />
                                
                                {/* 🎇 Efeito High-Tech de Scanner */}
                                <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)] opacity-0 group-hover/qr:opacity-100 transition-opacity duration-500 animate-[scan_3s_linear_infinite]" 
                                     style={{ 
                                         animation: 'scan 2.5s ease-in-out infinite',
                                         top: '0%' 
                                     }} 
                                />
                                
                                <style>{`
                                    @keyframes scan {
                                        0% { top: 0%; opacity: 0; }
                                        20% { opacity: 1; }
                                        80% { opacity: 1; }
                                        100% { top: 100%; opacity: 0; }
                                    }
                                `}</style>
                            </div>

                            {/* Detalhes de canto decorativos */}
                            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-200 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-200 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-200 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-200 rounded-br-lg" />
                        </div>
                    )}

                    {(status === 'expirado' || status === 'erro') && sessao && (
                        <div className="w-[280px] h-[280px] relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                            {/* Background Overlay Premium */}
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-slate-200 shadow-xl" />

                            {/* Blurred QR Background */}
                            <div className="absolute inset-0 flex items-center justify-center blur-[4px] grayscale opacity-5 pointer-events-none">
                                {sessao?.id && <QRCodeSVG value={sessao.id} size={240} level="H" />}
                            </div>

                            {/* Center Action Button (Discrete & Professional) */}
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                                <button
                                    onClick={gerarNovoQR}
                                    className="group/btn flex flex-col items-center justify-center gap-3 p-6 bg-red-500/10 text-red-600 rounded-[2rem] hover:bg-red-500/20 active:scale-95 transition-all duration-300 border border-red-500/20 mb-4"
                                >
                                    <div className="p-4 bg-red-600 rounded-full text-white shadow-lg shadow-red-200 dark:shadow-red-900/40 group-hover:rotate-180 transition-transform duration-700 flex items-center justify-center">
                                        <RefreshCw className="w-6 h-6" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-center mt-1">
                                        Recarregar
                                    </span>
                                </button>

                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                                    QR Code expirado
                                </span>
                            </div>
                        </div>
                    )}

                    {(status === 'identificado' || status === 'autorizado') && (
                        <EstadoAutorizado usuario={sessao?.usuario} status={status} />
                    )}
                </div>
            </div>
        </div>
    );
}

function EstadoAutorizado({ usuario, status }: { usuario: any, status: string }) {
    const isAutorizado = status === 'autorizado';

    return (
        <div className="w-[240px] h-auto flex flex-col items-center justify-center animate-in zoom-in duration-500 py-4">
            <div className="relative mb-4">
                <div className="relative rounded-2xl transition-all duration-500">
                    <Avatar 
                        nome={usuario?.nome || 'Usuário'} 
                        fotoPerfil={usuario?.foto_perfil} 
                        tamanho="2xl"
                    />
                </div>
            </div>
            <div className="flex flex-col items-center">
                <span className="text-[15px] font-black text-slate-900 uppercase tracking-tight text-center leading-none">
                    {usuario?.nome}
                </span>
                <span className="text-[11px] text-slate-400 font-bold mt-1 lowercase">
                    {usuario?.email}
                </span>
            </div>
            {isAutorizado && (
                <div className="mt-6 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full animate-pulse bg-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
                        Acesso Liberado
                    </span>
                </div>
            )}
        </div>
    );
}
