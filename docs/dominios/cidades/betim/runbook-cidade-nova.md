# Runbook — provisionar uma cidade nova no eixo Cidades

> Escrito em 2026-08-09, consolidando o que já estava espalhado nos comentários
> de `supabase/betim/migrations/0027_seed_bh_sp.sql` e `0043_seed_vales_jequitinhonha.sql`
> (a fonte real de cada decisão abaixo) e na guarda `etl/betim/scripts/conferir_defaults_de_cidade.py`.
> Não existia lugar único pra isso antes — este arquivo é esse lugar.

## O desenho: a rota nasce do banco, não de código

`app/[municipio]/layout.tsx` chama `slugsDasCidades()` em `generateStaticParams` —
uma linha nova em `municipios` é o suficiente pra rota existir. Nenhum arquivo de
rota precisa ser criado ou editado pra uma cidade nova aparecer.

## Passo 1 — os dois números que já causaram bug real

**Código IBGE e CNPJ da prefeitura/câmara têm de ser conferidos AO VIVO, nos dois
sentidos**, antes de escrever a migration. Em 2026-08-07 os dois palpites
iniciais de Araçuaí e Itinga estavam errados — e errados do pior jeito possível:
apontavam pra municípios REAIS de MG por transposição de dígito
(`3103504`=Araguari em vez de `3103405`=Araçuaí; `3133600`=Itapeva em vez de
`3134004`=Itinga). O erro não levanta exceção nenhuma: a linha entra, o ETL
roda, e ele coleta e grava o dado de OUTRA cidade em silêncio.

Confira:
- Código IBGE: `/localidades/municipios/{id}` da API do IBGE E a lista completa
  de municípios do estado — os dois sentidos, não só um.
- CNPJ da prefeitura e da câmara: PNCP e/ou diretório do Interlegis. CNPJ errado
  não é CNPJ ausente — faz `etl.pncp.contratos` coletar contrato de outro ente e
  gravá-lo como se fosse do município.

## Passo 2 — a migration de seed

Molde: `supabase/betim/migrations/0043_seed_vales_jequitinhonha.sql` (o mais
recente e mais comentado). `INSERT INTO municipios (id_municipio, nome, uf,
cnpj_prefeitura, lat, lng, dominio, branding, fontes, ativo) VALUES (...)`.

**`fontes` decide QUAIS PÁGINAS a cidade tem** (ver `temFonte()` em
`lib/db/queries/municipios.ts`) — **ausência de chave é lida como "tem"**, então
toda chave que não se aplica à cidade nova precisa de `false` explícito. Chaves
já em uso, conferidas nas duas migrations de seed existentes:

| Chave | Significa |
|---|---|
| `paraopeba` | só municípios signatários do Acordo do Rio Paraopeba |
| `citrolandia` | é bairro de Betim, não existe em outra cidade |
| `rotas_legadas` | `/zap-betim` e `/nota-betim` — URLs antigas só de Betim |
| `links_uteis_mg` | fontes estaduais de MG (barragens MPMG, PECMA, TACs) |
| `defesa_civil` | canal oficial (app/WhatsApp) pesquisado pra essa cidade — hoje só Betim (corrigido em 2026-08-09, era servido pra todo mundo por falta deste gate) |
| `terras` | tem levantamento de vazio cadastral do Terras Devolutas — Betim, BH, Vales; não São Paulo |
| `camara_proposicoes` | `false` quando é MEDIÇÃO, não escolha: o SAPL da cidade devolve 0 resultado, ou a câmara não tem módulo de proposições. Página permanentemente vazia é pior que ausente |
| `legislacao_fonte` | quem manda em `atos_oficiais` pra essa cidade — só grava se houver DOIS coletores concorrentes (ver nota de `refresh_completo_seguro` abaixo) |
| `vereadores_fonte` | ausência = "site oficial da câmara"; só declara quando a fonte é outra (ex.: TSE via `etl.bd.tse --semear`, caso de Itinga) |
| `camara_coletor` | chave de MÁQUINA pro ETL despachar o módulo certo: `sapl` \| `syssolution`. Ausência = cidade sem módulo de câmara |
| `camara_sistema` | RÓTULO DE TELA, já em produção: "PROLEGIS" (Betim), "SIL" (BH), "SPLegis" (SP) — impresso literalmente em `camara/proposicoes/page.tsx`. Não reusar `camara_coletor` pra isso |
| `legislatura.ordinal` | só grava se CONFIRMADO na fonte (ex.: SAPL devolve `numero` em `/api/parlamentares/legislatura/`). Sem isso, `rotuloLegislatura()` degrada pra "Legislatura atual (2025-2028)" — nunca copiar o ordinal de uma cidade vizinha |
| `estado_municipios_count` | total de municípios do estado, pro ranking PNTP/ATRICON (MG = 853, conferido na listagem do IBGE) |

`branding.slug` **não precisa ser semeado** — `slugDoNome()` deriva do `nome`
(a normalização NFD já come acento: "Araçuaí" → `aracuai`). Só usar o override
quando a URL já foi anunciada antes do código decidir o slug (foi o caso de
`/bh` e `/sp`).

## Passo 3 — o coletor de câmara é por FORNECEDOR, não por cidade

Antes de escrever coletor novo, descubra qual sistema a câmara usa
(`etl/betim/etl/camaras/sapl.py` e `syssolution.py` já cobrem os dois
fornecedores mais comuns em MG — o SAPL sozinho já destravou várias câmaras de
uma vez, ver `vales_jequitinhonha_state`). Se for um desses dois, é troca de
config, não código novo. Câmara sem proposições module ou sem site algum:
declare `camara_proposicoes: false` e siga — não force um coletor pra fonte que
não tem dado.

## Passo 4 — rodar o ETL, sempre por `--id-municipio`

Todo módulo lê a cidade de `carregar_municipio(id_municipio)` em
`etl/betim/etl/common.py`, que busca `nome, uf, cnpj_prefeitura, lat, lng,
branding, fontes` DO BANCO a partir do id — nunca de outro parâmetro de linha
de comando. É a correção estrutural pro bug real de 2026-08-03 (`etl.apis.anp`
tinha `--uf MG --municipio BETIM` como default; rodar só `--id-municipio
3550308` reetiquetou os postos de Betim como sendo de São Paulo, sem erro
nenhum). **Depois de qualquer ETL novo ou tocado, rode:**

```bash
python etl/betim/scripts/conferir_defaults_de_cidade.py
```

Sai com código 1 se algum módulo amarrar parâmetro de identidade da cidade fora
de `--id-municipio`. Verificado limpo (0 violações) em 2026-08-09.

## Passo 5 — `ativo` é a válvula, e o rebuild semanal publica sozinho

`rebuild.yml` roda toda segunda-feira. **Com a linha em `ativo = true`, a
cidade entra no ar no próximo rebuild sem ninguém rodar deploy** — o que não
estiver carregado até lá publica vazio. Se precisar de mais tempo pra ETL
rodar, semeie com `ativo = false` e ligue depois com um `update` — o ETL
funciona igual, porque `carregar_municipio()` nem lê essa coluna.

**Antes de ligar `ativo = true`, meça o custo:** cada cidade nova soma páginas
ao `next build`, e cada build inteiro lê o banco todo pra pré-renderizar — é
o mesmo orçamento de egress que já estourou uma vez (5,73/5 GB em
2026-08-07, ver `controle_popular_monorepo`). Não ative uma cidade nova na
mesma semana que outra mudança grande de dado.

## Checklist resumido

- [ ] Código IBGE conferido nos dois sentidos (API + listagem do estado)
- [ ] CNPJ de prefeitura e câmara conferidos em fonte oficial (PNCP/Interlegis)
- [ ] Migration de seed escrita, com TODAS as chaves de `fontes` que não se aplicam marcadas `false`
- [ ] Fornecedor da câmara identificado (SAPL? Syssolution? nenhum?) antes de escrever coletor novo
- [ ] `ativo = false` até o ETL rodar pelo menos uma vez
- [ ] `python etl/betim/scripts/conferir_defaults_de_cidade.py` verde
- [ ] Medido o delta de páginas do build antes de virar `ativo = true`

## Relações

Ver `Controle Popular — Estrutura do App (Mapa).md` (vault) pra onde cada
peça mora, `vales_jequitinhonha_state` (memória) pro caso real mais recente
de provisionamento, `etl_default_de_cidade` (memória) pro bug que o Passo 4
existe pra prevenir.
