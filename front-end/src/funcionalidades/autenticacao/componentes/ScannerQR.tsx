import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Settings, Monitor, ArrowRight } from 'lucide-react';
import { api } from '@/compartilhado/servicos/api';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';

import { vibrar, vibrarErro, somSucesso } from '@/utilitarios/haptics';

interface ScannerQRProps {
    aoFechar: () => void;
}

/**
 * Componente que utiliza EXCLUSIVAMENTE a câmera para escanear QR Code.
 * Remove qualquer opção de seleção de arquivo para uma experiência nativa.
 */
export default function ScannerQR({ aoFechar }: ScannerQRProps) {
    const { usuario } = usarAutenticacao();
    const [status, setStatus] = useState<'ocioso' | 'pedindo_permissao' | 'scaneando' | 'validando' | 'confirmacao' | 'autorizando' | 'sucesso' | 'erro'>('ocioso');
    const [erro, setErro] = useState<string | null>(null);
    const [sessaoIdPendente, setSessaoIdPendente] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Limpa os recursos ao fechar/desmontar
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                if (html5QrCodeRef.current.isScanning) {
                    html5QrCodeRef.current.stop().catch(console.error);
                }
            }
        };
    }, []);

    // Verifica se já teve permissão antes para inicializar automático
    useEffect(() => {
        if (status === 'ocioso') {
            const jaAutorizou = localStorage.getItem('qr_camera_autorizada') === 'true';
            if (jaAutorizou) {
                const timer = setTimeout(() => {
                    pedirPermissao();
                }, 400); // 400ms para aguardar a transição suave do modal
                return () => clearTimeout(timer);
            }
        }
    }, [status]);

    const pedirPermissao = async () => {
        setErro(null);
        setStatus('pedindo_permissao');

        try {
            // Solicita permissão nativa
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            stream.getTracks().forEach(track => track.stop()); // Libera para o sensor do leitor
            
            // Salva no navegador que o usuário confia no QR app para auto-abrir nas próximas
            localStorage.setItem('qr_camera_autorizada', 'true');
            
            iniciarLeitura();
        } catch (err: any) {
            console.error('[Scanner] Permissão negada:', err);
            setErro(err.name === 'NotAllowedError' ? 'Câmera bloqueada. Por favor, autorize nas permissões do seu navegador.' : 'Não foi possível detectar uma câmera ativa.');
            setStatus('erro');
            vibrarErro();
        }
    };

    const iniciarLeitura = async () => {
        setStatus('scaneando');

        // Aguarda montagem da div
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("leitor-qr");
                html5QrCodeRef.current = html5QrCode;

                const config = { 
                    fps: 15, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                };

                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    config,
                    (decodedText) => {
                        onScanSuccess(decodedText);
                    },
                    (_errorMessage) => { /* Ignora erros de frame sem QR */ }
                );

            } catch (err) {
                console.error('[Scanner] Erro ao iniciar:', err);
                setErro('Falha ao abrir o sensor da câmera.');
                setStatus('erro');
                vibrarErro();
            }
        }, 100);
    };

    const onScanSuccess = async (decodedText: string) => {
        // Verifica se é pelo menos parecido com um UUID
        if (!decodedText || decodedText.length < 30) {
            setErro('QR Code inválido ou não reconhecido.');
            setStatus('erro');
            vibrarErro();
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }
            return;
        }

        // Feedback haptico sutil ao ler
        vibrar(60);

        // Desliga a câmera imediatamente
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
        }

        // Valida e notifica o backend imediatamente para mostrar o avatar no PC
        identificarUsuario(decodedText);
    };

    const identificarUsuario = async (sessaoId: string) => {
        setStatus('validando');
        try {
            await api.post('/api/auth/qr/identificar', { sessaoId });
            setSessaoIdPendente(sessaoId);
            setStatus('confirmacao');
        } catch (e: any) {
            console.error('[Scanner] Falha ao identificar no desktop:', e);
            setErro(e.response?.data?.erro || 'QR Code inválido ou não pertence ao sistema.');
            setStatus('erro');
            vibrarErro();
        }
    };

    const autorizarSessao = async () => {
        if (!sessaoIdPendente) return;
        
        setStatus('autorizando');
        try {
            await api.post('/api/auth/qr/autorizar', { sessaoId: sessaoIdPendente });
            setStatus('sucesso');
            vibrar(100);
            somSucesso();
            setTimeout(aoFechar, 2000);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Autorização falhou.');
            setStatus('erro');
            vibrarErro();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 pt-4 min-h-[500px]">
            
            {(status === 'ocioso' || status === 'pedindo_permissao') && (
                <div className="text-center space-y-10 px-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-4 duration-700 w-full">
                    <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center mx-auto text-red-600 border border-slate-200 relative shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-transform hover:scale-105 duration-500">
                        <Camera size={48} strokeWidth={1.5} />
                        {status === 'pedindo_permissao' && (
                            <div className="absolute -inset-1.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-red-500/5 rounded-[2.5rem] -z-10 blur-xl" />
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600/60">Acesso Rápido</span>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">QR Login</h3>
                        </div>
                        <p className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-[260px] mx-auto min-h-[44px]">
                            {status === 'pedindo_permissao' 
                                ? 'Aguardando autorização da câmera pelo seu navegador...' 
                                : 'Digitalize para entrar instantaneamente.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full pt-4">
                        {status === 'pedindo_permissao' ? (
                            <div className="w-full h-14 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-3">
                                <Loader2 className="animate-spin" size={20} />
                                Solicitando Permissão
                            </div>
                        ) : (
                            <button
                                onClick={pedirPermissao}
                                className="w-full h-14 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg hover:bg-black"
                            >
                                Abrir Câmera
                            </button>
                        )}
                        <button onClick={aoFechar} className="py-2 text-xs text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                    </div>
                </div>
            )}

            {status === 'scaneando' && (
                <div className="w-full flex flex-col items-center space-y-10 px-4 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full mb-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Câmera Ativa</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Escanear Código</h3>
                        <p className="text-sm text-slate-400 font-medium">Aponte para o QR Code no seu computador</p>
                    </div>
                    
                    <div className="w-full max-w-[280px] aspect-square rounded-2xl border-[8px] border-white shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] bg-black relative overflow-hidden group ring-1 ring-slate-200">
                        {/* Container do Vídeo */}
                        <div id="leitor-qr" className="w-full h-full object-cover"></div>
                        
                        {/* Linha de Scan de Alta Tecnologia */}
                        <div className="absolute inset-0 pointer-events-none z-10">
                            <div className="w-full h-1  bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)] absolute top-0 animate-scan-line" />
                            
                            {/* Cantos Estilizados */}
                            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-white/80 rounded-tl-sm" />
                            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-white/80 rounded-tr-sm" />
                            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-white/80 rounded-bl-sm" />
                            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-white/80 rounded-br-sm" />
                        </div>
                    </div>

                    <button 
                        onClick={aoFechar}
                        className="w-14 h-14 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-900 rounded-full active:scale-90 transition-all flex items-center justify-center shadow-xl mb-4"
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {status === 'confirmacao' && (
                <div className="text-center space-y-8 px-6 animate-in slide-in-from-bottom-6 duration-500 flex flex-col items-center w-full">
                    
                    {/* Visualização de Conexão */}
                    <div className="flex items-center justify-center gap-6 w-full max-w-xs relative my-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse group-hover:bg-red-500/30 transition-all" />
                            <Avatar nome={usuario?.nome || ''} fotoPerfil={usuario?.foto_perfil || null} tamanho="lg" className="relative z-10 w-16 h-16 ring-4 ring-white shadow-xl" />
                        </div>

                        <div className="flex-1 h-px bg-gradient-to-r from-blue-200 via-blue-500 to-blue-200 relative overflow-hidden">
                            <div className="absolute top-1/2 left-0 -translate-y-1/2 animate-infinite-scroll">
                                <ArrowRight className="w-4 h-4 text-red-500 opacity-50 ml-10" />
                            </div>
                        </div>

                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl relative z-10">
                            <Monitor size={32} strokeWidth={1.5} />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Confirmar Acesso?</h3>
                        <div className="flex flex-col items-center">
                            <p className="text-[15px] text-slate-500 font-medium">Você está autorizando o acesso para:</p>
                            <span className="text-[15px] font-black text-red-600 uppercase mt-1 tracking-tight">{usuario?.nome}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full pt-4">
                        <button
                            onClick={autorizarSessao}
                            className="w-full h-14 bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                             Liberar Computador
                        </button>
                        <button 
                            onClick={() => setStatus('scaneando')}
                            className="text-xs text-slate-400 font-black uppercase tracking-widest"
                        >
                            Refazer Leitura
                        </button>
                    </div>
                </div>
            )}

            {status === 'validando' && (
                <div className="text-center space-y-6">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                    <p className="text-slate-900 font-black text-xl tracking-tight">Verificando QR Code...</p>
                </div>
            )}

            {status === 'autorizando' && (
                <div className="text-center space-y-6">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                    <p className="text-slate-900 font-black text-xl tracking-tight">Liberando sessões...</p>
                </div>
            )}

            {status === 'sucesso' && (
                <div className="text-center space-y-8 px-6 animate-in zoom-in duration-500 flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                        <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl relative z-10 ring-8 ring-green-50">
                            <CheckCircle size={56} strokeWidth={2} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tudo pronto!</h3>
                        <p className="text-sm text-slate-500 font-bold max-w-[200px] mx-auto leading-relaxed">
                            O acesso foi liberado. Divirta-se na fábrica!
                        </p>
                    </div>
                </div>
            )}

            {status === 'erro' && (
                <div className="text-center space-y-8 px-8">
                    <AlertCircle size={48} className="text-red-500 mx-auto" strokeWidth={1.5} />
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900">Erro</h3>
                        <p className="text-sm text-red-600 font-bold">{erro}</p>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                        <button onClick={pedirPermissao} className="w-full h-14 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                            <Settings size={20} /> Tentar Novamente
                        </button>
                        <button onClick={aoFechar} className="text-xs text-slate-400 font-black uppercase tracking-widest">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
