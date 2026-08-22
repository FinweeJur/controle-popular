# Fontes: Plataforma Brumadinho UFMG

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, fontes, coleta

## Sumário

- [Propósito](#propósito)
- [Resposta curta](#resposta-curta)
- [1. Quem é quem — cinco portais diferentes, fácil de confundir](#1-quem-é-quem-cinco-portais-diferentes-fácil-de-confundir)
- [2. IDE/GeoNode — o catálogo geoespacial](#2-idegeonode-o-catálogo-geoespacial)
- [3. Buscador de processos judiciais (Plataforma, Solr) — funciona, e é exatamente onde mora o risco](#3-buscador-de-processos-judiciais-plataforma-solr-funciona-e-é-exatamente-onde-mora-o-risco)
- [4. O que o site institucional tem, e por que também não dá pra copiar](#4-o-que-o-site-institucional-tem-e-por-que-também-não-dá-pra-copiar)
- [5. O que fazer com isso — ganho real, sem ingestão](#5-o-que-fazer-com-isso-ganho-real-sem-ingestão)
- [6. Lacunas declaradas](#6-lacunas-declaradas)
- [7. O que NÃO deve ser ingerido, e por quê](#7-o-que-não-deve-ser-ingerido-e-por-quê)
- [8. Endpoints confirmados — resumo](#8-endpoints-confirmados-resumo)
- [9. Ordem sugerida](#9-ordem-sugerida)

## Propósito

> ⚠️ **CORREÇÃO REGISTRADA EM 13/08/2026, MESMO DIA — ver > `docs/PLANO-INTEGRACAO-BRUMADINHO.md`.** A conclusão "não ingerir" do > buscador de processos (seções 3 e 7 abaixo) partia de risco **não medido** > — "pode conter dado pessoal" tratado como motivo de bloqueio total, em vez > de pergunta...

> ⚠️ **CORREÇÃO REGISTRADA EM 13/08/2026, MESMO DIA — ver
> `docs/PLANO-INTEGRACAO-BRUMADINHO.md`.** A conclusão "não ingerir" do
> buscador de processos (seções 3 e 7 abaixo) partia de risco **não medido**
> — "pode conter dado pessoal" tratado como motivo de bloqueio total, em vez
> de pergunta a medir. O dono corrigiu a premissa: **processo coletivo é
> público por natureza**, publicidade dos atos processuais é regra
> (CPC art. 189; LOMAN), não exceção, e o acervo já está publicado pela
> própria UFMG — copiar metadado já público não cria exposição nova. O plano
> de integração mediu o índice de verdade (distribuição por tipo de
> documento, campos expostos, confirmação de que NÃO há PDF nem texto
> integral acessível ao público) e achou que o risco real está concentrado
> em ~1,3% do acervo (tipos como "documento de identificação", "comprovante
> de residência"), não no acervo inteiro. **A ingestão de metadado, com
> triagem por tipo, está planejada — não bloqueada.** A seção 2 do IDE
> (camadas geoespaciais) segue com a mesma conclusão de não ingerir, essa
> reconfirmada, não corrigida. Este documento fica como está abaixo, como
> registro histórico da pesquisa original — a correção vive no documento
> novo, não por cima daqui.

Pergunta do dono: dá pra integrar algo do mapa/dados da Plataforma Brumadinho
UFMG? Resposta longa abaixo. A curta é **quase nada do mapa, e nada do
buscador de processos** — mas achei um jeito honesto e de custo zero de
puxar valor de lá mesmo assim: **linkar**, não copiar.
>
> *(Ver a caixa de correção no topo: a parte "nada do buscador de processos"
> foi corrigida em 13/08/2026 — ver `docs/PLANO-INTEGRACAO-BRUMADINHO.md`.)*

Tudo abaixo foi **chamado de verdade e confirmado respondendo** em
2026-08-13. Onde não confirmei, está escrito que não confirmei.

---

## Resposta curta

| # | Pergunta | Existe fonte utilizável hoje? | Licença permite republicar? |
|---|---|---|---|
| 1 | Camadas geoespaciais do IDE/GeoNode UFMG | **Sim, mas quase sem valor.** 16 camadas, todas de 2020, todas cartografia-base (hidrografia, MDT, limites, censo) já disponível em fonte mais fresca (ANA/IBGE/IEDE-SISEMA). WMS/WFS **quebrados** (erro de banco). Só o download direto do arquivo original funciona. | **Sim, para a maioria** (Domínio Público, confirmado camada a camada) — mas não compensa: é cópia velha de dado que já é aberto na fonte primária. |
| 2 | Buscador de processos judiciais (Plataforma, Solr) | **Sim, funciona bem** — 7.107 documentos indexados. | **Não aplicável — não ingerir.** Petições de processo judicial de vítimas. Risco de dado pessoal. Ver seção "O que NÃO ingerir". |
| 3 | Site institucional (relatórios dos 67 subprojetos) | Existe, mas é texto/PDF, não dado estruturado. | **Não.** Rodapé diz "Todos Direitos Reservados". Só linkar. |
| 4 | Algo daqui que o portal ainda não tem e ajuda quem foi atingido | **Não, na prática.** O valor real dos subprojetos (saúde, contaminação, impacto socioeconômico) está em relatório/PDF fechado, não em camada ou API aberta. | — |

A conclusão que interessa: **a Plataforma Brumadinho UFMG não é hoje uma
fonte de ingestão — é uma fonte de citação.** O melhor uso é um link de
qualidade nas páginas certas, não um pipeline.

---

## 1. Quem é quem — cinco portais diferentes, fácil de confundir

O dono pediu para não confundir. Medido agora, são pelo menos cinco coisas
distintas com "Brumadinho" no nome ou no assunto:

| Portal | Endereço | Quem mantém | O que é |
|---|---|---|---|
| **Projeto Brumadinho UFMG** | `projetobrumadinho.ufmg.br` | UFMG (Drupal 8) | Site institucional do projeto de pesquisa/extensão. 67 subprojetos, auxilia a 2ª Vara da Fazenda Pública de BH. Rodapé: **"2021 \| Todos Direitos Reservados"**. |
| **Plataforma Brumadinho UFMG** | `plataforma.projetobrumadinho.ufmg.br` | UFMG (subprojeto "Plataforma") | App (SPA) para consultar os **documentos do processo judicial** — busca full-text via Solr. Não é site de mapa. |
| **IDE Brumadinho UFMG** | `ide.projetobrumadinho.ufmg.br` | UFMG (instância GeoNode/GeoServer) | O catálogo geoespacial de verdade — é o que alimenta o widget de mapa Leaflet embutido no site institucional. Endereço não é divulgado em nenhum menu; achei vasculhando o bundle JS da Plataforma. |
| **Portal da Auditoria Socioambiental** | `portal.auditoriasocioambiental.com.br` | AECOM (auditora independente do Acordo, contratada pelo Comitê Gestor) | 211 relatórios técnicos (2019–2025) sobre a Bacia do Paraopeba, incluindo estudos de risco à saúde humana (ERSHRE). Acesso exige identificação por **CPF + data de nascimento**. **Não é UFMG.** Não pesquisei a fundo — fora do escopo desta pergunta, registro para research futuro. |
| **Pró-Brumadinho** | `mg.gov.br/pro-brumadinho` | Comitê Gestor Pró-Brumadinho (Governo de MG, Decreto 48.183/2021) | Portal financeiro/prestação de contas do Estado sobre o Acordo. **Não é UFMG.** Não pesquisado a fundo aqui. |
| **FGV — Projeto Rio Paraopeba** | `www18.fgv.br/projetorioparaopeba` | FGV (auditora independente dos Anexos I.3/I.4) | **Já integrado** no portal (`apps/web/lib/betim/paraopeba.ts`, migration 0022). Citado aqui só para não confundir com o resto. |
| Vale — página ESG Brumadinho | `vale.com/esg/brumadinho` | Vale S.A. | Comunicação institucional da empresa responsável pelo rompimento. **Não é fonte independente.** Não é dado, é relações públicas. |
| MPMG | `mpmg.mp.br` | Ministério Público de MG | Coautor institucional do Acordo (junto com MPF e DPMG). **Não mantém plataforma própria de dados** sobre Brumadinho — o que publica é notícia/comunicação, redirecionando para os portais acima. |

**Portanto: "Plataforma Brumadinho UFMG" no pedido do dono é na verdade duas
coisas** — o site institucional (relatórios) e o app de busca de processos
(Solr) — **mais uma terceira, escondida** (o IDE/GeoNode), que é a única com
geodado de verdade.

---

## 2. IDE/GeoNode — o catálogo geoespacial

### Como achei

Não tem link visível em nenhum menu do site institucional nem da Plataforma.
Achei baixando o bundle JS da Plataforma
(`http://plataforma.projetobrumadinho.ufmg.br/src.850c92d4.js`, 2,82 MB) e
grepando por `geoserver`. O widget de mapa (Leaflet, 113 referências no
bundle) usa:

```js
l = "http://ide.projetobrumadinho.ufmg.br/geoserver/ows"
d = {
  "Minas Gerais": tileLayer.wms(l, {layers:"geonode:limite_mg"}),
  "Municípios": tileLayer.wms(l, {layers:"geonode:mun_proj_brumadinho1"})
}
```

### ⚠️ Armadilha operacional grande: WMS, WFS e REST estão TODOS quebrados

Testei os três protocolos do GeoServer. Os três devolvem o **mesmo erro**,
palavra por palavra:

```
org.springframework.transaction.CannotCreateTransactionException: Could not
open JPA EntityManager for transaction; ... org.hibernate.exception.
GenericJDBCException: Cannot open connection ... Database may be already in
use: Locked by another process.
```

| Chamada | Resultado |
|---|---|
| `GetCapabilities` (WFS 2.0.0) | HTTP 400, erro de banco acima |
| `GetCapabilities` (WMS 1.3.0) | HTTP 200 mas corpo é `ServiceExceptionReport` com o mesmo erro |
| `GetMap` de `geonode:limite_mg` | HTTP 200 mas corpo é XML de erro, não PNG |
| `/geoserver/rest/layers.json` | HTTP 500, mesmo erro |

É erro de **banco H2 embutido travado** (clássico de GeoServer mal mantido:
outro processo, provavelmente um script de manutenção, está segurando o
lock do catálogo). Não é rate limit, não é permissão, não é "camada não
existe" — é o backend de consulta espacial **fora do ar de verdade**, hoje.
Não é transitório-e-eu-testei-uma-vez: reproduzi o mesmo erro em 4 chamadas
diferentes.

**Consequência prática: não dá pra consultar geometria por WFS nem
renderizar tile por WMS.** O próprio mapa embutido no site institucional da
UFMG está quebrado agora, pelo mesmo motivo.

### O que funciona: a API de catálogo (metadado) e o download direto do zip

Duas coisas sobrevivem ao banco travado, porque não dependem dele:

**A API REST legada do GeoNode** (`/api/layers/`, versão 1, não a v2)
responde normal:

```
http://ide.projetobrumadinho.ufmg.br/api/layers/?limit=20
```
Confirmado: HTTP 200, `geonode_version: "3.1.0"`, **16 camadas** (`objects`),
com abstract, licença, data, bbox por camada.

**O download do arquivo original** (fora do GeoServer, servido pelo GeoNode
como documento estático):

```
http://ide.projetobrumadinho.ufmg.br/download/<id>
```
Testado em duas camadas:
- `/download/5` (`geonode:limite_mg`) → HTTP 200, `application/zip`,
  **1.607.097 bytes**, shapefile válido.
- `/download/36` (`geonode:mun_proj_brumadinho1`) → HTTP 200, **60.076
  bytes**, shapefile + metadado ISO 19115/FGDC/Dublin Core completo em
  `.metadata/*.xml` e um dump JSON com a licença por extenso.

⚠️ **Todos os endpoints são `http://`, nunca `https://`** — testei e a porta
443 recusa conexão nos três subdomínios (`projetobrumadinho`,
`plataforma.projetobrumadinho`, `ide.projetobrumadinho`). Não é bloqueio
daqui: `curl -v` mostra `Connection refused` na negociação TCP, antes de
qualquer TLS.

### As 16 camadas — o que são, e por que nenhuma é dado novo do desastre

Todas datadas de **21/07/2020 a 18/08/2020** — congeladas há seis anos, sem
uma atualização desde então (`maintenance_frequency: unknown` em todas).
Nenhuma tem indicador de saúde, contaminação ou impacto socioeconômico —
são só a cartografia-base que os 67 subprojetos usaram como pano de fundo:

| Camada | O que é | Fonte declarada | Licença |
|---|---|---|---|
| `limite_mg` | Limite estadual de MG | IEDE/MG | Domínio Público |
| `mun_proj_brumadinho1` | **19 municípios** das chamadas de pesquisa do projeto | IBGE | Domínio Público |
| `distrito_mg`, `meso_mg`, `vila0`, `localidade_ibge0` | Distritos, mesorregiões, vilas, localidades de MG | IEDE/MG, IBGE, FJP | Domínio Público |
| `set_censo_2010_mg` | Setores censitários do Censo 2010 em MG | IBGE | **Não Especificada** |
| `DEM` | Modelo digital de elevação da bacia, ~150m | curvas de nível IEDE/MG | **Variada/Derivada** |
| `curva_nivel_20` | Curvas de nível (20/50m) | IEDE/MG | Domínio Público |
| `rio_paraopeba`, `bacia_paraopeba`, `rib_ferro_carvao`, `bacia_ferro_carvao`, `massa_dagua_mg`, `trecho_massa_dagua` | Hidrografia e bacias | ANA / IDE-SISEMA | Domínio Público / Não Especificada |
| `SUPERVIEW1_BRUMADINHO_30JAN2019` | Imagem de satélite do dia seguinte ao rompimento | TecTerra/SpaceWill (comercial) | **Não Especificada** — ⚠️ não republicar, é imagem de terceiro comercial |

**Confirmação da licença, não suposição**: baixei o dump de metadado ISO da
camada 36 (`mun_proj_brumadinho1`) e a licença vem por extenso:
`"license": {"id": 4, "name": "Public Domain", "abbreviation": "PD", ...}`.
As demais camadas foram checadas uma a uma pela página HTML de detalhe
(`/layers/geonode:<nome>`, campo "Licença").

CRS confirmado no `.prj` de `mun_proj_brumadinho1`: `GEOGCS["SIRGAS 2000"...
SPHEROID["GRS_1980"...]` — datum idêntico ao EPSG:4674 usado no resto do
projeto, mas **o `.prj` não traz o código EPSG explícito** (sem tag
`AUTHORITY`), então não afirmo "é EPSG:4674" com certeza total.

### A única camada com alguma singularidade — e por que não vale a pena mesmo assim

`mun_proj_brumadinho1` lista os **19 municípios** formalmente incluídos nas
chamadas de pesquisa do Projeto Brumadinho UFMG — um recorte **menor e
diferente** dos 26 municípios signatários do Acordo Geral que o portal já
cobre via FGV (é uma área mais concentrada no entorno imediato de
Brumadinho/Betim/Pará de Minas, mesorregiões Metropolitana de BH e Central
Mineira):

```
Betim, Brumadinho, Curvelo, Esmeraldas, Florestal, Fortuna de Minas,
Igarapé, Juatuba, Maravilhas, Mário Campos, Martinho Campos, Papagaios,
Pará de Minas, Paraopeba, Pequi, Pompéu, São Joaquim de Bicas,
São José da Varginha, Sarzedo
```

É Domínio Público confirmado, é fácil de baixar. **Mesmo assim não
recomendo implementar**: é literalmente um subconjunto do limite municipal
do IBGE, reproduzível em cinco minutos com o shapefile de municípios que o
IBGE já publica atualizado — a camada da UFMG não teria nem geometria mais
fresca nem informação que o IBGE não tenha. O único ganho seria "citar que
esses 19 municípios são o escopo formal da pesquisa UFMG", o que é
informação de baixíssimo impacto para quem foi atingido.

### Veredito da seção 2

**Não ingerir nenhuma camada do IDE.** Não é por a licença proibir — é
Domínio Público na maioria — é porque **não passa no teste de "ganho vale o
esforço"**: são 2020, são cópia de fonte que já é aberta em lugar mais
fresco (ANA, IBGE, IEDE-SISEMA — e o projeto já usa o geoserver da
IEDE-SISEMA para outras camadas), e nenhuma tem o dado que faria diferença
(saúde, contaminação, indicador de impacto). Copiar teria custo de
manutenção (mais um pipeline) para gerar redundância.

---

## 3. Buscador de processos judiciais (Plataforma, Solr) — funciona, e é exatamente onde mora o risco

### O serviço

```
http://plataforma.projetobrumadinho.ufmg.br/solr/platform/select?q=*:*&rows=0
```
Confirmado: HTTP 200, JSON, `"numFound": 7107`. É um índice Solr público
(sem autenticação) dos documentos do processo judicial nº
`5010709-36.2019.8.13.0024` (2ª Vara da Fazenda Pública de BH — o processo
que resultou no AJRI).

Amostra real de um documento (`id: 60346198`, "Petição Inicial"):

> "Petição inicial do processo... ajuizada pelo Estado de Minas Gerais...
> requer tutela antecipada... visando o atendimento das medidas emergenciais
> **às vítimas (pessoas, famílias, municípios)**..."

### Por que isto é zona de risco, não zona de oportunidade

O campo `summary_pt` que testei é resumo institucional (autor: "Estado de
Minas Gerais"), sem CPF nem nome de vítima individual **nesse resumo**. Mas:

- São **7.107 documentos**, incluindo `id_attached_documents` (anexos) — não
  dá pra garantir, sem abrir cada um, que nenhum anexo tem petição
  individual, laudo médico, ficha de cadastro de atingido ou lista de
  beneficiário com CPF/nome. Em processo de reparação de vítima, esse tipo
  de documento existe quase certamente em algum lugar do acervo.
- O campo `authors`/`author_metadata` referencia diretamente
  "equipe do subprojeto 01 do projeto brumadinho" — ou seja, o índice
  também carrega metadado de pesquisador, não só de processo.
- Este repositório **já vazou CPF uma vez** por um caminho mais simples que
  este (comentário de código, não nem dado real) — ver `docs/ANTES-DO-PUSH.md`.
  Um índice de 7 mil documentos judiciais de vítimas é ordem de grandeza
  mais perigosa.

### Veredito da seção 3

**Não ingerir.** Nem metadado agregado por enquanto: seria preciso auditar
documento por documento antes de publicar até um "processo tem N petições",
e isso está fora do escopo de uma integração de dado público. Se algum dia
fizer sentido, o caminho seguro é **linkar** para a Plataforma oficial
(`plataforma.projetobrumadinho.ufmg.br/proceedings`) e deixar a consulta
individual acontecer lá, sob a govermança de acesso que a UFMG já decidiu
— não replicar o acervo aqui.

---

## 4. O que o site institucional tem, e por que também não dá pra copiar

`projetobrumadinho.ufmg.br` (Drupal 8) publica os 67 subprojetos por eixo
(`/subprojetos/meio-ambiente`, `/subprojetos/saude-da-populacao`,
`/subprojetos/socioeconomico`, `/subprojetos/infraestrutura`), cada um com
relatórios em PDF e descrição. Confirmado no rodapé da home:

> "2021 | Todos Direitos Reservados"

**Sem licença aberta declarada** para o conteúdo textual/relatórios — ao
contrário das camadas do GeoNode (que têm licença por item), aqui é
reserva de direitos padrão. **Não copiar texto nem PDF.** Linkar é o único
caminho compatível.

Segundo material de divulgação da própria UFMG (Pró-Reitoria de Extensão —
**não medido por mim, é o que a UFMG diz sobre si própria**): mais de 400
pesquisadores, 67 subprojetos, 19 municípios atendidos por atividade de
extensão. Não tratar como contagem confirmada por este levantamento.

---

## 5. O que fazer com isso — ganho real, sem ingestão

O achado que sobra depois de descartar mapa (quebrado/redundante) e
buscador (risco de dado pessoal) é simples: **o portal ainda não cita o
Projeto Brumadinho UFMG em lugar nenhum**, e citar custa uma seção de link,
não um pipeline.

Sugestão concreta, de baixo custo:

- Na página do Paraopeba (`apps/web/app/[municipio]/meio-ambiente/paraopeba/page.tsx`),
  que já tem uma seção "O que é essa auditoria" linkando a FGV, acrescentar
  uma linha equivalente para o Projeto Brumadinho UFMG
  (`http://projetobrumadinho.ufmg.br/inicial`) como fonte acadêmica
  independente sobre saúde/ambiente/socioeconomia — mesmo padrão de link
  externo já usado ali, mesma seção.
- Não linkar direto para a Plataforma de busca de processos
  (`plataforma.projetobrumadinho.ufmg.br`) num contexto que pareça convidar
  a raspar — se linkar, deixar claro que é ferramenta de consulta oficial da
  UFMG, uso é lá.

---

## 6. Lacunas declaradas

- **Não confirmei** se as camadas do IDE alguma vez tiveram versão mais
  recente do que 2020 — não achei changelog nem página de "sobre a IDE".
  Pode ser que o projeto tenha simplesmente parado de manter aquele
  catálogo depois da fase inicial.
- **Não teve como testar** os `.metadata/*.xml` das 14 camadas restantes
  além das duas baixadas — os dumps podem trazer detalhe extra de proveniência
  que não vi.
- **Não pesquisei a fundo** o Portal da Auditoria Socioambiental (AECOM) nem
  o Pró-Brumadinho — apareceram no caminho da disambiguação pedida, mas a
  pergunta era sobre UFMG. Ambos merecem um levantamento próprio, no mesmo
  padrão deste documento, se o dono quiser seguir por ali (o ERSHRE da AECOM
  em particular pode ter dado de saúde/ambiente mais recente e mais fino que
  qualquer coisa do IDE de 2020 — mas também tem gate de CPF+nascimento para
  acessar os relatórios, o que já é um sinal de cautela redobrada).
- **Não abri** nenhum dos 7.107 documentos do índice Solr além do resumo do
  primeiro — a afirmação de risco de dado pessoal é por amostragem do tipo
  de documento (petição de reparação de vítima), não por ter encontrado um
  CPF específico.
- **Não confirmei** se `http://ide.projetobrumadinho.ufmg.br` tem alguma
  forma de contato/suporte para reportar o banco travado — se algum dia
  quiserem reconsiderar as camadas geoespaciais, valeria avisar a equipe da
  UFMG que o serviço de consulta está fora do ar.

---

## 7. O que NÃO deve ser ingerido, e por quê

| O quê | Por quê |
|---|---|
| **Índice de processos judiciais (Solr, 7.107 docs)** | Documento de processo de reparação de vítima. Alto risco de dado pessoal em anexos não auditados. Repositório é público e já vazou CPF uma vez por caminho mais simples. |
| **Relatórios/PDFs do site institucional** | "Todos Direitos Reservados" no rodapé — sem licença de redistribuição. |
| **Imagem de satélite `SUPERVIEW1_BRUMADINHO_30JAN2019`** | Licença "Não Especificada", fonte é empresa comercial terceira (TecTerra/SpaceWill) hospedada pela UFMG, não autoria da UFMG. |
| **Qualquer camada do IDE, mesmo as PD** | Não é dado-pessoa, mas reprovou no teste de esforço×ganho: 2020, redundante com fonte primária mais fresca, serviço de consulta quebrado. Não é proibição, é priorização. |

---

## 8. Endpoints confirmados — resumo

```bash
# Catálogo de camadas (GeoNode API legada) — funciona
http://ide.projetobrumadinho.ufmg.br/api/layers/?limit=20        # 16 camadas

# Download do arquivo original de uma camada — funciona, contorna o GeoServer quebrado
http://ide.projetobrumadinho.ufmg.br/download/<id>               # shapefile .zip

# WFS/WMS/REST do GeoServer — QUEBRADOS (erro de banco, confirmado nos 3 protocolos)
http://ide.projetobrumadinho.ufmg.br/geoserver/ows?service=wfs&version=2.0.0&request=GetCapabilities
http://ide.projetobrumadinho.ufmg.br/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities
http://ide.projetobrumadinho.ufmg.br/geoserver/rest/layers.json

# Buscador de processos judiciais (Solr) — funciona, NÃO INGERIR
http://plataforma.projetobrumadinho.ufmg.br/solr/platform/select?q=*:*&rows=0   # numFound: 7107

# Site institucional — texto/PDF, "Todos Direitos Reservados"
http://projetobrumadinho.ufmg.br/inicial
```

⚠️ **Todos em `http://`.** HTTPS recusa conexão nos três subdomínios
`.ufmg.br` testados.

---

## 9. Ordem sugerida

Critério: maior ganho para quem foi atingido, menor esforço, primeiro.

1. **Linkar o Projeto Brumadinho UFMG na página do Paraopeba**, mesma seção
   que já linka a FGV. Custo: uma linha de JSX. Ganho: cita fonte acadêmica
   independente que hoje não aparece no portal.
2. **Nada de ingestão de camada do IDE.** Já é redundante com o que o
   projeto tem ou pode ter direto do ANA/IBGE/IEDE-SISEMA, e o serviço de
   consulta está quebrado.
3. **Nada de ingestão do buscador de processos.** Risco de dado pessoal
   supera o ganho; se quiser, linkar, não replicar.
4. **Se algum dia quiserem ir atrás de dado de saúde/ambiente mais
   substantivo do universo de reparação de Brumadinho**, o candidato mais
   promissor não é a UFMG — é o **Portal da Auditoria Socioambiental
   (AECOM)**, que teria os ERSHRE (estudo de risco à saúde humana) mais
   recentes. Precisa de levantamento próprio, com o mesmo cuidado redobrado
   de dado de saúde/pessoa — o gate de CPF+nascimento no acesso já é sinal
   de que o dado ali é mais sensível, não menos.

---

*Levantado em 2026-08-13. Todos os endpoints desta página foram chamados e
responderam (inclusive os que respondem com erro — o erro em si foi
confirmado, não presumido). As contagens foram medidas, não estimadas. O
que não foi confirmado está marcado como tal.*
