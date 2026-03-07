---
description: 
---

---
description: 
---

# ⚙️ WORKFLOWS PARTE 2 — Fábrica de Software
> Leia rules.md antes deste arquivo. Fluxos 8 a 16.
> Ver workflows-01.md para os fluxos 0 a 7.

---

## WORKFLOW 8 — Mover card no kanban

### Backend:
```
1. Buscar tarefa atual no banco
2. Verificar permissão:
   - MEMBRO → só suas próprias tarefas
   - LIDER_EQUIPE → tarefas da sua equipe
   - LIDER_GRUPO / ADMIN → qualquer tarefa
3. UPDATE tarefas SET status = ?, atualizado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
4. INSERT em tarefa_historico (IMUTÁVEL — nunca UPDATE ou DELETE)
5. Registrar log com acao: 'TAREFA_MOVIDA'
6. Se colunaDestino = 'em_revisao': notificar líder da equipe
```

### Frontend:
```
1. Chamar moverCard(tarefaId, novaColuna) do hook usarKanban
2. Optimistic update: atualizar estado local imediatamente
3. Sincronizar com a API via PATCH /tarefas/:id/mover
4. Se a API falhar: reverter estado e exibir erro
```

### ❌ Erros comuns:
```
- Não registrar em tarefa_historico após mover
- Fazer optimistic update sem reverter em caso de falha
- Não verificar permissão por role no backend
```

---

## WORKFLOW 9 — Registrar ponto

### Backend:
```
1. Extrair IP via header CF-Connecting-IP
2. Verificar rede: estaNaRedeUnieuro(c.req.raw)
3. Se fora da rede:
   - registrarLog com status 'aviso', acao: 'PONTO_FORA_DA_REDE'
   - retornar 403: 'Ponto só pode ser registrado na rede da UNIEURO.'
4. Validar tipo ('entrada' ou 'saida')
5. Buscar último registro do dia:
   const ultimo = await c.env.DB.prepare(`
     SELECT tipo FROM registros_ponto
     WHERE usuario_id = ? AND DATE(registrado_em) = ?
     ORDER BY registrado_em DESC LIMIT 1
   `).bind(usuarioId, dataHoje).first()
6. Se ultimo?.tipo === tipo solicitado: retornar 400 (sequência inválida)
7. INSERT INTO registros_ponto (id, usuario_id, tipo, ip_origem)
8. registrarLog com acao: 'PONTO_ENTRADA' ou 'PONTO_SAIDA'
9. Retornar 201 com { id, tipo, registrado_em }
```

### Frontend:
```
1. Desabilitar botão se erro contiver 'rede da UNIEURO' (só UX)
2. Exibir aviso visual separado para erro de rede
3. Após sucesso: recarregar histórico e horas do dia
```

### ❌ Erros comuns:
```
- Fazer a verificação de IP só no frontend
- Não registrar log quando tentativa é fora da rede
- Não validar sequência entrada/saída no backend
```

---

## WORKFLOW 10 — Criar sprint

```
1. Verificar role: apenas LIDER_GRUPO ou ADMIN
2. Verificar se já existe sprint ativa no projeto:
   SELECT id FROM sprints WHERE projeto_id = ? AND status = 'ativa'
   Se existir: retornar 400 'Já existe uma sprint ativa neste projeto.'
3. INSERT INTO sprints (id, projeto_id, nome, objetivo, velocity_planejado, criado_por)
4. registrarLog com acao: 'SPRINT_CRIADA', modulo: 'backlog'
5. Retornar 201 com { id }
```

---

## WORKFLOW 11 — Encerrar sprint

```
1. Verificar role: apenas LIDER_GRUPO ou ADMIN
2. Buscar sprint ativa: WHERE id = ? AND status = 'ativa'
3. Se não encontrada: retornar 404
4. Mover tarefas incompletas para o backlog:
   UPDATE tarefas SET sprint_id = NULL, status = 'backlog'
   WHERE sprint_id = ? AND status IN ('a_fazer','em_andamento','em_revisao','testando')
5. Calcular velocity: SELECT SUM(pontos) FROM tarefas
   WHERE sprint_id = ? AND status = 'concluido'
6. Atualizar sprint: status='encerrada', encerrada_em, velocity_realizado
7. INSERT INTO retrospectivas com dados recebidos no body
8. Criar notificações para todos os membros do projeto (todosDoProjetoId)
9. registrarLog com acao: 'SPRINT_ENCERRADA'
10. Retornar { sucesso: true, velocityRealizado }
```

---

## WORKFLOW 12 — Criar aviso

```
1. Verificar role: apenas LIDER_EQUIPE, LIDER_GRUPO ou ADMIN
2. Receber: titulo, conteudo, prioridade, grupoId?, equipeId?, expiraEm?
3. INSERT INTO avisos (id, titulo, conteudo, prioridade, grupo_id, equipe_id, criado_por, expira_em)
4. Criar notificações:
   - Se equipeId: notificar equipeId
   - Se grupoId: notificar grupoId
   - Se nenhum: notificar todos (sem destinatário específico = aviso global)
5. registrarLog com acao: 'AVISO_CRIADO'
6. Retornar 201 com { id }
```

---

## WORKFLOW 13 — Atribuir responsável a tarefa

```
1. Verificar permissão (LIDER_EQUIPE ou acima, ou dono da tarefa)
2. INSERT INTO tarefa_responsaveis (tarefa_id, usuario_id)
   — ignorar se já existir (INSERT OR IGNORE)
3. INSERT em tarefa_historico:
   campo: 'responsavel', anterior: null, novo: usuario_id atribuído
4. Criar notificação para o membro atribuído:
   tipo: 'tarefa'
   titulo: 'Você foi atribuído a uma tarefa'
   mensagem: 'A tarefa "${tarefa.titulo}" foi atribuída a você.'
   link: '/app/kanban?tarefa=${tarefa.id}'
5. registrarLog com acao: 'TAREFA_ATRIBUIDA'
6. Retornar { sucesso: true }
```

---

## WORKFLOW 14 — Paginação em listagens

Usar sempre que a listagem puder crescer muito (logs, histórico, tarefas).

```typescript
// Backend — padrão de paginação
const pagina = Number(c.req.query('pagina') ?? 1)
const itensPorPagina = Math.min(Number(c.req.query('itensPorPagina') ?? 20), 100)
const offset = (pagina - 1) * itensPorPagina

const { results: [{ total }] } = await c.env.DB.prepare(
  'SELECT COUNT(*) as total FROM tabela WHERE ...'
).bind(...params).all<{ total: number }>()

const { results } = await c.env.DB.prepare(
  'SELECT id, campo1, campo2, criado_em FROM tabela WHERE ... ORDER BY criado_em DESC LIMIT ? OFFSET ?'
).bind(...params, itensPorPagina, offset).all()

return c.json({
  dados: results,
  paginacao: { total, pagina, itensPorPagina, totalPaginas: Math.ceil(total / itensPorPagina) }
})
```

```typescript
// Frontend — controles de paginação
const [pagina, setPagina] = useState(1)

// Passar pagina como parâmetro na chamada da API
api.get('/endpoint', { params: { pagina, itensPorPagina: 20 } })
```

---

## WORKFLOW 15 — Autenticação e primeiro login

```
1. Usuário clica "Entrar com Microsoft"
2. MSAL abre popup — autentica com conta institucional
3. Frontend verifica domínio:
   - Se não termina com @unieuro.com.br → logout + erro ao usuário
4. Frontend chama POST /api/usuarios/registrar-ou-obter com o token
5. Middleware de auth no backend:
   a. Valida JWT via JWKS da Microsoft
   b. Verifica domínio @unieuro.com.br (segunda verificação)
   c. Busca usuário pelo microsoft_id
6. Rota registrar-ou-obter:
   a. Se existe: UPDATE nome e email
   b. Se não existe: INSERT com role = 'MEMBRO'
7. Frontend armazena token em localStorage('token_acesso')
8. Redireciona para /app/dashboard
```

### ❌ Erros comuns:
```
- Verificar domínio só no frontend (o backend deve verificar também)
- Usar email como identificador único (usar microsoft_id — é imutável)
- Não atualizar nome/email no login (podem mudar no Azure AD)
```

---

## WORKFLOW 16 — Migration no banco

```
1. Criar: backend/src/db/migrations/00X_descricao.sql
2. Numeração sequencial — nunca pular
3. Nunca editar migration já executada — criar arquivo novo
4. Padrão de tabela nova:
   - id TEXT PRIMARY KEY (UUID)
   - ativo INTEGER DEFAULT 1 (soft delete)
   - criado_em TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
5. Testar local: wrangler d1 execute fabrica-db-dev --file=migrations/00X.sql
6. Produção: wrangler d1 execute fabrica-db --file=migrations/00X.sql
```