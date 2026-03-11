import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { rateLimiter } from 'hono-rate-limiter';
import rotasUsuarios from './rotas/usuarios';
import rotasTarefas from './rotas/tarefas';
import rotasTarefasDetalhes from './rotas/tarefas-detalhes';
import rotasPonto from './rotas/ponto';
import rotasPontoJustificativas from './rotas/ponto-justificativas';
import rotasAvisos from './rotas/avisos';
import rotasDashboard from './rotas/dashboard';
import rotasLogs from './rotas/logs';
import rotasAuth from './rotas/auth';
import rotasAuthQr from './rotas/auth-qr';

import rotasConfiguracoes from './rotas/configuracoes';
import rotasRelatorios from './rotas/relatorios';
import rotasEquipes from './rotas/equipes';
import rotasNotificacoes from './rotas/notificacoes';
import rotasIA from './rotas/ia';
import { lidarExcecao } from './middleware/erros';

export type Env = {
    DB: D1Database;
    JWT_SECRET: string;
    MSAL_TENANT_ID: string;
    MSAL_CLIENT_ID: string;
    DOMINIO_INSTITUCIONAL: string;
    BOOTSTRAP_ADMIN_EMAIL: string;
    SESSOES_QR: KVNamespace;
    SISTEMA_KV: KVNamespace;
    AI: any;
};

const app = new Hono<{ Bindings: Env }>();

// ─── CORS (DEVE ser o primeiro middleware) ────────────────────────────────────
// CORS precisa rodar ANTES de tudo para que respostas de erro (429, 503)
// também incluam os headers Access-Control-Allow-Origin, senão o navegador bloqueia.

app.use('*', cors({
    origin: (origin) => {
        // Permite localhost e qualquer subdomínio do projeto no Cloudflare
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin.includes('madebycotrim') || origin.includes('pages.dev')) {
            return origin;
        }
        return null; // Bloqueia outros
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ─── Rate Limiter Global ──────────────────────────────────────────────────────
// 120 req/min por IP (acomoda polling do QR Code a cada 800ms ≈ 75 req/min)
// Inicialização lazy para evitar operações assíncronas no escopo global
// (Cloudflare Workers proíbe setTimeout/crypto fora de handlers)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _limiteGlobal: any = null;

app.use("*", (c, next) => {
    if (!_limiteGlobal) {
        _limiteGlobal = rateLimiter({
            windowMs: 60 * 1000, 
            limit: 300, 
            standardHeaders: "draft-6",
            keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "",
            message: { erro: "Muitas requisições. O sistema identificou spam." }
        });
    }
    return _limiteGlobal(c, next);
});

// ─── Modo de Manutenção (WF 21) ────────────────────────────────────────────────
app.use('*', async (c, next) => {
    const { SISTEMA_KV } = c.env;
    const emManutencao = await SISTEMA_KV.get('MODO_MANUTENCAO');
    
    // Ignora bloqueio para a própria rota de manutenção (se houver) ou para o path de login para admins
    if (emManutencao === 'true' && !c.req.path.includes('/auth') && !c.req.path.includes('/configuracoes')) {
        return c.json({ 
            erro: 'Sistema em manutenção programada.',
            detalhe: 'Estamos realizando melhorias. Voltamos em breve!' 
        }, 503);
    }
    await next();
});

// ─── Erro global ──────────────────────────────────────────────────────────────

app.onError(lidarExcecao);

// ─── Rotas ────────────────────────────────────────────────────────────────────

app.route('/api/auth', rotasAuth);
app.route('/api/auth', rotasAuthQr);
app.route('/api/usuarios', rotasUsuarios);
app.route('/api/tarefas', rotasTarefas);
app.route('/api/tarefas', rotasTarefasDetalhes);
app.route('/api/ponto', rotasPonto);
app.route('/api/ponto', rotasPontoJustificativas);
app.route('/api/avisos', rotasAvisos);
app.route('/api/dashboard', rotasDashboard);
app.route('/api/logs', rotasLogs);

app.route('/api/configuracoes', rotasConfiguracoes);
app.route('/api/relatorios', rotasRelatorios);
app.route('/api/equipes', rotasEquipes);
app.route('/api/notificacoes', rotasNotificacoes);
app.route('/api/ia', rotasIA);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/', (c) => c.json({
    status: 'ok',
    servico: 'Fábrica de Software',
    versao: '1.0.0',
    timestamp: new Date().toISOString(),
}));

export default app;