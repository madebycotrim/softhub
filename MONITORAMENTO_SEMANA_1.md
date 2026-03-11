# 🕵️‍♂️ GUIA DE DIAGNÓSTICO: PRIMEIRA SEMANA (FASE 2)

Este guia prático foi criado para a dupla de Devs Juniores diagnosticar problemas de performance na primeira semana real de uso do sistema com **50 usuários online simultaneamente**.

Siga estes passos durante as tardes de horário de pico (ex: 14h às 16h).

---

## 1. Monitorando Consultas Lentas (EXPLAIN QUERY PLAN) 📊

Se o sistema começar a parecer lento ao carregar as Tarefas ou Ponto, o problema pode ser falta de índice (`INDEX`) em alguma tabela recém-criada, que obriga o banco D1 a varrer as tabelas do início ao fim (Table Scan).

**O que fazer:**
Peça o plano de execução (`EXPLAIN QUERY PLAN`) de qualquer rota para investigar:

Dentro da pasta `/back-end`, abra o terminal e rode:
```bash
npm run db:explain "EXPLAIN QUERY PLAN SELECT * FROM tarefas WHERE projeto_id = 'P1'"
```

**Como ler a resposta:**
- 🟢 **Se disser `SEARCH TABLE tarefas USING COVERING INDEX...`**: Excelente! Está super otimizado na RAM.
- 🔴 **Se disser `SCAN TABLE tarefas`**: Perigo! O D1 leu cada linha inteira da tabela do banco de dados 1 a 1.
    - **Solução Imediata:** Crie um índice correspondente aos campos no bloco `WHERE` e aplique na base!

---

## 2. Monitoramento Inteligente de Custos no Painel Cloudflare 💸

A meta do projeto é **nunca esgotar os 100.000 requests/diários gratuitos do plano**.
Vocês devem ficar de olhos grudados em duas métricas diárias essenciais até o padrão engrenar:

### A) Taxa de Polling do Front-end (Requests Zumbis)
Acesse: *Dashboard Cloudflare -> Workers & Pages -> softhub-api -> Metrics*

- **O que observar:** O gráfico de linhas `Requests`.
- **Sinal de Alerta:** Ter mais de 10.000 requests às *3 da manhã* (fora de expediente) ou saltar de `100 reqs/min` para `10.000 reqs/min` ao longo do dia.
- **Motivo do Alerta:** Indica que algum front-end ficou com o `setInterval` rodando em abas paradas esquecidas nos PCs do laboratório. 
- **O que fazer:** Ajustar nos hooks (`usarNotificacoes.ts` e `usarPonto.ts`) a propulação e regras para pausar em background do `useQuery`.

### B) Escalonamento Exagerado de Leituras DB (Rows Read)
Acesse: *Dashboard Cloudflare -> D1 -> softhub_db -> Metrics*

- **O que observar:** O gráfico `Rows Read` em relação ao `Queries Executed`.
- **Sinal de Alerta:** Ver `5.000 Queries Executed`, mas absurdos `20.000.000 Rows Read`.
- **Motivo do Alerta:** Confirma o Item (1). Consultas sem Índice ou mal formatadas. O banco não achou nada velozmente e precisou varrer tudo exaustivamente.
- **O que fazer:** Rode o `db:explain` com a sua Query e aplique os índices de correção.
