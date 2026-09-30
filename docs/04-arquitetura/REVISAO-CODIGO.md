# Revisão de código e onboarding

> **Tipo:** ARQUITETURA
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [ARQUITETURA.md](ARQUITETURA.md), [ESTADO.md](../02-estado/ESTADO.md), [PLANO-FALLBACK-BANCO.md](../planos/PLANO-FALLBACK-BANCO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** revisao, onboarding, codigo, camadas, banco, drizzle, comBancoReserva, sanitizacao, seguranca, divida, indice

## Sumário

- [Propósito](#propósito)
- [Método](#método)
- [Mapa de camadas](#mapa-de-camadas)
- [Parte 1 — camada de dados (lib/db)](#parte-1--camada-de-dados-libdb)
- [Achados e dívidas](#achados-e-dívidas)
- [Fila de revisão](#fila-de-revisão)
- [Decisões registradas](#decisões-registradas)

## Propósito

O código cresceu para mais de 50 módulos de `lib/` e 45 áreas de rota. Este
documento é o **índice da revisão e do onboarding por micro-partes**: para
cada módulo, o que ele é, de onde vem o dado, como se liga ao resto e o que
ainda pede revisão. Não é cópia do código — é ponteiro com link direto para a
fonte.

Serve a duas perguntas: “por onde um módulo novo se encaixa?” e “o que está
frágil aqui?”. As regras duras (commit, dado pessoal, deploy) continuam no
[`AGENTS.md`](/AGENTS.md); a arquitetura de alto nível, no
[ARQUITETURA.md](ARQUITETURA.md).

## Método

Economia é regra, não preguiça ([ESTRATEGIA-ECONOMIA-TOKENS](../planos/ESTRATEGIA-ECONOMIA-TOKENS.md)):

- **Uma camada por rodada.** Lê-se o módulo, não o repositório.
- **Foco na consequência**, não na categoria: o que pode publicar número
  errado, vazar dado pessoal ou quebrar a edição por outra pessoa
  (skill `revisar-seguranca-cp`).
- **Cada achado é confirmado no código** antes de virar linha aqui.
- **Módulo já bem documentado não se reescreve** — ganha link e entra na
  tabela. A regra de comentário de arquivo é a do AGENTS § 5.9.

## Mapa de camadas

| Camada | Caminho | Papel | Estado da revisão |
|---|---|---|---|
| Rotas | [`app/`](../../apps/web/app) | App Router: páginas, API, payload | ⏳ na fila |
| Lógica | [`lib/`](../../apps/web/lib) | Regras puras por frente, testadas ao lado | ⏳ na fila |
| Dados | [`lib/db/`](../../apps/web/lib/db) | Drizzle, conexão, reserva, queries | ✅ **Parte 1 (este doc)** |
| Coleta | [`scripts/`](../../scripts) | Coletores, ETL, rotinas | ⏳ na fila |
| Dado versionado | [`data/`](../../apps/web/data) | JSON lido no build (compactado) | ⏳ na fila |

## Parte 1 — camada de dados (lib/db)

Esta camada é a única que fala com o Postgres. Ela tem três níveis: conexão,
schema e consultas.

### Conexão e reserva

| Módulo | Papel |
|---|---|
| [client.ts](../../apps/web/lib/db/client.ts) | Abre a conexão e escolhe o driver pelo host: Neon (HTTP), Guara ou Postgres local. `getDb()` e `criarConexao(url)`. |
| [reserva.ts](../../apps/web/lib/db/reserva.ts) | `comBancoReserva`: roda a consulta no plano A (Guara) e, se vier **vazia ou com erro**, na MESMA consulta no Neon (B) e no home-pc (D). |
| [clientD1.ts](../../apps/web/lib/db/clientD1.ts) | Acesso ao D1 (SQLite), banco separado das escritas ao vivo. |
| [d1-http.ts](../../apps/web/lib/db/d1-http.ts) | Binding que imita a superfície `drizzle-orm/d1` sobre HTTP. |

**Por que a reserva é por consulta, e não por conexão:** medido em 30/09 — o
Postgres do Guara **conecta, mas está vazio** quando o ETL não rodou contra
ele. `getDb()` só troca de banco quando a *conexão* falha, então o sintoma era
“ainda não rodou contra este banco” com o dado existindo no Neon. A troca por
consulta resolve o caso real. Ver [PLANO-FALLBACK-BANCO.md](../planos/PLANO-FALLBACK-BANCO.md).

### Schema e ORM

| Módulo | Papel |
|---|---|
| [schema.ts](../../apps/web/lib/db/schema.ts) | ~90 tabelas Postgres, geradas por `drizzle-kit introspect`. **Gerado — não editar à mão.** |
| [relations.ts](../../apps/web/lib/db/relations.ts) | Relações do Drizzle. **Gerado — não editar à mão.** |
| [schema.d1.ts](../../apps/web/lib/db/schema.d1.ts) | Schema do D1 (SQLite), separado do Postgres. |
| [schema-autorizacoes.ts](../../apps/web/lib/db/schema-autorizacoes.ts) | Imóveis da União em MG (SPU). |
| [schema-cidades-mg.ts](../../apps/web/lib/db/schema-cidades-mg.ts) | Cidades e polos regionais de MG. |
| [schema-conselhos.ts](../../apps/web/lib/db/schema-conselhos.ts) | Conselhos sociais e colegiados. |
| [schema-outorgas.ts](../../apps/web/lib/db/schema-outorgas.ts) | Outorgas de água (licenciamento hídrico de MG). |
| [schema-ppp.ts](../../apps/web/lib/db/schema-ppp.ts) | Concessões e PPPs de MG. |
| [auth-schema.ts](../../apps/web/lib/db/auth-schema.ts) | Tabelas do Better Auth. |
| [num.ts](../../apps/web/lib/db/num.ts) | Lê coluna `numeric` como número JS (o driver devolveria string). |
| [ordem.ts](../../apps/web/lib/db/ordem.ts) | Ordena texto em português (`COLLATE`/`locale`). |

### Consultas — `queries/`

Toda função de leitura recebe o contexto primeiro (cidade, eixo) e a maioria
já passa pela **cadeia de reserva** (`comBancoReserva`). A coluna “Reserva”
abaixo diz se o módulo cai para o Neon/home-pc quando o Guara vem vazio.

| Módulo | Papel | Fonte oficial | Reserva |
|---|---|---|---|
| [ambiental-licenciamento.ts](../../apps/web/lib/db/queries/ambiental-licenciamento.ts) | Licenças ambientais de MG | SEMAD/MG | ✅ |
| [barragens.ts](../../apps/web/lib/db/queries/barragens.ts) | Barragens de MG (estaduais) | FEAM + SNISB (ANA) | ✅ |
| [betim.ts](../../apps/web/lib/db/queries/betim.ts) | Eixo Cidades: contratos, vereadores, saúde, educação | Prefeituras e câmaras | ✅ |
| [condicionantes.ts](../../apps/web/lib/db/queries/condicionantes.ts) | Condicionantes de licenças | SEMAD/MG | ✅ |
| [congresso.ts](../../apps/web/lib/db/queries/congresso.ts) | Proposições, votações, bancadas, agenda | Câmara e Senado (dados abertos) | ✅ |
| [copam.ts](../../apps/web/lib/db/queries/copam.ts) | Reuniões e pauta do COPAM | COPAM/SEMAD-MG | ✅ |
| [direito-critico.ts](../../apps/web/lib/db/queries/direito-critico.ts) | Legislação e precedentes críticos | ver cabeçalho do módulo | ✅ |
| [judiciario.ts](../../apps/web/lib/db/queries/judiciario.ts) | Tribunais, cadeiras, vagas, nomeações | Tribunais, CNJ, Senado | ✅ |
| [legislacao-ambiental.ts](../../apps/web/lib/db/queries/legislacao-ambiental.ts) | Normas ambientais (3 fontes) | ver cabeçalho do módulo | ✅ |
| [patrimonio-tombado.ts](../../apps/web/lib/db/queries/patrimonio-tombado.ts) | Patrimônio cultural tombado | ver cabeçalho do módulo | ✅ |
| [risco-direitos.ts](../../apps/web/lib/db/queries/risco-direitos.ts) | Agregador do índice de Risco a Direitos | cálculo sobre o banco | ✅ |
| [terras.ts](../../apps/web/lib/db/queries/terras.ts) | Rollup do pipeline terras-devolutas | projeto terras-devolutas | ✅ |

Fora da reserva, de propósito:

| Módulo | Papel | Por que não tem reserva |
|---|---|---|
| [municipios.ts](../../apps/web/lib/db/queries/municipios.ts) | Registro das cidades atendidas | Tem fallback próprio: a lista congelada no build (`cidades-do-build`) cobre o caso de banco fora do ar. |
| [betim-escritas.ts](../../apps/web/lib/db/queries/betim-escritas.ts) | Escritas Postgres (legado) | Escrita. Reserva é só para leitura pública. Usada só por paridade. |
| [betimD1.ts](../../apps/web/lib/db/queries/betimD1.ts) | Escritas ao vivo no D1 | Escrita em outro banco. Ler num e escrever noutro dividiria o estado. |
| [cidades-do-build.ts](../../apps/web/lib/db/cidades-do-build.ts) | Lista de cidades congelada | Gerado por script; é justamente o fallback de `municipios.ts`. |

## Achados e dívidas

Confirmados no código nesta rodada:

1. **Fallback incompleto fechado (30/09).** `congresso.ts` (40 leituras) e
   `betim.ts` (98 leituras) eram os módulos grandes ainda fora da cadeia.
   Agora entram. Com isso, **12 dos 15 módulos de `queries/` usam
   `comBancoReserva`**; os 3 restantes são escritas, D1 ou fallback próprio.
   Commits `74899fbf` (congresso) e `b7b250be` (betim).

2. **`schema.ts` e `relations.ts` sem marcador de gerado.** São saída de
   `drizzle-kit introspect` (`out: ./lib/db` em
   [drizzle.config.ts](../../apps/web/drizzle.config.ts)). Um leitor pode
   editá-los à mão e perder a edição no próximo introspect. **Higiene:**
   emitir um cabeçalho “GERADO POR — NÃO EDITE” no gerador, como já faz
   `cidades-do-build.ts`.

3. **Duas trilhas de escrita.** `betim-escritas.ts` (Postgres, legado, só
   paridade) e `betimD1.ts` (D1, escritas ao vivo). Enquanto as duas
   existirem, cada mudança de escrita pode divergir. Registrar qual é a
   canônica por operação antes de mexer.

4. **Segurança — piso confirmado.** Sem `sql.raw` nem `.raw(` em `lib/db`:
   os templates `sql\`\`` são parametrizados, então injeção é impossível por
   construção. Admin falha fechando; escrita pública nasce `aprovado:
   false`. O risco real do projeto é **dado pessoal**, e as defesas vivem no
   caminho do dado (`apps/web/lib/sem-cpf-no-repo.test.ts`,
   `scripts/checar-dado-pessoal-em-dado.py`), não no código-fonte.

5. **`getDb` direto (sem reserva).** Sobra em `betim-escritas.ts`,
   `betimD1.ts`, `municipios.ts` e nas funções por USUÁRIO de `judiciario.ts`
   (`monitoramentosDoUsuario`, `alertasDoUsuario`, `criarMonitoramento`) —
   todas corretas por natureza, não são leitura pública.

## Fila de revisão

Próximas micro-partes, por risco e retorno:

| # | Micro-parte | Por quê |
|---|---|---|
| 1 | `lib/assistente/` (RAG do Seu Nonô) | Prompt, abstenção, dado pessoal em contexto. |
| 2 | `lib/betim/` | Muitas regras de negócio e a maior frente. |
| 3 | `app/` — rotas que leem banco | Payload, teto do Worker, `.din.ts`. |
| 4 | `scripts/` — coletores e ETL | Rate limit, User-Agent honesto, `robots.txt`. |
| 5 | `lib/ambiental/`, `lib/paraopeba/`, `lib/terras/`, `lib/judiciario/`, `lib/congresso/` | Frentes com cálculo próprio. |
| 6 | `app/components/` | Acessibilidade (leitor sob estresse). |
| 7 | Compactação dupla | `lib/comunicabr/arquivo.ts` e `lib/estatico/compactar.ts`: duas implementações deliberadas — não unificar sem remedir. |

## Decisões registradas

- **Reserva por consulta, não por conexão** — o caso real é banco conectado e
  vazio, não conexão caída (ver [reserva.ts](../../apps/web/lib/db/reserva.ts)).
- **Leitura pública entra na cadeia; escrita e dado por usuário nunca** —
  senão lê de um banco e escreve em outro, e o estado do usuário se divide.
- **Revisão por micro-partes, uma camada por rodada** — lê-se o módulo, não o
  repositório.
- **Achado sem confirmação no código não entra aqui** — a ordem se decide por
  consequência, não por categoria.
