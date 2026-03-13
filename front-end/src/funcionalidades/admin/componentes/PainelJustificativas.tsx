import { useState } from 'react';
import { Bot, CheckCircle, XCircle, Loader2, Wand2 } from 'lucide-react';
import { api } from '@/compartilhado/servicos/api';
import { Tooltip } from '@/compartilhado/componentes/Tooltip';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { usarJustificativasAdmin } from '@/funcionalidades/admin/hooks/usarJustificativasAdmin';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '@/compartilhado/componentes/Modal';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';

/** Mapeia o tipo técnico para rótulo amigável. */
const formatarTipo = (tipo: string): string => {
    const mapa: Record<string, string> = {
        ausencia: 'Ausência (Atestado/Falta)',
        esquecimento: 'Esquecimento de Batida',
        problema_sistema: 'Falha no Sistema',
    };
    return mapa[tipo] ?? tipo;
};

/**
 * Painel de revisão de justificativas de ponto.
 * Usa tabela semântica padronizada.
 */
export function PainelJustificativas() {
    const { justificativas, carregando, erro, aprovar, rejeitar } = usarJustificativasAdmin();
    const [processandoAcao, setProcessandoAcao] = useState<string | null>(null);
    const [justificativaSelecionada, setJustificativaSelecionada] = useState<string | null>(null);
    const [motivoRejeicao, setMotivoRejeicao] = useState('');
    const [analisesIA, setAnalisesIA] = useState<Record<string, { sugestao: string, analise: string }>>({});
    const [carregandoIA, setCarregandoIA] = useState<string | null>(null);

    const handleAnalisarIA = async (id: string, motivo: string) => {
        setCarregandoIA(id);
        try {
            const res = await api.post('/api/ia/analisar-justificativa', { motivo });
            setAnalisesIA(prev => ({ ...prev, [id]: res.data }));
        } catch (e) {
            console.error('Erro ao analisar com IA:', e);
        } finally {
            setCarregandoIA(null);
        }
    };

    const handleAprovar = async (id: string) => {
        setProcessandoAcao(id);
        try {
            await aprovar(id);
        } catch (e) {
            console.error('Falha ao aprovar:', e);
        } finally {
            setProcessandoAcao(null);
        }
    };

    const handleRejeitar = async () => {
        if (!justificativaSelecionada || !motivoRejeicao.trim()) return;
        setProcessandoAcao(justificativaSelecionada);
        try {
            await rejeitar(justificativaSelecionada, motivoRejeicao);
            setJustificativaSelecionada(null);
            setMotivoRejeicao('');
        } catch (e) {
            console.error('Falha ao rejeitar:', e);
        } finally {
            setProcessandoAcao(null);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <CabecalhoFuncionalidade
                titulo="Caixa de Auditoria"
                subtitulo="Revisão e processamento de justificativas de ponto e ausências."
                icone={Bot}
            />

            <div className="bg-card border border-border rounded-2xl flex flex-col flex-1 overflow-hidden shadow-sm shadow-black/5">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {carregando && justificativas.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 py-20 animate-in fade-in duration-500">
                             <Carregando Centralizar={false} tamanho="lg" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Sincronizando Base de Auditoria</span>
                        </div>
                    ) : erro && justificativas.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center p-12">
                            <EstadoErro titulo="Erro ao carregar justificativas" mensagem={erro} />
                        </div>
                    ) : justificativas.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-16 text-center">
                            <div className="p-6 bg-muted/20 rounded-full text-muted-foreground/30 mb-4 animate-pulse">
                                <Bot size={48} strokeWidth={1} />
                            </div>
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-foreground/40">Caixa de Entrada Vazia</h3>
                            <p className="text-[10px] text-muted-foreground/40 mt-2">Nenhuma justificativa aguardando auditoria neste momento.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
                                    <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[25%]">
                                        OPERADOR
                                    </th>
                                    <th className="px-4 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[20%]">
                                        ESTADO & CRONOGRAMA
                                    </th>
                                    <th className="px-4 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                        INCIDENTE & ARGUMENTAÇÃO
                                    </th>
                                    <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[140px]">
                                        CONTROLES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {justificativas.map(just => (
                                    <tr key={just.id} className="hover:bg-muted/10 transition-colors group/row border-b border-border/20 last:border-none">
                                        {/* Membro */}
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex items-center gap-4">
                                                <Avatar nome={just.usuario_nome} fotoPerfil={just.usuario_foto} tamanho="md" />
                                                <div className="min-w-0">
                                                    <p className="font-black text-foreground text-[11px] uppercase tracking-wide truncate mb-0.5">
                                                        {just.usuario_nome}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted-foreground/60 truncate tracking-tight">
                                                        {just.usuario_email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status & Data */}
                                        <td className="px-4 py-5 align-top">
                                            <div className="flex flex-col items-start gap-2">
                                                <div className="scale-90 origin-left">
                                                    {just.status === 'pendente' && <Emblema texto="Pendente" variante="amarelo" />}
                                                    {just.status === 'aprovada' && <Emblema texto="Aprovada" variante="verde" />}
                                                    {just.status === 'rejeitada' && <Emblema texto="Rejeitada" variante="vermelho" />}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-[10px] font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50 w-fit">
                                                        {just.data}
                                                    </span>
                                                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                                                        Protocolo: {formatarDataHora(just.criado_em)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Tipo & Motivo */}
                                        <td className="px-4 py-5 align-top">
                                            <div className="flex flex-col gap-2 max-w-lg">
                                                <span className="text-[10px] font-black tracking-[0.1em] text-primary uppercase bg-primary/5 px-2 py-0.5 rounded w-fit">
                                                    {formatarTipo(just.tipo)}
                                                </span>
                                                <span className="text-[12px] text-muted-foreground/80 leading-relaxed font-medium">
                                                    {just.motivo}
                                                </span>
                                                
                                                {analisesIA[just.id] && (
                                                    <div className={`mt-3 p-4 rounded-xl border-2 shadow-sm animate-in slide-in-from-top-2 duration-300 ${
                                                        analisesIA[just.id].sugestao === 'aprovar' 
                                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' 
                                                        : analisesIA[just.id].sugestao === 'rejeitar'
                                                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-600'
                                                        : 'bg-amber-500/5 border-amber-500/20 text-amber-600'
                                                    }`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`p-1 rounded-md ${
                                                                analisesIA[just.id].sugestao === 'aprovar' ? 'bg-emerald-500/10' :
                                                                analisesIA[just.id].sugestao === 'rejeitar' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                                                            }`}>
                                                                <Bot size={14} strokeWidth={3} />
                                                            </div>
                                                            <span className="font-black uppercase tracking-[0.2em] text-[9px]">Análise Inteligente</span>
                                                        </div>
                                                        <p className="text-[11px] leading-relaxed font-semibold">{analisesIA[just.id].analise}</p>
                                                    </div>
                                                )}

                                                {just.status === 'rejeitada' && just.motivo_rejeicao && (
                                                    <div className="mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                                        <div className="flex items-center gap-1.5 mb-1 text-rose-500">
                                                            <XCircle size={12} strokeWidth={3} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Motivo da Reprovação</span>
                                                        </div>
                                                        <p className="text-[11px] text-rose-600/80 font-medium">{just.motivo_rejeicao}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Ações */}
                                        <td className="px-6 py-5 align-middle">
                                            <div className="flex items-center justify-end gap-3">
                                                {just.status === 'pendente' ? (
                                                    <div className="flex items-center gap-2 bg-muted/10 p-1.5 rounded-2xl border border-border/30">
                                                        <Tooltip texto="Analisar via IA">
                                                            <button
                                                                onClick={() => handleAnalisarIA(just.id, just.motivo)}
                                                                disabled={carregandoIA === just.id || !!analisesIA[just.id]}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-background text-primary hover:bg-primary hover:text-white transition-all border border-border hover:shadow-lg disabled:opacity-30 active:scale-90"
                                                            >
                                                                {carregandoIA === just.id ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} /> : <Wand2 className="w-5 h-5" strokeWidth={2.5} />}
                                                            </button>
                                                        </Tooltip>
                                                        
                                                        <div className="w-px h-6 bg-border/40 mx-1" />

                                                        <Tooltip texto="Aprovar">
                                                            <button
                                                                onClick={() => handleAprovar(just.id)}
                                                                disabled={processandoAcao === just.id}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-90 disabled:opacity-30"
                                                            >
                                                                {processandoAcao === just.id
                                                                    ? <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} />
                                                                    : <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                                                                }
                                                            </button>
                                                        </Tooltip>
                                                        <Tooltip texto="Rejeitar">
                                                            <button
                                                                onClick={() => setJustificativaSelecionada(just.id)}
                                                                disabled={processandoAcao === just.id}
                                                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-90 disabled:opacity-30"
                                                            >
                                                                <XCircle className="w-5 h-5" strokeWidth={2.5} />
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border border-border/50 rounded-xl">
                                                        <CheckCircle size={14} className="text-muted-foreground/30" strokeWidth={3} />
                                                        <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">
                                                            Finalizado
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Rejeição */}
            <Modal
                titulo="Reprovar Justificativa"
                aberto={!!justificativaSelecionada}
                aoFechar={() => { setJustificativaSelecionada(null); setMotivoRejeicao(''); }}
                largura="sm"
            >
                <div className="space-y-4 py-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Para manter a transparência, descreva o motivo da reprovação.
                    </p>
                    <textarea
                        placeholder="Motivo obrigatório de rejeição..."
                        required
                        className="w-full h-28 bg-background border border-border rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        value={motivoRejeicao}
                        onChange={(e) => setMotivoRejeicao(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-auto border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => { setJustificativaSelecionada(null); setMotivoRejeicao(''); }}
                            className="w-full sm:w-auto h-11 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleRejeitar}
                            disabled={!!processandoAcao || !motivoRejeicao.trim()}
                            className="w-full sm:w-auto h-11 bg-rose-600 text-white px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-rose-100 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {processandoAcao ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Reprovação'}
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmacaoExclusao
                aberto={false}
                aoFechar={() => {}}
                aoConfirmar={() => {}}
                titulo=""
                descricao=""
            />
        </div>
    );
}
 
export default PainelJustificativas;
