---
trigger: always_on
---

# 🗂️ CONTEXTO DO PROJETO — Fábrica de Software
> Estrutura de pastas, layout compartilhado, componentes reutilizáveis,
> serviço de API e formatadores. Leia rules.md antes deste arquivo.

---

## Estrutura de Pastas — Frontend

```
frontend/src/
├── funcionalidades/          ← cada módulo tem sua própria pasta
│   ├── autenticacao/         → TelaLogin.tsx, usarAutenticacao.ts
│   ├── kanban/               → QuadroKanban.tsx, CartaoTarefa.tsx, usarKanban.ts
│   ├── backlog/              → ListaBacklog.tsx, PainelSprints.tsx, usarBacklog.ts
│   ├── ponto/                → BaterPonto.tsx, HistoricoPonto.tsx, usarPonto.ts
│   ├── membros/              → DiretorioMembros.tsx, PerfilMembro.tsx, usarMembros.ts
│   ├── avisos/               → MuralAvisos.tsx, FormularioAviso.tsx, usarAvisos.ts
│   ├── dashboard/            → PaginaDashboard.tsx, GraficoBurndown.tsx, usarDashboard.ts
│   ├── portfolio/            → PaginaPortfolio.tsx, CartaoProjeto.tsx, usarProjetos.ts
│   └── admin/                → GerenciarMembros.tsx, PainelLogs.tsx, usarLogs.ts
│
├── compartilhado/            ← reutilizável em qualquer módulo
│   ├── componentes/
│   │   ├── LayoutPrincipal.tsx     ← estrutura com header + sidebar + conteúdo
│   │   ├── CabecalhoPagina.tsx     ← header com notificações, avatar e tema
│   │   ├── BarraLateral.tsx        ← navegação lateral
│   │   ├── Avatar.tsx              ← foto ou iniciais do membro
│   │   ├── Emblema.tsx             ← badge colorido de status/role
│   │   ├── Modal.tsx               ← modal genérico reutilizável
│   │   ├── ConfirmacaoExclusao.tsx ← modal de confirmação de ação destrutiva
│   │   ├── Carregando.tsx          ← spinner de carregamento
│   │   └── EstadoVazio.tsx         ← tela quando não há dados
│   ├── hooks/
│   │   ├── usarNotificacoes.ts     ← polling de notificações (30s)
│   │   └── usarPermissao.ts        ← verifica role no frontend (só UX)
│   └── servicos/
│       └── api.ts                  ← axios com base URL e interceptors
│
├── utilitarios/
│   ├── formatadores.ts       ← datas, horas, texto
│   ├── constantes.ts         ← colunas kanban, cores, labels
│   └── tema.ts               ← dark/light mode
│
├── contexto/
│   └── ContextoAutenticacao.tsx    ← ÚNICO contexto global permitido
│
└── configuracoes/
    ├── rotas.tsx             ← todas as rotas em um lugar
    ├── RotaProtegida.tsx     ← verifica autenticação + role
    ├── msal.ts               ← configuração MSAL.js
    └── ambiente.ts           ← variáveis de ambiente tipadas
```

---

## Estrutura de Pastas — Backend

```
backend/src/
├── rotas/          → usuarios.ts, tarefas.ts, sprints.ts, ponto.ts, avisos.ts, logs.ts
├── middleware/     → auth.ts, rede.ts, middleware-logs.ts
├── servicos/       → servico-logs.ts, servico-notificacoes.ts, servico-historico.ts
├── db/
│   ├── schema.sql
│   └── migrations/ → 001_tabelas_base.sql, 002_criar_tabela_logs.sql ...
└── index.ts        ← entrada do Worker, registra todas as rotas
```

---

## Layout Compartilhado

**Regra:** todas as páginas internas usam `LayoutPrincipal`.
Nunca recriar header, sidebar ou estrutura de página do zero.

```tsx
// compartilhado/componentes/LayoutPrincipal.tsx
// Envolve todo conteúdo interno da aplicação

export default function LayoutPrincipal({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <BarraLateral />
      <div className="flex flex-col flex-1 overflow-hidden">
        <CabecalhoPagina />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

```tsx
// Uso em qualquer página interna:
export default function PaginaKanban() {
  return (
    <LayoutPrincipal>
      <QuadroKanban />
    </LayoutPrincipal>
  )
}
```

---

## Componentes Compartilhados

### Avatar
```tsx
// Exibe foto do membro ou iniciais como fallback
interface AvatarProps {
  nome: string
  fotoPerfil: string | null
  tamanho?: 'sm' | 'md' | 'lg'  // sm=24px md=32px lg=40px
}
// Uso: <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="md" />
```

### ConfirmacaoExclusao
```tsx
// Modal de confirmação para ações destrutivas (arquivar, remover, desativar)
interface ConfirmacaoExclusaoProps {
  aberto: boolean
  aoFechar: () => void
  aoConfirmar: () => void
  titulo: string
  descricao: string
  textoBotao?: string   // padrão: 'Confirmar'
  carregando?: boolean
}
// Uso: <ConfirmacaoExclusao aberto={confirmar} aoFechar={() => setConfirmar(false)}
//        aoConfirmar={arquivarTarefa} titulo="Arquivar tarefa?"
//        descricao="Esta ação não pode ser desfeita." />
```

### Modal (genérico — usar para tudo)
```tsx
// Nunca criar modal inline no componente — sempre usar este
interface ModalProps {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  children: React.ReactNode
  largura?: 'sm' | 'md' | 'lg'  // padrão: 'md'
}
// Uso: <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Criar Tarefa">
//        <FormularioCriarTarefa />
//      </Modal>
```

### Emblema (badge colorido)
```tsx
// Para status, roles, prioridades, módulos, etc.
type VarianteEmblema = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'cinza'
// Uso: <Emblema texto="Em Andamento" variante="azul" />
//      <Emblema texto="Urgente" variante="vermelho" />
```

---

## Serviço de API (`compartilhado/servicos/api.ts`)

> **Frontend usa axios** — interceptors simplificam token e erros para iniciantes.
> **Backend usa fetch nativo** — Cloudflare Workers já tem fetch global, sem dependência extra.

```typescript
import axios from 'axios'
import { ambiente } from '../../configuracoes/ambiente'

export const api = axios.create({ baseURL: ambiente.apiUrl })

// Adiciona token automaticamente em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_acesso')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redireciona para login se token expirar (401)
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) window.location.href = '/login'
    return Promise.reject(erro)
  }
)
```

### Como usar a API nos hooks:
```typescript
// GET com query params
api.get('/tarefas', { params: { sprintId, pagina: 1 } })

// POST com body
api.post('/tarefas', { titulo, projetoId, prioridade })

// PATCH parcial
api.patch(`/tarefas/${id}/mover`, { colunaDestino })

// DELETE
api.delete(`/avisos/${id}`)
```

---

## Formatadores de Data e Hora

```typescript
// utilitarios/formatadores.ts — sempre importar daqui, nunca formatar inline

formatarDataHora('2025-03-05T14:30:00')   // → "05/03/25 às 14:30"
formatarDataRelativa('2025-03-05T14:30:00') // → "hoje" | "ontem" | "5 de março"
formatarTempoAtras('2025-03-05T14:30:00')  // → "há 5 minutos" | "há 2 horas"
formatarHoras(125)                          // → "2h 5min"
```

---

## Variáveis de Ambiente

### Frontend (`frontend/.env`):
```env
VITE_MSAL_CLIENT_ID=        # pegar com TI da UNIEURO
VITE_MSAL_TENANT_ID=        # pegar com TI da UNIEURO
VITE_API_URL=               # URL do Worker (ex: https://fabrica-api.workers.dev)
VITE_DOMINIO_INSTITUCIONAL=unieuro.edu.br
```

### Acessar no código:
```typescript
// configuracoes/ambiente.ts — nunca acessar import.meta.env diretamente
import { ambiente } from '../../configuracoes/ambiente'
ambiente.apiUrl      // URL da API
ambiente.msalClientId
```

---

## Comandos Úteis

```bash
# Frontend
npm run dev          # desenvolvimento local (http://localhost:5173)
npm run build        # build para produção

# Backend
wrangler dev         # desenvolvimento local (http://localhost:8787)
wrangler deploy      # deploy para produção
wrangler tail        # logs em tempo real

# Banco D1
wrangler d1 execute fabrica-db --file=src/db/migrations/001_tabelas_base.sql
wrangler d1 execute fabrica-db --command="SELECT * FROM usuarios LIMIT 5"
```