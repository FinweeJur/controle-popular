# Plano — Biblioteca de legislação (o painel das leis)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [FONTES.md](../06-fontes/FONTES.md), [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md), [REVISAO-CODIGO.md](../04-arquitetura/REVISAO-CODIGO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** legislacao, biblioteca, normas, lexml, urn, almg, camara, prefeitura, leismunicipais, planalto, normas.leg, tratados, onu, cidh, unesco, oms, omc, temas, tags, busca, rag, seu nono, seis qualidades, esfera, abrangencia

## Sumário

- [Propósito](#propósito)
- [O que já existe](#o-que-já-existe)
- [Visão](#visão)
- [Fontes por esfera](#fontes-por-esfera)
- [Modelo de dados](#modelo-de-dados)
- [Unificação e deduplicação](#unificação-e-deduplicação)
- [As seis qualidades aplicadas](#as-seis-qualidades-aplicadas)
- [Integração com o portal](#integração-com-o-portal)
- [Fases de execução](#fases-de-execução)
- [Regras editoriais e privacidade](#regras-editoriais-e-privacidade)
- [Riscos e armadilhas](#riscos-e-armadilhas)
- [Decisões registradas](#decisões-registradas)

## Propósito

Desenhar a **biblioteca unificada de legislação** do portal: uma base só,
por esfera (municipal, estadual, nacional, internacional), com busca,
filtro, ordenação, tags, resumo e exportação — o “Power BI das leis”. O
começo é a legislação **ambiental de Minas**: já é o que a casa tem de mais
maduro. Depois generaliza para todas as áreas e para o resto do país.

Este documento é **plano, não execução**. Nada aqui foi medido agora além do
que está citado com fonte.

## O que já existe

A biblioteca não nasce do zero. O que já está no ar e deve ser **base, nunca
duplicata**:

| Peça | Onde | O que dá |
|---|---|---|
| Acervo ambiental unificado | [legislacao-ambiental.ts](../../apps/web/lib/db/queries/legislacao-ambiental.ts) | 5 fontes numa tabela: ALMG, Semad, Siam (estaduais) + MMA, CNDH (federais). A coluna `esfera` já reserva `municipal` e `internacional` para o que não chegou. |
| Identificador canônico | [urn-lexml.ts](../../apps/web/lib/ambiental/urn-lexml.ts) | Monta a URN LexML para Lei/Decreto/Decreto-Lei/MP **federais**. Deriva no render, não grava — não envelhece. |
| Legislação municipal | [dados.ts](../../apps/web/lib/betim/legislacao/dados.ts) | 5 instrumentos (Lei Orgânica, Plano Diretor, Zoneamento, Tributário, Obras) verificados em `.gov.br`. |
| Temas e tags | `etl/temas_ambientais.py` | 8 temas e vocabulário fino por palavra-chave na ementa. |
| Busca global e RAG | [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md) | Índice de busca + assistente Seu Nonô (hoje 397 pedaços em memória). |

Medição registrada em 15/08: o portal publica **15.318 normas** (6.378
estaduais + 8.940 federais); só **651** ganham URN federal. O resto é
portaria/IN/resolução (tipo fora do vocabulário do `normas.leg.br`) ou
norma estadual (o portal é federal). Detalhe e armadilhas:
[URN-LEXML-NORMAS-LEG-BR.md](../historico/procedimentos/URN-LEXML-NORMAS-LEG-BR.md).

## Visão

Uma **única tela de biblioteca**, alimentada por um **único acervo**, com:

- **Abrangência** (esfera + território): internacional, nacional, estadual,
  municipal — e, dentro de cada, o recorte geográfico (Brasil, MG, cidade).
- **Temas** e **tags** unificados entre esferas (a mesma tag vale para uma
  lei federal e um decreto municipal).
- **Ordenável** por nome/tipo/número/ano/data/órgão/vigência.
- **Resumo** em português direto, rotulado quando gerado por máquina.
- **Pesquisável** na tela, na busca global e no RAG do Seu Nonô.
- **Exportável** (CSV com BOM e impressão), estritamente do que está filtrado.

A regra das seis qualidades do [AGENTS § 8](/AGENTS.md) vale para esta tela
como vale para qualquer acervo.

## Fontes por esfera

Ordem de preferência: **fonte oficial primeiro**, agregador privado só como
pista. Cada fonte nova entra em [FONTES.md](../06-fontes/FONTES.md) com a
licença e a decisão de coleta.

### Municipal — o Plano A são as câmaras e prefeituras

| Plano | Fonte | Como |
|---|---|---|
| **A** | APIs e portais das **câmaras e prefeituras** das cidades mapeadas | SAPL/APIs de câmara, portais de transparência, diários oficiais. Mesmo caminho já usado em Betim (ver [PLANO-revisao-dados-visibilizacao.md](PLANO-revisao-dados-visibilizacao.md), Sprint 4). Começa por MG. |
| **B** | Agregadores `leismunicipais.com.br` e `leisestaduais.com.br` | Só como ponte quando a fonte oficial não publica, e sempre marcados como agregador. A regra de ouro é a de [dados.ts](../../apps/web/lib/betim/legislacao/dados.ts): link principal só de `.gov.br`; agregador aparece na nota como pista. |

Base de partida: as **200+ cidades já mapeadas** (manifesto PNCP de 203,
medido em 25/09) em [PLANO-EXPANSAO-PNCP-199-CIDADES.md](PLANO-EXPANSAO-PNCP-199-CIDADES.md)
e a estrutura nacional em [PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md](PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md).

### Estadual

- **ALMG** (Assembleia de MG), **Semad** e **Siam** já coletam o acervo
  ambiental estadual.
- Expandir para as demais áreas e, depois, para as **27 assembleias** (o hub
  `/assembleias` já existe).

### Nacional

- **`normas.leg.br`** — API pública (`/api/public/normas`), não documentada,
  lida da rede da própria SPA. É o resolvedor de URN federal que funciona.
- **Planalto** (site da Presidência) — texto consolidado das leis federais.
- **MMA e CNDH** já estão no acervo. Candidatos: Ibama, ICMBio, Conama (as
  portarias hoje ficam sem URN — ver riscos).

### Internacional

- Tratados e documentos de **ONU** (UN Treaty Collection), **CIDH/OEA**,
  **UNESCO**, **OMS** e **OMC** com incidência sobre o Brasil.
- A casa já tem o hub `/internacional` e as conexões mapeadas em
  [G20-TRANSNACIONAL-BRASIL.md](../06-fontes/G20-TRANSNACIONAL-BRASIL.md) e
  [PLANO-EXPANSAO-INTERNACIONAL.md](PLANO-EXPANSAO-INTERNACIONAL.md) — a
  biblioteca pluga nos mesmos coletores.

## Modelo de dados

Estender a tabela que já existe (`ambiental_legislacao` → biblioteca geral),
sem quebrar o que a tela usa hoje. Campos-alvo por norma:

| Campo | Observação |
|---|---|
| `esfera` | `internacional` \| `nacional` \| `estadual` \| `municipal` (o check do banco já reserva os quatro). |
| `abrangencia` | Recorte territorial: `br`, `mg`, código IBGE da cidade. |
| `tipo`, `numero`, `ano`, `data` | Como a fonte escreve; `ano` derivado quando possível. |
| `orgao` | Órgão emissor. |
| `ementa` | Texto da fonte. |
| `situacao` | Vigência tal como a fonte diz; `null` = a fonte não informa, **nunca** “em vigor”. |
| `temas[]`, `tags[]` | Unificados entre esferas. `[]` é resultado legítimo. |
| `resumo` | Microresumo; se de máquina, rotulado com data e modelo. |
| `fonte`, `link_oficial` | Link direto e específico do ato. |
| `urn` | Quando houver (hoje só federal). Derivada, não congelada. |
| `chave_dedup` | Ver abaixo. |

## Unificação e deduplicação

- **Chave canônica:** `esfera + tipo + numero + ano + órgão`. A `urn` entra
  quando existir, porque aponta para o **ato**, não para o endereço de hoje.
- **Não fundir entre fontes sem prova.** A decisão de manter fontes separadas
  está documentada na migration `0063` e em `etl.apis._legislacao_ambiental`;
  repetir norma é melhor que fundir errado e perder a origem.
- **Lacuna é informação:** quando a fonte não publica, a linha diz
  `nao_encontrado` / `nao_verificado`, com nota de onde se procurou — matéria
  para LAI. Nunca inventar.

## As seis qualidades aplicadas

| Qualidade | Como entra |
|---|---|
| Linkável à fonte oficial | Ato sempre com link direto da fonte; agregador só na nota. |
| Buscável e filtrável | Busca textual tolerante a acento + facetas de esfera, tema, órgão, ano, situação. |
| Classificável e ordenável | Todas as colunas relevantes, com desempate por `id` (paginação estável). |
| Resumo e cartões de topo | Total por esfera/tema, medido e datado, nunca digitado à mão. |
| Chatbot com contexto cívico | O acervo alimenta o RAG do Seu Nonô com metadados e link oficial. |
| Exportável multi-formato | CSV (BOM, `;`) do filtrado na tela + impressão CSS e gráfico SVG acessível. |

## Integração com o portal

- **RAG / Seu Nonô:** a biblioteca é fonte do assistente; toda resposta cita o
  ato e linka a fonte oficial.
- **Busca global:** o acervo entra no índice de `scripts/gerar-indice-busca.mts`
  junto de memória e bases.
- **Página da cidade:** cada município mostra a legislação local (já iniciado
  em `/[municipio]/legislacao`).
- **Biblioteca de leis:** a tela nova, com as seis qualidades.

## Fases de execução

| Fase | Entrega | Escopo |
|---|---|---|
| **F1** | Esfera municipal em MG | Plano A nas câmaras/prefeituras das cidades de MG já mapeadas; Plano B (`leismunicipais`) só como ponte. |
| **F2** | Tela da biblioteca | As seis qualidades sobre o acervo unificado; filtro por esfera/tema/órgão/ano. |
| **F3** | Integração | RAG, busca global e página da cidade plugados no mesmo índice. |
| **F4** | Nacional e estadual geral | Alargar tipos (portaria/IN/resolução) e as 27 assembleias. |
| **F5** | Internacional | Tratados ONU/CIDH/UNESCO/OMS/OMC sobre o Brasil, na mesma base. |

Cada fase fecha com suíte e `tsc` verdes, cobertura **medida** e lacuna
declarada.

## Regras editoriais e privacidade

- **Número vem do dado**; resumo de máquina é rotulado, nunca conclusão do
  autor do documento.
- **Nunca dado pessoal.** CPF de pessoa física é violação; CNPJ é público.
  Varrer o dado antes de commitar ([AGENTS § 5.2](/AGENTS.md)).
- **Coleta:** pausa de 1–2 s por host, User-Agent honesto identificando o
  projeto, leitura de `robots.txt` — e a decisão registrada no cabeçalho do
  coletor ([AGENTS § 11](/AGENTS.md)).
- **Agregador privado não é fonte principal.** Ele ajuda a achar; o link
  oficial é que entra.

## Riscos e armadilhas

1. **HTTP 200 não prova nada no `normas.leg.br`** — a SPA devolve 200 com
   corpo idêntico para lei real e inventada; o sinal é o corpo trazer
   `legislationIdentifier`. Contar status mediria 100% e estaria 100% errado.
2. **LexML SRU está atrás de bot-check** (Senado). Não usar; o caminho que
   funciona é o `/api/public/` do `normas.leg.br`.
3. **Portaria/IN/resolução federal ficam sem URN** — tipo fora do vocabulário
   oficial. Não chutar autoridade; chute não vira link.
4. **Norma estadual não tem URN** no `normas.leg.br` (é federal). O lugar de
   plugar um resolvedor estadual é `TIPO_PARA_URN_FEDERAL` + a guarda de
   esfera, num arquivo só.
5. **Agregador pode estar desatualizado.** Por isso ele é pista, não fonte.
6. **Teto de payload.** Acervo grande vai por índice fatiado / paginação no
   servidor, não como prop de componente de cliente ([AGENTS § 5.1](/AGENTS.md)).

## Decisões registradas

- **Fonte oficial primeiro; agregador privado só como pista** — herdada de
  [dados.ts](../../apps/web/lib/betim/legislacao/dados.ts).
- **URN derivada, não gravada** — assim acompanha correções de data da fonte.
- **Não fundir entre fontes sem prova** — origem preservada (migration `0063`).
- **Municipal começa por Minas** — é onde a casa tem cobertura e acervo.
- **Lacuna declarada é conteúdo** — o que não veio aparece dito, não sumido.

## Origem

Nasce da visão do dono (30/09/2026): um “Power BI das leis”, geral, começando
pela legislação ambiental. Reaproveita o acervo ambiental, a URN LexML, a
legislação municipal verificada e o RAG existentes. Não substitui
[PLANO-EXPANSAO-INTERNACIONAL.md](PLANO-EXPANSAO-INTERNACIONAL.md) nem
[PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md](PLANO-BIBLIOTECA-CRIMES-SOCIOAMBIENTAIS.md)
— eles são fontes desta biblioteca.
