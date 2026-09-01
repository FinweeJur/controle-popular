# Arquitetura — controlepopular.com.br

> **Tipo:** ARQUITETURA
> **Domínio:** global
> **Última medição:** 2026-09-01
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [DESENVOLVIMENTO.md](../03-desenvolvimento/DESENVOLVIMENTO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [FONTES.md](../06-fontes/FONTES.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** payload, bundle, Cloudflare Workers, OpenNext, Neon, Drizzle, D1, compactacao, indice estatico, assistente, teto de asset

## Sumário

- [Propósito](#propósito)
- [Visão geral](#visão-geral)
- [Os dois tetos](#os-dois-tetos)
- [Regra de payload](#regra-de-payload)
- [Compactação de dado](#compactação-de-dado)
- [As três camadas de dado](#as-três-camadas-de-dado)
- [Regras de bundle](#regras-de-bundle)
- [Mapa de rotas](#mapa-de-rotas)
- [Banco de dados](#banco-de-dados)
- [Índice estático e assistente](#índice-estático-e-assistente)
- [Páginas modelo e perfis automáticos](#páginas-modelo-e-perfis-automáticos)
- [Radar Paraopeba](#radar-paraopeba)
- [Painel de edição](#painel-de-edição)
- [Código IBGE](#código-ibge)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

Descrever como o dado chega ao portal, onde os dois tetos de infraestrutura mandam, onde cada mecanismo mora e como escolher a camada de dado correta. Regras que não se negociam e armadilhas vivem no [`AGENTS.md`](/AGENTS.md); este documento é a estrutura.

## Visão geral

```
scripts/ (coletores)  →  apps/web/data/ (versionado)  →  opennextjs-cloudflare build  →  Cloudflare Workers
                             ↑                                        ↑
      Postgres local (home-pc) / Neon — Drizzle (lib/db/),      *.din.ts só entra no alvo Workers;
      lido no build, só onde a rota precisa                     *.local.* só existe em next dev
```

**O alvo principal é Cloudflare Workers com OpenNext — NÃO é `output: 'export'`.**
Publica-se com `npm run cf:deploy` (`opennextjs-cloudflare build && populateCache
remote && deploy`). O `output: 'export'` existe, mas só liga quando `PAGES_BASE_PATH`
está definido (`apps/web/next.config.ts:41-42,190`), que é o **alvo alternativo** do
GitHub Pages — hoje inviável por não caber no teto de 20 mil arquivos (ver
[`planos/deploy-github-pages.md`](../planos/deploy-github-pages.md)). Confundir os dois faz decidir payload pela
restrição errada.

- `apps/web/app/` — rotas (App Router). Hoje há 16 rotas `*.din.ts` (chat, busca, contratos, zap, classificados, coleta, moderação, anúncios, pageview), ignoradas pelo export estático.
- `apps/web/lib/` — lógica pura com teste ao lado; `data/` é lido no build; `scripts/` coleta e publica (`rotina-local.mts`).
- **As páginas são pré-renderizadas no build nos dois alvos** — nenhuma consulta banco em tempo de execução, e a tela abre com a Neon fora do ar. O que muda é o que sobra ao lado delas: no alvo Workers as 16 rotas `*.din.ts` existem e rodam em runtime; no export estático elas não entram.

**Stack medida em 2026-08-17:** Next.js 14 (App Router) + TypeScript + Tailwind + lucide-react, em `apps/web/`. Build roda na máquina `home-pc` e publica via `npx tsx scripts/sincronizar-e-publicar.mts`. Banco principal: Postgres serverless Neon (`@neondatabase/serverless` via HTTP, sem pool persistente — o autosuspend é o que mantém a cota Free). Drizzle ORM, 124 tabelas em 4 schemas (`public`, `congresso`, `judiciario`, `terras`) + 4 tabelas Better Auth. Banco de escritas ao vivo: Cloudflare D1 (SQLite) em `lib/db/schema.d1.ts` — `page_views`, `zap_estabelecimentos`, `classificados`, `anúncios`.

## Os dois tetos

| Teto | Valor | Consequência |
|---|---|---|
| Cloudflare Workers | 25 MiB por asset, 3 MiB gzip de bundle, 20.000 arquivos | rota pesada derruba o deploy; medir `.cache` antes de decidir |
| Neon (Postgres) | HTTP 402 até 2026-09-01 | sem banco não há `next build`; quem publica é o `home-pc`, com Postgres local. Esta máquina não builda nem mede `.cache` |

Consequência prática: tarefa que depende de medir rota ou ler o banco não anda nesta máquina — dizer isso em vez de estimar.

## Regra de payload

**Coleção nunca vai como props de componente de cliente.** Foi assim que `/ambiental/legislacao` chegou a 35,5 MiB contra o teto de 25 (medição em 16/08 — remeça antes de decidir com ele):

| | |
|---|---:|
| texto real das 15.318 ementas | 4,7 MiB |
| `.cache` gerado | 35,5 MiB |
| inflação | 7,5× |

O payload vai serializado duas vezes (HTML e RSC flight) e cada linha repete o nome de todos os campos — por isso a inflação, e por isso **constante importada pelo módulo cliente não paga nada** (entra uma vez no chunk, minificada, com gzip).

- Acima de ~2 mil linhas: serve do índice fatiado ou pagina no servidor.
- **`TabelaEstatica.tsx` é o mecanismo padrão**: busca, paginação e contagem no cliente sobre fatias. Medido em 16/08: 11 listas em 11 rotas o consomem (3 em Congresso, 8 em `[municipio]`) — siga uma delas, não invente mecanismo novo (medição em 16/08 — remeça antes de decidir com ele).
- Fatias: `lib/estatico/fatiar.ts` + `emitir.ts` geram grupos com `manifesto.json`, remontados no navegador com progresso em bytes.

## Compactação de dado

As duas implementações aplicam a mesma técnica — **esqueleto + rótulos internados** — a formatos diferentes, e são **intencionalmente diferentes**:

| Implementação | Formato | Ganho medido |
|---|---|---|
| `lib/comunicabr/arquivo.ts` | esqueleto nacional compartilhado + codec específico do ComunicaBR: o texto é nacional, o número é municipal; `rotulos`, `esqueletos` (com assinatura anti-desalinhamento) e valores esparsos `v` | 853 municípios: 99 MiB → **2,16 MB** (`public/data/comunicabr-31.json` em disco — movido de `data/` em 16/08 para sair do bundle do Worker via Assets binding, ver `lib/comunicabr/mg.ts`) |
| `lib/estatico/compactar.ts` | tabela plana genérica: esqueleto + dicionário, com a decisão de internar **medida por coluna** (internar errado aumenta o arquivo) | Rouanet: 7,9 MB → 2,4 MB (−69%); 7.206 projetos + 20.784 incentivadores |

**Decisão documentada: não unificar.** As duas nasceram em sessões que não se viram, mas cada uma serve a um formato — a do ComunicaBR carrega um esqueleto nacional com assinatura; a genérica decide coluna a coluna. Unificá-las descartaria exatamente a especialização que levou 99 MiB a 2,16 MB. Números em 16/08 — remeça antes de decidir com eles.

## As três camadas de dado

Todo dado cai em UMA das três camadas. Escolher a errada = payload errado no Worker.

### 1. TS inline (dados gerados por coletores)

Arquivos `.ts` com arrays grandes gerados por scripts em `scripts/` (Python/`.mts`). Ex.: `lib/paraopeba/auditoria-ajri.ts` (336 KiB), `execucao-fgv.ts` (226 KB), `clipping*.ts`, `documentos.ts` (586 KB), `betim.ts`, `congresso.ts`, `comunicabr/` (parcialmente migrado para JSON).

**REGRAS para este tipo**:
- Páginas **servidor** que só mostram contagens NUNCA importam o array — importam uma **cobertura literal** (`COBERTURA_*`), constante pequena com comentário explicando o porquê.
- Coberturas existentes: `COBERTURA_DOCUMENTOS_PROCESSO` (documentos.ts), `COBERTURA_CLIPPING` (149), `COBERTURA_CLIPPING_ATI` (46), `COBERTURA_CLIPPING_IJ` (59), `COBERTURA_AUDITORIA_AJRI` (467/391/76, 7 instrumentos, 25 temas), `COBERTURA_EXECUCAO_FGV` (26 municípios, 234 projetos).
- **Paridade obrigatória**: cada cobertura tem teste em `lib/paraopeba/dados.test.ts` (describe "as coberturas literais batem com o array real"). Regenerou o acervo e a contagem mudou → o teste falha → atualiza a cobertura.
- Arrays só são importados por **client components** (`*Client.tsx`), que vão ao bundle do cliente — sem teto de 3 MiB gzip.
- Exceção legítima: `app/paraopeba/execucao/page.tsx` importa os arrays de propósito (monta tabela no servidor, design zero-JS documentado no topo do arquivo).

### 2. JSON em `public/data/` lido via ASSETS.fetch

Arquivos grandes fora do bundle, lidos com `ASSETS.fetch()` + fallback `readFileSync` (padrão de `lib/comunicabr/mg.ts`). Migrados: `repasse-brumadinho-mg.json`, `biblioteca-ati.json`, `risco-climatico.json`, `comunicabr-31.json`.

**⚠️ LIÇÃO CRÍTICA (medida, ver `historico/HANDOFF-PAYLOAD-LEGISLACAO.md`)**: mover o arquivo para `public/data/` e usar ASSETS.fetch **NÃO tira o arquivo do bundle** — o `@vercel/nft` segue o caminho estático do `readFileSync` do fallback (mesmo dentro de catch/if) e embute. O **único** mecanismo que remove é `outputFileTracingExcludes` no `next.config.ts`. Medido: só mover o caminho → 3.074,71 → 3.074,74 KiB gzip; com excludes → -687,9 KiB (comunicabr).

Excludes ativos em `apps/web/next.config.ts`:
- `/dados/comunicabr` e `/dados/comunicabr/[codigo]` → `public/data/comunicabr-31.json`
- `/paraopeba` e `/paraopeba/biblioteca` → `public/data/biblioteca-ati.json`
- `/[municipio]/prefeitura` → `public/data/repasse-brumadinho-mg.json`
- `/[municipio]/clima` → `public/data/risco-climatico.json`

Consumidores únicos verificados: repasse → `/[municipio]/prefeitura`; risco → `/[municipio]/clima`; biblioteca → `/paraopeba` + `/paraopeba/biblioteca`.

### 3. Postgres (Neon) + D1

- Neon: ETL/build + dados históricos. Acesso por `lib/db/client.ts` (`getDb()` retorna `null` sem `DATABASE_URL` — página renderiza estado vazio, nunca lança; isso permite build sem banco).
- Local: se `DATABASE_URL` aponta para `localhost`, troca para `pg` via `process.getBuiltinModule` (escondido do bundler — `pg` é devDependency). Caminho só roda em build.
- D1: `lib/db/clientD1.ts` — escritas de runtime.
- NUNCA passar `fetchOptions: { cache: "no-store" }` no driver HTTP: mata a estaticização (`DYNAMIC_SERVER_USAGE`). Cache entre builds é problema de `npm run prebuild`.
- Teto de 50 subrequests por invocação no Workers Free: página deve fazer 1-2 selects com join/CTE, nunca N+1.

## Regras de bundle

1. Client bundle não tem teto — só o bundle do **servidor** importa.
2. `readFileSync` de caminho estático em código de servidor = candidato a inlining pelo nft.
3. Assinatura de import em módulo de dado: `import * as x` impede tree-shaking — sempre named imports (commit `2ac2440` corrigiu 50 arquivos).
4. Barril `lib/paraopeba/index.ts` re-exporta módulos leves; módulos pesados (`biblioteca.ts` (fs), `auditoria-ajri.ts`, `execucao-fgv.ts`) ficam fora do barril de propósito — páginas importam direto, e páginas server só importam as coberturas.
5. `lib/terras/camadas.ts` (45,9 MB, readFileSync+gunzipSync) usa nome de arquivo por **parâmetro de função** → nft não resolve → não embute (raciocínio, não medido).
6. Estado do payload em 2026-08-17: comunicabr 687,9 KiB excluído; repasse 21,5 + biblioteca 27,4 + risco 46,2 KiB excluídos (~95,1 KiB gzip liberados); coberturas livram a home e `/paraopeba/clipping` e `/paraopeba/auditoria` de ~1,1 MiB de arrays. **Pendente: medir o bundle real no deploy home-pc.**

## Mapa de rotas

### Raiz e institucional
`/`, `/sobre`, `/termos`, `/busca` (índice estático client-side em `lib/busca/`), `/assistente`.

### Municípios — `app/[municipio]/`
`/`, `admin`, `agro`, `anuncie`, `assistente`, `camara` (+ `comissoes`, `legislacao`, `proposicoes`, `votacoes`), `citrolandia`, `clima`, `coleta-lixo`, `compra-e-venda`, `contatos`, `dados`, `defesa-civil`, `economia`, `educacao`, `emendas`, `grupos-economicos`, `infraestrutura`, `legislacao`, `links-uteis-mg`, `meio-ambiente`, `metodologia`, `mineracao`, `noticias`, `plantao-farmacias`, `postos-combustivel`, `prefeitura`, `privacidade`, `rede-de-protecao`, `saude`, `seguranca`, `servicos`, `sobre`, `social`, `supermercados-farmacias`, `terras`, `vereadores/[slug]`, `zap`, `zap-betim`.

Tabela de municípios: `lib/db/queries/municipios.ts` (`listarCidades()` usa cache dentro do build — 1 consulta em vez de 110).

### Ambiental — `app/ambiental/`
`barragens`, `copam`, `direito-critico`, `legislacao`, `licenciamento`, `patrimonio-cultural`.

### Congresso — `app/congresso/`
`/`, `agenda`, `alertas`, `bancadas`, `comissoes`, `metodologia`, `parlamentares`, `proposicoes`, `votacoes`.

### Judiciário — `app/judiciario/`
`/`, `indicacoes`, `metodologia`, `privacidade`, `sobre`, `tribunais`, `vagas`.

### Função social da terra — `app/funcaosocialterra/`
`/`, `alertas`, `mapa`.

### Paraopeba — `app/paraopeba/`
`/` (home, coberturas), `auditoria`, `auxilio`, `biblioteca`, `clipping`, `documentos`, `entenda`, `execucao`, `linha-do-tempo`, `quem-atua`.

## Banco de dados

- `lib/db/` — Drizzle: `schema.ts` + `relations.ts` + `client.ts` (Postgres), com `queries/` por domínio.
- `CIDADES_DO_BUILD` é módulo, não prop — mesma razão do catálogo do assistente.
- Leitura do Postgres acontece no build; acesso degrada a `null` fora do contexto certo em vez de quebrar rota.
- Além do Postgres há o **D1** (`schema.d1.ts` + `clientD1.ts`): as escritas ao vivo (pageview, zap, clique, classificados, moderação) vivem nele, como binding do Worker — fora do Worker devolve `null`.

### Estado e recomendações do banco

Fonte: `lib/db/schema.ts` (123 KB, introspectado do Neon via drizzle-kit) + `lib/db/queries/` (14 arquivos).

**O que já existe de bom:**
- Full-text em português com unaccent: 4 índices GIN tsvector.
- pgvector: `public.embeddings` e `congresso.embeddings` (vector 384) com HNSW `vector_cosine_ops` — RAG em produção.
- Trigram: `congresso.parlamentares.nome` com GIN `gin_trgm_ops`.
- Índices compostos bem pensados por município.
- Sem soft-delete: padrão é flag `ativo`/`aprovado` — coerente, manter.

**Lacunas (prioridade para eficiência):**
- ILIKE sem índice em colunas quentes (36 ocorrências em `queries/`).
- Tabelas sem índice além do PK: `diarias`, `fornecedores`, `municipios`, `emendas`, `doacoes_campanha`, `obras`, etc.
- FKs de join sem índice.
- `diarias.chave_natural` existe mas não é unique.
- Colunas de texto longo sem índice.
- JSONB sem GIN (13 tabelas com jsonb, zero `gin(jsonb_ops)`).

## Índice estático e assistente

O assistente é uma escada de quatro degraus, e cada degrau só é acionado quando o anterior não resolve — a tela diz qual respondeu:

| Degrau | O que resolve | Estado |
|---|---|---|
| 0 — rota direta | "saúde em BH" → `/bh/saude` | **no ar** |
| 1 — índice estático | "onde fala de barragem em Brumadinho" — busca no índice da `/busca` | **no ar** |
| 2 — composição determinística | "compare Betim e Contagem" — regra escrita sobre respostas do degrau 1 | **no ar** (16/08) |
| 3 — LLM | pergunta livre que os anteriores não casaram; chave opcional | não iniciado |

- **Catálogo** (`lib/assistente/catalogo.ts`): 241 destinos como **constante de módulo** importada pelo cliente, nunca como prop — cabe em ~2,4 KiB gzip (medição em 16/08).
- **Navegação** (`navegacao.ts`): `interpretar()` devolve candidatos (máx. 8), nunca um palpite único; vazio é resposta. Sem rede, sem banco.
- **Documentos** (`documentos.ts`): o degrau 1 carrega o índice sob demanda, **uma vez por sessão**, e interrompe de verdade (`AbortController`).
## Páginas modelo e perfis automáticos

Toda página gerada automaticamente (seja de acervo geral ou de perfil/detalhamento dinâmico como empresas, contratos, vereadores, proposições ou editais) **DEVE obrigatoriamente incluir**:

1. **Sumário & Índice da Página (TOC)**: Bloco no topo com hiperlinks âncora navegáveis para cada seção.
2. **Notícias e Alertas Relacionados**: Bloco com o clipping recente de matérias do radar diário ligadas ao objeto/entidade.
3. **Páginas Relacionadas e Botões de Navegação**: Links responsivos (`← Item Anterior` e `Próximo Item →`) permitindo folhar todo o acervo.
4. **Footer Design Institucional**: Rodapé padrão padronizado com selo de transparência passiva (`<PedidoLAI />`) e garantia editorial.
5. **Garantia Editorial**: Isenção explícita de acusação e citação transparente da origem oficial dos dados (CVM, SEC EDGAR, US Census, ANM, PNCP).

Templates de prompt para agendamento dos agentes offline:
- Modelo A (Acervo Geral): `scripts/prompts/template-agente-modelo.md`
- Modelo B (Perfil / Detalhamento Dinâmico): `scripts/prompts/template-agente-detalhamento.md`

## Radar Paraopeba

- **Coleta de notícias**: coletor diário grava `data/noticias-paraopeba.json` (título, veículo, data e link — nunca o corpo da matéria), lido no build por `lib/paraopeba/radar.ts`. Fontes: MAB, Agência Brasil, Google Notícias e os feeds das 3 ATIs (AEDAS, ADAI, Guaicuy); TJMG e MPMG ficaram fora — os RSS respondem 404 — e a tela mostra a lacuna. Volume total do bloco: 254 itens (149 clipping + 46 ATIs + 59 radar) (medição em 16/08).
- **Triagem de dado pessoal** (`lib/paraopeba/triagem.ts`): régua dedicada ao acervo da Plataforma Brumadinho UFMG.
- **Três ATIs**: AEDAS (Regiões 1 e 2), NACAB (Região 3) e Guaicuy (Regiões 4 e 5).

## Painel de edição

- Rota `/painel` e API `/api/painel/*` só existem em `next dev` (`PAINEL_LOCAL=1`; extensões `.local.*` ficam fora do build).
- `PAINEL_TOKEN` vive em `apps/web/.env.local` — **nunca versionado**; sem ele a API nega tudo (fail-closed).
- A edição grava `data/edicoes.json` — **dado versionado**, mesmo formato do editor de linha de comando.

## Código IBGE

- O de 6 dígitos é o de 7 **sem o dígito verificador**: Betim é `3106705` (7) / `310670` (6); `3106200` é **Belo Horizonte**.
- **Casamento por código, nunca por nome** — a grafia diverge entre tabelas oficiais.

## Decisões registradas

- **Alvo principal é Cloudflare Workers com OpenNext, não `output: export`.**
- **Coleção nunca como props de componente de cliente.**
- **Não unificar as duas compactações** (`lib/comunicabr/arquivo.ts` × `lib/estatico/compactar.ts`).
- **JSON grande só sai do bundle com `outputFileTracingExcludes`** — mover para `public/data/` não basta.
- **Páginas server importam coberturas literais (`COBERTURA_*`), nunca arrays inteiros.**
- **`ARQUITETURA.md` absorve `MAPA-APLICACAO.md`** — fusão executada em 22/08/2026.

## Origem

Documentos absorvidos por esta página:

- `04-arquitetura/MAPA-APLICACAO.md` — **FUNDIDO** (conteúdo técnico detalhado absorvido).
- `docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md` — absorvido (lição crítica do payload).
- `docs/planos/PLANO-INDICE-ESTATICO-E-ASSISTENTE.md` — **ATIVO** → `docs/planos/`.
