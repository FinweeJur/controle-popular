# Expansão ambiental para as 27 UF — além de Minas

> **Tipo:** PLANO
> **Domínio:** ambiental (licenciamento, EIA-RIMA, TAC/acordos, barragens, outorgas)
> **Última medição:** 2026-11-17
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [relatorio-mapeamento-27-estados.md](../relatorio-mapeamento-27-estados.md), [PENDENCIAS-AMBIENTAL-18-10.md](../historico/planos/PENDENCIAS-AMBIENTAL-18-10.md)
> **Palavras-chave:** licenciamento, eia-rima, tac, barragens, sigbm, snisb, anm, outorga, 27-uf, expansao-nacional

## Sumário

- [Propósito](#propósito)
- [Medido em 17/11/2026](#medido-em-17112026)
- [Onda 1 — o que é nacional de graça](#onda-1--o-que-é-nacional-de-graça)
- [Onda 2 — reconhecimento das 12 UF sem coletor](#onda-2--reconhecimento-das-12-uf-sem-coletor)
- [Onda 3 — EIA-RIMA fora de MG](#onda-3--eia-rima-fora-de-mg)
- [Onda 4 — acordos](#onda-4--acordos)
- [Onda 5 — publicação](#onda-5--publicação)
- [Pendências herdadas](#pendências-herdadas)
- [Como verificar](#como-verificar)
- [Origem / Histórico](#origem--histórico)

## Propósito

Hoje o eixo ambiental é Minas Gerais com ilhas. Este plano leva licenciamento,
EIA-RIMA, acordos e barragens para as 27 unidades da federação.

Regra que vale em tudo: **fonte de órgão diferente nunca soma um "total
Brasil"**. Cada linha guarda o `orgao` de origem, e a tela diz o que é amostra.

## Medido em 17/11/2026

Licenciamento no feed `/ambiental/licencas` — 18 fontes, **todas com
`gerado_em` de 17/09/2026**:

| Situação | UF / fonte | Números |
|---|---|---|
| Completo | SP, ES, MT, MA, GO, DF, IBAMA | CETESB-SP 28.507 · IEMA-ES 20.792 · SEMA-MT 17.083 · IBAMA 14.157 · IBRAM-DF 3.758 · SEMAD-GO 3.095 · SEMA-MA 2.350 |
| Amostra truncada | RS, PR, SC, MS, RO, ANA | FEPAM-RS 300 de 54.589 · IAT-PR 300 de 364.419 · IMA-SC 300 de 114.790 · IMASUL-MS 24.000 de 41.417 · SEDAM-RO 5.966 de 25.353 · ANA 50.000 truncado |
| Quase vazio | BA, PA | INEMA-BA 71 linhas · SEMAS-PA 141 linhas |
| Sem coletor | AC, AL, AM, AP, CE, PB, PE, RJ, RN, RR, SE, TO | 12 UF |

As outras frentes:

| Frente | O que existe | Alcance |
|---|---|---|
| EIA-RIMA | `etl/betim/dados/ambiental-estudos.json` — 1.016 audiências, 2.439 linhas, 359 municípios | só SISEMA-MG |
| Acordos (TAC) | GTAC-MG — 2.002 termos, 392 municípios | só MG |
| Barragens de mineração | `apps/web/data/barragens-sigbm.json` | **nacional desde 17/11** (908 em 21 UF); a tela é de MG |
| Barragens, todos os usos | `snisb_barragens` no banco | **28.159 barragens em 27 UF e 3.562 municípios** desde 17/11 (rodada `--uf` nas 27). MG segue com 2.212 em 443 — a tela filtra pelo prefixo `31`, então o número publicado não mudou |
| Licenciamento por município | 19.713 linhas em 831/853 cidades | só MG |

O mapeamento dos 27 órgãos já existe desde 17/09/2026 em
[relatorio-mapeamento-27-estados.md](../relatorio-mapeamento-27-estados.md).
Ele diz o órgão, o sistema e a URL de cada UF — o que falta é **verificar ao
vivo** e escrever o coletor.

## Onda 1 — o que é nacional de graça

| # | O que | Ganho | Dependência |
|---|---|---|---|
| 1.1 | SIGBM/ANM: tirar o filtro de UF do `etl/betim/etl/apis/sigbm_anm.py` | ✅ **feito em 17/11**: 908 barragens, 21 UF, 183 municípios. MG segue com 318 e 59 municípios — os números da tela não mudaram | nenhuma |
| 1.2 | SNISB: rodar `--uf` nas 26 UF restantes | catálogo nacional de barragens | ✅ **feito em 17/11**: 28.159 barragens, 27 UF, 3.562 municípios, 0 sem município casado. MG segue 2.212/443. SP parou no 33º município por código repetido na fonte (Cajobi, 2488) — a coleta agora colapsa a repetição e conta; RN tinha 3 grafias antigas (Açu, Arês, Augusto Severo) que viraram alias |
| 1.3 | ANA outorgas: paginar até o fim | outorga federal por UF | hoje corta em 50.000 |
| 1.4 | Re-rodar as 18 fontes de licença | dado de 17/09 → atual | roda na madrugada |

SIGBM não cobre 27 UF: em 17/11/2026 o CSV traz barragens de mineração em 21.
Zero em AC, CE, DF, ES, PE e RR é ausência na fonte, não falha de coleta.

## Onda 2 — reconhecimento das 12 UF sem coletor

### Pará primeiro (ordem do dono, 17/11/2026)

O que o PA já tem medido: 712 barragens do SNISB em 84 municípios, 120 de
mineração no SIGBM, e **141 linhas de amostra** de licenciamento quando o
SIMLAM publica **115.980 empreendimentos** — ou seja, 0,1%.

O coletor `scripts/coletar-semas-pa-licencas.py` já fala com o SIMLAM sem
login e tem checkpoint por página (`.cache/semas-pa/`). A conta do custo é
do host, não do código: 115.980 detalhes + 11.598 páginas, a 3 s por
requisição (o cabeçalho do script marca o SIMLAM como sensível), dão **~106 h
de relógio — 4,4 dias**. Não paraleliza: dois workers furariam o ritmo de
1 requisição por host.

Rodada completa disparada em 17/11 (`--empreendimentos`, log em
`logs/semas-pa-supervisor.log`). Ela **acumula**: cada página fechada vale 10
empreendimentos e fica no checkpoint (`scripts/.cache/semas-pa/lista/`), então
uma noite já rende mais que a amostra de setembro. O JSON final só é escrito
no fim; até lá o site continua com a amostra de 141 linhas, que não é apagada.

Quem garante a noite é `scripts/rodar-semas-pa-ate-concluir.py`: pergunta ao
`checkpoint.json` se o catálogo fechou e, se não, chama o coletor de novo (ele
retoma do primeiro chunk faltando). Sem supervisor, um 500 de EventValidation
no meio matava a rodada e o resto da noite ficava sem coleta. O custo de
reiniciar é reandar o pager até a página salva (1 requisição por página, ~4 s
cada): reiniciar na página 1.000 custa ~1 h antes de dado novo.

A rotina noturna (`scripts/rodar-coleta-full.py`) passou a rodar o modo por
empreendimento, não o de processo: `--limit 0` custa ~106 h e nunca fecha numa
noite.

Pendente do dono: baixar a pausa de 3 s para 2 s (dentro da regra do repo de
1–2 s) encurta a rodada para ~71 h. Não foi feito sem ordem — o 3 s está
escrito no cabeçalho do coletor como decisão medida.

Ordem de prioridade: **PA → RJ → PE → CE → AM → AL → RN → PB → SE → TO → AC → AP → RR**.

> **17/11/2026 — o dono puxou o PA para a frente de todos.** O Pará não está
> entre as 12 UF sem coletor (INEMA-BA e SEMAS-PA já têm 141 linhas cada), mas
> tem 712 barragens do SNISB em 84 municípios, 120 de mineração no SIGBM e é o segundo maior
> estado em área e em pressão de licenciamento. Ordem: completar o que é
> barragem (feito), reconhecer SEMAS-PA, EIA-RIMA e MPPA, e só então voltar
> para a fila acima.


Cada ficha responde 6 perguntas, e é isso que decide se vira coletor:

1. O portal lista processo?
2. Filtra por município?
3. Pagina ou exporta?
4. `robots.txt` e termo de uso permitem?
5. Tem captcha ou login?
6. Volume estimado.

Pela experiência das 15 UF já feitas, a expectativa é cerca de 8 viáveis e 4
travados.

### RJ — sondado ao vivo em 17/11/2026

| Item | Achado |
|---|---|
| Licenciamento | `portallicenciamento.inea.rj.gov.br` é o SELCA: o acesso cai em **login de requerente com reCAPTCHA**. Nenhuma rota pública de consulta de processo foi localizada em 3 páginas do INEA. Tratar como Grupo C até aparecer rota pública — o relatório de 27/09 supunha "SPA/REST API" e isso não se confirmou |
| EIA-RIMA | ✅ **viável**. `inea.rj.gov.br/publicacoes/consulta-eia-rima/` tem página por ano (`/eia-rima-AAAA/`): 200 de 2007 a 2025, **404 em 2026**. Cada página linka PDFs nomeados com o nº SEI e o empreendimento (2025: 9 PDFs; 2024: 15) |
| Audiências públicas | ✅ **viável**. `inea.rj.gov.br/audiencias-publicas/` publica editais e atas em PDF, com nº SEI e empreendimento no título |
| Armadilha | o ano corrente é 404 porque a página-mãe foi atualizada em 04/2024 — coletor precisa tratar 404 por ano, não abortar |
| Campo que falta | município não é estruturado; sai do nome do empreendimento, com dicionário de municípios do RJ (mesma lição do MPMG) |

Conclusão do RJ: **EIA-RIMA entra agora**; licenciamento fica para LAI ou para
uma segunda sondagem no SPA.

## Onda 3 — EIA-RIMA fora de MG

Antes de escrever coletor por estado, checar se existe agregador nacional
(MMA/SINIMA). Se existir, muda o desenho. Prioridade estadual: **SP, RJ, PA,
MT, BA, RS** — RJ já está sondado (acima).

Armadilhas herdadas de MG que valem para qualquer UF:

- O Estado não hospeda o estudo: publica link para nuvem de terceiro.
- O Google Drive responde 500 ao `HEAD` e 416 ao `GET` com `Range`. A sonda
  certa é `file/d/<id>/view` (ver [PENDENCIAS-AMBIENTAL-18-10.md](../historico/planos/PENDENCIAS-AMBIENTAL-18-10.md)).
- `nome_arquivo: null` é dado, não buraco a preencher.
- Medido em MG: 205 links mortos de 1.016 fichas. Esperar o mesmo em todo lugar.

## Onda 4 — acordos

GTAC-MG é a única fonte hoje: 2.002 termos, 392 municípios. Fora de MG, nesta
ordem: **MPF (Câmara de Meio Ambiente) → CGU (acordos de leniência) → MPs
estaduais**.

Armadilha medida: `transparencia.mpmg.mp.br/buscarTac` responde **HTTP 200 com
0 byte** — status de sucesso e corpo vazio. Não serve como rota, e o mesmo
disfarce pode aparecer em outros MPs: validar corpo, nunca só o status.

## Onda 5 — publicação

`/ambiental/licencas` já tem filtro por UF, mas não diz o que é amostra.
Amostra tem de aparecer na tela (`300 de 54.589`), nunca virar número redondo.

Depois: páginas de barragem por UF (o dado já está nacional) e o recorte de
EIA-RIMA por UF. A segunda depende da Onda 1.2 para o SNISB.

## Pendências herdadas

| # | Pendência | Estado |
|---|---|---|
| P5 | Outorga IGAM por município (a grade só expõe a URGA) | depende de decisão do dono |
| D7 | CAR com cobertura municipal completa | exige ETL de 1,16 milhão de imóveis |
| B7 | OCR dos TAC do MPMG | sem rota de listagem |

## Como verificar

- Barragens: contar UF em `apps/web/data/barragens-sigbm.json` — `total`,
  `por_uf` e `municipios` são gravados pelo coletor.
- Catálogo de município: `select count(*), count(distinct uf) from
  ref_municipios` deve dar **5.571 e 27**; `select count(*) from ref_municipios
  where uf is null` deve dar **0** (a migration `0092` termina em
  `set not null`).
- Licenças: `apps/web/data/*licencas*.json`, campos `gerado_em` e `truncado`.
- EIA-RIMA: `etl/betim/dados/ambiental-estudos.json`, `resumo.audiencias` e
  `resumo.linhas`.
- RJ: `GET https://www.inea.rj.gov.br/eia-rima-2025/` (200) e
  `.../eia-rima-2026/` (404).

## Origem / Histórico

- **17/11/2026 — plano criado.** Pedido do dono: resgatar as pendências
  ambientais e levar EIA/RIMA, licenciamento, acordos e barragens para além de
  MG. Onda 1.1 executada no mesmo dia (SIGBM nacional) e RJ sondado ao vivo.
  A Onda 2 aproveita o mapeamento de
  [relatorio-mapeamento-27-estados.md](../relatorio-mapeamento-27-estados.md),
  de 17/09/2026.
- **17/11/2026 — `ref_municipios` nacional.** `0057` criou a tabela com as 853
  de MG; `0092_ref_municipios_nacional.sql` renomeia para `ref_municipios`,
  acrescenta `uf` e insere as 5.571 cidades do IBGE (27 UF). O recorte por UF
  passou a ser obrigatório em `etl.common.resolver_municipio` — sem ele, um
  "Bom Jesus" de MG casaria com o homônimo de PI ou de RN.
  Aplicada no banco local em 17/11 (5.571 linhas, 27 UF, 0 sem UF; as 5 FKs
  seguiram a tabela). **Pendente no Heroku**: a `DATABASE_URL` do `.env` é a
  local e é a única que o repositório conhece.
