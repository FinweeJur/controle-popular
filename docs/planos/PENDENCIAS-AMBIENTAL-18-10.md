# PENDÊNCIAS AMBIENTAL 18.10 — licenciamento fechado, EIA-RIMA e outorgas medidas

> **Tipo:** PLANO
> **Domínio:** ambiental (licenciamento, audiências/EIA-RIMA, TACs, outorgas, referência municipal)
> **Última medição:** 2026-10-18
> **Leitura estimada:** media
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [PENDENCIAS-07-10.md](PENDENCIAS-07-10.md)
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
3. **`ambiental_audiencias` está vazia no Heroku (0 linhas).** A página
   `/ambiental/estudos` não lê do banco: lê
   `etl/betim/dados/ambiental-estudos.json` — 1.004 audiências, 2.415
   linhas, **358 municípios**, Araçuaí incluída. O caminho de banco existe
   (`ambiental_audiencias` + `ambiental_estudo_documentos`), mas nada foi
   ingerido nele.
4. **EIA-RIMA com data velha e link morto.** JSON gerado em **20/08/2026**
   (dois meses antes da medição), fonte
   `sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-audiencia`.
   Dos 942 links por estado, **205 devolvem 404** (21,8%).
5. **TAC não é censo por cidade.** `/ambiental/tac` lê módulos curados
   (`lib/ambiental/tac-projetos-dados`, `tac-gtac`) — grandes acordos, cada
   um com os municípios que afeta. Zero em Araçuaí é esperado, não falha.
   A tabela `documentos_ambientais` tem 11 linhas (evidências: ALMG, CEMIG,
   IEF).
6. **Outorgas IGAM: limite estrutural.** A grade pública não expõe o
   município, só a regional (URGA). Já declarado na UI
   (`TabelaLicencas.tsx`); não é bug. Alternativa por cidade exigiria
   export xlsx com CSRF ou detalhe por portaria — não implementado.

## Pendências abertas

| # | Pendência | Esforço | Nota |
|---|---|---|---|
| P1 | ~~Remover São Paulo/SP de `ref_municipios_mg`~~ | encerrada | **não era bug**: grandfather documentado na migration `0057`; remover apagaria 28 barragens por cascata |
| P2 | Regerar `ambiental-estudos.json` (hoje 20/08) e tratar 205 links mortos | médio | exige rodar o coletor de audiências |
| P3 | Decidir o caminho de banco de audiências: ingerir no Heroku ou remover a tabela morta | médio | hoje a página vive de JSON |
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
