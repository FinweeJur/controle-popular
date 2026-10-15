# Plano — CI de ingestao automatica RAG + busca + padronizacao de unidades

> **Tipo:** PLANO
> **Domínio:** global (CI, RAG, busca, ETL, transformacao de dados)
> **Última medição:** 2026-10-15
> **Leitura estimada:** media (10-20 min)
> **Relacionados:** [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md), [PLANO-CRON-RAG-KEEPWARM.md](PLANO-CRON-RAG-KEEPWARM.md), [PLANO-AUTOMACAO-COMPLETA.md](PLANO-AUTOMACAO-COMPLETA.md), [ESTADO.md](../02-estado/ESTADO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** ci, rag, ingestao, busca, resposta-curada, unidades, transformacao, etl, acervo, seu nono, escada, codeScene

## Sumário

- [Proposito](#proposito)
- [Diagnostico da automacao hoje](#diagnostico-da-automacao-hoje)
- [Pilar 1 — CI de ingestao automatica RAG + busca](#pilar-1--ci-de-ingestao-automatica-rag--busca)
- [Pilar 2 — Padronizacao e transformacao de unidades](#pilar-2--padronizacao-e-transformacao-de-unidades)
- [Pilar 3 — Preparacao para expansao (CodeScene + ponytail)](#pilar-3--preparacao-para-expansao-codescene--ponytail)
- [Pendencias registradas](#pendencias-registradas)
- [Fases de execucao](#fases-de-execucao)
- [Riscos e metricas](#riscos-e-metricas)

## Proposito

Tres perguntas do dono, uma so resposta estruturada:

1. **Toda nova pagina / informacao entra automaticamente no RAG, no buscador
   geral, gera respostas pre-curadas e e acessivel pela IA do Seu Nono
   (site + Telegram)?** Hoje nao — e parcial. O plano fecha essa lacuna.
2. **Dados coletados podem ser trabalhados em diferentes unidades
   (minutos/anos, bilhoes/milhoes, reais/dolares, km/cm, watts/MW...)?**
   Hoje nao — cada pagina formata no proprio componente. O plano cria
   uma camada de transformacao reusavel.
3. **O codigo esta preparado pra expansao segundo CodeScene, sem complicar?**
   Parcialmente — a refatoracao de 08/10 subiu a saude do acervo de 6,98
   para 9+, mas a pipeline de ingestao ainda nao existe, e o acoplamento
   entre coleta e apresentacao e alto.

Regra que governa tudo: **o numero vem do dado; o modelo so embrulha**
(AGENTS.md S7). Cada nova informacao que entra no RAG traz a fonte
colada — o LLM nunca inventa.

## Diagnostico da automacao hoje

### O que funciona

| Componente | Estado | Detalhe |
|---|---|---|
| Escada deterministica (7 degraus) | ✅ | intercepta ~80% das perguntas sem LLM |
| Acervo em codigo (`montarAcervo()`) | ✅ | 436+ pedacos, deterministico, sem fs/rede |
| Respostas pre-curadas (`resposta-curada.ts`) | ✅ | busca deterministica na barra |
| Indice de busca (`gerar-indice-busca.mts`) | ✅ | gera estatico de 3 grupos no build |
| RAG hibrido (cosine + Jaccard) | ✅ | funciona com Maritaca fallback |
| Telegram bot + webhook | ✅ | porta blindada, segredo validado |
| CI de guardas (CPF, gitleaks, CodeScene, padrao) | ✅ | verde nos ultimos pushes |
| Canario de limites | ✅ | cron a cada 4h, sucesso |

### O que NAO funciona ou e parcial

| Componente | Estado | Detalhe |
|---|---|---|
| **ETL betim/congresso/judiciario** | ⛔ | cron **skipped** desde 08/10 (DB nao acessivel da CI; DB agora e Heroku) |
| **Cavas preparador** | ⛔ | 5 runs seguidos em failure — coleta nao fecha em 72 min |
| **Documentacao CI** | ⛔ | `docs/planos/ESTEIRA-CAVAS.md` sem metadados + sumario; 4 runs em failure |
| **Ingestao automatica de nova pagina no RAG** | ❌ | nao existe — acervo e montado em codigo, sem pipeline de deteccao |
| **Ingestao automatica de nova pagina na busca** | ❌ | indice e gerado no build, sem delta pos-build |
| **Respostas pre-curadas automaticas** | ❌ | tudo manual em `SeuNonoData.ts` e `resposta-curada.ts` |
| **Transformacao de unidades** | ❌ | cada componente formata no proprio `Intl.NumberFormat` |
| **pgvector** | ⛔ | nao medido no Heroku; RAG roda em memoria (suficiente hoje) |

### Achados de CI a corrigir

1. **`ESTEIRA-CAVAS.md`**: faltam 7 metadados + secao Sumario. Corrigir e
   revalidar com `validar-documentacao.py`.
2. **Cavas preparador**: coleta nao termina (0 manifestos em 72 min).
   Causa raiz: VM sem `rasterio` (corrigido 12/10) + dpkg interrompido
   (corrigido 13/10). Verificar proximo run agendado.
3. **ETLs skipped**: o `DATABASE_URL` da CI aponta para o Heroku, mas os
   workflows usam `psql` local. Reativar exige ajustar a string de conexao
   ou rodar ETL no `home-pc` via `rotina-local.mts`.

## Pilar 1 — CI de ingestao automatica RAG + busca

### Arquitetura proposta

```
  NOVA PAGINA / DADO
       |
       v
  ┌─────────────────────────────────────────────┐
  │  CI: ingestao-rag.yml (workflow_dispatch +  │
  │       on push touching apps/web/app/**      │
  │                    ou apps/web/data/**)      │
  │                                              │
  │  Passo 1: detectar mudancas                 │
  │    git diff --name-only HEAD~1              │
  │    filtrar: *.tsx, *.ts, *.json em data/    │
  │                                              │
  │  Passo 2: gerar delta do acervo             │
  │    node scripts/ingestao-rag.mts            │
  │    → le montarAcervo()                      │
  │    → diff contra baseline (sha256)          │
  │    → emite pedacos novos/modificados        │
  │                                              │
  │  Passo 3: atualizar respostas pre-curadas   │
  │    node scripts/gerar-respostas-curadas.mts │
  │    → para cada pagina nova, sugere Q&A      │
  │    → revisao humana (PR draft)              │
  │                                              │
  │  Passo 4: regenerar indice de busca         │
  │    node scripts/gerar-indice-busca.mts      │
  │    → delta: so paginas alteradas            │
  │                                              │
  │  Passo 5: aquecer embeddings (se houver     │
  │    modelo de embedding disponivel na CI)    │
  │    → upsert na tabela embeddings            │
  └─────────────────────────────────────────────┘
       |
       v
  Seu NonO responde com a nova informacao
  (Escada degrau 3 → RAG → LLM com citacao)
```

### Componentes a criar

#### 1.1 `scripts/ingestao-rag.mts` — detector de mudancas no acervo

Papel: rodar na CI (ou local), comparar o acervo antes/depois do push,
emitir delta (pedacos novos, modificados, removidos).

Principio ponytail: um script, < 100 loc, que:
1. Importa `montarAcervo` (ja deterministico, sem fs/rede)
2. Compara contra baseline em `data/acervo-baseline.json` (sha256 por pedaco)
3. Emite `data/acervo-delta.json` com os novos/modificados
4. Atualiza a baseline

CodeScene: funcao pura, sem efeito colateral fora do JSON de saida.
Testavel com o golden-set existente.

#### 1.2 `scripts/gerar-respostas-curadas.mts` — gerador de Q&A por pagina

Papel: para cada pagina que entrou no acervo e nao tem entrada em
`SeuNonoData.ts` ou `resposta-curada.ts`, sugerir perguntas e respostas
a partir do `resumoCidadao` + `titulo` + `recomendacoesChave`.

Principio ponytail: **template, nao LLM.** O gerador usa templates
deterministicos:

```typescript
// Exemplo: pagina de relatorio DH
const templates = [
  { q: "Qual a recomendacao do ${orgao} sobre ${tema}?",
    a: "${recomendacoesChave[0]} (fonte: ${linkOficial})" },
  { q: "O que diz o relatorio de ${ano} sobre ${titulo}?",
    a: "${resumoCidadao} (fonte: ${linkOficial})" },
];
```

LLM (Ollama local ou Maritaca) so entra para **refinar** o texto das
respostas sugeridas — e sempre com `format: "json"`, `temperature: 0`,
e revisao humana via PR draft.

#### 1.3 `apps/web/lib/assistente/auto-ingestao.ts` — extensao do acervo

Papel: funcao que le `data/acervo-delta.json` e acrescenta ao acervo
em runtime. Hoje `montarAcervo()` e 100% em codigo; esta funcao
adiciona a camada de **delta pos-build**, mantendo a deterministica
como base.

Principio ponytail: se o delta nao existe (primeiro build, CI sem
workflow), o acervo funciona igual — zero efeito. O delta e **aditivo**,
nunca sobrescreve o curado.

#### 1.4 Workflow `ingestao-rag.yml`

```yaml
name: Ingestao RAG + busca
on:
  push:
    branches: [main]
    paths:
      - 'apps/web/app/**'
      - 'apps/web/data/**'
      - 'apps/web/lib/assistente/**'
  workflow_dispatch:

jobs:
  delta:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: node scripts/ingestao-rag.mts
      - run: node scripts/gerar-respostas-curadas.mts --draft
      - run: node scripts/gerar-indice-busca.mts --delta
      # commit delta se houve mudanca
      - run: |
          if git diff --quiet data/acervo-delta.json; then exit 0; fi
          git add data/acervo-delta.json data/acervo-baseline.json
          git commit -m "ci: atualiza baseline e delta do acervo RAG"
          git push
```

### Como o Seu NonO passa a responder sobre nova pagina

1. Push adiciona `/ambiental/nova-rota/page.tsx`
2. CI roda `ingestao-rag.yml`
3. `ingestao-rag.mts` detecta que o acervo mudou, emite delta
4. `gerar-respostas-curadas.mts` sugere Q&A (template), abre PR draft
5. Humano revisa e mergeia o PR (as respostas entram em `SeuNonoData.ts`)
6. Proximo build: acervo + respostas curadas + indice de busca atualizados
7. Seu NonO responde pela Escada (degrau 3) ou pelo RAG (degrau 4)

**Telegram**: mesmo pipeline — o bot usa a mesma API `/api/chatbot`
que o site. Zero codigo extra.

## Pilar 2 — Padronizacao e transformacao de unidades

### Diagnostico

Hoje cada componente formata valores no proprio escopo:
- `Intl.NumberFormat('pt-BR')` para moeda
- `toFixed()` para porcentagem
- divisoes manuais (`valor / 1e6`) para milhoes/bilhoes
- `Math.round()` para arredondamento ad-hoc

Nao ha conversao entre unidades (ex.: "R$ 2,3 bi" → "US$ 420 mi" com
cambio do dia), nem entre escalas de tempo (ex.: "1.460 dias" → "4 anos"),
nem entre sistemas (ex.: "5.280 ft" → "1.609 m").

### Arquitetura proposta: `lib/transformacao/unidades.ts`

Uma **tabela de conversao** declarativa (dados, nao codigo) + uma funcao
pura `converter(valor, de, para)`. Ponytail: stdlib primeiro, zero
dependency nova.

```typescript
/**
 * Tabela de fatores de conversao.
 * Cada entrada: [de, para] → fator multiplicativo.
 * Transitiva: converter(a→c) = converter(a→b) * converter(b→c).
 */
const FATORES: Record<string, Record<string, number>> = {
  tempo: {
    segundo:    { minuto: 1/60, hora: 1/3600, dia: 1/86400, semana: 1/604800, mes: 1/2592000, ano: 1/31536000, decada: 1/315360000 },
    minuto:     { segundo: 60, hora: 1/60, dia: 1/1440, ano: 1/525600 },
    hora:       { segundo: 3600, minuto: 60, dia: 1/24, ano: 1/8760 },
    dia:        { segundo: 86400, minuto: 1440, hora: 24, semana: 1/7, mes: 1/30, ano: 1/365, decada: 1/3650 },
    semana:     { dia: 7, hora: 168, ano: 1/52 },
    mes:        { dia: 30, hora: 720, ano: 1/12 },
    ano:        { dia: 365, semana: 52, mes: 12, decada: 1/10, seculo: 1/100 },
    decada:     { ano: 10, dia: 3650 },
    seculo:     { ano: 100, decada: 10 },
  },
  comprimento: {
    metro:      { quilometro: 1/1000, centimetro: 100, milimetro: 1000, milha: 1/1609.34, pe: 1/0.3048, jarda: 1/0.9144 },
    quilometro: { metro: 1000, milha: 1/1.60934, pe: 3280.84 },
    milha:      { quilometro: 1.60934, metro: 1609.34 },
    pe:         { metro: 0.3048, centimetro: 30.48 },
    jarda:      { metro: 0.9144 },
    quadra:     { metro: 110, quilometro: 0.11 },  // quadra urbana BR ~110m
  },
  moeda: {
    // fatores estaticos (cambio fixo de referencia); atualizacao via API no Pilar 2b
    real:       { dolar: 1/5.50, euro: 1/6.00, yuan: 1/0.76, libra: 1/7.00 },
    dolar:      { real: 5.50, euro: 1/1.09, yuan: 7.24, libra: 1/1.27 },
    euro:       { real: 6.00, dolar: 1.09 },
    yuan:       { real: 0.76, dolar: 1/7.24 },
    libra:      { real: 7.00, dolar: 1.27 },
  },
  energia: {
    watt:       { quilowatt: 1/1000, megawatt: 1/1e6, gigawatt: 1/1e9, cavaloVapor: 1/745.7 },
    quilowatt:  { watt: 1000, megawatt: 1/1000 },
    megawatt:   { quilowatt: 1000, gigawatt: 1/1000 },
    gigawatt:   { megawatt: 1000 },
    cavaloVapor: { watt: 745.7, quilowatt: 0.7457 },
  },
  massa: {
    quilograma: { tonelada: 1/1000, grama: 1000, libra: 2.20462 },
    tonelada:   { quilograma: 1000, libra: 2204.62 },
    libra:      { quilograma: 0.453592, grama: 453.592 },
  },
  volume: {
    litro:      { metroCubico: 1/1000, mililitro: 1000, galao: 1/3.785 },
    metroCubico: { litro: 1000 },
    galao:      { litro: 3.785 },
  },
  area: {
    metroQuadrado:  { quilometroQuadrado: 1/1e6, hectare: 1/10000, alqueire: 1/24200 },
    hectare:        { metroQuadrado: 10000, alqueire: 1/2.42 },
    alqueire:       { hectare: 2.42, metroQuadrado: 24200 },  // alqueire paulista
    quilometroQuadrado: { hectare: 100, metroQuadrado: 1e6 },
  },
  escala: {
    unidade:   { mil: 1/1e3, milhao: 1/1e6, bilhao: 1/1e9, trilhao: 1/1e12 },
    mil:       { unidade: 1e3, milhao: 1/1e3 },
    milhao:    { unidade: 1e6, mil: 1e3, bilhao: 1/1e3 },
    bilhao:    { unidade: 1e9, milhao: 1e3, trilhao: 1/1e3 },
    trilhao:   { unidade: 1e12, bilhao: 1e3 },
  },
};
```

### Funcao pura `converter()`

```typescript
function converter(valor: number, de: string, para: string, dominio: string): number {
  if (de === para) return valor;
  const fator = FATORES[dominio]?.[de]?.[para];
  if (fator !== undefined) return valor * fator;
  // busca transita: de → intermediario → para
  for (const intermediario of Object.keys(FATORES[dominio]?.[de] ?? {})) {
    const paraFator = FATORES[dominio]?.[intermediario]?.[para];
    if (paraFator !== undefined) return valor * FATORES[dominio][de][intermediario] * paraFator;
  }
  throw new Error(`Conversao ${domio}:${de}→${para} nao encontrada`);
}
```

### Pilar 2b — Cambio em tempo real (futuro)

Os fatores de moeda acima sao fixos (cambio de referencia). Para
cambio em tempo real:
- `scripts/coletar-cambio.mts`: coleta a cotacao do dia do Banco Central
  (API publica, gratuita, `https://olinda.bcb.gov.br/olinda/servico/PTAX/...`)
- Salva em `data/cambio-dia.json` (1 entrada por dia, < 1 KB)
- `unidades.ts` le o JSON; se nao existir, usa o fator fixo (fallback)
- CI: `ingestao-rag.yml` roda a coleta de cambio no comeco

Principio ponytail: comeca com fator fixo (que funciona), adiciona
a API so quando o dono pedir. A funcao `converter()` nao muda — so
a fonte do fator.

### Como o componente usa

```typescript
import { converter, formatar } from "@/lib/transformacao/unidades";

// No componente:
const valorEmMilhoes = converter(2300000000, "unidade", "milhao", "escala");
// → 2300

const valorEmDolares = converter(2300, "milhao", "dolar", "moeda"); // via real
// → ~418 mi

// Formatador BR:
formatar(2300, "milhao", "real", "moeda");  // → "R$ 2,3 bilhoes"
formatar(1460, "dia", "ano", "tempo");      // → "~4 anos"
```

### Formatacao contextual (formatar())

```typescript
function formatar(valor: number, de: string, para: string, dominio: string): string {
  const resultado = converter(valor, de, para, dominio);
  const fmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    ...(dominio === "moeda" ? { style: "currency", currency: para === "dolar" ? "USD" : para === "euro" ? "EUR" : "BRL" } : {}),
  });
  return fmt.format(resultado);
}
```

### Teste

Um teste `unidades.test.ts` com:
- conversoes diretas (1 km → 1000 m)
- conversoes transitas (1 milha → 1.609 km)
- conversoes de escala (2,3 bi → 2.300 mi)
- conversoes de tempo (1.460 dias → ~4 anos)
- conversoes de moeda com fator fixo
- fallback quando conversao nao existe (throw)
- idempotencia: converter(converter(v, a, b), b, a) ≈ v

Principio ponytail: um arquivo, < 150 loc, zero dependencia,
cobrindo 90% dos casos reais do portal. Casos exotico (temperatura
F↔C com offset, dB logaritmico) = `ponytail: add quando aparecer no portal`.

## Pilar 3 — Preparacao para expansao (CodeScene + ponytail)

### Principios

1. **Funcao curta, nomeada, um proposito** — cada degrau da ingestao
   e uma funcao < 50 loc. CodeScene mede Complex Method e Large Method;
   funcoes curtas passam.
2. **Tabela de dados > logica imperativa** — fatores de conversao,
   templates de Q&A e regras de ingestao sao dados declarativos
   (Records/Maps), nao if/else encadeados.
3. **Composicao, nao heranca** — `converter()` compoe fatores
   transitivamente; `ingestao-rag.mts` compoe passos sequenciais;
   `montarAcervo()` compoe fontes. Nenhuma classe abstrata.
4. **Zero dependencia nova** — `Intl.NumberFormat` (stdlib), `montarAcervo()`
   (ja existe), `sha256` (Node crypto). Sem lib de unidades (mathjs),
   sem lib de template (handlebars), sem lib de diff (deep-diff).
5. **Delta, nao rebuild** — o indice de busca e o acervo sao
   incrementais. Mudou 1 pagina? Atualiza 1 entrada, nao 436.
6. **Fallback graca** — sem delta? Acervo funciona igual. Sem cambio?
   Fator fixo. Sem LLM? Template deterministico. Sem pgvector? Memoria.

### CodeScene: metricas a monitorar

| Metrica | Teto | Acao se violar |
|---|---|---|
| Complex Method | < 15 | quebrar em funcoes menores |
| Large Method | < 50 loc | extrair tabela de dados |
| File Health | > 9,0 | refatorar antes de expandir |
| Duplication | < 3% | extrair funcao compartilhada |
| Coupling (fan-out) | < 10 | interfaces estreitas |

### Estrategia de divisao por tarefa

| Arquivo atual | Problema | Divisao proposta |
|---|---|---|
| `acervo.ts` (852 loc) | grande, multiplas responsabilidades | ja refatorado (08/10): `REGRAS_FRENTES`, `PECAS_CAVAS`, `PECAS_MACRO` sao tabelas; `montarAcervoDetalhado()` chama funcoes nomeadas |
| `resposta-curada.ts` (655 loc) | grande, logica de zona + casamento | extrair: `casarPadrao()` (funcao pura), `filtrarZona()` (funcao pura), `RESPOSTAS` (tabela declarativa) |
| `escada-determinista.ts` | orquestrador limpo | manter; cada degrau ja e arquivo proprio |
| `gerar-indice-busca.mts` | monolito | extrair: `lerFontes()`, `construirVocabulario()`, `emitirIndice()` |
| componentes de pagina | formatacao inline | migrar para `converter()` + `formatar()` |

## Pendencias registradas

### CNDH — PDFs especificos dos relatorios 2023/2024

- **CNDH bacias Doce/Paraopeba** (2023): `linkOficial` aponta para a
  pagina de relatorios do MDH
  (`gov.br/mdh/.../cndh/relatorios`). O PDF especifico nao foi
  encontrado publicamente (possivelmente publicado internamente
  ou bloqueado pelo defeso eleitoral). Pendencia: buscar o PDF
  direto apos o defeso e atualizar `data/relatorios-direitos-humanos.json`.
- **CNDH semiario** (2024): mesma situacao.
- Registrado em: commit `6c0d1efc` (15/10/2026).

### Cavas preparador — coleta nao fecha

- 5 runs seguidos em failure (12-14/10). Causas: `rasterio` ausente,
  `dpkg` interrompido, `shallow.lock` travado. Corrigidos 12-13/10.
- Pendencia: verificar proximo run agendado (cron diario 12:30 UTC)
  para confirmar que a coleta fecha.

### ETLs skipped — DB Heroku nao acessivel da CI

- `etl-betim.yml`, `etl-congresso.yml`, `etl-judiciario.yml` todos
  `skipped` desde 08/10. O `DATABASE_URL` da CI nao e o Heroku.
- Pendencia: decidir se ETL roda no `home-pc` via `rotina-local.mts`
  (ja funciona) ou se ajusta a CI para acessar o Heroku (risco de
  expose do secret).

### Documentacao — `ESTEIRA-CAVAS.md`

- Faltam: Tipo, Dominio, Ultima medicao, Leitura estimada, Relacionados,
  Palavras-chave, secao Sumario. CI de `docs.yml` reclama.
- Pendencia: corrigir metadados e sumario.

## Fases de execucao

> **Execucao em 15/10/2026** (commit `d7735aae` + seguinte): Fases 1, 2, 3
> e 4 concluidas e verificadas; Fase 5 (cambio em tempo real) e Fase 6
> (migracao gradual) seguem abertas. O item `1.3 auto-ingestao.ts` foi
> **cortado de proposito** — ver a nota dele abaixo. Fluxo ponta a ponta
> testado: peca nova no acervo → delta detectado → sugestao de curadoria
> gerada com a fonte colada → rodada identica nao suja a arvore.

### Fase 0 — Corrigir pendencias (1-2 h)

- [x] Corrigir `ESTEIRA-CAVAS.md` (metadados + sumario)
- [ ] Verificar proximo run do `cavas-preparador.yml`
- [ ] Registrar pendencia CNDH em ESTADO.md (Bloco B)

### Fase 1 — `lib/transformacao/unidades.ts` (2-3 h)

- [x] Criar `unidades.ts` com tabela de fatores + `converter()` + `formatar()`
- [x] Criar `unidades.test.ts` (conversao direta, transitiva, escala, tempo, moeda)
- [x] Migrar 2-3 componentes existentes para usar `converter()` (piloto)
- [x] tsc + vitest + eslint

**Piloto executado** (3 alvos, tela medida antes/depois com 0 divergencia):
`lib/texto/normalizar-numeros.ts` (6× `*1000` → `converter(..., "escala")`),
`lib/comparador/cidades.ts:62` e `app/ambiental/car/page.tsx` (milhoes +
dias→anos). Descartados de proposito os alvos em que `*(1/1e6)` mudaria
arredondamento na tela (`lib/betim/format.ts` tem thresholds em cima da
conta) e o `tags-reparacao.ts`, que nao tem nenhum importador.

### Fase 2 — `scripts/ingestao-rag.mts` (3-4 h)

- [x] Criar `ingestao-rag.mts` (detecta delta do acervo vs baseline)
- [x] Criar `data/acervo-baseline.json` (snapshot atual, 449 pedacos)
- [x] ~~Criar `apps/web/lib/assistente/auto-ingestao.ts`~~ **CORTADO** (nota abaixo)
- [x] tsc + vitest

**Corte do item 1.3 (`auto-ingestao.ts`), decidido na execucao.** Prova:
o delta e SEMPRE subconjunto do acervo montado hoje — as pecas novas so
existem porque o codigo que as monta ja mudou, entao `montarAcervo()` ja
devolve elas. Injetar o delta em runtime seria codigo morto no caminho
quente do RAG (e colocaria o acervo de 449 pecas dentro do bundle do
Worker). O papel real do delta e **detectar e sugerir curadoria**, nao
injetar: e o que os itens 1.1 e 1.2 fazem. Se um dia houver fonte que
escreve acervo FORA do codigo (coleta pos-build), reabrir aqui.

**Nota sobre o indice de busca:** o item 1 do diagrama ("entrada no indice")
nao precisa de CI — `gerar-indice-busca.mts` ja roda no `prebuild` de cada
deploy e regera o indice inteiro. Ele exige `DATABASE_URL`, que o runner do
GitHub nao alcanca (mesma causa dos ETLs `skipped`), entao o workflow nao o
toca; ficou registrado no comentario do `.github/workflows/ingestao-rag.yml`.

### Fase 3 — `scripts/gerar-respostas-curadas.mts` (2-3 h)

- [x] Criar gerador de Q&A por template (sem LLM)
- [x] Integrar com `ingestao-rag.mts` (pipeline: detecta → sugere → revisao humana)
- [x] Testar com paginas de DH (relatorios novos)

**Como ficou a revisao humana:** o gerador imprime markdown para o
`$GITHUB_STEP_SUMMARY` da CI (nao abre PR e nao escreve no repo) — a regra
editorial do AGENTS.md vale: nada vira resposta curada sem o dono. O
`--tudo` faz o relatorio de cobertura do acervo inteiro a qualquer momento.

**Cobertura medida em 15/10/2026** (`--tudo`): 449 pecas, **264 ja
cobertas** por resposta curada (59%) e **185 sem pergunta correspondente**
— e o numero que sobra e a fila de curadoria do dono, gerada pelo mesmo
comando.

### Fase 4 — Workflow `ingestao-rag.yml` (1-2 h)

- [x] Criar workflow com steps: checkout → ingestao → respostas → indice → commit
- [x] Testar com `workflow_dispatch`
- [x] Ajustar paths triggers

**Diferenca do esquema do diagrama:** o passo "regenerar indice de busca"
saiu (nota na Fase 2) e o commit e so dos dois JSONs derivados, com
`[skip ci]` para nao reentrar no proprio gatilho. As sugestoes de curadoria
vao para o step summary, nao para commit.

### Fase 5 — Cambio em tempo real (2-3 h, apos Fase 1)

- [ ] Criar `scripts/coletar-cambio.mts` (API BC, 1 entrada/dia)
- [ ] Integrar com `unidades.ts` (le JSON, fallback fator fixo)
- [ ] Adicionar step no `ingestao-rag.yml`

**Nao executada de proposito:** o fator fixo da tabela ja converte (5,50
R$/US$ de referencia) e a funcao `converter()` nao muda quando a API entrar
— so muda a fonte do fator. Abrir quando o dono pedir cotacao do dia.

### Fase 6 — Migracao gradual de componentes (ongoing)

- [x] Identificar componentes com formatacao inline (3 alvos migrados no piloto)
- [ ] Migrar para `converter()` + `formatar()` um a um (fila: `cota-parlamentar`,
      `PainelEuropa`, `consumo-corporativo` — so depois de resolver o
      arredondamento `*(1/1e6)` vs `/1e6` nos thresholds)
- [ ] Cada migracao: tsc + vitest + CodeScene delta

## Riscos e metricas

| Risco | Mitigacao |
|---|---|
| Delta do acervo e grande (mudanca massiva) | Limitar delta a 50 pedacos por commit; acima, rebuild completo |
| Template de Q&A gera resposta fraca | Revisao humana obrigatoria (PR draft); LLM so refina, nunca cria |
| Cambio API do BC sai do ar | Fallback para fator fixo (ja na tabela); alerta no canario |
| `converter()` vira god-function | Dominio obrigatorio (string enum); cada dominio e Record separado |
| CodeScene regride com novos arquivos | `cs delta` no pre-commit; refatorar antes de commitar |
| pgvector ausente no Heroku | RAG em memoria (397 pedacos) suficiente; pgvector e Fase 5 do PLANO-RAG-COMPLETO, nao bloqueia |

### Metricas de sucesso

| Metrica | Baseline | Meta |
|---|---|---|
| Cobertura do RAG (paginas no acervo / paginas no portal) | ~40% (436 pedacos / ~100 paginas × multiplas facetas) | 80% em 2 semanas |
| Tempo de ingestao (push → acervo atualizado) | N/A (manual) | < 5 min na CI |
| Conversao de unidades: precisao | N/A | < 0,1% erro relativo |
| CodeScene: saude dos novos arquivos | N/A | > 9,0 |
| Cavas: runs com sucesso | 0/5 | 3/5 consecutivos |
| ETL: runs nao skipped | 0/3 | 1/3 (pelo menos betim) |
