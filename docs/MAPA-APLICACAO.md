# Mapa técnico da aplicação — Leilões.app / controle-popular

> Relatório consolidado em 2026-08-17, ao fim da reavaliação de código (payload, bundle e banco).
> Objetivo: documentar os caminhos atuais do app para que as próximas sessões de desenvolvimento
> não precisem reanalisar o código. Quando algo mudar, atualize este documento.

## 1. Stack e deploy

- **App**: Next.js 14 (App Router) + TypeScript + Tailwind + lucide-react, em `apps/web/`.
- **Deploy**: Cloudflare Workers **com OpenNext** (`next.config.ts` tem `outputFileTracingExcludes`; NÃO é `output: export`). Build roda na máquina home-pc e publica via `npx tsx scripts/sincronizar-e-publicar.mts`.
- **Banco principal**: Postgres serverless **Neon** (`@neondatabase/serverless` via HTTP, sem pool persistente — o autosuspend é o que mantém a cota Free). Drizzle ORM, 124 tabelas em 4 schemas (`public`, `congresso`, `judiciario`, `terras`) + 4 tabelas Better Auth.
- **Banco de escritas ao vivo**: **Cloudflare D1** (SQLite) em `lib/db/schema.d1.ts` — `page_views`, `zap_estabelecimentos`, `classificados`, `anuncios`. O Postgres é o banco do ETL/build; o D1 é o banco de runtime para conteúdo moderado.
- **Testes**: Vitest (`npx vitest run`), 49 arquivos, 699 testes verdes. Typecheck: `npx tsc --noEmit`.
- **Lint**: ESLint tem 2.091 erros pré-existentes no repo todo — só checar arquivos tocados: `npx eslint <files>`. Erros conhecidos e aceitos: `no-html-link-for-pages` (breadcrumbs/footers usam `<a>` de propósito).

## 2. As três camadas de dados

Todo dado cai em UMA das três camadas. Escolher a errada = payload errado no Worker.

### 2.1. TS inline (dados gerados por coletores)

Arquivos `.ts` com arrays grandes gerados por scripts em `scripts/` (Python/`.mts`). Ex.: `lib/paraopeba/auditoria-ajri.ts` (336 KiB), `execucao-fgv.ts` (226 KB), `clipping*.ts`, `documentos.ts` (586 KB), `betim.ts`, `congresso.ts`, `comunicabr/` (parcialmente migrado para JSON).

**REGRAS para este tipo**:
- Páginas **servidor** que só mostram contagens NUNCA importam o array — importam uma **cobertura literal** (`COBERTURA_*`), constante pequena com comentário explicando o porquê.
- Coberturas existentes: `COBERTURA_DOCUMENTOS_PROCESSO` (documentos.ts), `COBERTURA_CLIPPING` (149), `COBERTURA_CLIPPING_ATI` (46), `COBERTURA_CLIPPING_IJ` (59), `COBERTURA_AUDITORIA_AJRI` (467/391/76, 7 instrumentos, 25 temas), `COBERTURA_EXECUCAO_FGV` (26 municípios, 234 projetos).
- **Paridade obrigatória**: cada cobertura tem teste em `lib/paraopeba/dados.test.ts` (describe "as coberturas literais batem com o array real"). Regenerou o acervo e a contagem mudou → o teste falha → atualiza a cobertura.
- Arrays só são importados por **client components** (`*Client.tsx`), que vão ao bundle do cliente — sem teto de 3 MiB gzip.
- Exceção legítima: `app/paraopeba/execucao/page.tsx` importa os arrays de propósito (monta tabela no servidor, design zero-JS documentado no topo do arquivo).

### 2.2. JSON em `public/data/` lido via ASSETS.fetch

Arquivos grandes fora do bundle, lidos com `ASSETS.fetch()` + fallback `readFileSync` (padrão de `lib/comunicabr/mg.ts`). Migrados: `repasse-brumadinho-mg.json`, `biblioteca-ati.json`, `risco-climatico.json`, `comunicabr-31.json`.

**⚠️ LIÇÃO CRÍTICA (medida, ver `docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md`)**: mover o arquivo para `public/data/` e usar ASSETS.fetch **NÃO tira o arquivo do bundle** — o `@vercel/nft` segue o caminho estático do `readFileSync` do fallback (mesmo dentro de catch/if) e embute. O **único** mecanismo que remove é `outputFileTracingExcludes` no `next.config.ts`. Medido: só mover o caminho → 3.074,71 → 3.074,74 KiB gzip; com excludes → -687,9 KiB (comunicabr).

Excludes ativos em `apps/web/next.config.ts`:
- `/dados/comunicabr` e `/dados/comunicabr/[codigo]` → `public/data/comunicabr-31.json`
- `/paraopeba` e `/paraopeba/biblioteca` → `public/data/biblioteca-ati.json`
- `/[municipio]/prefeitura` → `public/data/repasse-brumadinho-mg.json`
- `/[municipio]/clima` → `public/data/risco-climatico.json`

Consumidores únicos verificados: repasse → `/[municipio]/prefeitura`; risco → `/[municipio]/clima`; biblioteca → `/paraopeba` + `/paraopeba/biblioteca`.

### 2.3. Postgres (Neon) + D1

- Neon: ETL/build + dados históricos. Acesso por `lib/db/client.ts` (`getDb()` retorna `null` sem `DATABASE_URL` — página renderiza estado vazio, nunca lança; isso permite build sem banco).
- Local: se `DATABASE_URL` aponta para `localhost`, troca para `pg` via `process.getBuiltinModule` (escondido do bundler — `pg` é devDependency). Caminho só roda em build.
- D1: `lib/db/clientD1.ts` — escritas de runtime.
- NUNCA passar `fetchOptions: { cache: "no-store" }` no driver HTTP: mata a estaticização (`DYNAMIC_SERVER_USAGE`). Cache entre builds é problema de `npm run prebuild`.
- Teto de 50 subrequests por invocação no Workers Free: página deve fazer 1-2 selects com join/CTE, nunca N+1.

## 3. Regras de bundle (Worker = 3 MiB gzip)

1. Client bundle não tem teto — só o bundle do **servidor** importa.
2. `readFileSync` de caminho estático em código de servidor = candidato a inlining pelo nft.
3. Assinatura de import em módulo de dado: `import * as x` impede tree-shaking — sempre named imports (commit `2ac2440` corrigiu 50 arquivos).
4. Barril `lib/paraopeba/index.ts` re-exporta módulos leves; módulos pesados (`biblioteca.ts` (fs), `auditoria-ajri.ts`, `execucao-fgv.ts`) ficam fora do barril de propósito — páginas importam direto, e páginas server só importam as coberturas.
5. `lib/terras/camadas.ts` (45,9 MB, readFileSync+gunzipSync) usa nome de arquivo por **parâmetro de função** → nft não resolve → não embute (raciocínio, não medido).
6. Estado do payload em 2026-08-17: comunicabr 687,9 KiB excluído; repasse 21,5 + biblioteca 27,4 + risco 46,2 KiB excluídos (~95,1 KiB gzip liberados); coberturas livram a home e `/paraopeba/clipping` e `/paraopeba/auditoria` de ~1,1 MiB de arrays. **Pendente: medir o bundle real no deploy home-pc.**

## 4. Mapa de rotas (App Router, `apps/web/app/`)

### Raiz e institucional
`/` (home), `/sobre`, `/termos`, `/busca` (índice estático client-side em `lib/busca/`), `/assistente`.

### Municípios — `app/[municipio]/`
`/`, `admin`, `agro`, `anuncie`, `assistente`, `camara` (+ `comissoes`, `legislacao`, `proposicoes`, `votacoes`), `citrolandia`, `clima` (→ `risco-climatico.json`), `coleta-lixo`, `compra-e-venda`, `contatos`, `dados`, `defesa-civil`, `economia`, `educacao`, `emendas`, `grupos-economicos`, `infraestrutura`, `legislacao` (+ `alertas`, `bons-exemplos`), `links-uteis-mg`, `meio-ambiente` (+ `autuacoes`, `barragens`, `paraopeba`), `metodologia`, `mineracao`, `nota-betim`, `nota-transparencia`, `noticias` (+ `[slug]`), `plantao-farmacias`, `postos-combustivel`, `prefeitura` (+ `contratos`, `despesas`, `diarias`, `legislacao`, `licitacoes`, `obras`, `servidores`), `privacidade`, `rede-de-protecao`, `saude`, `seguranca`, `servicos`, `sobre`, `social`, `supermercados-farmacias`, `terras`, `vereadores/[slug]`, `zap`, `zap-betim`.
Tabela de municípios: `lib/db/queries/municipios.ts` (`listarCidades()` usa cache dentro do build — 1 consulta em vez de 110).

### Ambiental — `app/ambiental/`
`barragens` (+ `municipio/[idIbge]`), `copam` (+ `municipio/[idIbge]`, `reuniao/[idFonte]`), `direito-critico`, `legislacao`, `licenciamento` (+ `municipio/[idIbge]`), `patrimonio-cultural`.

### Congresso — `app/congresso/`
`/` , `agenda`, `alertas`, `bancadas` (+ `[id]`), `bons-exemplos`, `comissoes` (+ `[sigla]`), `metodologia`, `parlamentares` (+ `[id]`), `proposicoes` (+ `[id]`, `[id]/oficio`), `votacoes`.

### Judiciário — `app/judiciario/`
`/`, `indicacoes`, `metodologia`, `privacidade`, `sobre`, `tribunais` (+ `[sigla]`), `vagas`.

### Dados — `app/dados/`
`comunicabr` (+ `[codigo]` → `public/data/comunicabr-31.json`), `populares`.

### Direitos em movimento — `app/direitos-em-movimento/`
`/`, `ajuda`, `denuncia`, `informacao`.

### Função social da terra — `app/funcaosocialterra/`
`/`, `alertas`, `mapa`.

### Paraopeba — `app/paraopeba/`
`/` (home, coberturas + `coberturaBiblioteca()` async), `auditoria` (server conta via `COBERTURA_AUDITORIA_AJRI`; `AuditoriaClient` filtra no cliente), `auxilio`, `biblioteca` (async ASSETS.fetch), `clipping` (server só coberturas; `ClippingClient`), `documentos` (`COBERTURA_DOCUMENTOS_PROCESSO`; `DocumentosClient`), `entenda`, `execucao` (tabela server-side, arrays de propósito), `linha-do-tempo`, `quem-atua`.

### Paraopeba — consumidores de dados (mapeado em 2026-08-17)
| Dado | Módulo | Tamanho | Consumidores server | Consumidores client |
|---|---|---|---|---|
| Auditoria AJRI | `auditoria-ajri.ts` | 336 KiB | home, `/auditoria` (só cobertura) | `AuditoriaClient.tsx` |
| Execução FGV | `execucao-fgv.ts` | 226 KB | `/execucao` (arrays, de propósito); home (só cobertura) | — |
| Documentos | `documentos.ts` | 586 KB | home (só cobertura) | `DocumentosClient.tsx` |
| Clipping geral | `clipping.ts` | 108 KB | home, `/clipping` (cobertura) | `ClippingClient.tsx` |
| Clipping ATI | `clipping-ati.ts` | 36 KB | `/clipping` (cobertura) | `ClippingClient.tsx` |
| Clipping IJ | `clipping-ij.ts` | 51 KB | `/clipping` (cobertura) | `ClippingClient.tsx` |
| Biblioteca | `biblioteca.ts` + `public/data/biblioteca-ati.json` | 27,4 KiB gzip | home (`coberturaBiblioteca()`) | `BibliotecaClient` (via page) |
| Repasse | `brumadinho/repasse.ts` + `public/data/repasse-brumadinho-mg.json` | 21,5 KiB gzip | `/[municipio]/prefeitura` | — |
| Risco climático | `public/data/risco-climatico.json` | 46,2 KiB gzip | `/[municipio]/clima` (`RiscoClimatico.tsx`) | — |
| Comunicabr | `public/data/comunicabr-31.json` | 687,9 KiB gzip | `/dados/comunicabr`, `/dados/comunicabr/[codigo]` | — |

## 5. Banco — estado e recomendações

Fonte: `lib/db/schema.ts` (123 KB, introspectado do Neon via drizzle-kit) + `lib/db/queries/` (14 arquivos).

### O que já existe de bom
- **Full-text em português com unaccent**: 4 índices GIN tsvector (`congresso.proposicoes` sobre `ementa || keywords`, `public.atos_oficiais`, `public.contratos` sobre `objeto`, `public.proposicoes` municipal). Queries usam `websearch_to_tsquery`/`plainto_tsquery`.
- **pgvector**: `public.embeddings` e `congresso.embeddings` (vector 384) com HNSW `vector_cosine_ops` — RAG em produção.
- **Trigram**: `congresso.parlamentares.nome` com GIN `gin_trgm_ops`.
- Índices compostos bem pensados por município (ex.: `royalties_cfem_municipio_periodo_idx`, `contratos_id_municipio_ano_idx`, `cap_autos_infracao_municipio_idx`).
- `ocupacoes.atual` é coluna gerada (`data_saida IS NULL`) com índice parcial.
- Sem soft-delete: padrão é flag `ativo`/`aprovado` — coerente, manter.

### Lacunas (prioridade para eficiência de busca/análise)
1. **ILIKE sem índice** em colunas quentes (36 ocorrências em `queries/`): `servidores.nome/cargo/lotacao`, `classificados.titulo`, `zap_estabelecimentos.nome`, `proposicoes.ementa` (betim), `contratos.objeto/fornecedor_nome`, `licitacoes.objeto/orgao_nome`, `votacoes_camara.materia/ementa`, `magistrados.nome`, `tribunais.nome`, `orgaos.sigla/nome`, `bancadas.nome`, `eventos.descricao`, `vagas.motivo`, `nomeacoes.senado_ementa`.
   → Solução barata: GIN `gin_trgm_ops` em `fornecedores.razao_social/nome_fantasia`, `servidores.nome`, `classificados.titulo`, `zap_estabelecimentos.nome`, `magistrados.nome` (já tem em parlamentares), `tribunais.nome`.
2. **Tabelas sem índice além do PK**: `diarias` (vereador_id e id_municipio sem índice — maior tabela dessa lista), `fornecedores` (só PK cnpj; busca por nome sem índice), `municipios` (só PK; `listarCidades()` varre), `emendas`, `doacoes_campanha`, `obras`, `pautas_atas`, `clima_cache`, `classificados`, `anuncios`, `zap_estabelecimentos`, `grupos_economicos`, `fontes_externas`, `cache_ia` (ambos schemas), `documentos`/`envios`/`perfis`/`monitoramentos` (judiciário).
3. **FKs de join sem índice**: `doacoes_campanha.vereador_id`, `emendas.id_municipio`, `diarias.*`, `votos_camara.vereador_id` (tem composto, mas consulta por vereador sozinho não usa), `votosInCongresso` por parlamentar.
4. **`diarias.chave_natural` existe mas não é unique** — o comentário do schema diz que deveria garantir idempotência do ETL. Corrigir o DDL e aplicar unique.
5. **Colunas de texto longo sem índice nenhum**: `proposicoesInCongresso.ementa_detalhada`/`texto_integral`, `tramitacoes.descricao/despacho`, `documentos.corpo`, `pautas_atas.conteudo`, `noticias.conteudo_html`, `copam_pauta_itens.texto_pauta`, `analises.parecer_critico` — candidatas a tsvector se entrar busca interna.
6. **JSONB sem GIN** (13 tabelas com jsonb, zero `gin(jsonb_ops)`): só vale se houver query de filtro no JSON — hoje nada filtra jsonb.
7. **Sem particionamento** — não é necessário no volume atual; rever se `presencas_plenario`, `tramitacoes` ou `votos_camara` (5.136 votos só em SP) crescerem muito.
8. **As 4 definições de índice tsvector aparecem truncadas no schema.ts** (artifact do introspect) — se o schema for regenerado, conferir que a definição continua correta.

### Volume potencial (topo)
`congresso.presencas_plenario` (513 parlamentares × sessões/ano), `congresso.tramitacoes`, `public.votos_camara`, `ibama_autos_infracao` (20.046 linhas), `cap_autos_infracao`, `ambiental_licenciamento`, `diarias`, `contratos`/`licitacoes` (PNCP).

## 6. Fluxo de trabalho e validação

- Coletores em `scripts/` (`.py` + `.mts`) escrevem `.ts`/`.json`; destinos de JSON = `apps/web/public/data/`.
- Depois de qualquer regeneração de acervo: rodar `npx tsc --noEmit` e `npx vitest run` (testes de conteúdo + paridade de cobertura pegam mudanças de contagem).
- Testes de conteúdo por domínio: `lib/paraopeba/dados.test.ts` (149/46/59/467/...), `lib/brumadinho/repasse.test.ts`, `lib/paraopeba/biblioteca.test.ts`, `sem-cpf-no-repo.test.ts`, `sem-dado-pessoal-no-repo.test.ts`.
- Regras de commit: pathspec explícito (cuidado com renames), sem `--force`, mensagens ASCII. Hooks de lint-staged ativos.
- Build local NÃO é possível hoje: Neon HTTP 402 (retorna em 2026-09-01), PG local na porta 5433 com senha desconhecida, sem `DATABASE_URL`. Deploy/medição de bundle dependem do home-pc.
- SSH para o home-pc está bloqueado (porta 22 timeout; `tailscale ping` OK). Conferir `netstat -an | Select-String ":22"` (deve mostrar `0.0.0.0:22`), regra de firewall `SSH-Tailscale`/`SSH-All`, ou habilitar Tailscale SSH. PowerShell: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## 7. Decisões registradas (2026-08-17)

- `dafe6ff`: repasse e biblioteca movidos para `public/data/` com leitura async (ASSETS.fetch + fallback); `arquivoRepasse()` sync removida; testes com `beforeAll`. (Só tem efeito real combinado com os excludes.)
- `96dfe16`: `outputFileTracingExcludes` para biblioteca/repasse/risco — ~95,1 KiB gzip liberados (o único mecanismo que tira JSON do bundle).
- `5120f31`: coberturas literais `COBERTURA_*` (clipping 149, ati 46, ij 59, auditoria 467, execução 26/234) + 5 testes de paridade; páginas server da home, `/paraopeba/clipping` e `/paraopeba/auditoria` deixam de importar ~1,1 MiB de arrays.

## 8. Pendências para próximas sessões

1. **Medir o bundle real** no deploy home-pc (Worker gzip) após os três commits de 2026-08-17.
2. Ícones `cruz` e `mapa da América Latina` (Brasil Icons) pendentes no painel de edição.
3. Foto `00296` fora das faixas (pipeline de imagens).
4. Decidir quais melhorias de banco da seção 5 entram (índices trigram em nomes é o maior ganho por esforço).
5. Neon Free voltou em 2026-09-01 → retomar build local e aplicar índices.
