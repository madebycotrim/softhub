import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '../../compartilhado/servicos/api';
import { usarAutenticacaoContexto } from '../../contexto/ContextoAutenticacao';
import { useNavigate } from 'react-router';
import { usarDispositivo } from '../../compartilhado/hooks/usarDispositivo';

/**
 * Componente que gera e exibe o QR Code na tela de login desktop.
 * Monitora o status da sessão via polling.
 */
export default function PainelQRCode() {
    const [sessao, setSessao] = useState<{ id: string; expiraEm: string } | null>(null);
    const [status, setStatus] = useState<'gerando' | 'pendente' | 'autorizado' | 'expirado' | 'erro'>('gerando');
    const { entrar } = usarAutenticacaoContexto();
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
        if (status !== 'pendente' || !sessao) return;

        // Limpa o polling ao mudar de estado ou desmontar
        let polling: any;

        const verificarStatus = async () => {
            try {
                const res = await api.get(`/api/auth/qr/verificar/${sessao.id}`);

                if (res.data.status === 'autorizado') {
                    setStatus('autorizado');
                    clearInterval(polling);

                    // Pequeno delay para mostrar o feedback de sucesso antes de navegar
                    setTimeout(() => {
                        entrar(res.data.usuario, res.data.token);
                        navigate('/app/dashboard', { replace: true });
                    }, 1500);
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

        polling = setInterval(verificarStatus, 5000); // Polling a cada 5 segundos para reduzir ruído

        return () => clearInterval(polling);
    }, [status, sessao, entrar, navigate]);

    return (
        <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Label discreta mas legível acima do QR */}
            <div className="flex items-center gap-3 mb-10">
                <div className="h-[1px] w-8 bg-red-600/20" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] whitespace-nowrap">
                    ACESSO INSTANTÂNEO
                </span>
                <div className="h-[1px] w-8 bg-red-600/20" />
            </div>

            {/* Container QR - Ultra Minimalist & Large */}
            <div className="relative group mb-4">
                <div className="relative flex items-center justify-center overflow-hidden">

                    {status === 'gerando' && (
                        <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Iniciando</span>
                        </div>
                    )}

                    {status === 'pendente' && sessao?.id && (
                        <div className="relative animate-in zoom-in duration-700 flex items-center justify-center group/qr">
                            <QRCodeSVG
                                value={sessao.id}
                                size={240}
                                level="H"
                                fgColor="#020617"
                                marginSize={0}
                                includeMargin={false}
                            />
                        </div>
                    )}

                    {(status === 'expirado' || status === 'erro') && sessao && (
                        <div className="w-[240px] h-[240px] relative z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
                            {/* Background Overlay */}
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px]" />

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

                    {status === 'autorizado' && (
                        <div className="w-[240px] h-[240px] flex flex-col items-center justify-center bg-card z-10 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4 animate-bounce shadow-lg ring-4 ring-card">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <span className="text-[12px] font-black text-green-600 uppercase tracking-widest">Autorizado</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
