---
description: 
---

---
description:
---

# ⚙️ WORKFLOWS PARTE 4 — Fábrica de Software
> Leia rules.md antes deste arquivo. Fluxos 24 a 27.
> Ver workflows-05.md para os fluxos 28 a 31.

---

## WORKFLOW 24 — Justificativa de ponto

Fluxo para quando o membro não bateu ponto (esqueceu, estava doente, sistema fora do ar).

### Backend — `POST /api/ponto/justificativas`:
```
1. Verificar autenticação
2. Receber: { data, tipo, motivo }
   - data: dia que faltou o registro (formato YYYY-MM-DD)
   - tipo: 'ausencia' | 'esquecimento' | 'problema_sistema'
   - motivo: texto livre explicando o ocorrido
3. Verificar se já existe justificativa pendente para o mesmo dia — retornar 400 se existir
4. INSERT INTO justificativas_ponto (id, usuario_id, data, tipo, motivo, status)
   - status padrão: 'pendente'
5. Criar notificação para o LIDER_EQUIPE e ADMIN:
   tipo: 'ponto'
   titulo: 'Nova justificativa de ponto'
   mensagem: '${usuario.nome} enviou uma justificativa para ${data}.'
   link: '/app/admin/justificativas'
6. registrarLog com acao: 'JUSTIFICATIVA_ENVIADA', modulo: 'ponto'
7. Retornar 201 com { id }
```

### Backend — `GET /api/ponto/justificativas` (listar as próprias):
```
1. Verificar autenticação
2. Buscar justificativas WHERE usuario_id = usuario.id ORDER BY criado_em DESC
3. Retornar com paginação (Workflow 14)
```

### Backend — `GET /api/admin/justificativas` (listar todas — admin):
```
1. Verificar role: LIDER_EQUIPE ou acima
2. Aceitar filtros: status, usuarioId, dataInicio, dataFim
3. Retornar com paginação
```

### Backend — `PATCH /api/admin/justificativas/:id/aprovar`:
```
1. Verificar role: LIDER_EQUIPE ou acima
2. Buscar justificativa — retornar 404 se não encontrada
3. Se status != 'pendente': retornar 400 'Justificativa já foi processada.'
4. UPDATE justificativas_ponto SET status = 'aprovada', avaliado_por = usuario.id, avaliado_em = strftime(...)
5. Criar notificação para o membro:
   tipo: 'ponto'
   titulo: 'Justificativa aprovada'
   mensagem: 'Sua justificativa para ${justificativa.data} foi aprovada.'
6. registrarLog com acao: 'JUSTIFICATIVA_APROVADA', modulo: 'ponto'
7. Retornar { sucesso: true }
```

### Backend — `PATCH /api/admin/justificativas/:id/rejeitar`:
```
1. Verificar role: LIDER_EQUIPE ou acima
2. Receber: { motivoRejeicao }
3. Buscar justificativa — retornar 404 se não encontrada
4. Se status != 'pendente': retornar 400 'Justificativa já foi processada.'
5. UPDATE justificativas_ponto SET status = 'rejeitada', motivo_rejeicao = ?, avaliado_por = ?, avaliado_em = strftime(...)
6. Criar notificação para o membro:
   tipo: 'ponto'
   titulo: 'Justificativa rejeitada'
   mensagem: 'Sua justificativa para ${justificativa.data} foi rejeitada. Motivo: ${motivoRejeicao}'
7. registrarLog com acao: 'JUSTIFICATIVA_REJEITADA', modulo: 'ponto'
8. Retornar { sucesso: true }
```

### Frontend:
```
1. FormularioJustificativa.tsx — campos: data (date picker), tipo (select), motivo (textarea)
2. ListaJustificativas.tsx — histórico do próprio membro com Emblema de status
3. PainelJustificativas.tsx (admin) — tabela de todas as justificativas pendentes primeiro,
   botões Aprovar/Rejeitar, ConfirmacaoExclusao antes de rejeitar (pedir motivo)
4. usarJustificativas.ts — hook do membro
5. usarJustificativasAdmin.ts — hook do painel admin
```

### Status de justificativa — Emblema:
```
pendente  → variante: 'amarelo'
aprovada  → variante: 'verde'
rejeitada → variante: 'vermelho'
```

### ❌ Erros comuns:
```
- Aprovar/rejeitar no frontend sem verificar role no backend
- Permitir duas justificativas para o mesmo dia
- Não notificar o membro ao processar a justificativa
```

---

## WORKFLOW 25 — Comentários em tarefas

### Banco de dados — tabela nova:
```sql
CREATE TABLE comentarios_tarefa (
  id          TEXT NOT NULL PRIMARY KEY,
  tarefa_id   TEXT NOT NULL REFERENCES tarefas(id),
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id),
  conteudo    TEXT NOT NULL,
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  editado_em  TEXT,
  ativo       INTEGER NOT NULL DEFAULT 1  -- soft delete
)
```
Criar via migration: `003_comentarios_tarefa.sql`

### Backend — `POST /api/tarefas/:id/comentarios`:
```
1. Verificar autenticação
2. Receber: { conteudo } — mínimo 1 caractere, máximo 2000
3. Buscar tarefa — retornar 404 se não encontrada
4. INSERT INTO comentarios_tarefa (id, tarefa_id, usuario_id, conteudo)
5. Buscar todos os usuários a notificar:
   - Responsáveis pela tarefa (tarefa_responsaveis)
   - Quem já comentou na tarefa (comentarios_tarefa WHERE ativo = 1)
   - Excluir o próprio autor do comentário da lista
   - Deduplicar (usar Set de IDs)
6. criarNotificacoes() para cada destinatário:
   tipo: 'tarefa'
   titulo: 'Novo comentário em tarefa'
   mensagem: '${usuario.nome} comentou em "${tarefa.titulo}".'
   link: '/app/kanban?tarefa=${tarefa.id}'
7. registrarLog com acao: 'COMENTARIO_CRIADO', modulo: 'kanban'
8. Retornar 201 com o comentário criado
```

### Backend — `GET /api/tarefas/:id/comentarios`:
```
1. Verificar autenticação
2. SELECT comentarios com JOIN em usuarios (nome, foto_perfil)
   WHERE tarefa_id = ? AND ativo = 1
   ORDER BY criado_em ASC
3. Retornar lista (sem paginação — comentários de uma tarefa raramente passam de 50)
```

### Backend — `PATCH /api/tarefas/:id/comentarios/:comentarioId`:
```
1. Verificar autenticação
2. Apenas o autor pode editar o próprio comentário
3. Receber: { conteudo }
4. UPDATE comentarios_tarefa SET conteudo = ?, editado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? AND usuario_id = ?
5. Retornar { sucesso: true }
```

### Backend — `DELETE /api/tarefas/:id/comentarios/:comentarioId`:
```
1. Verificar autenticação
2. Autor pode remover o próprio. LIDER_EQUIPE ou acima pode remover qualquer um.
3. Soft delete: UPDATE SET ativo = 0
4. registrarLog com acao: 'COMENTARIO_REMOVIDO', modulo: 'kanban'
5. Retornar { sucesso: true }
```

### Frontend:
```
1. SecaoComentarios.tsx — lista de comentários + formulário de novo comentário
   Exibir dentro do modal de detalhe da tarefa
2. CartaoComentario.tsx — avatar, nome, data relativa (formatarTempoAtras),
   conteudo, botão editar/remover se for o autor ou líder
3. usarComentarios.ts — hook que busca e gerencia comentários de uma tarefa
```

### ❌ Erros comuns:
```
- Notificar o próprio autor que comentou (excluir da lista de destinatários)
- Não deduplicar destinatários (responsável que também comentou receberia duas notificações)
- Permitir edição/remoção de comentário de outro membro sem verificar role no backend
```

---

## WORKFLOW 26 — Filtros e busca no Kanban

### Backend — atualizar `GET /api/tarefas`:
```
Aceitar filtros opcionais via query:
- sprintId      → tarefas da sprint (obrigatório se não for backlog)
- status        → filtrar por coluna específica
- prioridade    → 'urgente' | 'alta' | 'media' | 'baixa'
- responsavelId → tarefas atribuídas a um membro específico
- busca         → texto livre, busca em titulo e descricao (LIKE %busca%)

Construir query dinamicamente com os filtros recebidos.
Sempre usar prepared statements — nunca interpolar os valores.
```

### Frontend — `PainelFiltrosKanban.tsx`:
```
1. Input de busca por texto (debounce de 300ms — não chamar API a cada tecla)
2. Select de prioridade (múltipla seleção)
3. Select de responsável (lista de membros da equipe)
4. Botão "Limpar filtros" — reseta todos para o estado inicial
5. Indicador visual de filtros ativos (ex: "3 filtros ativos" em azul)
```

### `usarKanban.ts` — atualizar:
```typescript
// Adicionar estado de filtros
const [filtros, setFiltros] = useState({
  busca: '',
  prioridade: [] as string[],
  responsavelId: null as string | null,
})

// Busca re-executa automaticamente quando filtros mudam
useEffect(() => {
  buscarTarefas(filtros)
}, [sprintId, filtros])
```

### ❌ Erros comuns:
```
- Filtrar no frontend em vez de no backend (não escala com volume de tarefas)
- Não fazer debounce na busca por texto (chamada a cada tecla digitada)
- Não mostrar indicador visual de filtros ativos (usuário não sabe que está filtrando)
```

---

## WORKFLOW 27 — Gestão de equipes e grupos

### Banco de dados — verificar tabelas:
```sql
-- grupos: id, nome, descricao, lider_id, projeto_id, ativo, criado_em
-- equipes: id, nome, grupo_id, lider_id, ativo, criado_em
-- usuarios: adicionar equipe_id TEXT REFERENCES equipes(id)
```

### Backend — Grupos (`LIDER_GRUPO` ou `ADMIN`):
```
POST   /api/grupos                  → criar grupo
PATCH  /api/grupos/:id              → editar nome/descrição
PATCH  /api/grupos/:id/lider        → trocar líder do grupo
DELETE /api/grupos/:id              → soft delete (ativo = 0)
GET    /api/grupos                  → listar grupos do projeto
```

### Backend — Equipes (`LIDER_GRUPO` ou `ADMIN`):
```
POST   /api/equipes                 → criar equipe dentro de um grupo
PATCH  /api/equipes/:id             → editar nome
PATCH  /api/equipes/:id/lider       → trocar líder da equipe
DELETE /api/equipes/:id             → soft delete
GET    /api/grupos/:id/equipes      → listar equipes do grupo
```

### Backend — Membros de equipe (`LIDER_GRUPO` ou `ADMIN`):
```
POST   /api/equipes/:id/membros     → adicionar membro à equipe
DELETE /api/equipes/:id/membros/:usuarioId → remover membro da equipe
GET    /api/equipes/:id/membros     → listar membros
```

### Regras de negócio:
```
- Membro pode estar em apenas UMA equipe por vez
- Ao trocar de equipe: atualizar usuarios.equipe_id
- Líder de equipe pertence à equipe que lidera
- Ao desativar grupo: desativar todas as equipes do grupo
- registrarLog em toda alteração estrutural
```

### Frontend:
```
1. PainelEquipes.tsx (admin) — árvore visual: Grupo → Equipes → Membros
2. FormularioGrupo.tsx — criar/editar grupo
3. FormularioEquipe.tsx — criar/editar equipe, selecionar líder
4. GerenciarMembrosEquipe.tsx — adicionar/remover membros com busca
5. usarGrupos.ts / usarEquipes.ts
```

### ❌ Erros comuns:
```
- Permitir que membro entre em duas equipes simultaneamente
- Não desativar equipes ao desativar o grupo pai
- Não atualizar usuarios.equipe_id ao mover membro de equipe
```

---