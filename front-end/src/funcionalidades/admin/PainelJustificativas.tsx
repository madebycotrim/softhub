import { useState } from 'react';
import { Bot, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { usarJustificativasAdmin } from './usarJustificativasAdmin';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '../../compartilhado/componentes/Modal';

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

    if (carregando) {
        return (
            <div className="flex justify-center items-center h-48 bg-card border border-border/50 rounded-2xl">
                <span className="text-muted-foreground">Carregando painel...</span>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="flex justify-center items-center h-48 bg-card border border-border/50 rounded-2xl">
                <span className="text-destructive">{erro}</span>
            </div>
        );
    }

    return (
        <div className="space-y-10 flex flex-col h-full bg-background animate-in fade-in duration-500 pb-10">
            <CabecalhoFuncionalidade
                titulo="Caixa de Justificativas"
                subtitulo="Gerencia justificativas de ausências da sua equipe."
                icone={Bot}
                variante="padrao"
            />

            <div className="bg-card border border-border rounded-2xl flex flex-col flex-1 overflow-hidden shadow-sm">
                <div className="flex-1 overflow-auto">
                    {justificativas.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Bot className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium text-foreground">Caixa de Entrada Vazia</p>
                            <p className="text-sm mt-1">Nenhuma justificativa aguardando auditoria.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[25%]">
                                        Membro
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[18%]">
                                        Status & Data
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        Tipo & Motivo
                                    </th>
                                    <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[120px]">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {justificativas.map(just => (
                                    <tr key={just.id} className="hover:bg-muted/20 transition-colors group">
                                        {/* Membro */}
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-3">
                                                <Avatar nome={just.usuario_nome} fotoPerfil={just.usuario_foto} tamanho="sm" />
                                                <div>
                                                    <p className="font-medium text-foreground text-sm truncate max-w-[160px]">
                                                        {just.usuario_nome}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                                        {just.usuario_email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status & Data */}
                                        <td className="px-3 py-4 align-top">
                                            <div className="flex flex-col items-start gap-1.5">
                                                {just.status === 'pendente' && <Emblema texto="Pendente" variante="amarelo" />}
                                                {just.status === 'aprovada' && <Emblema texto="Aprovada" variante="verde" />}
                                                {just.status === 'rejeitada' && <Emblema texto="Rejeitada" variante="vermelho" />}
                                                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                    {just.data}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/60 font-mono">
                                                    {formatarDataHora(just.criado_em)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Tipo & Motivo */}
                                        <td className="px-3 py-4 align-top">
                                            <div className="flex flex-col gap-1 max-w-sm">
                                                <span className="text-xs font-bold tracking-wide text-primary uppercase">
                                                    {formatarTipo(just.tipo)}
                                                </span>
                                                <span className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                                    {just.motivo}
                                                </span>
                                                {just.status === 'rejeitada' && just.motivo_rejeicao && (
                                                    <div className="mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                                                        <span className="font-bold">Reprovação:</span> {just.motivo_rejeicao}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Ações */}
                                        <td className="px-3 py-4 align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                {just.status === 'pendente' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAprovar(just.id)}
                                                            disabled={processandoAcao === just.id}
                                                            className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20 disabled:opacity-50"
                                                            aria-label="Aprovar"
                                                            title="Aprovar Justificativa"
                                                        >
                                                            {processandoAcao === just.id
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : <CheckCircle className="w-4 h-4" />
                                                            }
                                                        </button>
                                                        <button
                                                            onClick={() => setJustificativaSelecionada(just.id)}
                                                            disabled={processandoAcao === just.id}
                                                            className="w-9 h-9 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20 disabled:opacity-50"
                                                            aria-label="Rejeitar"
                                                            title="Rejeitar Justificativa"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-2 py-1 bg-muted rounded-lg">
                                                        Fechado
                                                    </span>
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
