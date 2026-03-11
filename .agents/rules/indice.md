---
trigger: always_on
---

---
trigger: always_on
---

# 🗂️ ÍNDICE — Fábrica de Software
> Leia este arquivo primeiro. Ele define a ordem de leitura e o que cada arquivo cobre.

---

## Ordem obrigatória de leitura

```
1. rules.md          ← regras absolutas + checklist final
2. rules-contexto.md ← estrutura de pastas, layout, componentes, API, formatadores
3. workflows-01.md   ← fluxos 0 a 7  (rotas, hooks, componentes, formulários, permissão, notificação, log)
4. workflows-02.md   ← fluxos 8 a 16 (kanban, ponto, aviso, atribuição, paginação, auth, migration)
5. workflows-03.md   ← fluxos 17 a 23 (perfil, dashboard, retrospectiva, permissão, constantes, tema, logs)
6. workflows-04.md   ← fluxos 24 a 27 (justificativas de ponto, comentários em tarefas, filtros kanban, gestão de equipes/grupos)
7. workflows-05.md   ← fluxos 28 a 31 (bootstrap admin, histórico de tarefa, exportação CSV, checklist)
```

**Antes de escrever qualquer código:** leia rules.md e rules-contexto.md.
**Antes de implementar um módulo:** leia o workflow correspondente.
**Antes de escrever qualquer código:** leia rules.md e rules-contexto.md.
**Antes de implementar um módulo:** leia o workflow correspondente.

---

## O que cada arquivo cobre

| Arquivo | Cobre |
|---------|-------|
| `rules.md` | Língua PT-BR, nomenclatura, stack, estado, erros, IDs, banco, segurança, roles, módulos, proibições, checklist |
| `rules-contexto.md` | Estrutura de pastas, layout compartilhado, componentes reutilizáveis, serviço de API, formatadores, variáveis de ambiente, comandos |
| `workflows-01.md` | Fluxos 0–7: setup inicial, rota backend, hook, componente, formulário, permissão, notificação, log |
| `workflows-02.md` | Fluxos 8–16: mover card, registrar ponto, criar aviso, atribuir responsável, paginação, autenticação, migration |
| `workflows-03.md` | Fluxos 17–23: editar perfil, dashboard, retrospectiva, usarPermissao, constantes visuais, dark/light mode, painel de logs |
| `workflows-04.md` | Fluxos 24–27: justificativas de ponto, comentários em tarefas, filtros e busca no kanban, gestão de equipes e grupos |
| `workflows-05.md` | Fluxos 28–31: bootstrap do primeiro admin, histórico visível da tarefa, exportação CSV de ponto, checklist de tarefas |

---

## Mapa do sistema

```
Fábrica de Software
│
├── 🌐 Portfolio Público (sem login)
│   └── Projetos com publico = true
│
└── 🔒 Sistema Interno (login @unieuro.edu.br)
    ├── 📋 Kanban (Fluxo Contínuo)
    │   ├── Filtros por status, prioridade, responsável
    │   ├── Comentários em tarefas
    │   ├── Checklist por tarefa
    │   └── Histórico de alterações
    ├── 🕐 Ponto Eletrônico (só na rede UNIEURO)
    │   ├── Registro de entrada/saída
    │   ├── Justificativas de ponto
    │   └── Exportação CSV de relatório
    ├── 👥 Membros + Perfis
    ├── 🏢 Grupos e Equipes
    ├── 📢 Avisos + Notificações
    ├── 📊 Dashboard + Gráficos
    └── 🛡️ Admin
        ├── Gerenciar Membros
        ├── Publicar Projetos
        ├── Aprovar Justificativas
        └── Logs Globais
```

---

## Hierarquia de roles (referência rápida)

```
ADMIN > COORDENADOR > GESTOR > LIDER > SUBLIDER > MEMBRO
```

---

## Proibições absolutas (memorize)

```
❌ Zustand / Redux / MobX / qualquer store global
❌ Upload de arquivos (só links externos)
❌ Emails fora de @unieuro.edu.br
❌ Verificação de role só no frontend
❌ Ponto sem verificação de IP no backend
❌ IDs numéricos sequenciais (sempre UUID)
❌ UPDATE ou DELETE em tarefa_historico ou logs
❌ Secrets hardcoded no código
❌ Nomes em inglês (exceto exceções técnicas)
❌ Notificações criadas no frontend
❌ DELETE real no banco (Sem Soft Delete)
❌ Exportação CSV gerada no frontend
❌ Bootstrap de ADMIN hardcoded no código (sempre via variável de ambiente)
```