# PENDÊNCIAS AMBIENTAL 18.10 — licenciamento fechado, EIA-RIMA e outorgas medidas

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO
> **Domínio:** ambiental (licenciamento, audiências/EIA-RIMA, TACs, outorgas, referência municipal)
> **Última medição:** 2026-10-18
> **Leitura estimada:** media
> **Relacionados:** [ESTADO.md](../../02-estado/ESTADO.md), [FONTES.md](../../06-fontes/FONTES.md), [PENDENCIAS-07-10.md](/docs/historico/planos/PENDENCIAS-07-10.md)
> **Palavras-chave:** licenciamento, semad, ide-sisema, aracuai, eia-rima, audiencias, tac, outorga, igam, municipios, ref-municipios, bug-dados

## Sumário

- [Propósito](#propósito)
- [O que foi corrigido e verificado](#o-que-foi-corrigido-e-verificado)
- [Achados medidos](#achados-medidos)
- [Pendências abertas](#pendências-abertas)
- [Como verificar de novo](#como-verificar-de-novo)

## Propósito

Registrar o fechamento do bug "cidade com zero licenciamento" (18/10/2026)
e o que a auditoria encontrou nas frentes vizinhas — audiências/EIA-RIMA,
TACs, outorgas e a tabela de referência municipal. Medições feitas direto
no Heroku Postgres e no site publicado, não em relatório de terceiro.

## O que foi corrigido e verificado

**Causa do bug.** A coleta de 22/09 parou no município 145 e deixou
`ambiental_licenciamento` com 8.612 linhas em 145 municípios. Toda cidade
fora dessa fatia caía em `notFound()` — daí o "zero licenças" em Araçuaí
e em centenas de outras.

**Correção.** Rodada completa de 18/10 no Heroku: **19.713 linhas em 831
municípios** (commit `95007a2c`). Alias `Brasópolis` → `Brazópolis`
(`3108909`) recuperou 9 licenças que a similaridade 0,5714 < 0,6
descartava em silêncio.

**Verificação ao vivo no site publicado (18/10):**

| Cidade | Licenças |
|---|---|
| Araçuaí | 32 |
| Uberlândia | 646 |
| Paracatu | 308 |
| Divinópolis | 205 |
| Minas Novas | 39 |
| Brazópolis | 17 |

Índice: 19.713 licenças, 831 de 853 municípios. Cidades sem dado aparecem
marcadas "sem registro na fonte" e a página própria devolve 404 de
propósito.

## Achados medidos

1. **22 municípios sem licença na fonte** (831/853) — **conferido na fonte
   em 18/10: 22/22 dão zero no próprio WFS da Semad**
   (`IDE:ide_2101_mg_empreendimentos_licenciados_pto`, filtro
   `mun_solic='<nome>'`; Araçuaí devolve 32 pelo mesmo método). É lacuna da
   Semad, não da nossa coleta: Bandeira, Barão do Monte Alto, Bugre, Campo
   Azul, Catuti, Consolação, Córrego Novo, Entre Folhas, Imbé de Minas,
   Japonvar, Joanésia, Naque, Patis, Pingo-d'Água, Santa Efigênia de Minas,
   Santa Helena de Minas, São Geraldo da Piedade, São João do Oriente, São
   João do Pacuí, São Sebastião do Rio Preto, Senhora do Porto, Serra da
   Saudade.
2. **`ref_municipios_mg` tem 854 linhas — e está certo.** São as 853 de MG
   mais **São Paulo/SP (`3550308`)**, inserida de propósito pela migration
   `0057` (linhas 915-928) como *grandfather*: as 28 barragens SNISB da
   cidade de São Paulo apontam para esta tabela por FK com `on delete
   cascade`. Apagar a linha apagaria barragens reais. A UI corta com
   `like '31%'` e mostra 853. **Não remover.**
3. **`ambiental_audiencias` está vazia no Heroku (0 linhas) e é sobra de
   desenho.** O coletor declara na linha 126 de
   `etl/apis/ambiental_audiencias.py` que **não grava no Postgres** — só em
   JSON com `--saida`. A página `/ambiental/estudos` lê
   `etl/betim/dados/ambiental-estudos.json` — **1.016 audiências, 2.439
   linhas, 359 municípios** (regenerado em 18/10/2026), Araçuaí incluída.
   As tabelas `ambiental_audiencias` e `ambiental_estudo_documentos`
   (migration `0078`) não são lidas por nenhum código de `apps/`.
4. **A geração do dataset agora é reproduzível.** A transformação
   bruto→`linhas`+`resumo` morava fora do repositório e se perdeu; foi
   reescrita em `etl/betim/scripts/gerar-ambiental-estudos.py`, provada por
   round-trip (1.004 audiências antigas → 2.415 linhas, **0 divergência**).
   O script tem portão de validação: se o método de checagem não reproduzir
   os estados estáveis antigos, ele aborta em vez de degradar o dado.
5. **Links EIA/RIMA: 205 quebrados de 1.016 fichas.** Medido em 18/10:
   `ok` 740, `morto_404` 205, `morto_dns` 22, `bloqueado` 20, `instavel` 17,
   `nao_checado` 8, `sem_resposta` 4. O Google Drive passou a responder
   **500** ao HEAD e **416** ao `GET` com `Range` no `uc?export=download`
   (anti-abuso) — falseava centenas de links bons. A sonda certa é
   `file/d/<id>/view`, que devolve 200/404 honestos. A UI já mostra o selo
   "link quebrado" e o filtro "somente link quebrado".
6. **TAC não é censo por cidade.** `/ambiental/tac` lê módulos curados
   (`lib/ambiental/tac-projetos-dados`, `tac-gtac`) — grandes acordos, cada
   um com os municípios que afeta. Zero em Araçuaí é esperado, não falha.
   A tabela `documentos_ambientais` tem 11 linhas (evidências: ALMG, CEMIG,
   IEF).
7. **Outorgas IGAM: limite estrutural.** A grade pública não expõe o
   município, só a regional (URGA). Já declarado na UI
   (`TabelaLicencas.tsx`); não é bug. Alternativa por cidade exigiria
   export xlsx com CSRF ou detalhe por portaria — não implementado.

## Pendências abertas

| # | Pendência | Esforço | Nota |
|---|---|---|---|
| P1 | ~~Remover São Paulo/SP de `ref_municipios_mg`~~ | encerrada | **não era bug**: grandfather documentado na migration `0057`; remover apagaria 28 barragens por cascata |
| P2 | ~~Regerar `ambiental-estudos.json` e tratar links mortos~~ | encerrada | regenerado em 18/10: **1.016 audiências / 2.439 linhas / 359 municípios**; gerador versionado e provado por round-trip; Drive exige sondar `file/view` |
| P3 | ~~Decidir o caminho de banco de audiências~~ | encerrada | diagnóstico: coletor **não grava no Postgres** por desenho (linha 126); tabelas `0078` são mortas. Resta só decidir drop com o dono |
| P4 | ~~Investigar as 22 cidades sem licença~~ | encerrada | **22/22 conferidas no WFS da Semad em 18/10: zero na fonte**. Lacuna real, não filtro nosso |
| P5 | Outorgas por município: mover para escopo regional (URGA) ou buscar rota alternativa | grande | depende de decisão do dono |

## Como verificar de novo

- Licenciamento no banco: `select count(*), count(distinct id_municipio)
  from ambiental_licenciamento;` → 19.713 / 831.
- Referência: `select count(*) from ref_municipios_mg;` → 854, sendo 853 com
  `id_ibge like '31%'` (o 854º é São Paulo/SP, grandfather proposital).
- Audiências no banco: `select count(*) from ambiental_audiencias;` → 0.
- Site: abrir `/ambiental/licenciamento/municipio/3103405` (Araçuaí) e
  conferir 32 licenças.
- Fonte: WFS `https://geoserver.meioambiente.mg.gov.br/IDE/ows`, camada
  `IDE:ide_2101_mg_empreendimentos_licenciados_pto`, `request=GetFeature` +
  `resulttype=hits` + `CQL_FILTER=mun_solic='<nome>'` → Araçuaí 32,
  Bandeira 0.
- EIA/RIMA: `python scripts/gerar-ambiental-estudos.py --comparar` prova o
  transformador; sem `--comparar`, coleta audiencias novas e recheca links.
  O site só publica o novo dado **após deploy** (não disparado sem ordem).