# Plano: integração Brumadinho — mapa e acervo judicial

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, plano, entregue

## Sumário

- [Propósito](#propósito)
- [Resposta curta](#resposta-curta)
- [1. Frente 1 — o que falta no mapa 3D](#1-frente-1-o-que-falta-no-mapa-3d)
- [2. Frente 2 — o buscador de documentos do processo judicial (Solr)](#2-frente-2-o-buscador-de-documentos-do-processo-judicial-solr)
- [3. A etapa de dado pessoal — o que muda com a régua da seção 2.4](#3-a-etapa-de-dado-pessoal-o-que-muda-com-a-régua-da-seção-24)
- [4. Ordem sugerida — maior ganho para quem foi atingido, menor esforço primeiro](#4-ordem-sugerida-maior-ganho-para-quem-foi-atingido-menor-esforço-primeiro)
- [5. O que este plano NÃO decide](#5-o-que-este-plano-não-decide)
- [6. Lacunas declaradas](#6-lacunas-declaradas)

## Propósito

> Parte da premissa corrigida pelo dono em 13/08/2026: **processo coletivo é > público por natureza**, publicidade dos atos processuais é a regra, o > sigilo é exceção, e o acervo do processo 5010709-36.2019.8.13.0024 (e os > outros 15 processos ligados a Brumadinho) já está publicado na internet...

> Parte da premissa corrigida pelo dono em 13/08/2026: **processo coletivo é
> público por natureza**, publicidade dos atos processuais é a regra, o
> sigilo é exceção, e o acervo do processo 5010709-36.2019.8.13.0024 (e os
> outros 15 processos ligados a Brumadinho) já está publicado na internet
> pela própria UFMG. A conclusão anterior de `docs/_historico/FONTES-BRUMADINHO-UFMG.md`
> — **"não ingerir" o buscador de processos** — está **corrigida por este
> documento**: a integração é para ser planejada, não descartada. Ver seção 6.

Tudo abaixo foi **chamado de verdade e confirmado respondendo** em
2026-08-13. Onde não confirmei, está escrito que não confirmei. Contagem é
sempre contagem medida contra o endpoint, nunca estimativa.

---

## Resposta curta

| # | Pergunta | Achado |
|---|---|---|
| 1 | As 30 camadas do globo já cobrem Brumadinho? | Parcialmente. `zas-barragens`/`mancha-inundacao-barragens` são a **simulação hipotética** (PAE) de 156 barragens de MG. Não existe hoje a **área real** atingida em 2019, nem monitoramento, nem remanejamento. |
| 2 | Camadas da UFMG (IDE/GeoNode) ainda valem a pena? | **Não, reconfirmado.** Ainda 16 camadas, ainda todas de 2020, ainda cartografia-base redundante. Mesma conclusão do documento anterior — aqui só reconfirmada, não reaberta. |
| 3 | Existe fonte melhor que a UFMG para "o que aconteceu de verdade"? | **Sim, achado novo.** `geoserver.meioambiente.mg.gov.br/IDE` (SEMAD/IDE-Sisema — a MESMA infra que já alimenta `zas-barragens`) publica uma família de **8 camadas dedicadas ao rompimento de Brumadinho**: área diretamente afetada, 291 pontos de monitoramento, 104 pontos de remanejamento de família, estruturas de contenção, obras/intervenções, restauração. HTTPS, sem autenticação, licença "acesso livre", ~1,4 MB no total. |
| 4 | O buscador de processos judiciais (Solr, UFMG) funciona e é acessível? | **Sim, reconfirmado: 7.107 documentos**, na verdade de **16 processos distintos** (não um só). Só metadado + resumo institucional — **não expõe PDF nem texto integral**, testado e confirmado. |
| 5 | Dá para ingerir isso com segurança? | **Sim, com triagem por tipo de documento, não com bloqueio geral.** ~90 documentos (1,3%) são de tipo explicitamente pessoal (documento de identificação, comprovante de residência, declaração de hipossuficiência) — mesmo sem PDF, o **resumo** já contém iniciais e dado de saúde/emprego de vítima nesses tipos. O grosso (petição, decisão, certidão, intimação, despacho — tema "trâmites processuais", 4.732 docs) é processual/institucional e seguro. |
| 6 | Volume se for arquivar | ~9,3 MB estimados para o índice inteiro (só metadado — não há PDF para baixar, a plataforma não expõe nenhum). Cabe até em Static Assets; R2 é o padrão do projeto mesmo assim, por consistência com `docs/PLANO-ARQUIVO-DE-FONTES.md`. |

**Maior achado do dia**: a fonte boa para Brumadinho não estava na UFMG — estava
na própria SEMAD, na mesma infraestrutura que o portal já usa para `zas-barragens`
e `mancha-inundacao-barragens`. É extensão de um cano que já existe, não um
cano novo.

---

## 1. Frente 1 — o que falta no mapa 3D

### 1.1 Reconfirmação: as 16 camadas da UFMG (IDE/GeoNode) continuam sem valor

Rechamado hoje, mesmo endpoint do documento anterior:

```
http://ide.projetobrumadinho.ufmg.br/api/layers/?limit=100
```

Confirmado: HTTP 200, `total_count: 16`. **As mesmas 16 camadas**, mesmas
datas (21/07/2020 a 18/08/2020), mesmo conteúdo (limites administrativos,
hidrografia, censo, um DEM ~150m, uma imagem de satélite comercial de licença
não especificada). Nenhuma camada nova desde a última medição. **Não vale a
pena ingerir — mantida a conclusão anterior, com a mesma base de esforço×ganho.**
Não testei de novo o WMS/WFS quebrado do GeoServer da UFMG (já confirmado
quebrado três vezes no documento anterior, sem motivo para esperar
recuperação silenciosa em poucos dias).

### 1.2 Achado novo: a família `ide_250102_mg_*` do IDE-Sisema (SEMAD)

Buscando além da UFMG (ANM, FEAM, comitê de bacia, Defesa Civil — como o
pedido sugeriu), achei que a **SEMAD/IDE-Sisema** — o mesmo GeoServer que já
serve `zas-barragens` e `mancha-inundacao-barragens` para o portal, via
`geoserver.meioambiente.mg.gov.br/IDE/ows` — publica uma **série dedicada ao
rompimento da barragem B1 (Mina Córrego do Feijão)**, catalogada no
GeoNetwork da SEMAD (`idesisema.meioambiente.mg.gov.br/geonetwork`), com
prefixo `ide_250102_mg_*` (250102 = código interno de publicação, não data).

Todas as 8 camadas foram **chamadas via `GetCapabilities` e via `GetFeature`
de verdade** hoje, e todas respondem:

```
GetCapabilities: https://geoserver.meioambiente.mg.gov.br/IDE/ows?service=WFS&version=2.0.0&request=GetCapabilities
→ HTTP 200, 906.043 bytes, XML — as 8 camadas abaixo aparecem no capabilities
```

| Camada (`typeName`) | O que é | Feições medidas | Tamanho GeoJSON medido |
|---|---|---:|---:|
| `ide_250102_mg_impactos_ambientais_pol` | **Área diretamente afetada (ADA) pelo rejeito** — a mancha REAL, não hipotética | 2 | 97 KB |
| `ide_250102_mg_monitoramento_pto` | Pontos de monitoramento ambiental (água, ar, ruído, geotecnia) | 291 | 78 KB |
| `ide_250102_mg_remanejamento_pto` | Pontos de origem de famílias remanejadas | 104 | 28 KB |
| `ide_250102_mg_estruturas_contecao_pol` | Diques, estacas-prancha, barreiras estabilizantes de calha, canal de drenagem | 37 | 884 KB |
| `ide_250102_mg_obras_intervencoes_poligonais_pol` | Obras (pontes, ETA, disposição de rejeito, dragagem) | 22 | 285 KB |
| `ide_250102_mg_obras_intervencoes_pontuais_pto` | Obras pontuais (tratamento de sedimento, bombeamento emergencial, instrumentação) | 13 | 4 KB |
| `ide_250102_mg_obras_intervencoes_lineares_lin` | Obra linear (dragagem emergencial) | 1 | 3 KB |
| `ide_250102_mg_restauracao_pol` | Áreas de revegetação/restauração | 35 | 51 KB |

**Total: 8 camadas, 505 feições, ~1,4 MB de GeoJSON bruto.** Cabe inteiro sem
simplificação — para comparação, `mancha-inundacao-barragens` já entra
comprimido (`.gz`) no globo por ser maior.

#### O que cada uma realmente diz, medido no atributo, não suposto

- **`impactos_ambientais_pol`** (a mais importante): dois polígonos, cada um
  com `descricao: "Área afetada pelo rompimento da barragem I da Mina
  Córrego do Feijão"`. Mapeado por imagem Pleiades a escala compatível
  1:2.500 (metadado do GeoNetwork), publicado pela Semad em 2020,
  metadado revisado em 2023. **Isto é a mancha real do desastre — o par
  factual do que `zas-barragens`/`mancha-inundacao-barragens` já mostram
  como simulação hipotética (PAE) para as 156 barragens de MG.** As duas
  coisas contam histórias diferentes e as duas valem estar no mapa: uma é
  "o que pode acontecer se uma barragem parecida romper", a outra é "o que
  aconteceu quando esta rompeu".
- **`monitoramento_pto`** (291 pontos) — categoria medida por prefixo do
  campo `descricao`:

  | Categoria | Pontos |
  |---|---:|
  | Rejeitos | 140 |
  | Água Superficial e Sedimentos | 45 |
  | Água Subterrânea | 40 |
  | Água Superficial | 17 |
  | Ruído | 16 |
  | Hidrossedimentométrico | 11 |
  | Ar | 6 |
  | Efluente | 6 |
  | Poço Cava Feijão | 6 |
  | Radar Geotécnico | 4 |

  É exatamente o "ponto de monitoramento de água" que o pedido cogitou —
  e vem com ar, ruído e geotecnia de brinde.
- **`remanejamento_pto`** (104 pontos): campo `descricao` é sempre
  `"Origem: <bairro>"` — ex. "PARQUE DA CACHOEIRA", "CORREGO DO FEIJAO".
  É a origem do remanejamento por **comunidade**, não endereço individual
  nem nome — ver nota de risco na seção 1.3.
- **`estruturas_contecao_pol`** e as três camadas de `obras_intervencoes_*`:
  engenharia de contenção e obras emergenciais (diques, barreiras
  estabilizantes de calha — BEC, dragagem, bombeamento). Valor mais técnico
  que cívico direto, mas documenta o que foi construído para conter o
  rejeito.
- **`restauracao_pol`** (35 polígonos): áreas de revegetação por platô/setor.

#### Licença e formato — confirmados, não presumidos

Testei o registro de metadado do GeoNetwork para as duas camadas mais
importantes:

```
https://idesisema.meioambiente.mg.gov.br/geonetwork/geonetwork/api/records/202cf333-3337-4f7d-91a8-68ee9f1b93ad   (impactos_ambientais)
https://idesisema.meioambiente.mg.gov.br/geonetwork/srv/api/records/8fb50427-3b40-436b-8801-b3a623d452a4          (remanejamento)
```

Ambas: **licença "O acesso ao dado é livre"**, mantidas pela Secretaria de
Estado de Meio Ambiente e Desenvolvimento Sustentável (Semad-MG), CRS
SIRGAS 2000 (EPSG:4674) — mesmo datum do resto do projeto. Formatos
disponíveis: shapefile (`SHAPE-ZIP` via WFS), KML, Excel, e o `GetFeature`
com `outputFormat=application/json` que usei para medir (funciona,
confirmado, sem exigir os outros formatos). **As outras 6 camadas da mesma
série não tiveram o metadado individual aberto** — presumo mesma licença
por serem do mesmo publicador/série, mas isto é presunção, não confirmação
camada a camada; declarado como lacuna na seção 6.

#### Por que o custo de integração é baixo

Não é um pipeline novo. `apps/web/scripts/gerar-proveniencia-globo.mjs` já
documenta `zas-barragens` e `mancha-inundacao-barragens` como vindas de
`geoserver.meioambiente.mg.gov.br/IDE` (mesma raiz, mesmo protocolo WFS,
mesmo formato de resposta). Um coletor para `ide_250102_mg_*` é o mesmo
receita — troca o `typeName`, ajusta o `descricao`/`classe` da proveniência.
Não testei o coletor real (fica em outra frente/worktree, fora do escopo
territorial que esta tarefa autoriza tocar), mas o protocolo está provado
vivo e respondendo.

### 1.3 O que NÃO é dado pessoal aqui, e o que merece uma nota

`remanejamento_pto` é o único ponto de atenção nesta frente: são pontos
georreferenciados de **origem** de famílias deslocadas. O campo não traz
nome nem CPF — só o bairro de origem ("Origem: PARQUE DA CACHOEIRA") — e é
publicado como dado aberto pela própria Semad. Mesmo assim, a geometria do
PONTO (não só o texto) pode, em tese, coincidir com o terreno de uma
residência específica que não existe mais. Recomendo **não** aumentar a
precisão nem cruzar esta camada com CAR/cadastro de imóvel por CPF — usar
como está, com o mesmo tom informativo do dado de origem, não como localizador
de família.

### 1.4 O que pesquisei e NÃO virou camada — lacunas declaradas desta frente

- **ANM/SIGBM** (`sigbm.anm.gov.br/Publico`): existe, é público, atualiza em
  tempo real a classificação de risco/dano potencial associado (DPA) de
  barragens de mineração no Brasil inteiro, incluindo presumivelmente o
  registro histórico da B-I de Brumadinho. **Não achei, no tempo desta
  pesquisa, um endpoint de download em lote que respondesse** (tentei
  `dadosabertos.anm.gov.br` e `dados.gov.br/dados/conjuntos-dados/barragens-de-mineracao`
  — a segunda existe como página, não confirmei o arquivo). Fica como
  candidato para um levantamento dedicado, não incluído aqui por falta de
  confirmação de endpoint que responda.
- **IGAM/InfoHidro** (`portalinfohidro.igam.mg.gov.br`): confirmado que
  existe uma rede integrada IGAM+COPASA+CPRM/ANA com 47 pontos de
  monitoramento de água e sedimento no Paraopeba desde 2019 — mas isto é
  **narrativa e boletim**, não achei WFS/API própria durante esta pesquisa
  (diferente da camada `monitoramento_pto` da Semad, que É geoespacial e
  JÁ TESTADA respondendo — por isso ela entrou na tabela acima e o InfoHidro
  não). Pode ser o mesmo dado por trás, sem confirmar.
- **Comitê de bacia (CBH Paraopeba) / Agência Peixe Vivo**: publica boletins
  diários (texto), não achei dataset estruturado.
- **Defesa Civil de MG**: não achei portal de dado aberto específico sobre
  Brumadinho no tempo desta pesquisa.
- **Pró-Brumadinho / Acordo de reparação**: confirmado que existe portal
  financeiro (`mg.gov.br/pro-brumadinho`) com dados abertos mensais — mas
  isto é a MESMA linha de dado que a FGV já publica e que o portal já
  integra via `apps/web/lib/betim/paraopeba.ts` (migration 0022). Não é
  camada de mapa nem gap novo.

---

## 2. Frente 2 — o buscador de documentos do processo judicial (Solr)

### 2.1 O serviço, reconfirmado

```
http://plataforma.projetobrumadinho.ufmg.br/solr/platform/select?q=*:*&rows=0
→ HTTP 200, "numFound": 7107
```

Igual ao documento anterior. **Correção sobre o documento anterior**: não é
"o processo" — é **16 processos distintos** (facet em `process_number`,
medido agora):

| Processo | Documentos |
|---|---:|
| 5087481-40.2019.8.13.0024 | 1.670 |
| 5010709-36.2019.8.13.0024 (o citado no doc anterior) | 1.635 |
| 5026408-67.2019.8.13.0024 | 1.176 |
| 5044954-73.2019.8.13.0024 | 1.167 |
| 5071521-44.2019.8.13.0024 | 670 |
| 5036296-26.2020.8.13.0024 | 243 |
| + 10 processos menores | 546 (soma) |

Todos da 2ª Vara da Fazenda Pública de BH, todos ligados à reparação do
rompimento — mas processos diferentes (tutela coletiva inicial,
desdobramentos, incidentes). Isso importa para a triagem de risco (seção
2.4): o processo maior (5087481) tem trecho de "lista de pessoas
desaparecidas", o processo citado no doc anterior (5010709) é mais
institucional.

### 2.2 O que cada documento é — distribuição MEDIDA, não estimada

Facet real sobre os 7.107 documentos (`facet.field=type`, top 20 de 50
tipos distintos):

| Tipo | Docs | % |
|---|---:|---:|
| documentos comprobatórios | 1.847 | 26,0% |
| outros documentos | 1.800 | 25,3% |
| petição | 642 | 9,0% |
| documento de comprovação | 504 | 7,1% |
| juntada | 446 | 6,3% |
| certidão | 309 | 4,3% |
| intimação | 185 | 2,6% |
| manifestação da promotoria | 153 | 2,2% |
| ata de audiência | 134 | 1,9% |
| decisão | 123 | 1,7% |
| documentos 2a instância | 103 | 1,4% |
| manifestação | 101 | 1,4% |
| despacho | 96 | 1,4% |
| extraprocessual | 88 | 1,2% |
| ofício | 79 | 1,1% |
| manifestação da defensoria pública | 70 | 1,0% |
| manifestação da advocacia pública | 64 | 0,9% |
| procuração | 57 | 0,8% |
| **documento de identificação** | **56** | 0,8% |
| petição inicial | 23 | 0,3% |
| **comprovante de residência** | **17** | 0,2% |
| **declaração de hipossuficiência** | **17** | 0,2% |
| (mais 30 tipos menores, incl. sentença: 3, acórdão: 1) | — | — |

Por **tema** (`theme_pt`, multivalorado — um doc pode ter mais de um):

| Tema | Docs |
|---|---:|
| trâmites processuais | 4.732 |
| socioeconômico | 1.067 |
| infraestrutura | 997 |
| meio ambiente | 733 |
| saúde da população | 288 |
| n.a. | 4 |

### 2.3 Campos do índice — testado, não é "o que o app usa" e sim o que o Solr devolve

Peguei um documento inteiro (`fl=*`) e o endpoint REST irmão
(`/api/process-documents/<id>`, que devolve os MESMOS campos mais
`created_at`/`updated_at`/`created_by`):

```
id, page, process_number, title, type, id_2, id_same_documents,
id_main_documents, id_attached_documents, id_referenced_documents,
theme_pt, theme_en, ctc_category_pt, ctc_category_en, keywords, keywords_f,
places, attached_at, summary_pt, summary_en, authors, authors_f,
author_metadata, created_by, published_at, created_at, updated_at, deleted_at
```

**Não há campo de texto integral nem de arquivo/PDF.** Testei ativamente
procurar um: `/static/proceedings/full/<id>`, `/static/proceedings/frag/<id>`
e variantes devolvem o shell HTML da SPA (fallback de rota, não documento);
`/document/<id>` e `/proceedings/<id>` idem. Vasculhei o bundle JS
(`src.850c92d4.js`, 2,82 MB) atrás de URL de storage/S3/PDF — achei strings
como `"application/pdf"` e `"process-document-preview-pdf"` (a interface
tem visualizador de PDF), mas **nenhuma URL de arquivo aparece em texto
plano no bundle**, e nenhum endpoint testado devolveu um PDF. **Conclusão
prática: o público não tem acesso a texto integral nem a arquivo original
por esta plataforma — só metadado + um resumo (`summary_pt`/`summary_en`)
escrito por humano/IA da equipe do projeto.** Isso é uma notícia boa para o
risco: não existe um acervo de 7.107 PDFs para baixar e auditar — existe um
catálogo de metadado, que é uma categoria de risco bem menor.

### 2.4 Onde o risco de dado pessoal realmente mora — medido, não suposto

O ponto do dono está correto: a maioria do acervo é ato processual público
(petição, decisão, certidão, intimação, despacho, ofício — 4.732 docs no
tema "trâmites processuais"). **Mas o resumo (`summary_pt`) às vezes já
contém dado sensível mesmo sem PDF**, e isso É medido, não hipótese:

```
type: "comprovante de residência"
summary_pt: "Documentos de comprovação apresentados por L.H.M.G: 1) comprovante
  de residência [...] emitido pela Unidade Básica de Saúde (UBS) [...];
  3) formulário para pagamento emergencial [...]; 4) fichas de solicitação
  de exames complementares [...]"
authors: ["l.h.m.g."]
```

```
process_number: 5087481-40.2019.8.13.0024, type: "documentos comprobatórios"
summary_pt: "Relatório da Vale S/A apresentando lista de pessoas sem contato,
  classificadas como desaparecidas, divulgado em prazo não superior a
  24 horas, referente à data de 18/06/2019."
```

O padrão medido: quem indexou já **reduz nome a iniciais** no resumo (boa
prática pré-existente da equipe UFMG) — mas isso não neutraliza o segundo
caso, e cruzando `theme_pt=saúde da população` (288 docs) com `type`, 100
dos 288 são "documentos comprobatórios" e 64 "outros documentos" — os dois
tipos catch-all, que fazem 51,3% do acervo inteiro e cuja composição real
varia por processo (medido: no processo 5087481, uma fatia de
"documentos comprobatórios" é a lista diária de desaparecidos; no processo
5010709, a mesma categoria trouxe estatuto social de ONG e ata de assembleia
da Vale — institucional, sem dado de vítima).

**Isto substitui o "não ingerir" do documento anterior por uma régua
operacional**: risco não é do acervo inteiro, é concentrado por
`type` × `theme_pt` × `process_number`, e dá para medir antes de publicar.

### 2.5 Paginação e limite de requisição

Testado sem hesitar: `rows=10000` (acima do total, 7.107) numa chamada só
devolveu tudo, HTTP 200, em menos de 1 segundo. `start=100` pagina
normalmente. Cinco chamadas sequenciais rápidas (~0,3s cada) não
disparam nenhum throttle observável. **Não há limite de requisição
confirmado** — o que não significa ausência de limite, só que não bati
nele nesta medição. Mesmo assim, o plano de coleta deve pausar entre
lotes por educação com o servidor, seguindo a mesma regra 3 de
`docs/PLANO-ARQUIVO-DE-FONTES.md`.

### 2.6 Volume real

Amostra de 200 documentos completos (`fl=*`, JSON): 275.236 bytes →
**1.376 bytes/doc em média**. Para os 7.107: **~9,3 MB no total.** Isto é só
metadado — não há PDF para somar, porque não existe PDF exposto (seção 2.3).
Cabe folgado em Static Assets (teto de 25 MiB por arquivo); ainda assim,
recomendo R2, pela mesma razão do `docs/PLANO-ARQUIVO-DE-FONTES.md`: um
acervo com histórico (nova captura no futuro pode mudar contagem/resumo,
e o hash prova integridade) e separado do bundle do deploy.

### 2.7 Licença e citação

Não há licença aberta declarada para a Plataforma. O bundle JS traz as
strings `"All rights reserved"` / `"Todos os direitos reservados"` — mesmo
padrão do site institucional já registrado no documento anterior. **Isto
não é impedimento para citar/indexar metadado de processo judicial**: o
copyright de uma aplicação (design, resumo redigido, categorização) é
distinto da natureza pública do processo em si — publicidade dos atos
processuais é regra legal (CPC art. 189; LOMAN), não uma opção da UFMG. A
UFMG detém direito sobre o RESUMO que ela escreveu, sobre a curadoria/
categorização (`theme_pt`, `ctc_category_pt`) e sobre o app — não sobre o
fato de o processo existir nem sobre o número/tipo/data do documento. **A
regra de atribuição proposta**: toda entrada vinda deste índice cita
"Plataforma Brumadinho UFMG" com link para o documento na origem
(`plataforma.projetobrumadinho.ufmg.br`, o mesmo padrão de rótulo que o
projeto já usa para FGV no Paraopeba), e o resumo é reexibido como
CITAÇÃO do resumo da UFMG (com atribuição), não reescrito como se fosse
produção própria do portal.

### 2.8 Onde isso encaixa no portal, sem virar silo

Três pontas existentes, e a integração é estender cada uma, não criar
uma quarta:

- **`/busca`** (`apps/web/scripts/gerar-indice-busca.mts`): já gera um
  índice estático fatiado a partir de 5 fontes (`atos_oficiais`,
  `proposicoes`, `congresso.proposicoes`, `judiciario.tribunais`,
  `judiciario.magistrados`), cada uma com seu `f` (zona: `cidades`,
  `congresso`, `judiciario`). O padrão pede uma sexta fonte, zona nova
  (ex. `f: "brumadinho"`), reaproveitando o MESMO pipeline de
  `to_tsvector`/radicalização — mas como o dado vive num Solr externo, não
  no Postgres do projeto, é preciso primeiro espelhar o metadado filtrado
  para uma tabela local (ou uma etapa de coleta que grava JSON estático
  direto), e só então alimentar o gerador. O tamanho (~9,3 MB de origem,
  bem menos depois de filtrar os tipos de risco) não é o gargalo.
- **`/[municipio]/meio-ambiente/paraopeba`**: já tem a seção "A avaliação
  independente da UFMG" linkando o site institucional (não o buscador). Um
  link para a Plataforma de busca, agora que ela deixou de ser
  "não confirmar", cabe na mesma seção, com o aviso de que é ferramenta de
  consulta oficial da UFMG.
- **`/[municipio]/meio-ambiente/barragens`**: já existe por cidade, já cita
  Mariana/Brumadinho como exemplo de método a montante. É o lugar natural
  para citar a família `ide_250102_mg_*` (Frente 1) na página de
  Brumadinho especificamente, e possivelmente linkar os documentos do
  processo relacionados àquele município quando o `places`/tema bater.

Nenhuma dessas rotas precisa virar "página do processo judicial" com
visualizador de PDF — a plataforma da UFMG já é essa página, e não expõe o
PDF de qualquer forma (seção 2.3). O portal cita e busca; a leitura completa
acontece na Plataforma oficial.

---

## 3. A etapa de dado pessoal — o que muda com a régua da seção 2.4

`scripts/checar-dado-pessoal.py` varre CÓDIGO-FONTE rastreado no git (`*.py`,
`*.ts`, `.md`...) e explicitamente EXCLUI dado coletado
(`.geojson`/`.csv`/dumps ficam de fora, por design, para não deixar o hook
lento). **Ele não se aplica, como está, a um dump de metadado do Solr** —
não é código, e o padrão de CPF (regex mod-11) não pegaria "L.H.M.G." nem
"lista de pessoas desaparecidas", que são os riscos reais medidos aqui.

A etapa que falta, específica para este acervo, antes de qualquer JSON
público do Solr entrar no repositório ou em qualquer bucket:

1. **Filtro por `type`, automático, antes de tudo**: excluir por padrão os
   tipos confirmados como pessoais — `documento de identificação`,
   `comprovante de residência`, `declaração de hipossuficiência`, e
   qualquer tipo com "identificação"/"comprovante"/"declaração" no nome
   (lista fechada, revisável).
2. **Amostragem estratificada de `documentos comprobatórios` e
   `outros documentos`** (51,3% do acervo, catch-all, risco variável por
   processo — seção 2.4): sortear ~200 documentos distribuídos pelos 16
   processos (não só o maior), ler o `summary_pt` de cada um, e decidir se
   aquele tipo, NAQUELE processo, entra ou fica de fora. Isto é o
   equivalente do "sortear ~100 URLs" que `docs/PLANO-ARQUIVO-DE-FONTES.md`
   já propõe para o acervo de normas — mesma lógica, medir antes de
   publicar em massa.
3. **Varredura textual sobre os campos publicáveis** (`title`, `summary_pt`,
   `summary_en`, `authors`) — não sobre PDF, porque PDF não existe aqui —
   com o MESMO regex de CPF mod-11 de `checar-dado-pessoal.py`, adaptado
   para rodar sobre JSON de dado em vez de `git grep` sobre código
   (arquivo novo, ex. `scripts/checar-dado-pessoal-em-dado.py`, ou uma flag
   `--arquivo <path>` no script existente). É uma rede de segurança
   automática, não substitui os passos 1 e 2 — o caso "L.H.M.G." não tem
   CPF no texto e passaria batido num regex puro.
4. **Nunca publicar `authors`/`authors_f` de tipo pessoal como texto livre
   pesquisável** — mesmo já reduzido a iniciais pela UFMG, agregar em um
   índice buscável do PRÓPRIO portal aumenta a superfície de descoberta
   (a UFMG optou por iniciais, não por remover o campo; replicar sem
   filtro herdaria essa escolha sem tê-la pensado).

---

## 4. Ordem sugerida — maior ganho para quem foi atingido, menor esforço primeiro

1. **Corrigir o registro em `docs/_historico/FONTES-BRUMADINHO-UFMG.md`**: a conclusão
   "não ingerir" do buscador de processos (seção 3 e 7 daquele documento)
   estava fundamentada em risco não medido; este documento mede o risco e
   propõe a régua da seção 2.4/3 acima. Deixar o documento anterior citando
   este como a atualização, em vez de apagar o histórico da decisão errada
   — o valor de mostrar o erro e a correção é maior que o de esconder que
   ele aconteceu.
2. **Ingerir a família `ide_250102_mg_*` da Semad/IDE-Sisema (Frente 1,
   seção 1.2)** — maior ganho absoluto, menor esforço absoluto desta
   pesquisa inteira: protocolo já provado (mesma infra de `zas-barragens`),
   licença livre confirmada, ~1,4 MB, zero dado pessoal individual
   identificável. Prioridade dentro da família: `impactos_ambientais_pol`
   (a mancha real) e `monitoramento_pto` (291 pontos, o que responde "isso
   aqui foi atingido de verdade" e "onde monitoram a água perto de mim") —
   depois `remanejamento_pto`, depois as camadas de engenharia
   (`estruturas_contecao_pol`, `obras_intervencoes_*`, `restauracao_pol`),
   que são mais técnicas que cívicas.
3. **Buscador de processos (Frente 2)**: primeiro os 4.732 documentos do
   tema "trâmites processuais" nos tipos processuais claros (petição,
   decisão, certidão, intimação, despacho, manifestação, ofício) — é
   metadado de ato público, sem achado de risco nesta amostra. Depois a
   amostragem estratificada do passo 2 da seção 3 para decidir o resto.
   Sempre com link de volta para `plataforma.projetobrumadinho.ufmg.br`, o
   mesmo padrão de citação já usado para a FGV e para o site institucional.
4. **Lacunas da seção 1.4** (SIGBM, InfoHidro, comitê de bacia, Defesa
   Civil): não confirmadas nesta rodada — próximo levantamento, se o dono
   quiser seguir, com o mesmo padrão de rigor.

---

## 5. O que este plano NÃO decide

- Nome exato da zona nova em `/busca` (`f: "brumadinho"` vs. reaproveitar
  `f: "cidades"` filtrado por tema) — decisão de desenho de UI, não de fonte.
- Se a amostragem do passo 2 da seção 3 é feita à mão ou com um modelo de
  linguagem lendo `summary_pt` em lote — ambos funcionam, o critério de
  aceitação (o que conta como "achou dado pessoal") é o mesmo dos dois jeitos.
- Bucket público vs. atrás de Worker para o metadado do Solr arquivado —
  mesma decisão em aberto que `docs/PLANO-ARQUIVO-DE-FONTES.md` já deixou
  para as ~23,6 mil URLs de norma.

---

## 6. Lacunas declaradas

- **Não confirmei individualmente a licença das outras 6 camadas** da
  família `ide_250102_mg_*` (só abri o metadado de `impactos_ambientais` e
  `remanejamento`) — presumo mesma licença "acesso livre" por serem do
  mesmo publicador/série de metadado, mas não é confirmação camada a
  camada.
- **Não achei endpoint de download em lote do SIGBM/ANM que respondesse**
  no tempo desta pesquisa — só o portal interativo. Pode existir e eu não
  achei; não afirmo que não existe.
- **Não confirmei API/WFS do InfoHidro (IGAM)** — a camada `monitoramento_pto`
  da Semad cobre a mesma necessidade e ESSA está confirmada, então não foi
  crítico insistir no InfoHidro para este plano, mas fica como pergunta
  em aberto se um dia quiserem cruzar as duas fontes.
- **Não abri PDF nenhum** do acervo Solr — e a razão principal é que a
  investigação ativa (seção 2.3) indica que não há PDF exposto ao público
  por essa plataforma. Não é 100% impossível que exista uma rota
  autenticada ou um CDN externo não referenciado no bundle JS atual — só
  não achei nenhuma em teste ativo.
- **A amostragem da seção 2.4** é qualitativa (poucas dezenas de
  documentos lidos, não centenas) — suficiente para desenhar a régua de
  triagem, insuficiente para uma auditoria completa do acervo. O passo 2 da
  seção 3 é exatamente o que fecha essa lacuna antes de publicar em massa.
- **Não medi `places`** (campo do índice, visto na estrutura mas vazio nos
  documentos amostrados) — pode ser um campo geográfico útil para cruzar
  documento com município, não testado a fundo.

---

*Levantado em 2026-08-13. Todos os endpoints citados foram chamados e
responderam nesta data (inclusive o `GetCapabilities` de 906 KB e as 8
chamadas de `GetFeature` da família `ide_250102_mg_*`). Contagens de
feições, bytes e tipos de documento são medidas diretas, não estimativas.
O que não foi confirmado está marcado como tal.*
