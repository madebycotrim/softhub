import { useState, useMemo } from 'react';
import { Bot, LogIn, LogOut, ShieldAlert, Plus, AlertTriangle } from 'lucide-react';
import { usarPonto } from './usarPonto';
import { formatarTempoAtras, formatarDataHora } from '../../utilitarios/formatadores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usarJustificativas } from './usarJustificativa';
import { ListaJustificativas } from './ListaJustificativas';
import { FormularioJustificativa } from './FormularioJustificativa';
import { BotaoExportarPonto } from './BotaoExportarPonto';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Watch } from 'lucide-react';

/**
 * Interface de registro e visualização diária do ponto.
 * Controla os blocos de lógica de travamento fora da rede da Instituição (simulado via errors textuais na UI).
 */
export function BaterPonto() {
    const { registrosHoje, historico, carregando, erro, baterPonto } = usarPonto();
    const { justificativas, enviarJustificativa } = usarJustificativas();

    const [salvando, setSalvando] = useState(false);
    const [erroPonto, setErroPonto] = useState<string | null>(null);
    const [modalJustificativaAberto, setModalJustificativaAberto] = useState(false);

    // Calcula qual é o próximo tipo baseado no último registro de hoje
    const ultimoRegistro = useMemo(() => {
        if (registrosHoje.length === 0) return null;
        // Assumindo ordem decrescente de API (mais recente no topo)
        return registrosHoje[0];
    }, [registrosHoje]);

    const proximoTipo = ultimoRegistro?.tipo === 'entrada' ? 'saida' : 'entrada';

    // UX Rule: Se a API falhou por causa da rede, tranca o botão proativamente
    const foraDaRede = erro?.includes('rede da UNIEURO') || erroPonto?.includes('rede da UNIEURO');

    const handleBaterPonto = async () => {
        setErroPonto(null);
        setSalvando(true);
        try {
            await baterPonto(proximoTipo);
        } catch (e: any) {
            setErroPonto(e.message);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="w-full h-full pb-8 space-y-6">
            <CabecalhoFuncionalidade
                titulo="Ponto Eletrônico"
                subtitulo="Registre sua jornada de trabalho com segurança."
                icone={Watch}
                variante="padrao"
            />

            <Tabs defaultValue="registro" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-card border border-border shadow-sm">
                        <TabsTrigger value="registro" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                            Registro Diário
                        </TabsTrigger>
                        <TabsTrigger value="justificativas" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                            Minhas Justificativas
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                        <BotaoExportarPonto />
                        <button
                            onClick={() => setModalJustificativaAberto(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/90 border border-border rounded-lg text-sm text-secondary-foreground transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Justificativa
                        </button>
                    </div>
                </div>

                <TabsContent value="registro" className="mt-0 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Coluna 1: Ação (Botão principal) */}
                        <div className="lg:col-span-1 flex flex-col gap-4">
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden h-[340px]">

                                <h2 className="text-xl font-bold tracking-tight text-card-foreground mb-6 relative z-10">
                                    Controle de Jornada
                                </h2>

                                <div className="mb-6 relative z-10">
                                    {foraDaRede ? (
                                        <div className="flex flex-col items-center text-destructive">
                                            <ShieldAlert className="w-12 h-12 mb-3" />
                                            <p className="font-medium text-sm">Acesso bloqueado</p>
                                            <p className="text-xs mt-1 text-muted-foreground">Você deve estar conectado à<br />rede Wi-Fi da UNIEURO.</p>
                                        </div>
                                    ) : ultimoRegistro ? (
                                        <div className="flex flex-col items-center">
                                            <p className="text-sm text-muted-foreground mb-1">Último registro</p>
                                            <div className="flex items-center justify-center gap-2">
                                                {ultimoRegistro.tipo === 'entrada' ?
                                                    <LogIn className="w-5 h-5 text-emerald-500" /> :
                                                    <LogOut className="w-5 h-5 text-rose-500" />
                                                }
                                                <p className="text-xl font-bold text-foreground tracking-widest">
                                                    {new Date(ultimoRegistro.registrado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <p className="text-xs text-primary mt-2">
                                                {ultimoRegistro.tipo === 'entrada' ? 'Trabalhando ' : 'Ausente '}
                                                {formatarTempoAtras(ultimoRegistro.registrado_em)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <Bot className="w-12 h-12 mb-3 opacity-50" />
                                            <p className="font-medium">Nenhum registro hoje</p>
                                            <p className="text-xs mt-1">Sua jornada ainda não iniciou.</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleBaterPonto}
                                    disabled={carregando || salvando || foraDaRede}
                                    className={`
                        w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] relative z-10 text-white
                        ${foraDaRede ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' :
                                            proximoTipo === 'entrada'
                                                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/50'
                                                : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/50'
                                        }
                        ${(carregando || salvando) ? 'opacity-70 pointer-events-none' : ''}
                        `}
                                >
                                    {salvando ? (
                                        <span className="animate-pulse">Registrando...</span>
                                    ) : foraDaRede ? (
                                        <span>Rede Incompatível</span>
                                    ) : (
                                        <>
                                            {proximoTipo === 'entrada' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                                            Registrar {proximoTipo === 'entrada' ? 'Entrada' : 'Saída'}
                                        </>
                                    )}
                                </button>

                                {/* Efeitos visuais de fundo */}
                                {!foraDaRede && (
                                    <div className={`absolute bottom-0 left-0 w-full h-[60%] blur-[100px] pointer-events-none opacity-20 ${proximoTipo === 'entrada' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                )}
                            </div>

                            {erroPonto && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <p>{erroPonto}</p>
                                </div>
                            )}
                        </div>

                        {/* Coluna 2: Histórico (Mesclando o componente no mesmo arquivo para brevidade na UI) */}
                        <div className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col h-[340px] overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-border shrink-0 bg-muted/50">
                                <h3 className="font-bold text-card-foreground">Histórico Recente</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 min-w-0">
                                {historico.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                        <p>Nenhum registro encontrado no histórico.</p>
                                    </div>
                                ) : (
                                    <Table className="w-full text-sm text-left">
                                        <TableHeader className="bg-muted/50 rounded-t-lg sticky top-0 transition-colors">
                                            <TableRow className="border-border hover:bg-transparent">
                                                <TableHead className="px-4 py-3 font-medium rounded-tl-lg text-muted-foreground">Data e Hora</TableHead>
                                                <TableHead className="px-4 py-3 font-medium text-muted-foreground">Tipo</TableHead>
                                                <TableHead className="px-4 py-3 font-medium text-right rounded-tr-lg text-muted-foreground">Rede (IP)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historico.slice(0, 10).map((registro) => (
                                                <TableRow key={registro.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                                    <TableCell className="px-4 py-3 text-foreground font-medium font-mono text-xs max-w-[140px] truncate">
                                                        {formatarDataHora(registro.registrado_em)}
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${registro.tipo === 'entrada'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            }`}>
                                                            {registro.tipo === 'entrada' ? <LogIn className="w-3 h-3 shrink-0" /> : <LogOut className="w-3 h-3 shrink-0" />}
                                                            {registro.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-4 py-3 text-right text-muted-foreground font-mono text-xs max-w-[120px] truncate">
                                                        {registro.ip_origem.includes('192.') || registro.ip_origem.includes('10.') ? (
                                                            <span className="text-primary">UNIEURO Local</span>
                                                        ) : (
                                                            registro.ip_origem
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>

                    </div>
                </TabsContent>

                <TabsContent value="justificativas" className="mt-0 outline-none">
                    <ListaJustificativas justificativas={justificativas} />
                </TabsContent>
            </Tabs>

            <FormularioJustificativa
                aberto={modalJustificativaAberto}
                aoFechar={setModalJustificativaAberto}
                aoSalvar={enviarJustificativa}
            />
        </div>
    );
}
