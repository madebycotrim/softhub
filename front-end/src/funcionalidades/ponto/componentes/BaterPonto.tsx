import { useState, useMemo, useCallback, memo } from 'react';
import { Plus, AlertTriangle, LayoutDashboard, ScrollText, History, Fingerprint, ChevronLeft, ChevronRight, Timer, LogIn, LogOut } from 'lucide-react';
import { usarPonto } from '@/funcionalidades/ponto/hooks/usarPonto';
import { formatarDataHora, formatarHoras } from '@/utilitarios/formatadores';
import { usarJustificativas } from '@/funcionalidades/ponto/hooks/usarJustificativa';
import { ListaJustificativas } from './ListaJustificativas';
import { FormularioJustificativa } from './FormularioJustificativa';
import { DayCard } from './DayCard';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { useEffect as useReactEffect } from 'react';
import { BarraBusca } from '@/compartilhado/componentes/BarraBusca';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Tooltip } from '@/compartilhado/componentes/Tooltip';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { Alerta } from '@/compartilhado/componentes/Alerta';
import { startOfWeek, addDays, isSameDay, isToday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { JustificativaPonto } from '@/funcionalidades/ponto/hooks/usarJustificativa';
import { PainelRelogio } from './PainelRelogio';
import { PainelStatusJornada } from './PainelStatusJornada';
import type { RegistroPonto } from '@/funcionalidades/ponto/hooks/usarPonto';
import { Clock } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { api } from '@/compartilhado/servicos/api';

/**
 * Interface de registro e visualização diária do ponto.
 * Controla os blocos de lógica de travamento fora da rede da Instituição.
 */
export const BaterPonto = memo(() => {
    const { registrosHoje, historico, carregando, erro, baterPonto } = usarPonto();
    const { justificativas, enviarJustificativa, editarJustificativa, excluirJustificativa } = usarJustificativas();

    const [salvando, setSalvando] = useState(false);
    const [erroPonto, setErroPonto] = useState<string | null>(null);
    const [modalJustificativaAberto, setModalJustificativaAberto] = useState(false);
    const [justificativaEditando, setJustificativaEditando] = useState<JustificativaPonto | null>(null);
    const [idExcluindo, setIdExcluindo] = useState<string | null>(null);
    const [abaAtiva, setAbaAtiva] = useState<'registro' | 'justificativas'>('registro');
    const [busca, setBusca] = useState('');
    const [semanaSelecionada, setSemanaSelecionada] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }).getTime());
    const [tentativaBloqueada, setTentativaBloqueada] = useState(false);
    
    const [searchParams] = useSearchParams();
    const abaUrl = searchParams.get('aba');

    useReactEffect(() => {
        if (abaUrl === 'justificativas') {
            setAbaAtiva('justificativas');
        }
    }, [abaUrl]);
    
    // Governança de Horário Dinâmica
    const [janelaTrabalho, setJanelaTrabalho] = useState({ inicio: '13:00', fim: '17:00' });

    useReactEffect(() => {
        const carregarGovernanca = async () => {
            try {
                const res = await api.get('/api/configuracoes/publico');
                if (res.data.hora_inicio_ponto && res.data.hora_fim_ponto) {
                    setJanelaTrabalho({
                        inicio: res.data.hora_inicio_ponto,
                        fim: res.data.hora_fim_ponto
                    });
                }
            } catch (e) {
                console.error('Falha ao sincronizar governança de horário');
            }
        };
        carregarGovernanca();
    }, []);

    const podeRegistrar = usarPermissaoAcesso('ponto:registrar');
    const podeJustificar = usarPermissaoAcesso('ponto:justificar');
    const isAdmin = usarPermissaoAcesso('membros:gerenciar'); // Simplificacao para verificar se e admin

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

    const foraDoHorario = useMemo(() => {
        const horaBrasiliaStr = agoraRelogio.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
        
        const converterParaMinutos = (h: string) => {
            const [horas, minutos] = h.split(':').map(Number);
            return horas * 60 + minutos;
        };

        const agoraMinutos = converterParaMinutos(horaBrasiliaStr);
        const inicioMinutos = converterParaMinutos(janelaTrabalho.inicio);
        const fimMinutos = converterParaMinutos(janelaTrabalho.fim);

        return agoraMinutos < inicioMinutos || agoraMinutos > fimMinutos;
    }, [agoraRelogio, janelaTrabalho]);




    // Cronômetro de Jornada Progressivo
    const cronometroJornada = useMemo(() => {
        if (!ultimoRegistro || ultimoRegistro.tipo === 'saida') return null;

        const entrada = new Date(ultimoRegistro.registrado_em);
        
        const { inicio, fim } = janelaTrabalho;
        const [hFim, mFim] = fim.split(':').map(Number);
        const dataFim = new Date(new Date().setHours(hFim, mFim, 0, 0));

        // O cronômetro deve parar no horário de fechamento se não houve saída
        const fimProcesso = agoraRelogio > dataFim ? dataFim : agoraRelogio;

        const diffms = Math.max(0, fimProcesso.getTime() - entrada.getTime());
        const totalSegundos = Math.floor(diffms / 1000);

        const h = Math.floor(totalSegundos / 3600);
        const m = Math.floor((totalSegundos % 3600) / 60);
        const s = totalSegundos % 60;

        return {
            texto: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
            finalizadoAuto: foraDoHorario && ultimoRegistro.tipo === 'entrada'
        };
    }, [ultimoRegistro, agoraRelogio, foraDoHorario, janelaTrabalho]);

    // Identifica todas as semanas únicas que possuem registros + a semana atual
    const semanasDisponiveis = useMemo(() => {
        const mapa = new Set<number>();
        historico.forEach(reg => {
            mapa.add(startOfWeek(new Date(reg.registrado_em), { weekStartsOn: 1 }).getTime());
        });
        mapa.add(startOfWeek(new Date(), { weekStartsOn: 1 }).getTime());
        return Array.from(mapa).sort((a, b) => a - b);
    }, [historico]);

    const indiceSemanaAtual = semanasDisponiveis.indexOf(semanaSelecionada);

    const handleBaterPonto = useCallback(async () => {
        setErroPonto(null);
        setSalvando(true);
        try {
            await baterPonto(proximoTipo);
        } catch (e: any) {
            setErroPonto(e.message);
        } finally {
            setSalvando(false);
        }
    }, [baterPonto, proximoTipo]);

    const handleAlternarAba = useCallback(() => {
        setAbaAtiva(prev => prev === 'registro' ? 'justificativas' : 'registro');
    }, []);

    const handleNovaJustificativa = useCallback(() => {
        setJustificativaEditando(null);
        setModalJustificativaAberto(true);
    }, []);

    const handleMudarBusca = useCallback((v: string) => setBusca(v), []);

    const handleSemanaAnterior = useCallback(() => {
        setSemanaSelecionada(semanasDisponiveis[indiceSemanaAtual - 1]);
    }, [semanasDisponiveis, indiceSemanaAtual]);

    const handleSemanaProxima = useCallback(() => {
        setSemanaSelecionada(semanasDisponiveis[indiceSemanaAtual + 1]);
    }, [semanasDisponiveis, indiceSemanaAtual]);

    const handleEditarJustificativa = useCallback((just: JustificativaPonto) => {
        if (just.status !== 'pendente') return;
        setJustificativaEditando(just);
        setModalJustificativaAberto(true);
    }, []);

    const handleExcluirJustificativa = useCallback((id: string) => {
        const just = justificativas.find(j => j.id === id);
        if (just?.status === 'pendente') {
            setIdExcluindo(id);
        }
    }, [justificativas]);

    const handleConfirmarExclusao = useCallback(async () => {
        if (idExcluindo) {
            const just = justificativas.find(j => j.id === idExcluindo);
            if (just?.status === 'pendente') {
                await excluirJustificativa(idExcluindo);
            }
            setIdExcluindo(null);
        }
    }, [idExcluindo, justificativas, excluirJustificativa]);

    const handleSalvarJustificativa = useCallback(async (dados: any) => {
        if (justificativaEditando) {
            if (justificativaEditando.status !== 'pendente') {
                throw new Error('Apenas justificativas pendentes podem ser editadas.');
            }
            await editarJustificativa(justificativaEditando.id, dados);
        } else {
            await enviarJustificativa(dados);
        }
    }, [justificativaEditando, editarJustificativa, enviarJustificativa]);

    // Semanas disponíveis movidas para cima para evitar TDZ em callbacks

    const diasSemana = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => addDays(new Date(semanaSelecionada), i));
    }, [semanaSelecionada]);

    const registrosAgrupados = useMemo(() => {
        return diasSemana.map(dia => ({
            dia,
            registros: historico.filter(reg => isSameDay(new Date(reg.registrado_em), dia))
        }));
    }, [historico, diasSemana]);

    // Interface de Carregamento Inicial (Skeleton)
    if (carregando && historico.length === 0) return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            <div className="h-20 w-full bg-card/60 border border-border/40 rounded-3xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px] bg-card/60 border border-border/40 rounded-3xl animate-pulse" />
                <div className="space-y-6">
                    <div className="h-32 bg-card/60 border border-border/40 rounded-3xl animate-pulse" />
                    <div className="h-[250px] bg-card/60 border border-border/40 rounded-3xl animate-pulse" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full font-sans text-slate-900 animar-entrada">
            <div className="w-full space-y-4">

                {/* Cabeçalho Padronizado */}
                <CabecalhoFuncionalidade
                    titulo="Ponto Eletrônico"
                    subtitulo="Controle de jornada e registros."
                    icone={Fingerprint}
                    variante="padrao"
                >
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Tooltip texto={abaAtiva === 'registro' ? "Ver Justificativas" : "Ver Registros"} posicao="bottom">
                            <button
                                onClick={handleAlternarAba}
                                className={`flex items-center justify-center w-11 h-11 rounded-2xl border transition-all ${abaAtiva === 'justificativas'
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


                            {podeJustificar && (
                                <button
                                    onClick={handleNovaJustificativa}
                                    className="h-11 px-6 bg-primary text-primary-foreground rounded-full flex items-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    <span>Justificar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </CabecalhoFuncionalidade>

                {/* Layout Unificado 'Platinum Glass' */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* COLUNA ESQUERDA: RELÓGIO E AÇÃO COM FEEDBACK DE SEGURANÇA */}
                    <PainelRelogio
                        agoraRelogio={agoraRelogio}
                        foraDaRede={foraDaRede}
                        foraDoHorario={foraDoHorario}
                        podeRegistrar={podeRegistrar}
                        tentativaBloqueada={tentativaBloqueada}
                        salvando={salvando}
                        carregando={carregando}
                        proximoTipo={proximoTipo as 'entrada' | 'saida'}
                        aoTentarRegistrar={() => {
                            if (foraDaRede || foraDoHorario || !podeRegistrar) {
                                setTentativaBloqueada(true);
                                setTimeout(() => setTentativaBloqueada(false), 500);
                            }
                        }}
                        aoBaterPonto={handleBaterPonto}
                    />

                    {/* COLUNA DIREITA: STATUS, JORNADA E HISTÓRICO */}
                    <div className="flex flex-col gap-4 w-full">

                        {/* PAINEL SUPERIOR: STATUS E JORNADA */}
                        <PainelStatusJornada
                            ultimoRegistro={ultimoRegistro}
                            cronometroJornada={cronometroJornada}
                        />

                        {/* TILE 4: HISTÓRICO RECENTE (LINHA DO TEMPO) */}
                        <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-8 flex flex-col shadow-[0_30px_70px_-20px_rgba(0,0,0,0.04)] max-h-[540px]">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6 shrink-0">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Linha do Tempo</h3>
                                    <p className="text-[24px] font-black text-slate-900 tracking-tight">
                                        {abaAtiva === 'registro' ? 'Atividade da Semana' : 'Justificativas Enviadas'}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                    {abaAtiva === 'registro' && semanasDisponiveis.length > 1 && (
                                        <div className="flex items-center gap-2 bg-slate-950/[0.03] p-1.5 rounded-2xl border border-slate-950/5 backdrop-blur-sm">
                                            <button 
                                                onClick={handleSemanaAnterior}
                                                disabled={indiceSemanaAtual <= 0}
                                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed text-slate-600"
                                                title="Semana Anterior com Registros"
                                            >
                                                <ChevronLeft size={18} strokeWidth={2.5} />
                                            </button>
                                            <div className="px-3 min-w-[120px] text-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                                    {isSameDay(new Date(semanaSelecionada), startOfWeek(new Date(), { weekStartsOn: 1 })) 
                                                        ? 'Esta Semana' 
                                                        : format(new Date(semanaSelecionada), "'Semana de' dd/MM", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={handleSemanaProxima}
                                                disabled={indiceSemanaAtual >= semanasDisponiveis.length - 1}
                                                className="p-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed text-slate-600"
                                                title="Próxima Semana com Registros"
                                            >
                                                <ChevronRight size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative w-full sm:w-56">
                                        <BarraBusca
                                            valor={busca}
                                            aoMudar={handleMudarBusca}
                                            placeholder="Buscar registros..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-none pr-1">
                                {abaAtiva === 'registro' ? (
                                    <div className="grid grid-cols-5 gap-3 w-full">
                                        {registrosAgrupados.map(({ dia, registros }) => (
                                            <DayCard
                                                key={dia.toISOString()}
                                                dia={dia}
                                                registros={registros}
                                                hoje={isToday(dia)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <ListaJustificativas
                                        justificativas={justificativas.filter(j => j.motivo.toLowerCase().includes(busca.toLowerCase()) || j.tipo.toLowerCase().includes(busca.toLowerCase()))}
                                        aoEditar={handleEditarJustificativa}
                                        aoExcluir={handleExcluirJustificativa}
                                    />
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Banner de Erro Flutuante se houver erro */}
                {(erroPonto || erro) && (
                    <Alerta tipo="erro" mensagem={erroPonto || erro || "Erro desconhecido"} flutuante />
                )}

                <FormularioJustificativa
                    aberto={modalJustificativaAberto}
                    aoFechar={setModalJustificativaAberto}
                    justificativaAtual={justificativaEditando}
                    aoSalvar={handleSalvarJustificativa}
                />

                <ConfirmacaoExclusao
                    aberto={!!idExcluindo}
                    aoFechar={() => setIdExcluindo(null)}
                    aoConfirmar={handleConfirmarExclusao}
                    titulo="Excluir justificativa?"
                    descricao="Apenas justificativas pendentes podem ser excluídas. Esta ação não poderá ser desfeita."
                />


            </div>
        </div>
    );
});

export default BaterPonto;
