import { Hono } from 'hono';
import { cors } from 'hono/cors';
import rotasUsuarios from './rotas/usuarios';
import rotasTarefas from './rotas/tarefas';
import rotasTarefasDetalhes from './rotas/tarefas-detalhes';
import rotasSprints from './rotas/sprints';
import rotasPonto from './rotas/ponto';
import rotasPontoJustificativas from './rotas/ponto-justificativas';
import rotasAvisos from './rotas/avisos';
import rotasDashboard from './rotas/dashboard';
import rotasLogs from './rotas/logs';
import rotasAuth from './rotas/auth';
import rotasAuthQr from './rotas/auth-qr';
import rotasOrganizacao from './rotas/organizacao';
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
const origemPermitida = (origin: string): string | null => {
    // Permite qualquer localhost/127.0.0.1 em desenvolvimento
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return origin;
    }
    // Produção: adicione aqui os domínios permitidos
    const permitidos = ['https://seu-frontend.pages.dev'];
    return permitidos.includes(origin) ? origin : null;
};

app.use('*', cors({
    origin: origemPermitida,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ─── Erro global ──────────────────────────────────────────────────────────────

app.onError(lidarExcecao);

// ─── Rotas ────────────────────────────────────────────────────────────────────

app.route('/api/auth',      rotasAuth);
app.route('/api/auth',      rotasAuthQr);
app.route('/api/usuarios',  rotasUsuarios);
app.route('/api/tarefas',   rotasTarefas);
app.route('/api/tarefas',   rotasTarefasDetalhes);
app.route('/api/sprints',   rotasSprints);
app.route('/api/ponto',     rotasPonto);
app.route('/api/ponto',     rotasPontoJustificativas);
app.route('/api/avisos',    rotasAvisos);
app.route('/api/dashboard', rotasDashboard);
app.route('/api/logs',      rotasLogs);
app.route('/api/organizacao', rotasOrganizacao);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/', (c) => c.json({ mensagem: 'API Fábrica de Software Operacional', status: 'OK' }));

export default app;