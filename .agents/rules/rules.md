---
trigger: always_on
---

---
trigger: always_on
---

# 📏 RULES — Fábrica de Software
> Regras absolutas. Leia este arquivo antes de qualquer tarefa, sem exceção.
> Checklist de entrega está no final deste arquivo.

---

## REGRA 1 — Língua: Português do Brasil em tudo

### Use PT-BR em:
- Variáveis → `const nomeUsuario`, `let tarefaAtiva`
- Funções → `function buscarTarefas()`, `async function registrarPonto()`
- Componentes → `CartaoTarefa`, `BarraLateral`, `ModalConfirmacao`
- Hooks → `usarAutenticacao`, `usarTarefas`, `usarPonto`
- Arquivos → `servico-logs.ts`, `PainelLogs.tsx`
- Pastas → `funcionalidades/`, `compartilhado/`, `configuracoes/`
- Comentários, JSDoc, labels, placeholders, mensagens de erro na UI
- Tipos e interfaces → `interface DadosTarefa`, `type StatusKanban`
- Mensagens de commit → `feat: adiciona kanban`, `fix: corrige ponto`

### Exceções — mantenha em inglês:
`props`, `state`, `hook`, `token`, `payload`, `middleware`, `deploy`, `build`, `fetch`, `callback`, `boolean`, `string`, `number`, `null`, `undefined`, `true`, `false`

---

## REGRA 2 — Nomenclatura de arquivos e pastas

```
Componentes React:   PascalCase   → CartaoTarefa.tsx, ModalConfirmacao.tsx
Hooks:               camelCase    → usarKanban.ts, usarPonto.ts
Serviços/utilitários: kebab-case → servico-logs.ts, formatadores.ts
Rotas backend:       kebab-case  → rotas/tarefas.ts, rotas/ponto.ts
Pastas:              kebab-case  → funcionalidades/, compartilhado/
```

---

## REGRA 3 — Stack aprovada (não instalar nada fora desta lista)

```
Frontend:    React 19 + Vite + TypeScript
Estilização: Tailwind CSS v4 + shadcn/ui
DnD:         @dnd-kit/core + @dnd-kit/sortable
Auth:        MSAL.js (@azure/msal-browser + @azure/msal-react)
Roteamento:  React Router v7
Estado:      useState + useEffect + Context (SÓ autenticação)
Formulários: React Hook Form + Zod
Gráficos:    Recharts
Datas:       date-fns (com locale ptBR)
Ícones:      Lucide React
Backend:     Cloudflare Workers + Hono
Banco:       Cloudflare D1 (SQLite na edge)
Hospedagem:  Cloudflare Pages + Workers
```

---

## REGRA 4 — Gerenciamento de estado

| Situação | Solução |
|----------|---------|
| Dados da sessão (usuário logado, token) | React Context — `ContextoAutenticacao` |
| Dados de qualquer tela/módulo | `useState` + `useEffect` no componente |
| Dados complexos de um módulo | Hook customizado (ex: `usarKanban`) |
| Formulários | React Hook Form + Zod |
| Preferência dark/light | `localStorage` |

**Um hook não deve misturar lógica de módulos diferentes.**
Ex: `usarKanban` não deve buscar dados de ponto. Crie hooks separados.

### Proibido para sempre:
```
❌ Zustand / Redux / MobX / Jotai / Recoil
❌ Qualquer store global fora do ContextoAutenticacao
```

> **Motivo:** iniciantes tendem a colocar tudo no estado global quando não precisam.
> `useState` + hooks customizados resolve todos os casos deste projeto.

---

## REGRA 5 — Tratamento de erros no frontend

Todo componente que busca dados deve tratar os três estados obrigatoriamente:

```typescript
if (carregando) return <Carregando />
if (erro) return <p className="text-red-400 text-center py-8">{erro}</p>
if (dados.length === 0) return <EstadoVazio titulo="Nenhum dado encontrado" />
```

- Mensagens de erro sempre em PT-BR e amigáveis ao usuário
- Nunca exibir mensagem técnica da API diretamente na UI
- Erros de notificações devem ser silenciados (não travar a UI)
- Sempre usar `finally` para parar o loading, mesmo quando há erro

---

## REGRA 6 — IDs: sempre UUID

```typescript
// ✅ CERTO
const id = crypto.randomUUID()

// ❌ ERRADO — nunca INTEGER AUTOINCREMENT
```

No banco: `id TEXT PRIMARY KEY` — nunca autoincrement.

---

## REGRA 7 — Banco de dados

- IDs sempre `TEXT` com UUID
- Datas sempre `TEXT` via `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')` — gera ISO 8601 com sufixo `Z` explícito (UTC)
- `tarefa_historico` e `logs` são **imutáveis** — nunca `UPDATE` ou `DELETE`
- Soft delete obrigatório: `ativo = 0` ou `status = 'arquivado'` — nunca `DELETE`
- Sempre **prepared statements** — nunca interpolação de string em SQL
- Migrations são irreversíveis — nunca editar arquivo já executado, sempre criar novo

---

## REGRA 8 — Segurança

- Secrets **sempre** em variáveis de ambiente, nunca no código
- Verificação de **role sempre no backend** — frontend só esconde por UX
- Verificação de **IP do ponto sempre no backend** — frontend só desabilita botão
- Verificação de **domínio @unieuro.edu.br** no backend também, não só no frontend
- Nunca logar token, senha ou dado sensível
- HTTPS obrigatório em produção (Cloudflare cuida)

---

## REGRA 9 — Código simples e didático

Projeto desenvolvido por **estudantes iniciantes**. Clareza vale mais que elegância.

- Funções pequenas: uma responsabilidade, idealmente até 30 linhas
- Nomes descritivos: o nome revela o propósito sem ler o corpo
- Comentários explicam o **PORQUÊ**, não o que o código faz
- Sem abstrações desnecessárias: se uma função resolve, não crie uma classe
- **JSDoc obrigatório** em toda função, hook e componente

---

## REGRA 10 — Notificações: sempre no backend

Notificações criadas **SEMPRE no backend** via `criarNotificacoes()`.
Frontend apenas lê e marca como lida. **Nunca criar notificação no frontend.**

---

## REGRA 11 — Logs: registrar toda ação de negócio

Toda ação relevante chama `registrarLog()` no backend.
A tabela `logs` é **imutável** — nunca `UPDATE` ou `DELETE`.

---

## REGRA 12 — Hierarquia de roles

```
ADMIN > LIDER_GRUPO > LIDER_EQUIPE > MEMBRO > VISITANTE
```

| Role | Pode fazer |
|------|-----------|
| `ADMIN` | Tudo |
| `LIDER_GRUPO` | Tudo do seu Grupo |
| `LIDER_EQUIPE` | Tarefas e membros da sua equipe |
| `MEMBRO` | Próprio perfil, tarefas atribuídas, bater ponto |
| `VISITANTE` | Apenas portfolio público |

---

## REGRA 13 — Regras específicas por módulo

**Kanban:** tarefa sem `sprint_id` fica só no backlog. Nunca deletar tarefas. Todo movimento registra em `tarefa_historico`. Máximo uma sprint ativa por projeto. Filtros por status, prioridade, responsável e busca por texto.

**Comentários:** qualquer membro autenticado pode comentar em tarefas. Autor pode editar/remover o próprio. `LIDER_EQUIPE` ou acima pode remover qualquer um. Notificar responsáveis e quem já comentou — excluir o autor da lista. Tabela `comentarios_tarefa` usa soft delete.

**Checklist:** itens informativos dentro de tarefas — não bloqueiam movimentação. Qualquer membro pode marcar/desmarcar. Apenas `LIDER_EQUIPE` ou acima adiciona/remove itens. Progresso exibido no card do kanban.

**Ponto:** verificação de IP obrigatória no backend. Não permitir duas entradas ou duas saídas seguidas. Confirmar IPs reais com o TI antes do deploy. Justificativas de ponto aprovadas por `LIDER_EQUIPE` ou acima.

**Portfolio:** rota `/api/projetos/publicos` é pública. Projeto aparece só com `publico = 1`. Apenas `ADMIN` e `LIDER_GRUPO` publicam/despublicam.

**Membros:** primeiro login cria com `role = 'MEMBRO'`. Só `ADMIN` altera role. Desativados têm `ativo = 0` — nunca deletar. Primeiro ADMIN definido via variável de ambiente `BOOTSTRAP_ADMIN_EMAIL` (ver Workflow 28).

**Equipes e Grupos:** membro pertence a apenas UMA equipe por vez. Ao trocar de equipe, atualizar `usuarios.equipe_id`. Desativar grupo desativa todas as equipes do grupo. Apenas `LIDER_GRUPO` ou `ADMIN` cria/edita grupos e equipes.

**Avisos:** apenas `LIDER_EQUIPE`, `LIDER_GRUPO` e `ADMIN` criam avisos. Expirados não aparecem. Só criador, líderes superiores ou `ADMIN` removem.

---

## REGRA 14 — O que NÃO implementar (decisões adiadas)

```
❌ Integração com GitHub
❌ Notificações por email
❌ App mobile
❌ Exportação em PDF (exportação CSV já está implementada — ver Workflow 30)
❌ WebSocket (polling a cada 30s resolve)
❌ Multi-tenant
❌ Upload de arquivos (use links externos)
❌ Gamificação (XP, níveis, ranking e conquistas)
```

---

---

## CHECKLIST FINAL — Antes de entregar qualquer código

```
[ ] Todos os nomes em PT-BR (exceto exceções técnicas)?
[ ] Nomenclatura de arquivos correta (PascalCase / kebab-case)?
[ ] Tem JSDoc na função/hook/componente?
[ ] Hook tem apenas uma responsabilidade de módulo?
[ ] Estado gerenciado só com useState/useEffect/Context?
[ ] IDs são UUID (crypto.randomUUID())?
[ ] Verificação de permissão está no backend?
[ ] Nenhum secret hardcoded?
[ ] Prepared statements em todas as queries SQL?
[ ] Log registrado para a ação de negócio?
[ ] Notificação criada se o evento exige?
[ ] tarefa_historico atualizado se campo de tarefa foi alterado?
[ ] Soft delete em vez de DELETE no banco?
[ ] Formulário usa <form onSubmit> com handleSubmit do React Hook Form?
[ ] Três estados tratados no frontend (carregando, erro, vazio)?
[ ] Mensagem de erro amigável em PT-BR na UI?
[ ] Nenhuma notificação criada no frontend?
[ ] Comentários notificam responsáveis e quem já comentou (sem duplicatas, sem notificar o autor)?
[ ] Justificativa de ponto notifica líder ao enviar e membro ao processar?
[ ] Exportação CSV gerada no backend — nunca no frontend?
[ ] Bootstrap do primeiro ADMIN via variável de ambiente (não hardcoded)?
```