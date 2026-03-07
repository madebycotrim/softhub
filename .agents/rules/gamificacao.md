---
trigger: always_on
---

---
description:
---

# 🎮 GAMIFICAÇÃO — Fábrica de Software
> Implementar apenas após o sistema interno estar completo e funcionando.
> Leia rules.md e rules-contexto.md antes deste arquivo.

---

## Visão geral

A gamificação cobre dois grupos:

- **Usuários do sistema** — membros que usam o sistema no dia a dia (bater ponto, completar tarefas, participar de sprints)
- **Desenvolvedores** — membros que contribuem com o código do projeto (dependente de integração futura com GitHub — não implementar agora)

Esta documentação cobre apenas a gamificação de **usuários**. A gamificação de desenvolvedores fica adiada até a integração com GitHub ser liberada (ver REGRA 14 em rules.md).

---

## Banco de dados — alterações necessárias

### Colunas novas em `usuarios`:
```sql
xp               INTEGER NOT NULL DEFAULT 0,
nivel            TEXT NOT NULL DEFAULT 'Trainee',
streak_atual     INTEGER NOT NULL DEFAULT 0,
streak_maximo    INTEGER NOT NULL DEFAULT 0,
ultima_atividade TEXT    -- data do último dia com atividade válida (ISO 8601 com Z)
```

### Tabela nova: `conquistas` (catálogo — imutável em produção)
```sql
CREATE TABLE conquistas (
  id          TEXT NOT NULL PRIMARY KEY,
  codigo      TEXT NOT NULL UNIQUE,       -- ex: 'PRIMEIRA_TAREFA'
  titulo      TEXT NOT NULL,              -- ex: 'Primeira Tarefa'
  descricao   TEXT NOT NULL,              -- ex: 'Completou a primeira tarefa'
  icone       TEXT NOT NULL,              -- emoji ou nome do ícone Lucide
  xp_bonus    INTEGER NOT NULL DEFAULT 0, -- XP extra ao desbloquear
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
)
```

### Tabela nova: `conquistas_usuarios` (quais badges cada membro desbloqueou)
```sql
CREATE TABLE conquistas_usuarios (
  id            TEXT NOT NULL PRIMARY KEY,
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id),
  conquista_id  TEXT NOT NULL REFERENCES conquistas(id),
  desbloqueado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(usuario_id, conquista_id)  -- nunca duplicar
)
```

> `conquistas_usuarios` é **imutável** — nunca UPDATE ou DELETE. Badge desbloqueado permanece para sempre.

### Migration:
Criar `backend/src/db/migrations/002_gamificacao.sql` com todas as alterações acima + INSERT das conquistas iniciais no catálogo.

---

## Tabela de XP — quanto cada ação vale

| Ação | XP |
|------|----|
| Completar tarefa de prioridade `baixa` | +5 XP |
| Completar tarefa de prioridade `media` | +10 XP |
| Completar tarefa de prioridade `alta` | +20 XP |
| Completar tarefa de prioridade `urgente` | +35 XP |
| Bater ponto (entrada) em dia útil | +5 XP |
| Adicionar comentário em tarefa | +2 XP |
| Sprint encerrada com velocity ≥ planejado | +50 XP para todos os membros da equipe |
| Desbloquear uma conquista | XP bônus definido na conquista |

> XP é concedido **sempre no backend**, junto com a ação que o gerou. Nunca calcular ou conceder XP no frontend.

---

## Tabela de níveis

| Nível | XP necessário |
|-------|--------------|
| Trainee | 0 XP |
| Júnior | 100 XP |
| Pleno | 300 XP |
| Sênior | 600 XP |
| Tech Lead | 1000 XP |

O nível é recalculado e atualizado em `usuarios.nivel` a cada vez que XP é concedido.

```typescript
// servicos/servico-gamificacao.ts
function calcularNivel(xp: number): string {
  if (xp >= 1000) return 'Tech Lead'
  if (xp >= 600)  return 'Sênior'
  if (xp >= 300)  return 'Pleno'
  if (xp >= 100)  return 'Júnior'
  return 'Trainee'
}
```

---

## Streak — regra de cálculo

- Incrementa `streak_atual` em +1 quando o membro **bate ponto E conclui pelo menos 1 tarefa** no mesmo dia útil
- Se passar um dia útil sem as duas condições: `streak_atual` zera (volta para 0)
- `streak_maximo` nunca diminui — guarda o recorde histórico do membro
- `ultima_atividade` é atualizado a cada dia de streak válido

> Sábado, domingo e feriados não contam — streak não zera nem incrementa nesses dias. Implementar lista de feriados nacionais em `utilitarios/feriados.ts`.

---

## Catálogo de conquistas iniciais

Inserir via migration. Adicionar novas conquistas sempre via migration — nunca hardcoded no código.

| Código | Título | Descrição | Ícone | XP Bônus |
|--------|--------|-----------|-------|----------|
| `PRIMEIRA_TAREFA` | Primeira Tarefa | Completou a primeira tarefa | 🎯 | 20 XP |
| `STREAK_7` | Em Chamas | 7 dias seguidos de streak | 🔥 | 50 XP |
| `STREAK_30` | Inabalável | 30 dias seguidos de streak | 💎 | 200 XP |
| `SPRINT_PERFEITA` | Sprint Perfeita | Sprint encerrada com 100% das tarefas concluídas | ⚡ | 100 XP |
| `TOP_EQUIPE` | Top da Equipe | Maior XP da equipe em um mês | 🏆 | 75 XP |
| `PONTUAL_30` | Pontual | 30 dias batendo ponto sem falha | ⏰ | 100 XP |
| `TAREFAS_10` | Produtivo | Completou 10 tarefas | 📦 | 30 XP |
| `TAREFAS_50` | Veterano | Completou 50 tarefas | 🧠 | 100 XP |
| `URGENTE_5` | Bombeiro | Completou 5 tarefas urgentes | 🚒 | 80 XP |
| `COMENTARISTA` | Colaborador | Fez 20 comentários em tarefas | 💬 | 40 XP |
| `CHECKLIST_10` | Organizado | Concluiu 10 checklists completos | ✅ | 30 XP |

---

## Serviço de gamificação — backend

Criar `backend/src/servicos/servico-gamificacao.ts` com três funções:

```typescript
/**
 * Concede XP ao usuário, recalcula nível e verifica conquistas desbloqueadas.
 * Chamar após toda ação que gera XP — nunca chamar do frontend.
 */
async function concederXP(
  db: D1Database,
  usuarioId: string,
  quantidade: number,
  motivo: string  // ex: 'TAREFA_CONCLUIDA_URGENTE'
): Promise<void>

/**
 * Verifica e atualiza o streak do usuário com base na data atual.
 * Chamar ao registrar ponto (entrada) e ao concluir tarefa.
 */
async function atualizarStreak(
  db: D1Database,
  usuarioId: string
): Promise<void>

/**
 * Verifica se o usuário desbloqueou alguma conquista nova e registra.
 * Chamar após concederXP — nunca chamar isoladamente.
 */
async function verificarConquistas(
  db: D1Database,
  usuarioId: string
): Promise<void>
```

### Onde chamar cada função:

| Onde | O que chamar |
|------|-------------|
| `rotas/tarefas.ts` — ao mover para `concluido` | `concederXP()` + `atualizarStreak()` + `verificarConquistas()` |
| `rotas/ponto.ts` — ao registrar entrada | `concederXP()` + `atualizarStreak()` + `verificarConquistas()` |
| `rotas/sprints.ts` — ao encerrar sprint com velocity ≥ planejado | `concederXP()` para cada membro da equipe + `verificarConquistas()` |
| `rotas/tarefas.ts` — ao criar comentário | `concederXP()` + `verificarConquistas()` |

---

## Rotas de gamificação — backend

Adicionar em `rotas/gamificacao.ts`:

```
GET  /api/gamificacao/ranking?tipo=equipe&mes=2025-03   → ranking mensal por XP
GET  /api/gamificacao/conquistas                         → catálogo completo de badges
GET  /api/usuarios/:id/gamificacao                       → XP, nível, streak, badges do membro
```

---

## Interface — onde a gamificação aparece

### Barra lateral
- Abaixo do avatar do usuário logado: nível atual + barra de progresso para o próximo nível
- Ex: `Pleno · 420/600 XP ████████░░`

### Perfil do membro (`PerfilMembro.tsx`)
- Card de gamificação com: nível, XP total, streak atual 🔥, streak máximo
- Grade de badges desbloqueados com tooltip descrevendo cada conquista
- Badges bloqueados aparecem em cinza (sem revelar o nome — o usuário descobre ao conquistar)

### Diretório de membros (`DiretorioMembros.tsx`)
- Badge de nível ao lado do avatar: `<Emblema texto="Pleno" variante="azul" />`
- Ícone de streak se streak_atual ≥ 7: 🔥

### Kanban — card da tarefa (`CartaoTarefa.tsx`)
- Mini avatar do responsável com nível embaixo

### Dashboard (`PaginaDashboard.tsx`)
- Card de ranking mensal da equipe por XP (top 5)
- Usar `GRAFICO_COR_PRIMARIA` e `GRAFICO_COR_SUCESSO` — nunca inventar outras cores

### Notificação automática ao desbloquear conquista
- Criar via `criarNotificacoes()` no backend ao registrar em `conquistas_usuarios`
- Tipo: `'sistema'`
- Título: `'Conquista desbloqueada!'`
- Mensagem: `'Você desbloqueou "${conquista.titulo}" e ganhou ${conquista.xp_bonus} XP bônus!'`

---

## Hook de gamificação — frontend

Criar `frontend/src/funcionalidades/gamificacao/usarGamificacao.ts`:
```typescript
// Busca XP, nível, streak e badges do usuário logado
// Usar no PerfilMembro e na BarraLateral
function usarGamificacao(usuarioId: string) {
  // retorna: { xp, nivel, streakAtual, streakMaximo, badges, carregando, erro }
}
```

Criar `frontend/src/funcionalidades/gamificacao/usarRanking.ts`:
```typescript
// Busca ranking mensal da equipe por XP
// Usar no Dashboard
function usarRanking(mes: string) {
  // retorna: { ranking, carregando, erro }
}
```

---

## Regras de negócio importantes

```
✅ XP concedido sempre no backend — nunca no frontend
✅ Badge desbloqueado é permanente — conquistas_usuarios é imutável
✅ streak_maximo nunca diminui — apenas cresce
✅ Nível atualizado automaticamente ao conceder XP
✅ Conquista notifica o membro via sistema de notificações
✅ Ranking é mensal — não acumulado (evita desmotivação de quem entra depois)
❌ Nunca remover XP do usuário
❌ Nunca deletar ou atualizar registros em conquistas_usuarios
❌ Nunca calcular nível no frontend — buscar sempre do banco
❌ Não exibir badges bloqueados com nome/descrição — só silhueta cinza
```

---

## Checklist antes de entregar gamificação

```
[ ] Migration 002_gamificacao.sql criada e testada localmente?
[ ] Catálogo de conquistas inserido via migration (não hardcoded)?
[ ] concederXP() chamado nas rotas certas?
[ ] atualizarStreak() chamado ao bater ponto e ao concluir tarefa?
[ ] verificarConquistas() chamado após concederXP()?
[ ] Notificação criada ao desbloquear conquista?
[ ] Ranking mensal funcionando?
[ ] Gamificação aparece em: barra lateral, perfil, diretório, kanban, dashboard?
[ ] Badges bloqueados aparecem em cinza sem revelar nome?
[ ] Nenhum cálculo de XP ou nível feito no frontend?
```