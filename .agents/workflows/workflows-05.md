---
description: 
---

---
description:
---

# ⚙️ WORKFLOWS PARTE 5 — Fábrica de Software
> Leia rules.md antes deste arquivo. Fluxos 28 a 31.
> Ver workflows-04.md para os fluxos 24 a 27.

---

## WORKFLOW 28 — Bootstrap do primeiro ADMIN

O primeiro login sempre cria com `role = 'MEMBRO'`. Este workflow resolve como o primeiro usuário vira ADMIN sem mexer diretamente no banco.

### Solução — variável de ambiente de bootstrap:
```toml
# wrangler.toml
[vars]
BOOTSTRAP_ADMIN_EMAIL = "email.do.admin@unieuro.edu.br"
```

### Backend — atualizar `POST /api/usuarios/registrar-ou-obter`:
```
Após criar ou buscar o usuário:

1. Verificar se c.env.BOOTSTRAP_ADMIN_EMAIL está definido
2. Se o email do usuário === BOOTSTRAP_ADMIN_EMAIL:
   a. Verificar se já existe algum ADMIN no banco:
      SELECT COUNT(*) FROM usuarios WHERE role = 'ADMIN' AND ativo = 1
   b. Se não existe nenhum ADMIN ainda:
      UPDATE usuarios SET role = 'ADMIN' WHERE id = usuario.id
      registrarLog com acao: 'ROLE_ALTERADA', descricao: 'Bootstrap: primeiro admin definido'
3. Após bootstrap bem-sucedido, a variável pode ser removida do wrangler.toml
   (o sistema já tem um ADMIN — não é mais necessária)
```

### Regras de segurança:
```
✅ O upgrade só acontece SE não existe nenhum ADMIN no banco ainda
✅ Após o primeiro ADMIN existir, a variável se torna inerte (não eleva mais ninguém)
✅ Registrar log do bootstrap para auditoria
❌ Nunca hardcodar o email no código — sempre via variável de ambiente
❌ Nunca expor rota manual de "tornar admin" sem autenticação
```

### Documentar no .env.example:
```bash
# Email do primeiro administrador do sistema.
# Usado apenas no bootstrap inicial — pode ser removido após o primeiro login do admin.
BOOTSTRAP_ADMIN_EMAIL=
```

---

## WORKFLOW 29 — Histórico visível da tarefa

O `tarefa_historico` já é preenchido a cada mudança. Este workflow expõe esse histórico para o usuário na tela.

### Backend — `GET /api/tarefas/:id/historico`:
```
1. Verificar autenticação
2. SELECT tarefa_historico JOIN usuarios (nome, foto_perfil)
   WHERE tarefa_id = ? ORDER BY criado_em ASC
3. Retornar lista completa (histórico é pequeno por tarefa)
```

### Frontend — `HistoricoTarefa.tsx`:
```
Exibir dentro do modal de detalhe da tarefa, abaixo dos comentários.
Linha do tempo vertical — cada evento com:
- Ícone do tipo de mudança (Lucide React)
- Texto gerado automaticamente pelo campo alterado:
  status:      "João moveu de 'A Fazer' para 'Em Andamento'"
  responsavel: "Maria atribuiu Pedro como responsável"
  prioridade:  "Carlos alterou prioridade de 'Baixa' para 'Urgente'"
  titulo:      "Ana renomeou a tarefa"
- Data relativa com formatarTempoAtras()
- Avatar do autor da mudança
```

### Gerador de texto para o histórico:
```typescript
// utilitarios/formatadores.ts — adicionar esta função
function formatarEventoHistorico(campo: string, anterior: string, novo: string): string {
  const labels: Record<string, Record<string, string>> = {
    status: {
      a_fazer: 'A Fazer', em_andamento: 'Em Andamento',
      em_revisao: 'Em Revisão', testando: 'Testando', concluido: 'Concluído'
    },
    prioridade: { urgente: 'Urgente', alta: 'Alta', media: 'Média', baixa: 'Baixa' }
  }
  const labelAnterior = labels[campo]?.[anterior] ?? anterior
  const labelNovo = labels[campo]?.[novo] ?? novo
  return `alterou ${campo} de "${labelAnterior}" para "${labelNovo}"`
}
```

### ❌ Erros comuns:
```
- Exibir IDs brutos em vez de labels legíveis (ex: 'em_andamento' em vez de 'Em Andamento')
- Tentar fazer UPDATE no tarefa_historico para corrigir texto — é imutável
- Paginar o histórico (raramente passa de 20 eventos por tarefa — não precisa)
```

---

## WORKFLOW 30 — Exportação de relatório de ponto (CSV)

### Backend — `GET /api/ponto/exportar`:
```
1. Verificar role: LIDER_EQUIPE ou acima
2. Aceitar query: usuarioId?, equipeId?, dataInicio, dataFim (obrigatórios)
3. Validar que dataFim - dataInicio <= 31 dias (evitar queries gigantes)
4. Buscar registros_ponto + justificativas_ponto aprovadas no período
5. Calcular horas trabalhadas por dia (entrada → saída)
6. Gerar CSV com colunas:
   Nome, Email, Data, Entrada, Saída, Horas Trabalhadas, Observação
7. Retornar com headers:
   Content-Type: text/csv; charset=utf-8
   Content-Disposition: attachment; filename="ponto_${dataInicio}_${dataFim}.csv"
```

### Frontend — `BotaoExportarPonto.tsx`:
```
1. Formulário com: período (data início + data fim), membro ou equipe (opcional)
2. Ao confirmar: chamar api.get('/ponto/exportar', { params, responseType: 'blob' })
3. Criar URL do blob e acionar download automático via <a download>
4. Mostrar 'Gerando relatório...' durante o carregamento
5. Exibir apenas para LIDER_EQUIPE ou acima (usarPermissao)
```

### Formato do CSV gerado:
```
Nome,Email,Data,Entrada,Saída,Horas Trabalhadas,Observação
João Silva,joao@unieuro.edu.br,05/03/2025,08:02,17:15,9h 13min,
Maria Santos,maria@unieuro.edu.br,05/03/2025,,,0h 0min,Justificativa aprovada: consulta médica
```

### ❌ Erros comuns:
```
- Não limitar o período máximo (query pode retornar meses de dados de uma vez)
- Gerar CSV no frontend (dados sensíveis não devem trafegar além do necessário)
- Não incluir justificativas aprovadas no relatório (dia aparece zerado sem contexto)
```

---

## WORKFLOW 31 — Subtarefas / Checklist

Checklist leve dentro de uma tarefa — sem criar subtarefas completas com status próprio.

### Banco de dados — tabela nova:
```sql
CREATE TABLE checklist_tarefa (
  id         TEXT NOT NULL PRIMARY KEY,
  tarefa_id  TEXT NOT NULL REFERENCES tarefas(id),
  texto      TEXT NOT NULL,
  concluido  INTEGER NOT NULL DEFAULT 0,  -- 0 = pendente, 1 = concluído
  ordem      INTEGER NOT NULL DEFAULT 0,  -- para reordenação
  criado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
)
```
Criar via migration: `004_checklist_tarefa.sql`

### Backend:
```
POST   /api/tarefas/:id/checklist         → adicionar item
PATCH  /api/tarefas/:id/checklist/:itemId → marcar/desmarcar ou editar texto
DELETE /api/tarefas/:id/checklist/:itemId → remover item (DELETE real — item não tem histórico)
GET    /api/tarefas/:id/checklist         → listar itens ordenados por `ordem`
```

### Regras de negócio:
```
- Qualquer membro com acesso à tarefa pode marcar/desmarcar itens
- Apenas LIDER_EQUIPE ou acima pode adicionar/remover itens
- Progresso do checklist aparece no CartaoTarefa: "3/5 ✓"
- Tarefa NÃO é bloqueada para mover se checklist incompleto — é só informativo
```

### Frontend:
```
1. SecaoChecklist.tsx — lista de itens com checkbox, dentro do modal de detalhe
2. Cada item: checkbox + texto + botão remover (se tiver permissão)
3. Input inline para adicionar novo item (pressionar Enter confirma)
4. Progresso no CartaoTarefa.tsx: barra fina colorida + "X/Y concluídos"
5. usarChecklist.ts — hook para gerenciar itens
```

### ❌ Erros comuns:
```
- Bloquear movimentação da tarefa se checklist incompleto (é informativo, não bloqueante)
- Criar subtarefas completas com status/responsável próprio (scope creep — usar checklist)
- Não mostrar progresso no card do kanban (perde visibilidade)
```