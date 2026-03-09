import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Loader2, Settings } from 'lucide-react';
import { api } from '../../compartilhado/servicos/api';

interface ScannerQRProps {
    aoFechar: () => void;
}

/**
 * Componente que utiliza EXCLUSIVAMENTE a câmera para escanear QR Code.
 * Remove qualquer opção de seleção de arquivo para uma experiência nativa.
 */
export default function ScannerQR({ aoFechar }: ScannerQRProps) {
    const [status, setStatus] = useState<'ocioso' | 'pedindo_permissao' | 'scaneando' | 'confirmacao' | 'autorizando' | 'sucesso' | 'erro'>('ocioso');
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

    const pedirPermissao = async () => {
        setErro(null);
        setStatus('pedindo_permissao');

        try {
            // Solicita permissão nativa
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            stream.getTracks().forEach(track => track.stop()); // Libera para o sensor do leitor
            
            iniciarLeitura();
        } catch (err: any) {
            console.error('[Scanner] Permissão negada:', err);
            setErro(err.name === 'NotAllowedError' ? 'Câmera bloqueada. Por favor, autorize nas permissões do seu navegador.' : 'Não foi possível detectar uma câmera ativa.');
            setStatus('erro');
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
            }
        }, 100);
    };

    const onScanSuccess = async (decodedText: string) => {
        if (!decodedText || decodedText.length < 30) return;

        // Desliga a câmera imediatamente
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
        }

        setSessaoIdPendente(decodedText);
        setStatus('confirmacao');

        // Notifica o backend imediatamente para mostrar o avatar no PC
        identificarUsuario(decodedText);
    };

    const identificarUsuario = async (sessaoId: string) => {
        try {
            await api.post('/api/auth/qr/identificar', { sessaoId });
        } catch (e) {
            console.error('[Scanner] Falha ao identificar no desktop:', e);
        }
    };

    const autorizarSessao = async () => {
        if (!sessaoIdPendente) return;
        
        setStatus('autorizando');
        try {
            await api.post('/api/auth/qr/autorizar', { sessaoId: sessaoIdPendente });
            setStatus('sucesso');
            setTimeout(aoFechar, 2000);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Autorização falhou.');
            setStatus('erro');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 pt-4 min-h-[440px]">
            
            {(status === 'ocioso' || status === 'pedindo_permissao') && (
                <div className="text-center space-y-8 px-6 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary relative">
                        <Camera size={48} strokeWidth={1.5} />
                        {status === 'pedindo_permissao' && (
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Autorizar Acesso</h3>
                        <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                            Aponte para o código na tela do computador para entrar. Usaremos apenas a câmera.
                        </p>
                    </div>

                    <button
                        onClick={pedirPermissao}
                        disabled={status === 'pedindo_permissao'}
                        className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {status === 'pedindo_permissao' ? <Loader2 className="animate-spin" /> : 'Abrir Câmera'}
                    </button>
                    <button onClick={aoFechar} className="text-xs text-slate-400 font-black uppercase tracking-widest">Agora não</button>
                </div>
            )}

            {status === 'scaneando' && (
                <div className="w-full flex flex-col items-center space-y-8 px-4 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-black text-slate-900">Escanear</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest animate-pulse">Buscando QR Code...</p>
                    </div>
                    
                    <div className="w-full max-w-[320px] aspect-square rounded-[3rem] border-[12px] border-slate-100/50 shadow-2xl bg-black relative overflow-hidden">
                        <div id="leitor-qr" className="w-full h-full object-cover"></div>
                    </div>

                    <button 
                        onClick={aoFechar}
                        className="p-4 bg-slate-900 text-white rounded-full active:scale-90 transition-all font-bold shadow-xl"
                    >
                        <X size={24} />
                    </button>
                </div>
            )}

            {status === 'confirmacao' && (
                <div className="text-center space-y-8 px-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-24 h-24 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-blue-500/20">
                        <CheckCircle size={48} strokeWidth={1.5} />
                    </div>
                    
                    <div className="space-y-3">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirmar Acesso</h3>
                        <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                            Deseja autorizar o acesso neste computador?
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                        <button
                            onClick={autorizarSessao}
                            className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all"
                        >
                            Autorizar Agora
                        </button>
                        <button 
                            onClick={() => setStatus('ocioso')}
                            className="text-xs text-slate-400 font-black uppercase tracking-widest"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {status === 'autorizando' && (
                <div className="text-center space-y-6">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                    <p className="text-slate-900 font-black text-xl tracking-tight">Validando Acesso...</p>
                </div>
            )}

            {status === 'sucesso' && (
                <div className="text-center space-y-6 px-6 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={56} strokeWidth={1} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Login Autorizado!</h3>
                        <p className="text-sm text-slate-500 font-medium font-bold">O computador agora está conectado.</p>
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
