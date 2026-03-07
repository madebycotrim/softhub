---
description: 
---

---
description: 
---

# ⚙️ WORKFLOWS PARTE 3 — Fábrica de Software
> Leia rules.md antes deste arquivo. Fluxos 17 a 23.
> Ver workflows-01.md (fluxos 0–7) e workflows-02.md (fluxos 8–16).

---

## WORKFLOW 17 — Editar perfil do membro

### Backend:
```
1. Pegar usuário autenticado: c.get('usuario')
2. Receber { bio, fotoPerfil } no body
3. Membro só pode editar o próprio perfil (usar usuario.id, ignorar qualquer id do body)
4. UPDATE usuarios SET bio = ?, foto_perfil = ?, atualizado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
5. registrarLog com acao: 'MEMBRO_ATUALIZADO', modulo: 'membros'
6. Retornar { sucesso: true }
```

### Frontend:
```
1. Pré-preencher o formulário com os dados atuais do usuário (pegar do ContextoAutenticacao)
2. Campos editáveis: bio (textarea) e foto_perfil (input de URL)
3. Foto: aceitar apenas URL externa (GitHub, LinkedIn, etc.) — sem upload de arquivo
4. Após salvar com sucesso: atualizar o estado do ContextoAutenticacao localmente
5. Exibir mensagem de confirmação: 'Perfil atualizado com sucesso!'
```

### ❌ Erros comuns:
```
- Permitir que o membro edite o role ou equipe pelo perfil
- Fazer upload de arquivo de imagem (só URL externa é permitido)
- Não atualizar o ContextoAutenticacao após salvar (usuário vê dados antigos)
```

---

## WORKFLOW 18 — Dashboard (métricas e gráficos)

### Dados necessários para o dashboard:
```
- Velocity das últimas sprints (nome da sprint + velocity_realizado)
- Burndown da sprint ativa (tarefas restantes por dia)
- Distribuição de tarefas por status (a_fazer, em_andamento, etc.)
- Total de membros ativos
- Total de tarefas concluídas no período
```

### Backend — rota sugerida `GET /api/dashboard?projetoId=xxx`:
```
1. Buscar sprint ativa do projeto
2. Buscar as últimas 5 sprints encerradas para o gráfico de velocity
3. Contar tarefas por status da sprint ativa
4. Retornar tudo em um único objeto para evitar múltiplas requisições
```

### Frontend:
```
1. usarDashboard busca todos os dados em uma única chamada
2. GraficoBurndown usa Recharts LineChart
3. GraficoVelocity usa Recharts BarChart
4. Mostrar Carregando enquanto busca — nunca gráfico vazio sem feedback
5. Se não há sprint ativa: exibir EstadoVazio com mensagem explicativa
```

### Constantes dos gráficos:
```typescript
// Cores fixas para os gráficos (não inventar outras)
GRAFICO_COR_PRIMARIA  = '#2563EB'  // azul
GRAFICO_COR_SUCESSO   = '#10B981'  // verde
GRAFICO_COR_ALERTA    = '#F59E0B'  // amarelo
GRAFICO_COR_PERIGO    = '#EF4444'  // vermelho
```

---

## WORKFLOW 19 — Retrospectiva de sprint

### Regras:
```
- Uma retrospectiva por sprint (relação 1:1 com a tabela sprints)
- Criada automaticamente ao encerrar a sprint (ver Workflow 11)
- Pode ser editada depois por LIDER_GRUPO ou ADMIN
- Campos: o_que_foi_bem, o_que_melhorar, acoes_proxima_sprint
```

### Backend — `PATCH /api/sprints/:id/retrospectiva`:
```
1. Verificar role: LIDER_GRUPO ou ADMIN
2. Verificar se a sprint já foi encerrada (status = 'encerrada')
3. UPDATE retrospectivas SET o_que_foi_bem, o_que_melhorar, acoes_proxima_sprint
4. registrarLog com acao: 'RETROSPECTIVA_ATUALIZADA', modulo: 'backlog', descricao explicativa
5. Retornar { sucesso: true }
```

### Frontend:
```
1. Exibir retrospectiva no PainelSprints após encerramento
2. Formulário com três textareas: 'O que foi bem', 'O que melhorar', 'Ações para a próxima sprint'
3. Apenas LIDER_GRUPO e ADMIN veem o botão de editar
4. Usar usarPermissao('LIDER_GRUPO') para esconder o botão (só UX)
```

---

## WORKFLOW 20 — Hook usarPermissao (uso correto)

```typescript
// compartilhado/hooks/usarPermissao.ts
// Serve APENAS para esconder/mostrar elementos na UI
// A verificação real de segurança é sempre no backend

import { usarAutenticacao } from '../../contexto/ContextoAutenticacao'

export function usarPermissao(roleNecessario: string): boolean {
  const { usuario } = usarAutenticacao()
  if (!usuario) return false
  const hierarquia = ['VISITANTE', 'MEMBRO', 'LIDER_EQUIPE', 'LIDER_GRUPO', 'ADMIN']
  return hierarquia.indexOf(usuario.role) >= hierarquia.indexOf(roleNecessario)
}
```

### Exemplos de uso correto:
```tsx
const ehAdmin        = usarPermissao('ADMIN')
const ehLider        = usarPermissao('LIDER_EQUIPE')
const podeCriarAviso = usarPermissao('LIDER_EQUIPE')

// Esconder botão para quem não tem permissão
{ehAdmin && <button>Gerenciar Membros</button>}
{podeCriarAviso && <button>Criar Aviso</button>}

// Desabilitar campo (não apenas esconder)
<input disabled={!ehLider} />
```

### ❌ Erros comuns:
```
- Usar usarPermissao como única verificação de segurança (o backend deve verificar também)
- Não usar usarPermissao e deixar botões restritos visíveis para todos
- Verificar role manualmente com usuario.role === 'ADMIN' em vez de usar o hook
```

---

## WORKFLOW 21 — Constantes visuais (usar sempre, não inventar)

```typescript
// utilitarios/constantes.ts — importar sempre daqui

// Colunas do kanban (ordem fixa)
COLUNAS_KANBAN = [
  { id: 'a_fazer',      titulo: 'A Fazer',      cor: '#64748B' },
  { id: 'em_andamento', titulo: 'Em Andamento',  cor: '#2563EB' },
  { id: 'em_revisao',   titulo: 'Em Revisão',    cor: '#7C3AED' },
  { id: 'testando',     titulo: 'Testando',      cor: '#F59E0B' },
  { id: 'concluido',    titulo: 'Concluído',     cor: '#10B981' },
]

// Cores de prioridade de tarefas
CORES_PRIORIDADE = {
  urgente: '#EF4444',  // 🔴
  alta:    '#F59E0B',  // 🟠
  media:   '#3B82F6',  // 🟡
  baixa:   '#10B981',  // 🟢
}

// Labels de prioridade
LABELS_PRIORIDADE = {
  urgente: '🔴 Urgente',
  alta:    '🟠 Alta',
  media:   '🟡 Média',
  baixa:   '🟢 Baixa',
}

// Cores de prioridade de avisos
CORES_AVISO = {
  urgente:     { fundo: 'bg-red-500/10',   borda: 'border-red-500/30',   texto: 'text-red-400' },
  normal:      { fundo: 'bg-blue-500/10',  borda: 'border-blue-500/30',  texto: 'text-blue-400' },
  informativo: { fundo: 'bg-slate-500/10', borda: 'border-slate-500/30', texto: 'text-slate-400' },
}
```

---

## WORKFLOW 22 — Dark/Light Mode

```
1. Ao carregar a aplicação: chamar aplicarTemaSalvo() no main.tsx
2. Tema padrão: dark (se nenhum salvo no localStorage)
3. Toggle no CabecalhoPagina chama alternarTema()
4. Preferência salva em localStorage('tema')
```

```typescript
// utilitarios/tema.ts
aplicarTemaSalvo()  // chamar no main.tsx antes de renderizar o app

alternarTema()      // chamar no botão de toggle do CabecalhoPagina
```

### Tailwind dark mode nas classes:
```tsx
// Sempre fornecer variante dark nas cores de fundo e texto
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
className="border-slate-200 dark:border-slate-700"
className="text-slate-600 dark:text-slate-400"
```

---

## WORKFLOW 23 — Painel de Logs (admin)

### Backend — `GET /api/admin/logs`:
```
1. Verificar role: apenas ADMIN
2. Aceitar filtros via query: busca, modulo, acao, status, usuarioId,
   entidadeTipo, dataInicio, dataFim, pagina, itensPorPagina
3. Construir query dinamicamente com os filtros recebidos
4. Usar paginação (ver Workflow 14)
5. Retornar { dados, paginacao }
```

### Backend — `GET /api/admin/logs/estatisticas?dias=7`:
```
1. Verificar role: apenas ADMIN
2. Contar logs por status (sucesso, erro, aviso) nos últimos N dias
3. Contar logs por modulo
4. Retornar dados prontos para os gráficos do PainelLogs
```

### Frontend — PainelLogs:
```
1. Cards com totais: sucesso (verde), erro (vermelho), aviso (amarelo)
2. Gráfico de linha: eventos por dia (Recharts LineChart)
3. Gráfico de barras: eventos por módulo (Recharts BarChart)
4. Tabela paginada com Emblema colorido por status
5. Ao clicar em uma linha: abrir Modal com todos os detalhes do log
6. Modal de detalhe exibe diff antes/depois em JSON formatado
7. Filtros: busca por texto, módulo, status, data início e data fim
```