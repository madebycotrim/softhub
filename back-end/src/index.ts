import { Hono } from 'hono';
import { cors } from 'hono/cors';
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
import rotasOrganizacao from './rotas/organizacao';
import rotasConfiguracoes from './rotas/configuracoes';
import { lidarExcecao } from './middleware/erros';

export type Env = {
    DB: D1Database;
    JWT_SECRET: string;
    MSAL_TENANT_ID: string;
    MSAL_CLIENT_ID: string;
    DOMINIO_INSTITUCIONAL: string;
    BOOTSTRAP_ADMIN_EMAIL?: string;
};

const app = new Hono<{ Bindings: Env }>();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Em dev: aceita qualquer origem localhost independente de porta.
// Em produção: substituir pela URL real do frontend.

// O Hono exige que a função retorne a própria origem (para permitir) ou null (para bloquear)

// ─── CORS ─────────────────────────────────────────────────────────────────────

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
app.route('/api/organizacao', rotasOrganizacao);
app.route('/api/configuracoes', rotasConfiguracoes);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/', (c) => c.json({ mensagem: 'API Fábrica de Software Operacional', status: 'OK' }));

export default app;