import { useState } from 'react';
import { Bot, CheckCircle, XCircle } from 'lucide-react';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { Textarea } from '@/components/ui/textarea';
import { usarJustificativasAdmin } from './usarJustificativasAdmin';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';

export function PainelJustificativas() {
    const { justificativas, carregando, erro, aprovar, rejeitar } = usarJustificativasAdmin();
    const [processandoAcao, setProcessandoAcao] = useState<string | null>(null);
    const [justificativaSelecionada, setJustificativaSelecionada] = useState<string | null>(null);
    const [motivoRejeicao, setMotivoRejeicao] = useState('');

    const formatarTipo = (tipo: string) => {
        const mapa: Record<string, string> = {
            'ausencia': 'Ausência (Atestado/Falta)',
            'esquecimento': 'Esquecimento de Batida',
            'problema_sistema': 'Falha no Sistema'
        };
        return mapa[tipo] || tipo;
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
        <div className="space-y-6 flex flex-col h-full bg-background">
            <CabecalhoFuncionalidade
                titulo="Caixa de Justificativas"
                subtitulo="Gerencia justificativas de ausências da sua equipe."
                icone={Bot}
                variante="padrao"
            />

            <div className="bg-card border border-border rounded-2xl flex flex-col flex-1 overflow-hidden shadow-sm">

                <div className="flex-1 overflow-y-auto min-w-0">
                    {justificativas.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Bot className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium text-foreground">Caixa de Entrada Vazia</p>
                            <p className="text-sm mt-1">Nenhuma justificativa aguardando auditoria.</p>
                        </div>
                    ) : (
                        <Table className="w-full text-sm text-left">
                            <TableHeader className="bg-muted/50 sticky top-0 border-border/50 shadow-sm z-10 text-xs">
                                <TableRow className="border-border/50 hover:bg-transparent">
                                    <TableHead className="px-5 py-4 font-semibold text-muted-foreground">Membro</TableHead>
                                    <TableHead className="px-5 py-4 font-semibold text-muted-foreground">Status & Data</TableHead>
                                    <TableHead className="px-5 py-4 font-semibold text-muted-foreground">Tipo & Motivo</TableHead>
                                    <TableHead className="px-5 py-4 text-center font-semibold text-muted-foreground w-36">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border/50 border-t border-border/50">
                                {justificativas.map((just, idx) => (
                                    <TableRow key={just.id} className={`${idx % 2 === 0 ? 'bg-transparent' : 'bg-accent/20'} border-transparent hover:bg-accent/50 transition-colors group cursor-default`}>
                                        <TableCell className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-3">
                                                <Avatar nome={just.usuario_nome} fotoPerfil={just.usuario_foto} tamanho="sm" />
                                                <div>
                                                    <p className="font-medium text-foreground">{just.usuario_nome}</p>
                                                    <p className="text-xs text-muted-foreground">{just.usuario_email}</p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-5 py-4 align-top">
                                            <div className="flex flex-col items-start gap-1.5">
                                                {just.status === 'pendente' && <Emblema texto="Pendente" variante="amarelo" />}
                                                {just.status === 'aprovada' && <Emblema texto="Aprovada" variante="verde" />}
                                                {just.status === 'rejeitada' && <Emblema texto="Rejeitada" variante="vermelho" />}
                                                <span className="font-mono text-xs text-muted-foreground font-medium whitespace-nowrap bg-muted px-2 py-0.5 rounded ml-0.5">
                                                    {just.data}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                                                    {formatarDataHora(just.criado_em)}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-5 py-4 align-top w-[40%]">
                                            <div className="flex flex-col gap-1 w-full max-w-sm">
                                                <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                                                    {formatarTipo(just.tipo)}
                                                </span>
                                                <span className="text-sm text-foreground line-clamp-2 md:line-clamp-4 leading-relaxed group-hover:text-foreground transition-colors">
                                                    {just.motivo}
                                                </span>
                                                {just.status === 'rejeitada' && just.motivo_rejeicao && (
                                                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
                                                        <span className="font-semibold">Reprovação:</span> {just.motivo_rejeicao}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-5 py-4 align-middle">
                                            <div className="flex items-center justify-end gap-2 pr-2">
                                                {just.status === 'pendente' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAprovar(just.id)}
                                                            disabled={processandoAcao === just.id}
                                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20 disabled:opacity-50"
                                                            aria-label="Aprovar"
                                                            title="Aprovar Justificativa"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setJustificativaSelecionada(just.id)}
                                                            disabled={processandoAcao === just.id}
                                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20 disabled:opacity-50"
                                                            aria-label="Rejeitar"
                                                            title="Rejeitar Justificativa"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground font-medium px-2 py-1 bg-muted rounded">Auditoria fechada</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <ConfirmacaoExclusao
                    aberto={!!justificativaSelecionada}
                    aoFechar={() => {
                        setJustificativaSelecionada(null);
                        setMotivoRejeicao('');
                    }}
                    aoConfirmar={handleRejeitar}
                    titulo="Reprovar Justificativa"
                    descricao={`Você está prestes a reprovar este pedido. Para manter a transparência e cumprir com a política da equipe, por favor descreva o motivo.`}
                    textoBotao={processandoAcao ? "Processando..." : "Confirmar Reprovação"}
                    carregando={!!processandoAcao}
                >
                    <div className="mt-4 pb-2">
                        <Textarea
                            placeholder="Motivo obrigatório de rejeição"
                            required
                            className="bg-background border-input text-sm h-24 text-foreground"
                            value={motivoRejeicao}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMotivoRejeicao(e.target.value)}
                        />
                    </div>
                </ConfirmacaoExclusao>
            </div>
        </div>
    );
}
