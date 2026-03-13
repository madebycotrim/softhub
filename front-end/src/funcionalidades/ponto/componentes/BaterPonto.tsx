import { useState, useMemo, useCallback, memo } from 'react';
import { Plus, AlertTriangle, LayoutDashboard, ScrollText, History, Fingerprint, ChevronLeft, ChevronRight, Timer, LogIn, LogOut } from 'lucide-react';
import { usarPonto } from '@/funcionalidades/ponto/hooks/usarPonto';
import { formatarDataHora, formatarHoras } from '@/utilitarios/formatadores';
import { usarJustificativas } from '@/funcionalidades/ponto/hooks/usarJustificativa';
import { ListaJustificativas } from './ListaJustificativas';
import { FormularioJustificativa } from './FormularioJustificativa';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { useEffect as useReactEffect } from 'react';
import { BarraBusca } from '@/compartilhado/componentes/BarraBusca';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Tooltip } from '@/compartilhado/componentes/Tooltip';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { Alerta } from '@/compartilhado/componentes/Alerta';
import { startOfWeek, addDays, isSameDay, isToday, format, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { JustificativaPonto } from '@/funcionalidades/ponto/hooks/usarJustificativa';
import type { RegistroPonto } from '@/funcionalidades/ponto/hooks/usarPonto';
import { Clock } from 'lucide-react';

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

    // Interface de Carregamento Inicial (Sempre depois dos hooks)
    if (carregando && historico.length === 0) return (
        <div className="flex flex-col items-center justify-center min-h-[500px] w-full bg-white/50 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl animate-in fade-in zoom-in duration-500">
            <Carregando Centralizar={true} />
            <div className="flex flex-col items-center gap-2 mt-6">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Sincronizando registros</p>
                <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-primary animate-progress-scan" />
                </div>
            </div>
        </div>
    );

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
                                    className="h-11 px-5 bg-primary text-primary-foreground rounded-2xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Justificar</span>
                                </button>
                            )}
                        </div>
                    </div>
                </CabecalhoFuncionalidade>

                {/* Layout Unificado 'Platinum Glass' */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* COLUNA ESQUERDA: RELÓGIO E AÇÃO COM FEEDBACK DE SEGURANÇA */}
                    <div className="flex flex-col h-full relative">
                        {/* Ultra-Premium Animation Suite */}
                        <style dangerouslySetInnerHTML={{ __html: `
                            @keyframes shake {
                                0%, 100% { transform: translateX(0); }
                                25% { transform: translateX(-6px); }
                                75% { transform: translateX(6px); }
                            }
                            .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
                            @keyframes security-pulse {
                                0% { opacity: 0; transform: scale(0.9); }
                                50% { opacity: 0.15; transform: scale(1); }
                                100% { opacity: 0; transform: scale(1.1); }
                            }
                            .animate-security { animation: security-pulse 2s infinite; }
                            @keyframes shine-sweep {
                                0% { left: -100%; opacity: 0; }
                                20% { opacity: 0.5; }
                                40% { left: 100%; opacity: 0; }
                                100% { left: 100%; opacity: 0; }
                            }
                            .animate-shine { position: absolute; top: 0; left: -100%; width: 50%; h-full: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-20deg); animation: shine-sweep 6s infinite; }
                            @keyframes fade-up {
                                from { opacity: 0; transform: translateY(20px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            .animate-fade-up { animation: fade-up 0.8s cubic-bezier(.22,1,.36,1) forwards; }
                            @keyframes progress-scan {
                                0% { left: -10%; }
                                100% { left: 110%; }
                            }
                            .animate-scan { animation: progress-scan 2s linear infinite; }
                        `}} />

                        <div 
                            className={`
                                bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-10 
                                flex flex-col items-center justify-center text-center relative overflow-hidden group 
                                shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] h-[480px] transition-all duration-700
                                animate-fade-up hover:border-primary/20 hover:shadow-[0_60px_120px_-20px_rgba(var(--primary-rgb),0.12)]
                                ${tentativaBloqueada ? 'animate-shake border-rose-500/50 shadow-rose-500/10' : ''}
                            `}
                        >
                            {/* Visual Shine Effect */}
                            <div className="animate-shine z-0" />
                            
                            {/* Visual Security Overlay - Active when locked */}
                            {(foraDaRede || foraDoHorario) && (
                                <div className="absolute inset-0 bg-rose-500/5 animate-security pointer-events-none z-0" />
                            )}
                            
                            {/* Aurora Accent */}
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-[120px] z-0 opacity-20 pointer-events-none group-hover:opacity-40 transition-all duration-1000 group-hover:scale-125" />
                            
                            <div className="relative z-10 space-y-12 w-full">
                                <div className="space-y-5">
                                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-950/[0.04] rounded-full border border-slate-900/5 mb-2 backdrop-blur-sm group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
                                        <div className={`w-2 h-2 rounded-full ${foraDaRede || foraDoHorario ? 'bg-rose-500' : 'bg-primary animate-pulse'}`} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 group-hover:text-primary transition-colors">
                                            {foraDaRede || foraDoHorario ? 'Acesso Restrito' : 'Horário de Brasília'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <h2 className="text-8xl sm:text-9xl font-black tracking-[-0.08em] text-slate-950 tabular-nums flex items-baseline justify-center drop-shadow-sm">
                                            {agoraRelogio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            <span className="text-3xl sm:text-4xl text-slate-400/60 font-black ml-3 select-none tracking-widest">
                                                {agoraRelogio.toLocaleTimeString('pt-BR', { second: '2-digit' })}
                                            </span>
                                        </h2>
                                        <div className="w-24 h-1.5 bg-slate-900/5 rounded-full mt-4 overflow-hidden relative border border-slate-900/5 shadow-inner">
                                            <div 
                                                className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
                                                style={{ width: `${(agoraRelogio.getSeconds() / 60) * 100}%` }}
                                            />
                                            <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-scan z-10" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative w-full max-w-sm mx-auto">
                                    <button
                                        onMouseDown={() => {
                                            if (foraDaRede || foraDoHorario || !podeRegistrar) {
                                                setTentativaBloqueada(true);
                                                setTimeout(() => setTentativaBloqueada(false), 500);
                                            }
                                        }}
                                        onClick={handleBaterPonto}
                                        disabled={carregando || salvando || foraDaRede || foraDoHorario || !podeRegistrar}
                                        className={`
                                            w-full py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.3em] 
                                            transition-all active:scale-[0.97] border shadow-2xl relative z-10
                                            disabled:cursor-not-allowed
                                            ${proximoTipo === 'entrada'
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700'
                                                : 'bg-rose-600 text-white border-rose-600 shadow-rose-600/30 hover:bg-rose-700'
                                            }
                                            ${(foraDaRede || foraDoHorario) ? 'saturate-[0.2] opacity-80' : ''}
                                        `}
                                    >
                                        {salvando ? (
                                            <Carregando Centralizar={false} tamanho="sm" className="border-t-white border-white/30" />
                                        ) : (
                                            <div className="flex items-center justify-center gap-3">
                                                {foraDaRede || foraDoHorario ? (
                                                    <AlertTriangle size={16} strokeWidth={3} />
                                                ) : proximoTipo === 'entrada' ? (
                                                    <LogIn size={16} strokeWidth={3} />
                                                ) : (
                                                    <LogOut size={16} strokeWidth={3} />
                                                )}
                                                <span>Registrar {proximoTipo}</span>
                                            </div>
                                        )}
                                    </button>
                                    
                                    {/* Locked State Tooltip-like hint */}
                                    {(foraDaRede || foraDoHorario) && tentativaBloqueada && (
                                        <div className="absolute -bottom-14 inset-x-0 animate-bounce">
                                            <span className="bg-rose-600 text-white text-[9px] font-black py-1.5 px-4 rounded-full uppercase tracking-widest shadow-lg">
                                                Acesso Negado: Fora da Rede/Horário
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: STATUS, JORNADA E HISTÓRICO */}
                    <div className="flex flex-col gap-4 w-full">

                        {/* PAINEL SUPERIOR: STATUS E JORNADA */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* TILE 2: STATUS */}
                            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between gap-4 group hover:border-emerald-500/20 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-slate-950/[0.03] text-slate-950 rounded-2xl border border-slate-950/5 group-hover:bg-emerald-500/5 group-hover:text-emerald-600 transition-colors">
                                        <LayoutDashboard size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className={`w-3 h-3 rounded-full mt-2 ring-4 ${ultimoRegistro?.tipo === 'entrada' ? 'bg-emerald-500 ring-emerald-500/10 animate-pulse' : 'bg-slate-200 ring-slate-100'}`} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Estado Atual</p>
                                    <p className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                                        {ultimoRegistro?.tipo === 'entrada' ? 'Em Jornada' : 'Em Pausa'}
                                    </p>
                                </div>
                            </div>

                            {/* TILE 3: JORNADA */}
                            <div className="bg-white/60 border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between gap-4 group hover:border-amber-500/20 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.03)] transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-amber-500/5 text-amber-600 rounded-2xl border border-amber-500/5">
                                        <Clock size={22} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tempo Decorrido</p>
                                    <p className="text-2xl font-black text-slate-900 leading-tight tabular-nums tracking-tight">
                                        {cronometroJornada?.texto || '00:00:00'}
                                    </p>
                                </div>
                            </div>
                        </div>

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

/**
 * Card individual de exibição de registros por dia.
 * Otimizado com memo para evitar renderizações desnecessárias pelo relógio principal.
 */
const DayCard = memo(({ dia, registros, hoje }: { dia: Date; registros: RegistroPonto[]; hoje: boolean }) => {
    const temRegistros = registros.length > 0;

    // Ordenação memoizada para performance
    const registrosOrdenados = useMemo(() => {
        return [...registros].sort((a, b) => new Date(a.registrado_em).getTime() - new Date(b.registrado_em).getTime());
    }, [registros]);

    const totalMinutos = useMemo(() => {
        if (!temRegistros) return 0;
        let soma = 0;
        for (let i = 0; i < registrosOrdenados.length; i++) {
            if (registrosOrdenados[i].tipo === 'entrada' && registrosOrdenados[i + 1]?.tipo === 'saida') {
                const entrada = new Date(registrosOrdenados[i].registrado_em);
                const saida = new Date(registrosOrdenados[i + 1].registrado_em);
                soma += Math.floor((saida.getTime() - entrada.getTime()) / (1000 * 60));
                i++; // Pula o par processado
            }
        }
        return soma;
    }, [registrosOrdenados, temRegistros]);

    return (
        <div className={`
            flex flex-col items-center w-full p-5 rounded-2xl border transition-all duration-500 relative group
            ${hoje
                ? 'bg-white border-primary/20 shadow-[0_25px_60px_-15px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/5'
                : 'bg-white/40 border-slate-200/60 hover:bg-white hover:border-slate-300 hover:shadow-xl'
            }
        `}>
            {/* Top Identity Line */}
            {hoje && (
                <div className="absolute top-0 inset-x-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-b-full opacity-60" />
            )}

            {/* Header: Clean Typography */}
            <div className="flex flex-col items-center justify-center w-full mb-6 pt-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${hoje ? 'text-primary' : 'text-slate-400'}`}>
                    {format(dia, 'EEEE', { locale: ptBR }).split('-')[0]}
                </span>
                <div className="relative flex items-center justify-center mb-1">
                    <span className={`text-5xl font-black tabular-nums tracking-tighter transition-all ${hoje ? 'text-slate-900 scale-105' : 'text-slate-200'}`}>
                        {format(dia, 'dd')}
                    </span>
                    {hoje && (
                        <div className="absolute -right-3 -top-1 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)] animate-pulse" />
                    )}
                </div>
                {temRegistros && (
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${hoje ? 'bg-primary/5 border-primary/10 text-primary' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <Timer size={13} strokeWidth={2.5} />
                        <span className="text-[11px] font-black tabular-nums tracking-tight">
                            {formatarHoras(totalMinutos)}
                        </span>
                    </div>
                )}
            </div>

            {/* activity records - chronological log ribbon with internal scroll */}
            <div className="flex flex-col w-full h-[200px] px-1 overflow-y-auto scrollbar-none scroll-smooth">
                {temRegistros ? (
                    <div className="flex flex-col gap-5 py-2">
                        {registrosOrdenados.map((reg, idx, arr) => (
                            <div key={reg.id} className="relative flex items-center gap-3 group/item">
                                {/* Visual Connector */}
                                {idx < arr.length - 1 && (
                                    <div className="absolute left-[7px] top-4 w-[2px] h-7 bg-slate-100/80 rounded-full" />
                                )}
                                
                                {/* Dynamic Node */}
                                <div className={`
                                    w-4 h-4 rounded-full border-2 bg-white z-10 shrink-0 transition-all duration-300
                                    ${reg.tipo === 'entrada' 
                                        ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover/item:shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                                        : 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)] group-hover/item:shadow-[0_0_15px_rgba(244,63,94,0.4)]'}
                                `} />

                                <div className="flex flex-col justify-center">
                                    <span className="text-sm font-black text-slate-800 tabular-nums leading-none">
                                        {format(new Date(reg.registrado_em), 'HH:mm')}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] mt-1 ${reg.tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {reg.tipo}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 border border-dashed border-slate-100 rounded-2xl opacity-30">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">Sem atividade</span>
                    </div>
                )}
            </div>
        </div>
    );
});
 
export default BaterPonto;
