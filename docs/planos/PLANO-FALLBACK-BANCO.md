# Plano — Fallback de banco: Guara → Neon → dinâmico → home-pc

> **Tipo:** PLANO
> **Domínio:** global (acesso a dados / resiliência)
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [ESTADO.md](../02-estado/ESTADO.md), [ROTEIRO-NEON-01-09.md](ROTEIRO-NEON-01-09.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** postgres, fallback, neon, guara, home-pc, reserva, etl, neonctl, resiliencia, banco

## Sumário

- [O problema](#o-problema)
- [A cadeia de bancos (planos A→D)](#a-cadeia-de-bancos-planos-ad)
- [Onde mora no código](#onde-mora-no-código)
- [Manter a Neon (plano B) sincronizada via CLI](#manter-a-neon-plano-b-sincronizada-via-cli)
- [Limites do plano free da Neon](#limites-do-plano-free-da-neon)
- [Riscos e regras](#riscos-e-regras)

## O problema

O incidente medido não é "o banco caiu": é o Postgres do Guara **conectar
normalmente, mas estar vazio** — o ETL não rodou contra ele. A página então
mostra "ainda não rodou contra este banco" mesmo existindo dado na Neon.

O `getDb()` (`lib/db/client.ts`) só trocava de banco quando a **criação da
conexão** falhava. Conexão que abre e responde vazio passava batido. Foi
assim que o Neon — que deveria ser o reserva — não ativava.

## A cadeia de bancos (planos A→D)

| Plano | Banco | Como entra | Papel |
|---|---|---|---|
| **A** | Guara (`DATABASE_URL`) | `getDb()` | principal |
| **B** | Neon (`DATABASE_URL_NEON`) | `comBancoReserva()` | reserva nominal (HTTP) |
| **C** | dinâmico (`.din.ts`, runtime) | comportamento de página | quando A e B não têm o dado |
| **D** | home-pc (`DATABASE_URL_HOMEPC` ou `DATABASE_URL_RESERVA`) | `comBancoReserva()` | Postgres local, automático por último |

**Regra:** A → B → D, a primeira resposta **não vazia** vence. Vazio **e**
erro contam como "tenta o próximo". O log diz qual banco respondeu.
Fallback silencioso é proibido — esconderia o Guara caído e o site sairia
com o dado de ontem sem ninguém saber (mesma disciplina de
`listarCidades()`).

O **plano C** não é banco: é a rota dinâmica em runtime. Quando nem A nem B
nem D respondem, a página cai no seu estado de degradação / rota `.din.ts`.

## Onde mora no código

- `apps/web/lib/db/client.ts` — `criarConexao(url)` (driver por hostname) e
  `getDb()` (fallback só na criação da conexão).
- `apps/web/lib/db/reserva.ts` — `bancosReserva()` (ordem e filtro a partir
  das envs) e `comBancoReserva(consulta, { vazio, padrao, rotulo })`.
- Aplicado às leituras de `/ambiental/licenciamento`, `/ambiental/copam`,
  `/ambiental/legislacao` e `/ambiental/patrimonio-cultural` — as páginas
  que exibiam "ETL não rodou contra este banco".
- Teste: `apps/web/lib/db/reserva.test.ts` (ordem/filtro das reservas).

## Manter a Neon (plano B) sincronizada via CLI

O fallback só ajuda se a Neon tiver o dado. Ela vive hoje carregada com o
mínimo de 08/09 (124,4 MB). Para o plano B funcionar de facto, a Neon
precisa das tabelas que as páginas leem. Tudo isso é possível pela CLI
(`neonctl` 5.0.0, já instalada), sem painel.

### Passo a passo

1. **Pegar a connection string** (nunca imprimir em log nem commitar):
   ```powershell
   neonctl connection-string production --pooled
   ```
   Use o endpoint **direto** (sem `-pooled`) para scripts com SQL
   não-qualificado: o pooler zera o `search_path` (achado de 08/09).

2. **Aplicar migrations novas** (tabelas/bases novas) — o runner do repo
   funciona com `DATABASE_URL` apontando para a Neon:
   ```powershell
   $env:DATABASE_URL = '<string-da-neon>'   # só nesta sessão, nunca no .env
   foreach ($m in (Get-ChildItem supabase\betim\migrations\*.sql | Sort-Object Name)) {
     npx tsx scripts/aplicar-migration.mts $m.FullName
   }
   ```
   As migrations são idempotentes (`if not exists` / `on conflict`).

3. **Carregar dado** — rodar o próprio ETL com a `DATABASE_URL` da Neon na
   sessão. Exemplos de carga por arquivo já usados no repo:
   ```powershell
   npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-mma.json
   python -m etl.apis.classificar_temas_ambientais
   ```
   Para o resto (convênios, COPAM, licenciamento), o caminho medido é
   `pg_dump --data-only -t <tabela>` no Postgres local e `psql` na Neon,
   **tabela a tabela** — o dump completo sobrescreveria o que já está lá
   diferente (ver `ROTEIRO-NEON-01-09.md`, passo 3).

4. **Conferir**:
   ```powershell
   npx tsx scripts/colunas-reais.mts convenios_federais atos_oficiais
   ```

### Novas bases

- **Tabela nova (mesmo schema):** entra só com migration (passo 2) — não
  consome cota além do storage.
- **Schema/banco novo na Neon:** no free, banco novo custa um **project**
  ou um **branch** novo, que têm limite próprio. Preferir criar a tabela no
  schema `public` existente a abrir projeto só para isso.

## Limites do plano free da Neon

Os três tetos que importam (o menor manda):

| Recurso | Teto | Como medir |
|---|---|---|
| **Storage** | 500 MB por projeto (este repo já mediu 470/500 MB em 29/09) | `neonctl` (painel) ou `pg_database_size` |
| **Egress** | 5 GB/mês (é o teto que estourou em 07/08 com 9 builds) | `apps/web/scripts/orcamento-egress.mts`; builds **nunca** apontam para a Neon |
| **Compute** | cota de horas/mês (o compute suspende após ~5 min ocioso) | painel da Neon |

**Resposta curta:** sim — dentro do free dá para atualizar as bases pela
CLI e rodar ETL contra a Neon, **desde que o total fique sob o storage**, o
egress fique para o tráfego (não para build) e o compute caiba no mês.
Cargas parciais e incrementais, tabela a tabela, mantêm o consumo sob
controle.

Regra de ouro: **build e medição continuam no Postgres local** do home-pc;
a Neon é reserva de leitura para o runtime, não alvo de `next build`
(um build contra a Neon já levou HTTP 402).

## Riscos e regras

- **Não** apontar `next build` para a Neon (egress). Build é sempre no
  Postgres local.
- **Não** commitar a connection string da Neon. Ela mora fora do repo, no
  mesmo regime de `AI_API_KEY`.
- Fallback **registra** o banco que respondeu; não pode ser silencioso.
- Uma tabela vazia só derruba a página dela — a cadeia é por consulta, não
  global (uma tabela sem dado não muda o banco das outras).
- O plano D (home-pc) só funciona se houver caminho de rede do Guara até o
  Postgres do home-pc (túnel/proxy). Sem isso, `DATABASE_URL_HOMEPC` fica
  ausente e a cadeia cai em A→B→C.
