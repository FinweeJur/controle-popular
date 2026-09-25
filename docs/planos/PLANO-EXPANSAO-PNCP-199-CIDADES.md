# Plano de expansão PNCP — das 6 cidades principais às demais mapeadas

> **Tipo:** PLANO
> **Domínio:** cidades
> **Última medição:** 2026-09-25
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md), [PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md](PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md), [FONTES.md](../06-fontes/FONTES.md), [ESTADO.md](../02-estado/ESTADO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [HANDOFF-22-09-COLETA-GUARA.md](../historico/entregas/HANDOFF-22-09-COLETA-GUARA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** pncp, contratos, licitacoes, coleta, checkpoint, municipios, ibge, 199 cidades, guara, etl, ampliacao, fila

## Sumário

- [Propósito](#propósito)
- [Estado medido em 25/09](#estado-medido-em-2509)
- [Estado medido em 24/09](#estado-medido-em-2409)
- [Estado medido em 23/09](#estado-medido-em-2309)
- [Escopo](#escopo)
- [Fase A — fechar as 6 cidades principais](#fase-a--fechar-as-6-cidades-principais)
- [Fase B — preparar a ampliação (código, sem rodar)](#fase-b--preparar-a-ampliação-código-sem-rodar)
- [Fase C — executar as demais mapeadas](#fase-c--executar-as-demais-mapeadas)
- [Cadência e limites da API](#cadência-e-limites-da-api)
- [Riscos e salvaguardas](#riscos-e-salvaguardas)
- [Verificação](#verificação)
- [Fora de escopo](#fora-de-escopo)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Definir a ordem e o ritual para ampliar a coleta PNCP (contratos e licitações)
para as demais cidades mapeadas, **somente depois** de fechar a coleta atual
das 6 cidades principais do portal.

## Estado medido em 25/09

Coleta da madrugada fechou 6 cidades (Manacapuru, Parintins, Tefé,
Abaetetuba, Altamira, Ananindeua).

| Item | Medição (25/09 07:35) |
|---|---|
| Cidades completas (ck contratos + licitações ok) | **36 / 136** prontas |
| Fila restante | **100** |
| Chaves ck contratos | 336 (336 ok, 0 parcial) |
| Chaves ck licitações | 3.349 (3.349 ok, 0 parcial) |
| Próximas da fila | Ananindeua/PA (refazer — morta no timeout), Cametã, Castanhal, Itaituba, Marabá, Paragominas (PA) |
| Cidade morta no timeout | chaves só `ok` enganam `cidade_completa` — conferir `logs/pncp/<ibge>.out` |

## Estado medido em 24/09

Fase B commitada (`7c67a3a0`); Fase C rodando na desktop.

| Item | Medição (24/09) |
|---|---|
| Manifesto `etl/betim/dados/manifesto-pncp.csv` | **203** linhas — 136 `pronta`, 55 `delegada` (25 capitais fila B + 30 grandes ao Gemini), 6 `excluida-principal`, 6 `bloqueada-cnpj` |
| Cidades completas (ck contratos + licitações ok) | **31 / 136** prontas |
| Fila restante | **105** |
| Chaves ck contratos | 300 (300 ok, 0 parcial) |
| Chaves ck licitações | 2.959 (2.959 ok, 0 parcial) |
| Próximas da fila | Manacapuru/AM, Parintins/AM, Tefé/AM, Abaetetuba/PA, Altamira/PA |
| CSV separador | `;` + BOM UTF-8 — **editar sempre com `\n'`**, nunca juntar com `;` |
| Suíte ETL | 15 testes pytest verdes (manifesto, fila, cobertura, checkpoint) |

## Estado medido em 23/09

Medido nesta máquina, com o ETL PNCP vivo em background.

| Item | Medição |
|---|---|
| Checkpoint incremental | `etl/betim/etl/pncp/checkpoint.py` — JSON atômico por página/modo/ano |
| Contratos PNCP (Betim) | 2021–2023 ok (0); **2024 ok = 285**; **2025 parcial p=5 = 188**; 2026 pendente |
| Licitações PNCP (Betim) | 2021 todas modalidades ok (0); **2022 ok até modalidade 10**; 11–13 e 2023+ pendentes |
| Banco Guara | Neon descartada; `DATABASE_URL` → `cp-postgres-597bd0` em `127.0.0.1:15432` |
| `licitacoes` PNCP | ainda **0 linhas** no banco (checkpoint avança; upsert por página grava) |
| API PNCP | viva e instável: 500 transitório, timeout 60 s, 429/503; página min 10 |
| Processo de fundo | `.bat` via `Invoke-CimMethod Win32_Process Create` sobrevive ao harness |
| Árvore de processo | venv hermes → uv python é **pai→filho**, não duplicado |

### As 6 cidades principais

Rota em `apps/web/lib/db/cidades-do-build.ts` (12 slugs no build; as 6 de
produto são as abaixo — `docs/01-produto/PRODUTO.md`):

| Cidade | UF | IBGE 7 dígitos | Papel |
|---|---|---|---|
| Betim | MG | 3106705 | industrial; coleta PNCP **em andamento** |
| Belo Horizonte | MG | 3106200 | capital regional |
| São Paulo | SP | 3550308 | metrópole |
| Diamantina | MG | 3121605 | pequeno |
| Araçuaí | MG | 3103405 | pequeno |
| Itinga | MG | 3134004 | pequeno |

### Mapa das demais cidades mapeadas

Fonte: [`apps/web/data/cidades-estrategicas.json`](/apps/web/data/cidades-estrategicas.json)
(gerado 2026-09-01).

| Métrica | Valor medido |
|---|---|
| `total` no JSON | **203** (campo `total` e contagem de `cidades`) |
| Por tipo | 27 capitais + 176 polo-interior |
| Nome de marca no portal | **199 cidades estratégicas** (rótulo editorial / ONSA) |
| `ativo: true` no JSON | apenas BH e SP (outros `ativo: false` — semeadas incompletas) |
| CNPJ prefeitura no JSON | muitos `null` — **obrigatório preencher antes do PNCP** |

> ⚠️ **203 ≠ 199.** O JSON tem 203 entradas; o portal e os textos públicos
> usam 199. Este plano usa **"demais mapeadas"** = o restante do JSON após as
> 6 principais (**197**, se todas forem elegíveis) e exige reconciliar 203 vs
> 199 **antes** de falar número final ao leitor. Nunca diga "199 baixadas" sem
> recontar o arquivo na data da fala.

## Escopo

**Dentro:**

- `etl.pncp.contratos` e `etl.pncp.licitacoes` (e `etl.pncp.orgaos` quando
  faltar CNPJ).
- Fila por código IBGE de 7 dígitos.
- Checkpoint por cidade + unidade (ano / ano-modalidade).
- Relatório de cobertura por cidade.

**Fora (ver [Fora de escopo](#fora-de-escopo)):**

- SAPL, diários, GeneXus, TCE, portais municipais.
- Seeds completos das 176+ cidades (runbook separado).
- Deploy antes de fechar a Fase A.

## Fase A — fechar as 6 cidades principais

**Bloqueio duro:** a Fase C não começa antes da Fase A terminar.

Ordem recomendada (mantém o que já tem checkpoint):

1. **Betim — contratos PNCP**
   - Concluir 2025 (retoma p=6) e 2026.
   - Manter o processo atual (`_tmp-pncp-contratos.bat`).
   - Meta: checkpoint `2021..atual` todos `status: ok`.

2. **Betim — licitações PNCP**
   - Retomar do checkpoint (`2022-11` em diante; modalidades 1–13; anos
     seguintes).
   - Rodar **depois** dos contratos de Betim (evita dois ETLs no mesmo PC
     brigando pela API).
   - Meta: `licitacoes` com `numero_controle_pncp` não nulo e `fonte='pncp'`
     > 0; anos 2021..atual cobertos ou zerados com registro `ok`.

3. **As outras 5 cidades — PNCP**
   - Para cada uma, nesta ordem: `orgaos` (se CNPJ órgão incompleto) →
     `contratos` → `licitacoes`.
   - Semântica de esfera: licitações já filtram `esferaId=M` (não publicar
     licitação alheia como se fosse da prefeitura).
   - BH/SP: esperar **muita página** (modalidade 6 sozinha pode ter milhares);
   - checkpoint obrigatório — sem ele, timeout apaga a rodada.

4. **Recontagem e lacuna**
   - Contar por cidade × fonte × ano (comando em [Verificação](#verificação)).
   - Zero com checkpoint `ok` = lacuna legítima da fonte, não bug.
   - Zero sem checkpoint `ok` = ETL não rodou — volta para a fila.

5. **Deploy Guara**
   - Só depois das 6 + suíte verdes (`npm test`, `npx tsc --noEmit`).
   - Cadência ~5 dias (política do dono; ver OPERACAO § 0).
   - Páginas que conferem: contratos, licitações, emendas, COPAM das cidades
     com rota.

### Critério de saída da Fase A

| Critério | Como saber |
|---|---|
| 6 cidades com contratos PNCP rodados até o ano atual | checkpoint `ok` em todos os anos do intervalo |
| 6 cidades com licitações PNCP rodadas | idem por chave `{ano}-{modalidade}` |
| Banco coerente | contagem Guara por `id_municipio` + `fonte='pncp'` |
| Dado pessoal limpo | suíte + `checar-dado-pessoal-em-dado.py` |
| Imagem pronta | testes + `tsc` verdes; `guara deploy` na cadência |

## Fase B — preparar a ampliação (código, sem rodar)

**Status (23–24/09/2026):** código entregue nesta sessão — ver
[Execução B/C desta sessão](#execução-bc-desta-sessão-24092026).

Pode ser feito **enquanto** a Fase A roda, desde que não derrube o processo
de fundo nem misture staging.

1. **Fila de cidades**
   - Ler `cidades-estrategicas.json` (ou lista derivada versionada).
   - Filtrar: excluir as 6 principais; exigir `id_municipio` 7 dígitos.
   - Marcar `cnpj_prefeitura` null → fila "bloqueada CNPJ", não pular em
     silêncio.
   - Ordenar: MG primeiro (mesma UF da coleta atual), depois UFs do Sudeste,
     depois o resto; cidades menores antes (piloto de ritmo).

2. **Checkpoint por cidade**
   - Hoje: `.checkpoint-pncp-{contratos,licitacoes}.json` (Betim).
   - Ampliar para: `.checkpoint-pncp-{contratos,licitacoes}-{ibge}.json`
     **ou** um namespace `{ibge: {…}}` no mesmo arquivo.
   - Critério: dois PCs / duas sessões não podem se atropelar.
   - Manter gitignore em `etl/betim/.checkpoint-pncp-*.json`.

3. **Orquestrador de fila (novo)**
   - Um comando tipo `python -m etl.pncp.fila --manifesto cidades.json`.
   - 1 cidade por vez; dentro da cidade: `orgaos?` → contratos → licitações.
   - Retomada automática pelo checkpoint (cidade com todas as unidades `ok`
     é pulada).
   - Log por cidade: `logs/pncp/{ibge}.out` (gitignored) + CSV de cobertura.

4. **CSV de cobertura (artefato versionado quando completo)**
   - Colunas: `ibge`, `nome`, `uf`, `tipo_coleta`, `contratos_n`,
     `licitacoes_n`, `anos_ok`, `ultimo_erro`, `atualizado_em`.
   - Separador `;` + BOM UTF-8 (regra do portal para Excel).

5. **Piloto (2 cidades menores fora das 6)**
   - Escolher 2 com `cnpj_prefeitura` preenchido e volume pequeno.
   - Rodar ponta a ponta; medir tempo/página e taxa de 500.
   - Só então abrir a Fase C.

6. **Testes e docs**
   - Teste unitário do namespace de checkpoint (parcial → retoma → ok).
   - Atualizar [FONTES.md § PNCP](../06-fontes/FONTES.md) com o ritual.
   - Atualizar este plano (medição) e o [ESTADO.md](../02-estado/ESTADO.md)
     na fila.

## Fase C — executar as demais mapeadas

**Pré-condição:** Fase A fechada + piloto da Fase B aprovado.

**Divisão de filas (23/09):** SP + 25 capitais = handoff da outra IA
([HANDOFF-23-09-PNCP-SP-CAPITAIS.md](../HANDOFF-23-09-PNCP-SP-CAPITAIS.md)).
Esta sessão executa B e o **resto** de C (polos / MG fora das 6) — nunca a
fila da outra IA. Um ETL PNCP por máquina.

1. **Congelar a lista de entrada**
   - Snapshot versionado do manifesto (códigos IBGE 7 dígitos).
   - Registrar data, contagem total e quantas sem CNPJ.

2. **Lotes**
   - Lote 1: demais ativas do build + MG.
   - Lote 2: capitais restantes (volume alto — um por rodada).
   - Lote 3: polos do interior.
   - Entre lotes: recontar Guara e olhar o CSV de cobertura.

3. **Runtime**
   - Sempre em processo independente (WMI / `.bat`), nunca preso ao shell
     da sessão.
   - Uma cidade por vez; pausa 1–2 s entre hosts (regra de coleta).
   - Retry com backoff em 500/timeout; depois de N falhas, marca cidade
     `ultimo_erro` e segue (não parar o lote inteiro).

4. **Diário de bordo**
   - Ao fim de cada lote: commit do CSV de cobertura + docs se mudou medição.
   - Commit por pathspec explícito; mensagem PT sem acento, `-F`.

5. **Deploy**
   - Segunda janela de deploy do Guara quando as rotas das novas cidades
     existirem (seeds/páginas). **Não** misturar com o deploy da Fase A se a
     cadência de ~5 dias ainda não venceu.

## Cadência e limites da API

| Regra | Valor |
|---|---|
| Pausa entre requisições | 1–2 s por host (FONTES) |
| `tamanhoPagina` | mínimo 10; medido estável em 10 |
| Filtro município | `codigoMunicipioIbge` **case-sensitive** (minúsculo final) |
| Modalidade licitações | `codigoModalidadeContratacao` **obrigatório** (1..13) |
| Esfera licitações | manter `esferaId=M` |
| Série histórica | 2021 → ano atual (PNCP começa em 2021) |
| Paralelismo | **1** ETL PNCP por máquina (API já é lenta) |
| Checkpoint | por página (contratos) e por página/modalidade (licitações) |

Estimativa grosseira (remaça na Fase B com o piloto): Betim 2024 fechou
7 páginas para 285 contratos. Cidade grande pode ter dezenas de páginas por
ano por modalidade — o plano aceita isso; não comprimir histórico sem medir.

## Riscos e salvaguardas

| Risco | Salvaguarda |
|---|---|
| API cai no meio | checkpoint parcial; retoma `pagina+1`; upsert idempotente por `numero_controle_pncp` |
| PC/TV/session morre | processo via WMI; logs em arquivo; nada crítico só na memória |
| CNPJ errado puxa outro ente | validar CNPJ contra `municipios`; `orgaos` antes; nunca casar por nome |
| São Paulo engole a fila em volume | esfera `M`; lote separado para capitais; medir piloto |
| 203 vs 199 na comunicação | recontar JSON na data da fala; rótulo do portal ≠ tamanho do arquivo |
| Dado pessoal | varrer dado ingerido; suíte antes de commitar dado |
| Dois runs atropelam | um lock por checkpoint (ou trava simples de arquivo); detectar processo vivo antes de lançar |
| Deploy no meio da coleta | deploy só na Fase A fechada e na cadência do dono |
| Repo cresce com log | checkpoints e `pncp*.out/err` gitignored; CSV só quando consolidado |

## Verificação

```text
# Processo vivo (não matar o par venv→uv)
Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
  Where-Object { $_.CommandLine -like '*etl.pncp*' }

# Checkpoint de Betim
Get-Content etl/betim/.checkpoint-pncp-contratos.json
Get-Content etl/betim/.checkpoint-pncp-licitacoes.json

# Contagem no Guara (1 stmt, formato csv)
# select id_municipio, fonte, count(*) from contratos group by 1,2;
# select id_municipio, fonte, count(*) from licitações group by 1,2;
# (CLI: guara catalog query -p controle-popular -s cp-postgres-597bd0)

# Antes de commitar qualquer dado
npm test
npx tsc --noEmit
python scripts/checar-dado-pessoal-em-dado.py
python scripts/validar-documentacao.py
```

## Fora de escopo

- Fechar SAPL/diário/GeneXus/TCE das 197 demais (ver
  [PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md)).
- Completar seeds `0083-0087` (runbook-cidade-nova).
- Migrar banco (Fase 4 Guara) — não travar a coleta nele.
- Deploy de expansão nacional sem as 6 principais fechadas.

## Execução B/C desta sessão (24/09/2026)

Ordem de serviço do dono: **B depois C, direto, sem perguntar; commit no fim.**

| Passo | Artefato | O que faz |
|---|---|---|
| B1 | `etl/betim/etl/pncp/manifesto.py` | Lê `cidades-estrategicas.json`, exclui as 6 principais, marca `pronta` / `bloqueada-cnpj`, ordena MG → Sudeste → resto e polo antes de capital |
| B2 | `etl/betim/etl/pncp/fila.py` | 1 cidade/vez (lock `.fila-pncp.lock`): contratos → licitações; pula cidade cujo checkpoint do IBGE está todo `ok` |
| B3 | `etl/betim/etl/pncp/cobertura.py` | CSV `;` + BOM UTF-8 por IBGE a partir do manifesto + checkpoints |
| B4 | `etl/betim/etl/pncp/preencher_cnpj.py` | Descobre `cnpj_prefeitura` no PNCP (esfera `M`, razão social de prefeitura/município) e grava em `municipios` |
| B5 | `manifesto_test.py`, `checkpoint_test.py` | Namespace `{ibge}:…` e filtros do manifesto |
| B6 | Este plano + FONTES + ESTADO | Medições datadas |
| C1 | `etl/betim/dados/manifesto-pncp.csv` | Snapshot versionado da fila |
| C2 | `preencher_cnpj` em lote | Destrava polos |
| C3 | `fila --manifesto …` | Coleta só cidades `pronta` **fora** da fila B (SP/capitais da outra IA) |
| C4 | `cobertura` + recontagem Guara | Números no banco |
| C5 | `npm test` + `tsc` + commit pathspec + push | Publica o código |

**Fora desta execução:** deploy Guara (cadência do dono), SP e as 25
capitais do handoff, seeds de páginas além do PNCP.

## Decisões registradas

1. **Ordem: 6 principais → depois as demais mapeadas** — decisão do dono
   em 23/09/2026; este documento é a ordem de serviço.
2. **Checkpoint incremental é obrigatório** em toda coleta PNCP nova —
   sem ele, queda de internet apaga a rodada.
3. **Um ETL PNCP por vez nesta máquina** — a API já é o gargalo.
4. **Manifesto por IBGE 7 dígitos** — nunca casar município por nome.
5. **CNPJ null bloqueia a cidade** na fila de PNCP — não coleto no escuro.
6. **Números públicos do mapa** (199 vs 203) só depois de recontagem na
   data da fala.

## Origem / Histórico

- 24/09/2026: Fase B implementada (manifesto, fila, cobertura, preencher
  CNPJ, testes); Fase C iniciada nesta sessão (fora da fila B de SP).
- 23/09/2026: plano escrito durante a coleta PNCP de Betim (checkpoint por
  página já em produção nesta máquina).
- Reusa a Fase de cidades do
  [PLANO-AUTOMACAO-COLETA-CIDADES.md](PLANO-AUTOMACAO-COLETA-CIDADES.md)
  (199 = 27 + 172 naquela medição de 01/09; este JSON de 23/09 mostra
  203 = 27 + 176 — reconciliar na execução).
- Medição de fonte PNCP: [FONTES.md](../06-fontes/FONTES.md).
- Estado da fila: [ESTADO.md](../02-estado/ESTADO.md).
