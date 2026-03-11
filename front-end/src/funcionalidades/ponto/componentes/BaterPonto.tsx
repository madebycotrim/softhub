import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, LayoutDashboard, ScrollText, History, Fingerprint } from 'lucide-react';
import { usarPonto } from '@/funcionalidades/ponto/hooks/usarPonto';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { usarJustificativas } from '@/funcionalidades/ponto/hooks/usarJustificativa';
import { ListaJustificativas } from './ListaJustificativas';
import { FormularioJustificativa } from './FormularioJustificativa';
import { BotaoExportarPonto } from './BotaoExportarPonto';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { useEffect as useReactEffect } from 'react';
import { BarraBusca } from '@/compartilhado/componentes/BarraBusca';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Tooltip } from '@/compartilhado/componentes/Tooltip';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import type { JustificativaPonto } from '@/funcionalidades/ponto/hooks/usarJustificativa';

/**
 * Interface de registro e visualização diária do ponto.
 * Controla os blocos de lógica de travamento fora da rede da Instituição (simulado via errors textuais na UI).
 */
export function BaterPonto() {
    const { registrosHoje, historico, carregando, erro, baterPonto } = usarPonto();
    const { justificativas, enviarJustificativa, editarJustificativa, excluirJustificativa } = usarJustificativas();

    const [salvando, setSalvando] = useState(false);
    const [erroPonto, setErroPonto] = useState<string | null>(null);
    const [modalJustificativaAberto, setModalJustificativaAberto] = useState(false);
    const [justificativaEditando, setJustificativaEditando] = useState<JustificativaPonto | null>(null);
    const [idExcluindo, setIdExcluindo] = useState<string | null>(null);
    const [abaAtiva, setAbaAtiva] = useState<'registro' | 'justificativas'>('registro');
    const [busca, setBusca] = useState('');

    const podeRegistrar = usarPermissaoAcesso('ponto:registrar');
    const podeJustificar = usarPermissaoAcesso('ponto:justificar');
    const podeExportarCsv = usarPermissaoAcesso('ponto:exportar_csv');

    // Calcula qual é o próximo tipo baseado no último registro de hoje
    const ultimoRegistro = useMemo(() => {
        if (registrosHoje.length === 0) return null;
        // Assumindo ordem decrescente de API (mais recente no topo)
        return registrosHoje[0];
    }, [registrosHoje]);

    const proximoTipo = ultimoRegistro?.tipo === 'entrada' ? 'saida' : 'entrada';

    // UX Rule: Se a API falhou por causa da rede, tranca o botão proativamente
    const foraDaRede = erro?.includes('rede da UNIEURO') || erroPonto?.includes('rede da UNIEURO');

    // Relógio em tempo real
    const [agoraRelogio, setAgoraRelogio] = useState(new Date());

    useReactEffect(() => {
        const interval = setInterval(() => {
            setAgoraRelogio(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const horaAtual = agoraRelogio.getHours();
    const foraDoHorario = horaAtual < 13 || horaAtual >= 17;


    // Cronômetro de Jornada Progressivo
    const cronometroJornada = useMemo(() => {
        if (!ultimoRegistro || ultimoRegistro.tipo === 'saida') return null;
        
        const entrada = new Date(ultimoRegistro.registrado_em);
        // O cronômetro deve parar às 17h se não houve saída
        const fim = horaAtual >= 17 
            ? new Date(new Date().setHours(17, 0, 0, 0)) 
            : agoraRelogio;

        const diffms = Math.max(0, fim.getTime() - entrada.getTime());
        const totalSegundos = Math.floor(diffms / 1000);
        
        const h = Math.floor(totalSegundos / 3600);
        const m = Math.floor((totalSegundos % 3600) / 60);
        const s = totalSegundos % 60;
        
        return {
            texto: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
            finalizadoAuto: horaAtual >= 17 && ultimoRegistro.tipo === 'entrada'
        };
    }, [ultimoRegistro, agoraRelogio, horaAtual]);

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

    // Otimização: Filtragem memorizada para evitar cálculos no re-render do relógio
    const registrosFiltrados = useMemo(() => {
        return historico.filter(r => 
            r.tipo.toLowerCase().includes(busca.toLowerCase()) || 
            formatarDataHora(r.registrado_em).includes(busca)
        );
    }, [historico, busca]);

    return (
        <div className="w-full font-sans text-slate-900 animate-in fade-in duration-700">
            <div className="w-full space-y-4">
                
                {/* Cabeçalho Padronizado */}
                <CabecalhoFuncionalidade
                    titulo="Ponto Eletrônico"
                    subtitulo="Controle de jornada e registros."
                    icone={Fingerprint}
                    variante="padrao"
                >
                    <div className="flex items-center gap-3 sm:gap-4">
                        {carregando && historico.length > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse transition-all">
                                <Carregando Centralizar={false} tamanho="sm" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Sincronizando...</span>
                            </div>
                        )}
                        <Tooltip texto={abaAtiva === 'registro' ? "Ver Justificativas" : "Ver Registros"} posicao="bottom">
                            <button 
                                onClick={() => setAbaAtiva(abaAtiva === 'registro' ? 'justificativas' : 'registro')}
                                className={`flex items-center justify-center w-11 h-11 rounded-2xl border transition-all ${
                                    abaAtiva === 'justificativas' 
                                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                                    : 'bg-background border-border text-muted-foreground hover:border-primary/20 hover:text-primary hover:bg-primary/5'
                                }`}
                            >
                                {abaAtiva === 'justificativas' ? (
                                    <ScrollText size={18} strokeWidth={2.5} />
                                ) : (
                                    <History size={18} strokeWidth={2.5} />
                                )}
                            </button>
                        </Tooltip>
                        
                        <div className="flex items-center gap-2">
                            {podeExportarCsv && <BotaoExportarPonto />}

                            {podeJustificar && (
                                <button 
                                    onClick={() => {
                                        setJustificativaEditando(null);
                                        setModalJustificativaAberto(true);
                                    }}
                                    className="h-11 px-5 bg-foreground text-background rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Justificar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </CabecalhoFuncionalidade>

                {/* Layout Moderno de Duas Colunas (Evita esticamentos indesejados) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    
                    {/* COLUNA ESQUERDA: RELÓGIO E AÇÃO */}
                    <div className="flex flex-col">
                        {/* TILE 1: AÇÃO PRINCIPAL */}
                        <div className="bg-card border border-border/60 rounded-2xl p-8 sm:py-16 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all">
                            
                            <div className="relative z-10 space-y-6 sm:space-y-8 w-full">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 mb-2">
                                    <div className="w-1 h-1 bg-primary rounded-full" />
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary">Horário de Brasília</span>
                                </div>
                                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 tabular-nums flex items-baseline justify-center">
                                    {agoraRelogio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    <span className="text-xl sm:text-2xl text-slate-300 font-medium ml-1.5 select-none">
                                        {agoraRelogio.toLocaleTimeString('pt-BR', { second: '2-digit' })}
                                    </span>
                                </h2>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={handleBaterPonto}
                                    disabled={carregando || salvando || foraDaRede || foraDoHorario || !podeRegistrar}
                                    className={`w-full max-w-sm py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none border border-border/50 ${
                                        proximoTipo === 'entrada' 
                                        ? 'bg-foreground text-background hover:opacity-90' 
                                        : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                    }`}
                                >
                                {salvando ? <Carregando Centralizar={false} tamanho="sm" className="border-t-white border-white/30" /> : `EFETUAR REGISTRO: ${proximoTipo}`}
                                </button>
                            </div>

                            {foraDoHorario && (
                                <div className="flex items-center justify-center gap-2 text-destructive bg-destructive/5 py-2.5 px-6 rounded-2xl w-fit mx-auto border border-destructive/10">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Acesso Bloqueado • Fora do Expediente</span>
                                </div>
                            )}
                        </div>
                    </div>
                    </div>

                    {/* COLUNA DIREITA: STATUS, JORNADA E HISTÓRICO */}
                    <div className="flex flex-col gap-3 sm:gap-4 w-full">
                        
                        {/* PAINEL SUPERIOR: STATUS E JORNADA */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {/* TILE 2: STATUS */}
                            <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-between gap-3 group hover:border-primary/40 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 sm:p-2.5 bg-muted/40 text-muted-foreground rounded-2xl border border-border/50 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                        <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className={`w-2 h-2 rounded-full mt-1 ${ultimoRegistro?.tipo === 'entrada' ? 'bg-emerald-500' : 'bg-muted'}`} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                                    <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                                        {ultimoRegistro?.tipo === 'entrada' ? 'Ocupado' : 'Livre'}
                                    </p>
                                </div>
                            </div>

                            {/* TILE 3: JORNADA */}
                            <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-between gap-3 group hover:border-amber-400/40 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 sm:p-2.5 bg-amber-500/5 text-amber-600 rounded-2xl border border-amber-500/10">
                                        <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jornada</p>
                                    <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight tabular-nums">
                                        {cronometroJornada?.texto || '00:00:00'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* TILE 4: HISTÓRICO RECENTE */}
                        <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col h-[400px]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <div className="space-y-0.5">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linha do Tempo</h3>
                                <p className="text-base font-black text-slate-900 truncate">
                                    {abaAtiva === 'registro' ? 'Atividade Diária' : 'Justificativas'}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative w-full sm:w-48">
                                    <BarraBusca 
                                        valor={busca}
                                        aoMudar={setBusca}
                                        placeholder="Filtrar..."
                                    />
                                </div>
                                <Tooltip texto={abaAtiva === 'registro' ? "Mostrar Justificativas" : "Mostrar Registros"} posicao="left">
                                    <button 
                                        onClick={() => setAbaAtiva(abaAtiva === 'registro' ? 'justificativas' : 'registro')}
                                        className={`p-2.5 rounded-2xl transition-all active:scale-95 border ${
                                            abaAtiva === 'justificativas' 
                                            ? 'bg-primary border-primary text-primary-foreground' 
                                            : 'bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {abaAtiva === 'justificativas' ? (
                                            <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />
                                        ) : (
                                            <History className="w-4 h-4 sm:w-5 sm:h-5" />
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                            {abaAtiva === 'registro' ? (
                                (() => {
                                    if (registrosFiltrados.length === 0) {
                                        return (
                                            <div className="py-8">
                                                <EstadoVazio 
                                                    tipo={busca ? 'pesquisa' : 'vazio'}
                                                    titulo={busca ? "Nenhum resultado" : "Sem batidas"}
                                                    descricao={busca ? `Não encontramos "${busca}".` : "Inicie o dia registrando sua entrada."}
                                                    compacto={true}
                                                />
                                            </div>
                                        );
                                    }

                                    return registrosFiltrados.slice(0, 5).map((reg) => (
                                        <div key={reg.id} className="flex items-center justify-between p-4 sm:p-5 bg-muted/10 border border-hidden rounded-2xl group hover:bg-card hover:border-border/50 transition-all">
                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                <div className={`p-2 sm:p-3 rounded-2xl shrink-0 ${reg.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{reg.tipo}</p>
                                                    <p className="text-sm sm:text-base font-black text-slate-800 truncate">{formatarDataHora(reg.registrado_em).split(' às ')[1]}</p>
                                                </div>
                                            </div>
                                            <div className="hidden xs:block px-2 sm:px-3 py-1 sm:py-1.5 bg-background border border-border/50 rounded-2xl shrink-0 ml-2">
                                                <span className="text-[8px] sm:text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest leading-none">Rede</span>
                                            </div>
                                        </div>
                                    ));
                                })()
                            ) : (
                                <ListaJustificativas 
                                    justificativas={justificativas.filter(j => j.motivo.toLowerCase().includes(busca.toLowerCase()) || j.tipo.toLowerCase().includes(busca.toLowerCase()))}
                                    aoEditar={(just) => {
                                        setJustificativaEditando(just);
                                        setModalJustificativaAberto(true);
                                    }}
                                    aoExcluir={(id) => setIdExcluindo(id)}
                                />
                            )}
                        </div>
                    </div>
                    
                    </div>
                </div>

                {/* Banner de Erro Flutuante se houver erro */}
                {(erroPonto || erro) && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8">
                        <div className="bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-rose-500/50">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{erroPonto || erro}</span>
                        </div>
                    </div>
                )}

                <FormularioJustificativa 
                    aberto={modalJustificativaAberto} 
                    aoFechar={setModalJustificativaAberto} 
                    justificativaAtual={justificativaEditando}
                    aoSalvar={async (dados) => {
                        if (justificativaEditando) {
                            await editarJustificativa(justificativaEditando.id, dados);
                        } else {
                            await enviarJustificativa(dados);
                        }
                    }} 
                />

                <ConfirmacaoExclusao 
                    aberto={!!idExcluindo}
                    aoFechar={() => setIdExcluindo(null)}
                    aoConfirmar={async () => {
                        if (idExcluindo) {
                            await excluirJustificativa(idExcluindo);
                            setIdExcluindo(null);
                        }
                    }}
                    titulo="Excluir justificativa?"
                    descricao="Apenas justificativas pendentes podem ser excluídas. Esta ação não poderá ser desfeita."
                />


            </div>
        </div>
    );
}
