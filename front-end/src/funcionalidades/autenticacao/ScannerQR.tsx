import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../../compartilhado/servicos/api';
import { CheckCircle, XCircle, Camera, Loader2 } from 'lucide-react';

interface ScannerQRProps {
    aoFechar: () => void;
}

/**
 * Componente que utiliza a câmera para escanear o QR Code de login.
 * Deve ser acessado por um dispositivo já logado.
 */
export default function ScannerQR({ aoFechar }: ScannerQRProps) {
    const [status, setStatus] = useState<'lendo' | 'autorizando' | 'sucesso' | 'erro'>('lendo');
    const [mensagemErro, setMensagemErro] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Inicializa o scanner
        scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        const aoEscanearSucesso = async (resultado: string) => {
            // O resultado deve ser o ID da sessão QR
            if (status !== 'lendo') return;

            try {
                setStatus('autorizando');
                // Para o scanner após leitura bem-sucedida
                if (scannerRef.current) {
                    await scannerRef.current.clear();
                }

                // Envia a autorização para o backend
                await api.post('/api/auth/qr/autorizar', { sessaoId: resultado });

                setStatus('sucesso');
                // Fecha após 2 segundos de sucesso
                setTimeout(aoFechar, 2000);
            } catch (erro: any) {
                console.error('[Scanner] Erro ao autorizar:', erro);
                setStatus('erro');
                setMensagemErro(erro.response?.data?.erro || 'Falha ao autorizar login.');
            }
        };

        const aoEscanearErro = (_erro: any) => {
            // Erros de leitura (QR não encontrado no frame) são ignorados para não poluir o log
        };

        scannerRef.current.render(aoEscanearSucesso, aoEscanearErro);

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl overflow-hidden min-h-[400px]">
            <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-slate-800">Escaneie o QR Code</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Aponte para o código na tela do computador
                </p>
            </div>

            <div className="relative w-full max-w-[300px] aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200">
                <div id="qr-reader" className="w-full h-full" />

                {status === 'autorizando' && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <Loader2 className="w-10 h-10 text-[#003366] animate-spin mb-3" />
                        <span className="text-sm font-bold text-[#003366]">Autorizando...</span>
                    </div>
                )}

                {status === 'sucesso' && (
                    <div className="absolute inset-0 bg-green-50 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
                        <span className="text-sm font-bold text-green-600">Login Autorizado!</span>
                    </div>
                )}

                {status === 'erro' && (
                    <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-4 text-center animate-in zoom-in duration-300">
                        <XCircle className="w-16 h-16 text-red-500 mb-3" />
                        <span className="text-sm font-bold text-red-600 mb-1">Erro</span>
                        <p className="text-xs text-red-500">{mensagemErro}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-2xl"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Camera className="w-3 h-3" />
                    Câmera Ativa
                </div>

                <button
                    onClick={aoFechar}
                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
