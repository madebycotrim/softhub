import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { api } from '../../compartilhado/servicos/api';
import { usarPermissao } from '../../compartilhado/hooks/usarPermissao';
import { Modal } from '../../compartilhado/componentes/Modal';
import { Tooltip } from '../../compartilhado/componentes/Tooltip';

export function BotaoExportarPonto() {
    const podeExportar = usarPermissao('LIDER_EQUIPE');
    const [aberto, setAberto] = useState(false);
    const [carregando, setCarregando] = useState(false);

    // Datas padrão: primeiro e último dia do mês atual
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

    const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
    const [dataFim, setDataFim] = useState(ultimoDiaMes);

    // Só exibe se for líder ou admin
    if (!podeExportar) return null;

    const aoConfirmarExportacao = async () => {
        try {
            setCarregando(true);
            const resposta = await api.get('/ponto/exportar', {
                params: { dataInicio, dataFim },
                responseType: 'blob'
            });

            // Cria link temporário para download
            const url = window.URL.createObjectURL(new Blob([resposta.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_ponto_${dataInicio}_${dataFim}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setAberto(false);
        } catch (erro) {
            console.error('Falha ao exportar:', erro);
            alert('Falha ao gerar relatório. Verifique o período (máx 31 dias).');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <>
        <Tooltip texto="Gerar Relatório CSV" posicao="left">
            <button
                onClick={() => setAberto(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-lg border border-border transition-colors text-sm font-medium"
            >
                <Download className="w-4 h-4" />
                Exportar CSV
            </button>
        </Tooltip>

            <Modal aberto={aberto} aoFechar={() => setAberto(false)} titulo="Exportar Relatório de Ponto" largura="sm">
                <div className="space-y-6 pt-2">
                    <p className="text-sm text-muted-foreground">
                        Selecione o período para gerar o relatório consolidado de todos os membros.
                        O período máximo é de 31 dias.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Início</label>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fim</label>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="pt-6 mt-auto border-t border-border flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={() => setAberto(false)}
                            className="w-full sm:w-auto h-12 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all rounded-2xl"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={aoConfirmarExportacao}
                            disabled={carregando}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-primary/20"
                        >
                            {carregando ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Baixar Relatório
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
