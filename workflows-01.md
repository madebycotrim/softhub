---
description: 
---

---
description: 
---

# ⚙️ WORKFLOWS PARTE 1 — Fábrica de Software
> Leia rules.md antes deste arquivo. Fluxos 0 a 7.
> Ver workflows-02.md para os fluxos 8 a 16.

---

## WORKFLOW 0 — Antes de qualquer tarefa (obrigatório)

```
1. Ler rules.md completo
2. Identificar o módulo da tarefa (kanban, ponto, membros, etc.)
3. Confirmar stack permitida — não instalar nada fora da lista
4. Ao finalizar, passar pelo checklist em rules.md
```

---

## WORKFLOW 1 — Criar rota de backend (Hono)

```
1. Criar em backend/src/rotas/<modulo>.ts (kebab-case)
2. Importar Hono, registrarLog e serviços necessários
3. Definir schema Zod para validar o body (se POST/PATCH)
4. Implementar a rota nesta ordem:
   a. Pegar usuário autenticado: c.get('usuario')
   b. Ler params, query ou body
   c. Verificar role se necessário
   d. Executar query com prepared statement
   e. Registrar em tarefa_historico se alterou campo de tarefa
   f. Criar notificações se o evento exige
   g. Chamar registrarLog()
   h. Retornar resposta padronizada
5. Registrar a rota no backend/src/index.ts
```

### Padrões de resposta:
```typescript
// Erros
return c.json({ erro: 'Mensagem clara em PT-BR.' }, 400)
return c.json({ erro: 'Token não fornecido.' }, 401)
return c.json({ erro: 'Permissão insuficiente.' }, 403)
return c.json({ erro: 'Não encontrado.' }, 404)

// Sucesso
return c.json({ id }, 201)        // criação
return c.json({ sucesso: true })  // atualização/ação
return c.json(resultados)         // listagem
```

### ❌ Erros comuns neste workflow:
```
- Interpolar string no SQL: WHERE id = '${id}' → use prepared statement
- Esquecer de registrar log após ação de negócio
- Verificar role só no frontend e não no backend
- Retornar mensagem de erro em inglês
```

---

## WORKFLOW 2 — Criar hook de frontend

```
1. Criar em frontend/src/funcionalidades/<modulo>/usar<Nome>.ts
2. Definir interface TypeScript dos dados (exportar junto)
3. Implementar o hook:
   a. useState para dados, carregando e erro
   b. useEffect para buscar dados ao montar
   c. Funções de ação que chamam a API
4. Um hook = um módulo (não misturar responsabilidades)
```

### Padrão obrigatório de busca de dados:
```typescript
const [dados, setDados] = useState<Tipo[]>([])
const [carregando, setCarregando] = useState(true)
const [erro, setErro] = useState<string | null>(null)

useEffect(() => {
  async function carregar() {
    try {
      const resultado = await api.get('/endpoint')
      setDados(resultado.data)
    } catch {
      setErro('Não foi possível carregar os dados.')
    } finally {
      setCarregando(false) // sempre, mesmo com erro
    }
  }
  carregar()
}, [])
```

### ❌ Erros comuns neste workflow:
```
- Misturar lógica de módulos diferentes no mesmo hook
- Não parar o carregando no finally — o loading fica eterno se houver erro
- Chamar a API diretamente no componente em vez de usar o hook
```

---

## WORKFLOW 3 — Criar componente de frontend

```
1. Criar em frontend/src/funcionalidades/<modulo>/<NomeComponente>.tsx
2. Escrever JSDoc descrevendo o componente
3. Definir interface de props
4. Implementar na ordem:
   a. if (carregando) return <Carregando />
   b. if (erro) return <p className="text-red-400 ...">...</p>
   c. if (dados.length === 0) return <EstadoVazio />
   d. Renderizar os dados
5. Usar componentes compartilhados: Modal, Emblema, Carregando, EstadoVazio
```

### Estrutura padrão de página:
```tsx
export default function PaginaExemplo() {
  const { dados, carregando, erro } = usarDados()

  if (carregando) return <Carregando />
  if (erro) return <p className="text-red-400 text-center py-8">{erro}</p>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Título da Página
        </h1>
      </div>
      {dados.length === 0
        ? <EstadoVazio titulo="Nenhum dado encontrado" />
        : <div className="space-y-4">{/* lista */}</div>
      }
    </div>
  )
}
```

### Identidade visual obrigatória:
```
Títulos:   font-family: 'Space Grotesk', sans-serif
Corpo:     font-family: 'Inter', sans-serif
Bordas:    rounded-xl (cards) / rounded-2xl (modais)
Primária:  #2563EB  Secundária: #7C3AED
Sucesso:   #10B981  Alerta: #F59E0B  Perigo: #EF4444
```

---

## WORKFLOW 4 — Criar formulário

```
1. Definir schema Zod fora do componente com mensagens em PT-BR
2. Inferir o tipo com z.infer<typeof esquema> — nunca duplicar manualmente
3. Configurar useForm com zodResolver e defaultValues
4. Implementar campos com register() + label associado (htmlFor/id)
5. Exibir erro abaixo do campo com role="alert"
6. Botão type="submit" dentro do <form> com disabled={isSubmitting}
7. Mostrar 'Salvando...' enquanto isSubmitting
```

### Padrão obrigatório — `<form onSubmit>`:
```tsx
// ✅ CERTO — semântico, acessível, padrão do React Hook Form
const esquemaTarefa = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres'),
  prioridade: z.enum(['urgente', 'alta', 'media', 'baixa']),
})
type DadosTarefa = z.infer<typeof esquemaTarefa>

const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<DadosTarefa>({ resolver: zodResolver(esquemaTarefa) })

<form onSubmit={handleSubmit(aoEnviar)} className="space-y-4">
  <div>
    <label htmlFor="titulo" className="text-sm text-slate-400">Título</label>
    <input id="titulo" {...register('titulo')} />
    {errors.titulo && (
      <p role="alert" className="text-xs text-red-400">{errors.titulo.message}</p>
    )}
  </div>
  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Salvando...' : 'Salvar'}
  </button>
</form>

// ❌ ERRADO — perde semântica e acessibilidade
<div>
  <button onClick={handleSubmit(aoEnviar)}>Salvar</button>
</div>
```

### ❌ Erros comuns:
```
- Usar <div onClick> em vez de <form onSubmit> — quebra acessibilidade e Enter no teclado
- Duplicar o tipo manualmente em vez de usar z.infer
- Não associar label ao input com htmlFor/id
- Não colocar role="alert" no erro — leitores de tela não anunciam
```

---

## WORKFLOW 5 — Verificar permissão

### No backend (verificação real — obrigatória):
```typescript
function verificarRole(roleUsuario: string, roleMinimo: string): boolean {
  const hierarquia = ['VISITANTE', 'MEMBRO', 'LIDER_EQUIPE', 'LIDER_GRUPO', 'ADMIN']
  return hierarquia.indexOf(roleUsuario) >= hierarquia.indexOf(roleMinimo)
}

if (!verificarRole(usuario.role, 'LIDER_EQUIPE')) {
  return c.json({ erro: 'Permissão insuficiente.' }, 403)
}
```

### No frontend (apenas UX — esconder/mostrar):
```typescript
const podeGerenciar = usarPermissao('LIDER_EQUIPE')
{podeGerenciar && <button>Ação Restrita</button>}
```

### ❌ Erros comuns neste workflow:
```
- Fazer a verificação real de segurança só no frontend
- Esquecer de retornar 403 após a verificação falhar no backend
- Usar o hook usarPermissao como se fosse segurança real
```

---

## WORKFLOW 6 — Criar notificação

**Sempre no backend. Nunca no frontend.**

```typescript
import { criarNotificacoes } from '../servicos/servico-notificacoes'

// Preencher apenas UM dos destinatários
await criarNotificacoes(c.env.DB, {
  usuarioId: destinatarioId,          // usuário específico
  // OU equipeId: equipeId,           // toda uma equipe
  // OU grupoId: grupoId,             // todo um grupo
  // OU todosDoProjetoId: projetoId,  // todos do projeto
  titulo: 'Título da notificação',
  mensagem: 'Descrição do que aconteceu.',
  tipo: 'tarefa', // 'tarefa'|'ponto'|'sprint'|'aviso'|'sistema'
  link: '/app/kanban',
})
```

### Tabela de eventos que geram notificação:
| Evento | Destinatário |
|--------|-------------|
| Atribuído a tarefa | Membro atribuído |
| Tarefa movida para "Em Revisão" | Líder da equipe |
| Novo comentário em tarefa | Responsáveis + quem já comentou |
| Sprint iniciada/encerrada | Todos os membros do projeto |
| Novo aviso criado | Destinatários do grupo/equipe |
| Justificativa aprovada/rejeitada | Membro que enviou |
| Prazo de tarefa em menos de 24h | Responsáveis pela tarefa |

---

## WORKFLOW 7 — Registrar log

```typescript
await registrarLog(c.env.DB, {
  // Quem fez — sempre copiar nome/email (histórico imutável)
  usuarioId: usuario.id,
  usuarioNome: usuario.nome,
  usuarioEmail: usuario.email,
  usuarioRole: usuario.role,

  acao: 'TAREFA_MOVIDA',   // ver lista abaixo
  modulo: 'kanban',
  descricao: `${usuario.nome} moveu "${tarefa.titulo}" para "Em Revisão"`,

  ip: c.req.header('CF-Connecting-IP') ?? '',
  entidadeTipo: 'tarefa',
  entidadeId: tarefa.id,
  dadosAnteriores: { status: 'em_andamento' },
  dadosNovos: { status: 'em_revisao' },
})
```

### Ações disponíveis:
```
Auth:      LOGIN_REALIZADO · LOGIN_FALHOU · LOGOUT_REALIZADO · DOMINIO_INVALIDO
Membros:   MEMBRO_CRIADO · MEMBRO_ATUALIZADO · MEMBRO_DESATIVADO · ROLE_ALTERADA
Kanban:    TAREFA_CRIADA · TAREFA_MOVIDA · TAREFA_ATUALIZADA · TAREFA_ARQUIVADA · TAREFA_ATRIBUIDA · COMENTARIO_CRIADO · COMENTARIO_REMOVIDO
Sprints:   SPRINT_CRIADA · SPRINT_INICIADA · SPRINT_ENCERRADA · RETROSPECTIVA_ATUALIZADA
Ponto:     PONTO_ENTRADA · PONTO_SAIDA · PONTO_FORA_DA_REDE · JUSTIFICATIVA_ENVIADA · JUSTIFICATIVA_APROVADA · JUSTIFICATIVA_REJEITADA
Projetos:  PROJETO_CRIADO · PROJETO_PUBLICADO · PROJETO_DESPUBLICADO
Avisos:    AVISO_CRIADO · AVISO_REMOVIDO
Sistema:   ERRO_INTERNO · ACESSO_NEGADO
```

### Módulos:
```
auth · membros · kanban · backlog · ponto · projetos · avisos · admin · sistema · equipes
```