# Plano v8 — "Prometeu? Cumpriu?": plano de governo × execução, por secretaria e ministério

> **Tipo:** Plano de produto e arquitetura de dados
> **Domínio:** Editorial / Dados / Arquitetura da informação
> **Última medição:** 2026-09-02
> **Leitura estimada:** 18 minutos
> **Relacionados:** `docs/planos/PLANO-v7.3-FORCA-E-CITACOES.md`, `docs/historico/RETROSPECTIVA-2026-09.md`, `AGENTS.md`
> **Palavras-chave:** plano de governo, promessas de campanha, execução orçamentária, convênios, contratos, obras, monitoramento

## Sumário

1. [A pergunta](#1-a-pergunta)
2. [O que já existe (pesquisa)](#2-o-que-já-existe-pesquisa)
3. [Modelo de dados](#3-modelo-de-dados)
4. [Pipeline: do PDF do plano ao status medido](#4-pipeline-do-pdf-do-plano-ao-status-medido)
5. [Fontes de evidência](#5-fontes-de-evidência)
6. [Anatomia da página](#6-anatomia-da-página)
7. [Regras permanentes aplicadas](#7-regras-permanentes-aplicadas)
8. [Rollout](#8-rollout)
9. [Fases de execução](#9-fases-de-execução)
10. [Riscos e cuidados](#10-riscos-e-cuidados)

---

## 1. A pergunta

Cada Executivo monitorado ganha uma página que responde, com evidência pública linkada:

1. **Cumpriu o que prometeu?** — cada proposta do plano de governo registrado no TSE vira um item rastreável.
2. **Está executando as obras?** — obras anunciadas, iniciadas, paralisadas, concluídas.
3. **Tem metas/obras atrasadas?** — prazo anunciado × data corrente, sem adjetivo: o atraso é medido, não afirmado.
4. **O que mais está em curso?** — iniciativas que NÃO estavam no plano também entram (governar é mais do que prometer; omitir o que anda fora do plano seria distorção).

Tudo com links, tags, filtrável, buscável, referenciado nas páginas relacionadas do portal (a proposta de saneamento de MG linka `/[municipio]/infraestrutura`; a obra estadual linka a cidade onde acontece).

**Nome de trabalho:** "Prometeu? Cumpriu?" (a página nunca responde com sim/não editorial — responde com o estado medido de cada proposta).

---

## 2. O que já existe (pesquisa)

Levantamento de 02/09/2026 (web, URLs verificadas):

### No Brasil

| Iniciativa | Mantenedor | Escopo | Estado em 2026 |
|---|---|---|---|
| **Promessas dos Políticos** | g1 (Globo) | Presidente, 27 governadores e prefeitos de capitais; só promessas "claramente cobráveis e mensuráveis"; status Cumpriu/Em parte/Não cumpriu ainda | **Ativo** desde 2015 (atualização jul/2026) — único tracker contínuo multi-ente do país |
| O Não Pagador de Promessas | Congresso em Foco + FCB | Cobrança cidadã a governadores/prefeitos | Provavelmente descontinuado (só notícia de 2019) |
| Checagem de fim de mandato | Agência Lupa | Federal (47 metas do plano Bolsonaro) | Pontual (dez/2022), não contínuo |
| Programa de Metas | Prefeitura de SP | Metas oficiais da própria gestão | Ativo (oficial, auto-referido) |
| Painel PPA Aberto / SIOP | Min. do Planejamento | Metas do PPA (não promessas de campanha) | Ativo (oficial) |

**Não localizados** (busca honesta): painéis estaduais "prometeu×cumpriu" de MG/SP/DF; "Compromissômetro"; tracker da Transparência Brasil ou da FGV (a FGV tem o CEPESP Data, infraestrutura eleitoral, não tracker); Instituto Update e Gênero e Número atuam em representatividade, não em promessas.

### No mundo (referências de modelo)

| Iniciativa | País | O que ensina |
|---|---|---|
| **PolitiFact** (Obameter / Trump-O-Meter / MAGA-Meter) | EUA | Padrão-ouro: status Kept/Compromise/Broken/Stalled/In the Works, cada promessa com fonte |
| **Full Fact Government Tracker** | Reino Unido | Tracker de governo em exercício, metodologia pública |
| **Lui Président** ("Macronomètre") | França | Cobertura de mandatos sucessivos (Hollande, Macron) |
| **Polimeter** (Univ. Laval) | Canadá | Rigidez acadêmica de critérios |

### A lacuna que o portal ocupa

1. **Profundidade por órgão** — o g1 cobre só promessas "cobráveis" de governadores e prefeitos de capital; ninguém cruza promessa → secretaria/ministério → contrato/convênio/obra com dados abertos.
2. **Além das capitais** — interior de MG e polos já mapeados no `polos-interior-ibge.json`.
3. **Lacuna como dado** — trackers jornalísticos marcam "não cumpriu ainda"; o portal registra também o **silêncio público** datado (sem sinal até DD/MM/AAAA), sem editorializar.
4. **Arquivo permanente** — evidências com hash e Wayback; o tracker do g1 some do ar entre mandatos, o do portal é repositório git AGPL.

---

## 5. Fontes de evidência

| Fonte | O que tem | Formato | URL | Cadastro? |
|---|---|---|---|---|
| TSE DivulgaCandContas | Plano de governo (PDF) por candidato/UF/ano | Web + REST interno (`/divulga/rest/arquivo/doc/{id}`) | divulgacandcontas.tse.jus.br | Não |
| TSE Dados Abertos | Conjunto "Candidatos – Proposta de governo" (bulk por ano) | CSV + PDF | dadosabertos.tse.jus.br | Não |
| Brasil.IO Eleições | Candidaturas desde 1996; scripts turicas/eleicoes-brasil | CSV/SQLite | brasil.io/datasets/ | Não |
| CEPESP Data (FGV) | Dados eleitorais acadêmicos | API REST | cepespdata.io | Não |
| **TransfereGov** (ex-SICONV) | Convênios, transferências especiais, fundo a fundo, TED | API REST nova (2026) + CSV diário | api-publica.transferegov.gestao.gov.br | Não |
| **PNCP** (Lei 14.133) | Contratações de TODOS os entes federativos | API REST JSON + Swagger | pncp.gov.br/api/consulta | Não |
| Compras.gov.br | Licitações/contratos federais, catálogos | API JSON/CSV | dadosabertos.compras.gov.br | Não |
| **ObrasGov.br** | Projetos/obras federais: execução física, contratos, geo, status | API REST | api-publica.obrasgov.gestao.gov.br/obras/docs | Não |
| Portal da Transparência (CGU) | Despesas, servidores, sanções | API REST | api.portaldatransparencia.gov.br | **Chave gov.br (gratuita)** |
| SIOP | Execução físico-orçamentária federal | Painéis + CSV | siop.planejamento.gov.br | Não |
| **Querido Diário** (OKFN) | Diários municipais (~449 cidades, 660 mil+ edições) | API REST | queridodiario.ok.org.br/api/docs | Não |
| DIO-MG (Imprensa Oficial) | Diário oficial de MG (desde 30/04/2023; acervo antigo em jornal.iof.mg.gov.br) | Web/PDF | jornalminasgerais.mg.gov.br | Não |
| DOU / INLABS | Diário Oficial da União (XML diário) | Web/XML | in.gov.br | Não (reverificar) |
| **Transparência MG** | Despesa estadual, CSVs anuais 2002–2026, atualização diária, CC-BY-4.0 | CKAN | dados.mg.gov.br/dataset/despesa | Não |
| Transparência SP / RJ / ES / PA / DF | Despesa estadual | Web exportável; API formal não confirmada | transparencia.{sp,rj,es,pa,df}.gov.br | Não |
| **TCE-MG** | Dados abertos + **SISOP** (registro/fiscalização de obras, substituiu Geo-Obras) | Web/CSV | dadosabertos.tce.mg.gov.br | Não |
| TCE-SP | Transparência + jurisprudência | Conjuntos de dados | transparencia.tce.sp.gov.br/conjunto-de-dados | Não |
| TCU | Acórdãos/jurisprudência | CSV dados abertos | pesquisa.apps.tcu.gov.br/dados-abertos | Não |
| TCE-RJ / TCE-ES / TCE-PA / TCDF | Portais de processos | Web | tce.rj.gov.br / tcees.tc.br / tce.pa.gov.br / tcdf.tc.br | Não |
| Instagram oficial | Anúncios de gestão | **Sem scraping** (ToS Meta): embeds oficiais, links citados em matérias, Wayback/archive.today, transcrição manual datada | — | — |

**MG é o estado mais maduro em dados abertos** (CKAN com despesa diária + TCE-MG com dados abertos + SISOP) — mais um motivo para o piloto P0 ser MG.

**Pendente de inventário:** os datasets Brasil.IO já baixados (o dono registra que existem no home-pc; nesta máquina não foram localizados — F0 inclui mapeá-los).

**Reuso imediato do que o portal já domina:** clipping próprio (`noticias-*.json`), diários oficiais municipais (`diario-atos-municipios.json`), e o molde documental de `/paraopeba/auditoria` (AECOM: documento → veredito ancorado em fonte — a mesma engenharia, trocando laudo por plano de governo).

---

## 3. Modelo de dados

JSONs em `apps/web/data/`, gerados por script, nunca digitados à mão (regra: o número vem do dado).

### 3.1 Entidades

```
Mandato
  ente: "MG" | "SP" | "RJ" | "ES" | "PA" | "DF" | "uniao" | <municipio-slug>
  esfera: "estadual" | "federal" | "municipal"
  gestor: nome conforme registro TSE
  partido, coligacao
  periodo: { inicio, fim }
  plano_pdf_url: URL do DivulgaCand/TSE
  plano_registrado_em: data

Proposta
  id: "<ente>-<nnn>"
  mandato_id
  tema: saúde | educação | segurança | infraestrutura | saneamento | habitação | ...
  orgao_alvo: secretaria/ministério responsável (quando identificável no texto)
  trecho_verbatim: citação literal do plano
  plano_pagina: página do PDF
  status: "sem_sinal" | "anunciada" | "em_andamento" | "concluida" | "contrariada" | "revogada"
  status_medido_em: data da última verificação
  evidencias: [Evidencia]

Evidencia
  tipo: "edital" | "contrato" | "convenio" | "obra" | "diario_oficial" | "noticia" | "post_oficial" | "lei" | "decreto" | "tce" | "orcamento"
  titulo
  url (sempre; sem URL não entra)
  data_publicacao
  orgao_emissor
  via: como o link foi encontrado/arquivado (rastreabilidade da própria evidência)
  arquivado_em: URL Wayback Machine (quando possível — links de governo morrem)

IniciativaForaDoPlano   (mesmo schema de Evidencia + tema + órgão; alimenta a seção "o que anda sem ter sido prometido")
```

### 3.2 Status — definições medíveis (sem editorialização)

| Status | Critério objetivo |
|---|---|
| `sem_sinal` | Nenhuma evidência pública localizada até a data de verificação. **É lacuna, não acusação.** |
| `anunciada` | Existe ato oficial (decreto, post oficial, nota, anúncio) mas nenhum instrumento executivo (edital/contrato/convênio/obra). |
| `em_andamento` | Existe instrumento executivo vigente (contrato, convênio, edital publicado, obra iniciada). |
| `concluida` | Entrega documentada (inauguração oficial, termo de encerramento, obra concluída em portal de obras). |
| `contrariada` | Ato oficial em sentido oposto (extinção do programa, veto, revogação) — citar o ato, nunca interpretar. |
| `revogada` | O próprio gestor retirou formalmente a proposta (raro; citar o ato). |

Uma proposta pode ter evidências de mais de um tipo; o status é sempre o mais avançado **documentado**, com data.

---

## 4. Pipeline: do PDF do plano ao status medido

1. **Captura do plano** — PDF do plano de governo do candidato eleito, baixado do registro de candidatura do TSE (DivulgaCand). Guardar hash do arquivo e data do download (o PDF é a prova do que foi prometido).
2. **Extração de propostas** — leitura do PDF e estruturação em itens (proposta, tema, página, trecho verbatim). Assistido por IA, **conferido por humano** antes de entrar no JSON (uma proposta mal extraída vira injustiça; o trecho verbatim é o compromisso).
3. **Coleta de evidências** — por órgão/secretaria: convênios (TransfereGov), contratos e editais (PNCP), execução orçamentária (SIOP / portais estaduais), diários oficiais (Querido Diário + imprensas oficiais), portais de obras, clipping de notícias (mesmo padrão de `noticias-paraopeba.json`), posts oficiais de Instagram (link arquivado — ver §10 sobre ToS).
4. **Cruzamento** — proposta × evidência por tema + órgão + palavras-chave, com revisão humana do pareamento.
5. **Geração** — script `scripts/gerar-prometeu-cumpriu.py` lê os JSONs-fonte e emite `data/prometeu-cumpriu-<ente>.json` com todos os números medidos (contagens por status, % por tema, tempos de atraso). Nada digitado à mão.
6. **Página** — consome o JSON; número que não vem do JSON não existe.

---

## 5. Fontes de evidência

<!-- PREENCHER COM O RELATÓRIO DO AGENTE DE PESQUISA: tabela fonte | o que tem | formato | URL | cadastro? — TSE, TransfereGov, PNCP, SIOP, portais MG/SP/RJ/ES/PA/DF, TCEs, Querido Diário, portais de obras -->

---

## 6. Anatomia da página

Rota proposta: `/mandato/[ente]` (ex.: `/mandato/mg`, `/mandato/uniao`, `/mandato/belo-horizonte`), com hub `/mandato`. Molde visual: `/paraopeba/auditoria` (resumo medido no topo, vereditos com fonte, sem adjetivos).

1. **Cabeçalho do mandato** — gestor, partido, período, link do plano PDF registrado no TSE, data da última verificação. Nome e cargo vêm de fonte oficial, com data — se mudar, a página muda.
2. **Resumo medido** — N propostas extraídas do plano; distribuição por status (números do JSON). Sem % de "cumprimento" editorial: a barra mostra o estado documentado, não uma nota.
3. **Por secretaria/ministério** — agrupamento por órgão alvo; cada órgão vira capítulo com suas propostas, seus contratos/convênios/obras relacionados.
4. **Cards de proposta** — trecho verbatim do plano (página do PDF), status medido, evidências linkadas com data e tipo, tags de tema. Filtrável por status/tema/órgão; buscável.
5. **Obras** — sublista: anunciadas / iniciadas / paralisadas / concluídas, com prazo anunciado × data corrente quando houver prazo público.
6. **Fora do plano** — iniciativas em curso que não constavam do plano (mesma evidência, mesma régua).
7. **Lacunas** — propostas sem sinal público, listadas como lacuna ("não localizamos evidência pública até DD/MM/AAAA"), nunca como descumprimento.
8. **Relacionadas** — links para as páginas do portal que o tema toca (município, infraestrutura, congresso, empresas contratadas).

---

## 7. Regras permanentes aplicadas

- **O número vem do dado** — contagens, percentuais e atrasos são emitidos por script a partir dos JSONs; nada digitado.
- **Lacuna é informação** — `sem_sinal` é dado útil, apresentado como lacuna, não como falha do gestor.
- **Insinuação é dano** — status nunca acusa; toda afirmação carrega URL; `contrariada` cita o ato oficial, não a intenção.
- **Nomes de pessoas** — gestor e titulares de secretaria/ministério vêm de publicação oficial (regra das forças: instituição é o alvo; indivíduo só quando publicado em ato oficial). CPF e dados pessoais nunca.
- **Instagram oficial** — sem scraping (ToS): só posts citados em matérias jornalísticas ou arquivados (Wayback), com link e data.
- **O PDF é a prova** — guardar arquivo + hash + URL do TSE; se o TSE tirar do ar, o portal conserva a referência e o hash.

---

## 8. Rollout

Ordem decidida pelo dono (02/09/2026) — estados primeiro, descendo:

| Fase | Entes | Observação |
|---|---|---|
| P0 | **MG** (piloto) | Estado de origem do portal; fontes estaduais já parcialmente mapeadas |
| P0 | **União** (piloto paralelo) | SIOP/TransfereGov/PNCP federais servem todos os entes depois |
| P1 | SP, RJ, ES, PA, DF | Completar o bloco estadual prioritário |
| P2 | Prefeituras já monitoradas hoje pelo portal | Reuso direto do clipping e diários existentes |
| P3 | Capitais dos estados P0/P1 | Belo Horizonte, São Paulo, Rio, Vitória, Belém, Brasília (DF já coberto como estado) |
| P4 | Demais capitais | — |
| P5 | Maiores cidades do interior dos estados-chave | `polos-interior-ibge.json` já define os polos |
| P6 | Demais municípios monitorados | Conforme cobertura do Querido Diário / imprensas municipais |

Mandatos passados entram como arquivo histórico (o plano de 2022×2026 de MG pode ser medido retroativamente — o PDF e o Diário Oficial não expiram).

---

## 9. Fases de execução

- **F0 — Fundação (dados)**: inventário dos datasets Brasil.IO já baixados nesta máquina; script de captura do plano TSE por ente; schema dos JSONs; extração piloto do plano de MG (2022) com conferência humana.
- **F1 — Piloto MG**: coleta de evidências das secretarias de MG (saúde, educação, infraestrutura primeiro); JSON + página `/mandato/mg` com resumo medido.
- **F2 — Piloto União**: mesma régua para ministérios (TransfereGov/PNCP/SIOP).
- **F3 — Bloco P1**: SP, RJ, ES, PA, DF — adaptar conectores estaduais.
- **F4 — Municipais**: prefeituras monitoradas, capitais, interior (P2-P6).
- **F5 — Arquivo histórico + automação**: mandatos anteriores; rotina de re-verificação datada (o status apodrece; cada proposta carrega `status_medido_em`).

---

## 10. Riscos e cuidados

1. **Extração errada de proposta** — mitigação: trecho verbatim + página do PDF + conferência humana obrigatória antes do JSON.
2. **Pareamento falso (evidência que não é daquela proposta)** — revisão humana do cruzamento; em dúvida, a evidência fica em "relacionadas", não vira status.
3. **Link rot de governo** — Wayback em toda evidência (o portal já registrou na retrospectiva o risco de zero snapshots próprios; aqui vira rotina).
4. **ToS do Instagram** — nenhum scraping; só link citado/arquivado.
5. **Assimetria de publicidade** — governos comunicam diferente; `sem_sinal` mede silêncio público, não inação. A redação da página diz isso explicitamente.
6. **Carga de verificação** — time de 2 (dono + IA): priorizar P0/P1 com profundidade antes de ampliar; cada ente novo só entra quando os anteriores têm data de verificação recente.
7. **Neutralidade partidária** — mesma régua, mesmo schema, mesmos status para todo ente; a página nunca compara gestores, cada mandato é medido contra o próprio plano.
