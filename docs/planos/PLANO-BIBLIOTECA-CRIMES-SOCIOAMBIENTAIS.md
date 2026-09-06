# Plano — Biblioteca unificada de documentos dos crimes socioambientais de Mariana e Brumadinho

> **Tipo:** PLANO
> **Domínio:** ambiental/paraopeba
> **Última medição:** 2026-09-05
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** biblioteca, desastres, mariana, brumadinho, paraopeba, doce, itatiaucu, jequitinhonha, atis, documentos, filtros, busca, coletores, noticias, atingidos, bahia, espirito santo, mpmg, mpf, dpmg, dpu, notas tecnicas

## Sumário

- [Propósito](#propósito)
- [Decisões do dono registradas](#decisões-do-dono-registradas)
- [Modelo de dado unificado](#modelo-de-dado-unificado)
- [Coletores da fase 1](#coletores-da-fase-1)
- [A página /ambiental/crimes-socioambientais](#a-página-ambientalcrimes-socioambientais)
- [Absorção da rota /paraopeba/biblioteca](#absorção-da-rota-paraopebabiblioteca)
- [Expansão — novas fontes e páginas do ecossistema (01/09/2026)](#expansão-novas-fontes-e-páginas-do-ecossistema-01092026)
- [Entregas finais — espelho, mapa de links, resumo e análise integrada](#entregas-finais-espelho-mapa-de-links-resumo-e-análise-integrada)
- [Regras editoriais específicas](#regras-editoriais-específicas)
- [Fases de execução](#fases-de-execução)
- [Verificação](#verificação)
- [Riscos](#riscos)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

Uma biblioteca única de documentos oficiais (metadado + link, **nunca o arquivo**
— regra já decidida no repo: Lei 9.610/98, "linkar, não copiar") dos dois
desastres de barragens de rejeitos, coletada de bibliotecas de órgãos federais,
estaduais (MG, ES, BA), instituições de justiça e ATIs — com busca, tags,
filtros e ordenação. A página **absorve** a atual `/paraopeba/biblioteca`
(597 itens AEDAS/Guaicuy/ADAI), que passa a ser recorte dela.

Não é uma página nova de "notícia": é o acervo documental que sustenta qualquer
alegação sobre reparação — decisão, laudo, resolução, termo — publicado por
quem é parte ou autoridade no caso.

## Decisões do dono registradas

1. **Absorver** a biblioteca das ATIs do Paraopeba; na abertura a biblioteca
   mostra só o **desastre em foco**, e o leitor amplia clicando na tag do outro
   caso.
2. **ES + BA no escopo.** ES entra por ser bacia atingida do Doce (IEMA, AGERH,
   MPES, TJES). BA entra principalmente por **notícias** — pedido do dono em
   31/08/2026: "recentemente teve reconhecimento de atingidos da Bahia e tem
   mais notícias disso". Documental da BA fica em fase 2, guiado pelo que as
   notícias revelarem.
3. Fase 1 = **4 coletores piloto** + 1 coletor de notícias.
4. Rota: **`/ambiental/crimes-socioambientais`**.

## Modelo de dado unificado

Item normalizado do acervo:

```ts
interface ItemDesastre {
  id: string;                  // fonteId + slug
  desastre: "mariana" | "brumadinho";
  bacia: "doce" | "paraopeba" | "itatiaucu" | "jequitinhonha" | "sao_francisco" | "velhas" | "para" | "verde_grande" | "mucuri" | "paracatu" | "geral";
  titulo: string;
  data: string | null;         // ISO yyyy-mm-dd; null = a fonte não publicou
  tipo: string;                // rótulo do tipo como a fonte o nomeia
  orgao: string;               // nome curto do órgão/instituição
  esfera: "federal" | "estadual" | "justica" | "ati" | "imprensa";
  uf: "MG" | "ES" | "BA" | "BR";
  tags: string[];
  resumo: string | null;       // descrição publicada pela PRÓPRIA fonte; nunca gerado
  url: string;                 // página do item na fonte — nunca o PDF
  fonteId: string;             // slug da fonte no registry
  coletadoEm: string;
}
```

- **Absorção:** o agregador consome o `apps/web/public/data/biblioteca-ati.json`
  existente, marca `desastre: "brumadinho"`, `bacia: "paraopeba"`,
  `esfera: "ati"` e funde com as demais fontes por `fonteId` — fusão idempotente,
  coleta vazia não sobrescreve o arquivo bom (padrão medido em
  `coletar-biblioteca-ati.py`).

  ⚠️ **ATIs existem nos DOIS desastres.** O `biblioteca-ati.json` existente
  cobre só o **programa Paraopeba** (AEDAS/Guaicuy/ADAI/NACAB na bacia do
  Paraopeba = Brumadinho) — por isso o mapeamento para `desastre: "brumadinho"`
  está correto. **Mariana tem as próprias ATIs** — Cáritas, CTA (Centro de
  Tecnologia Alternativa) e também AEDAS/ADAI no programa do Rio Doce —, que
  são **fonte nova** para a biblioteca com `desastre: "mariana"`. O coletor
  delas grava `etl/betim/dados/desastres/ati-mariana.json` (schema normalizado),
  que o agregador já consome sem mudança de código.
- **Lacuna é informação:** o arquivo carrega `ficouDeFora` por fonte, exibido na
  tela — fonte que respondeu menos que o previsto é declaração, não silêncio.
- **Resumo:** só metadescription/descrição publicada pela fonte. Nenhum resumo
  gerado por modelo sem rótulo (regra: "o número vem do dado; o modelo, se
  houver, só embrulha").
- **Camada:** `apps/web/public/data/biblioteca-desastres.json` (asset buscado
  pelo cliente, padrão `PainelTac.tsx`), com entrada no
  `outputFileTracingExcludes` do `next.config.ts` — o único mecanismo que tira o
  arquivo do bundle do Worker (ARQUITETURA.md). Fonte de verdade por fonte em
  `etl/betim/dados/desastres/*.json`, unificada por
  `scripts/agregar-biblioteca-desastres.mts`.
- **Agregado de servidor:** `COBERTURA_BIBLIOTECA_DESASTRES` (total, por
  desastre, por esfera, por fonte, barradosPelaTriagem, ficouDeFora,
  coletadoEm) — a página servidor importa só ele, nunca o array.

## Coletores da fase 1

Todos no padrão do repo (FONTES.md + OPERACAO.md): cabeçalho-doc com robots.txt
e decisão registrada, UA honesto `ControlePopular/1.0 (+https://controlepopular.com.br)`,
pausa 1–2 s por host, 429/503 param a coleta, validar **conteúdo** nunca só
status, `--seco`, trava de CPF no serializado antes de gravar, saída de
metadado + link.

| # | Coletor | Fontes-alvo | Desastre | Bacias | Esfera |
|---|---|---|---|---|---|
| 1 | `coletar-biblioteca-cif-mariana.*` | CIF (Comitê Interfederativo) do Acordo de Mariana — resoluções e documentos | mariana | Rio Doce | federal (tripartite) |
| 2 | `coletar-documentos-mpf.*` | MPF — casos Samarco/Fundão e Brumadinho | ambos | Rio Doce, Paraopeba | justica |
| 3 | `coletar-biblioteca-mg.*` | SEMAD/IGAM/FEAM (relatórios, fiscalização) + CGE-MG (sem duplicar `/ambiental/decisoes-lai`) | ambos | Rio Doce, Paraopeba, Jequitinhonha | estadual |
| 4 | `coletar-biblioteca-es.*` | IEMA-ES, AGERH, MPES, TJES — bacia do Doce | mariana | Rio Doce | estadual + justica |
| 5 | `coletar-noticias-desastres.py` | Radar: título, fonte, data de publicação, microresumo (metadescription da matéria), link — padrão `coletar-noticias-paraopeba.py`, nunca o corpo. Buscas: "atingidos Bahia" (prioridade), Mariana, Brumadinho | ambos | todas | imprensa |
| 6 | `coletar-biblioteca-ati-mariana.*` | ATIs de Mariana — Cáritas, CTA, AEDAS/ADAI no programa do Rio Doce | mariana | Rio Doce | ati |
| 7 | `coletar-mpmg-notas-tecnicas.*` | MPMG — Coordenadorias Rio Doce (Coerdoce), Paraopeba e Jequitinhonha/Mucuri: Informações Técnico-Jurídicas (ITJs), notas técnicas, inquéritos civis | ambos | Rio Doce, Paraopeba, Itatiauçu, Jequitinhonha | estadual (justica) |
| 8 | `coletar-mpf-notas-tecnicas.*` | MPF — Grandes Casos (Samarco), Procuradoria em MG, 2ª CCR: acordos, pareceres, laudos, notas técnicas sobre operação Rejeito e condutas | ambos | Rio Doce, Paraopeba, Jequitinhonha | federal (justica) |
| 9 | `coletar-dpu-comite-rio-doce.*` | DPU — Comitê Temático Rio Doce/Brumadinho: notas técnicas sobre atingidos, habitação, renda, saúde | ambos | Rio Doce, Paraopeba | federal |
| 10 | `coletar-dpmg-notas-tecnicas.*` | DPMG — Defensoria Pública de MG: atuação em comitês do Acordo, notas sobre atingidos em Mariana e Brumadinho | ambos | Rio Doce, Paraopeba | estadual |

Registro obrigatório ao fim de cada coletor: slug no `REGISTRY_FONTES`
(camada `public-assets`), entrada no `MAPA_SCRIPTS` do `rotina-coletas.mts`,
diretório de saída em `DIRETORIOS_DADO` do `checar-dado-pessoal-em-dado.py`
(coletor que grava JSON a cada rodada entra na lista) e seção em `FONTES.md`.

## A página /ambiental/crimes-socioambientais

Estrutura no padrão inviolável do repo — **server importa só `COBERTURA_*`**,
cliente recebe o array por fetch de asset:

- **page.tsx (servidor):** cartões de topo (total por desastre, por esfera, por
  fonte), gráfico SVG inline (evolução por ano; com alternativa em texto/tabela
  e textura, nunca só cor), aviso editorial "dois desastres, dois casos" no
  topo — Mariana (2015, Samarco/Vale/BHP, bacia do Doce, atingidos em MG e ES)
  e Brumadinho (2019, Vale, bacia do Paraopeba, MG) são casos distintos com
  responsáveis, acordos e processos diferentes.
- **`BibliotecaDesastresClient.tsx`:** busca full-text com `semAcento` de
  `lib/busca/normalizar.ts`; filtros por **desastre** (chips com contagem) —
  abertura com o desastre em foco: chega de `/paraopeba` → Brumadinho; de
  `/ambiental/mariana` → Mariana; entrada direta → os dois visíveis com selo de
  desastre em cada item; **clicar na tag do outro caso amplia** (decisão do
  dono). Filtros por esfera, órgão, tipo, ano, UF e tags; ordenação por coluna
  (`lib/tabela/ordenar.ts`); CSV do filtrado (`lib/tabela/csv.ts`, `;` + BOM
  UTF-8); paginação "Ver mais" (~40); mensagem explícita de vazio.
- **Notícias:** bloco "Radar" na mesma página (padrão `/paraopeba/clipping`),
  filtrado pelo mesmo seletor de desastre.
- Se o acervo unificado passar de ~10 mil itens: migrar para índice fatiado
  (`lib/estatico/fatiar.ts` + `emitir.ts` + `TabelaEstatica`). Até lá, asset +
  fetch (padrão `PainelTac`).

## Absorção da rota /paraopeba/biblioteca

- O arquivo `biblioteca-ati.json` e `lib/paraopeba/biblioteca.ts` **continuam
  como estão** (outras telas da frente dependem deles); o agregador da
  biblioteca unificada lê o mesmo arquivo — **a absorção é de dado
  compartilhado, não de rota**.
- `/paraopeba/biblioteca` **segue contentful** (decisão de 01/09/2026, após o
  commit do remoto `74ef839` que ali indexou o acervo Pró-Brumadinho): é a
  biblioteca da frente Paraopeba (ATIs + acervo oficial do Acordo de
  Brumadinho). A biblioteca unificada em `/ambiental/crimes-socioambientais`
  cobre os DOIS desastres e inclui o mesmo acervo ATI como fonte. Não há
  duplicação de dado — as duas telas leem os mesmos arquivos.
- Decisão do dono "abrir com o desastre em foco e ampliar clicando no outro"
  vale para a biblioteca unificada (chips por caso); a página do Paraopeba
  mantém o filtro por ATI/acervo que já tinha.

## Expansão — novas fontes e páginas do ecossistema (01/09/2026 + 05/09/2026)

Escopo pedido pelo dono em 01/09/2026, ampliado em 05/09/2026 com notas técnicas de órgãos ministeriais e defensorias.

### Fontes judiciais e ministeriais (adição 05/09/2026)

As notas técnicas do MPMG, MPF, DPU e DPMG são o documento mais denso sobre o que
realmente aconteceu nas bacias — laudos, pareceres, requisições de investigação,
acusação técnica. São o contrapeso às notas das empresas.

| Órgão | URL principal | Bacias cobertas | O que procurar | Prioridade |
|---|---|---|---|---|
| **MPMG — Coerdoce** | `mpmg.mp.br/portal/menu/comunicacao/noticias/` | Rio Doce, Paraopeba | Informações Técnico-Jurídicas (ITJs), inquéritos civis, relatórios de fiscalização | P1 |
| **MPMG — Coordenadoria Jequitinhonha** | `mpmg.mp.br/` | Jequitinhonha | Inquéritos civis, notas sobre mineração na bacia | P2 |
| **MPMG — Coordenadoria Paraopeba** | `mpmg.mp.br/` | Paraopeba, Itatiauçu | Articulação com CBH Paraopeba, notas sobre saneamento e rejeitos | P2 |
| **MPF — Grandes Casos** | `mpf.mp.br/atuacao/grandes-casos/caso-samarco/documentos` | Rio Doce | Acordos, pareceres, laudos do Instituto Lactec, operação Rejeito | P1 |
| **MPF — Procuradoria em MG** | `mpf.mp.br/o-mpf/unidades/pr-mg/noticias` | Rio Doce, Jequitinhonha | Notícias com links para PDFs, operações de combate ao crime ambiental | P2 |
| **DPU — Comitê Temático** | `direitoshumanos.dpu.def.br/comite-tematico-especializado-rio-doce-brumadinho/` | Rio Doce, Paraopeba | Notas técnicas sobre atingidos, habitação, renda, saúde | P1 |
| **DPMG** | `defensoria.mg.def.br/` | Rio Doce, Paraopeba, Jequitinhonha | Atuação em comitês do Acordo, notas sobre atingidos | P2 |
| **CIF/IBAMA** | `ibama.gov.br/cif/notas-tecnicas/` + `monitoramentoriodoce.org/documentos/` | Rio Doce | Notas técnicas ambientais do GTA-PMQQS (80+ NTs), dados quantitativos | P1 |

**Lacunas mapeadas:**
- **Itatiauçu** — sem fonte específica. Coberta indiretamente pela Coordenadoria do Paraopeba no MPMG e pelo CBH Paraopeba.
- **Jequitinhonha (trecho BA)** — MPBA com atuação incipiente. MPF em MG cobre melhor o trecho mineiro.

### Novas fontes a pesquisar e coletar

| Fonte | Endereço | Alcance medido 01/09 | O que procurar |
|---|---|---|---|
| Fundo Brasil de Direitos Humanos | fundobrasil.org.br | 200 (robots ok) | projetos/relatórios financiados ligados ao Rio Doce |
| ANATER | anater.org.br | 200 (sem robots) | assistência técnica rural no âmbito da reparação |
| Secretaria-Geral da Presidência | gov.br/secretariageral | 200 | papel na repactuação, documentos assinados |
| Signatários da repactuação | — | pesquisa | União (ministérios), MG, ES, MPF, Defensorias, Samarco, Vale, BHP, CIF — quem assinou e onde publica |

### Páginas novas do ecossistema

Cada uma segue o padrão das cinco coisas (gráfico, cartões, CSV, filtro,
ordenação) + fonte declarada por número + regra da insinuação:

1. **BHP** — joint venture 50% da Samarco; ações na Inglaterra; documentos.
2. **Samarco** — operadora da barragem do Fundão; acordos e documentos.
3. **Fundação Renova** — entidade criada pós-desastre; execução da reparação.
4. **Responsabilidade de cada ministério segundo a repactuação** — tabela com
   ministério → responsabilidade prevista, com fonte de cada linha; nunca
   inferência sem documento.
5. **Ações internacionais (Inglaterra)** — corte inglesa, BHP Group UK.
6. **Ações no STF e STJ** — processos principais, decisões, repercussão.
7. **Vale do Jequitinhonha — lítio** — mineração de lítio (Sigma Lithium, CBL,
   Atlas Lithium) e impactos em quilombolas e comunidades tradicionais.
8. **Quadrilátero Ferrífero** — Mina Apolo (Vale) vs. Parque Serra do Gandarela,
   Operação Rejeito (PF, 2025), Serra do Rola-Moça.
9. **Vale do Aço** — impactos acumulados da mineração e desindustrialização.

### Expansão regional — outras regiões de MG (adição 05/09/2026)

A biblioteca original cobria Rio Doce e Paraopeba. Expansão para regiões com
conflitos socioambientais relevantes em MG:

| Região | Bacia | Conflito principal | Órgãos | Prioridade |
|---|---|---|---|---|
| **Alto/Médio São Francisco** | São Francisco | Conflitos quilombola/vazanteiro vs. agronegócio e UCs (Parque Mata Seca, Verde Grande) | IBAMA, INCRA, IEF, MPF, MAB | Alta |
| **Alto/Médio Velhas** | Rio das Velhas | Poluição crônica por esgoto (Classe 4, 30 km entre Sabará e Ribeirão da Mata). Mineração vs. mananciais | IGAM, FEAM, COPAM, Copasa | Alta |
| **Alto Pará** | Rio Pará | Conflito hídrico: outorga >30% em trechos. Mineração vs. abastecimento | IGAM, CBH-SF2, FEAM | Alta |
| **Verde Grande** | Rio Verde Grande | Conflito hídrico >126%. Garimpo ilegal | IGAM, FEAM, IBAMA, PF | Alta |
| **Noroeste (Paracatu/Urucuia)** | Paracatu, Urucuia | Maior volume outorgado (~140 m³/s). Agronegócio vs. segurança hídrica | IGAM, CBH-SF7/SF8, CPRM | Alta |
| **Quadrilátero Ferrífero** | Velhas/Doce | Mina Apolo vs. Gandarela. Operação Rejeito. Rola-Moça | SEMAD, FEAM, IEF, ICMBio, IBAMA, PF, MPMG | Crítica |
| **Vale do Aço** | Rio Doce | Impactos acumulados do rompimento de Fundão. Contaminação por metais pesados e microplásticos | SEMAD, IEF, FEAM, IBAMA, MPF, MPMG | Alta |
| **Nordeste (Conceição do Mato Dentro)** | Doce | Mineroduto Minas-Rio (Anglo American) vs. quilombolas. Fragmentação ilegal do licenciamento | IBAMA, FEAM, IEF, MPF | Alta |
| **Norte (garimpo ilegal)** | São Francisco | Operação Nascentes Livres (2026): garimpo de quartzo em Vargem Grande do Rio Pardo | ICMBio, PF, IBAMA, SEMAD | Alta |
| **Sul (garimpo ilegal)** | Mortes/Grande | Operação Protetor dos Biomas (2026): garimpo clandestino em 9 municípios | PF, PMMG, IBAMA, ANM | Alta |
| **Mucuri (fronteira MG/BA)** | Mucuri | Conflito quilombola PCH Mucuri: Comunidade Marques vs. Queiroz Galvão | FEAM, IBAMA, INCRA, MPF | Média-Alta |

**Órgãos estaduais relevantes:** SEMAD, IGAM, FEAM, IEF, CODEMIG, CPRM, COPAM, CERH-MG.

### Expansão nacional — casos de escala nacional (adição 05/09/2026)

Além de Mariana e Brumadinho, a biblioteca deve cobrir casos com repercussão
nacional e internacional:

| Caso | Ano | Local | Tipo | Fontes principais | Relevância |
|---|---|---|---|---|---|
| **Barragem de Fundão** | 2015 | Mariana/MG | Ruptura de barragem | MPF, Fundação Renova, STF, High Court Londres | Caso emblemático: 19 mortos, 40 mi m³ de rejeitos. Acordo R$ 170 bi (2024). 620 mil reclamantes em Londres |
| **Barragem B1 Córrego do Feijão** | 2019 | Brumadinho/MG | Ruptura de barragem | MPF, MPMG, STJ, SEC (EUA) | 272 mortos. Acordo R$ 37,68 bi. Vale pagou US$ 55,9 mi à SEC por fraude ESG |
| **Mina Pingo d'Água** | 2024 | Brumadinho/MG | Vazamento em barragem | ANM, MPMG, Defesa Civil MG | Padrão recorrente de falhas na mesma região |
| **Xikrin do Cateté vs. Vale** | 2025 | Pará | Contaminação indígena | MPF/PA, UFPA | 99,7% dos indígenas contaminados. Ação civil pública |
| **APA do Tapajós** | 2024-2025 | Pará | Mineração ilegal em UC | MPF, IBAMA, ICMBio | 828 PLGs irregulares. Caso paradigmático |
| **Extremo Sul da BA** | 2025-2026 | Mucuri/BA | Reparação Mariana | TJ-BA, MPF | 5 municípios processam Vale/BHP/Samarco por R$ 780 mi |
| **BHP na Justiça Inglesa** | 2018-2026 | Londres | Ação coletiva transnacional | High Court, Pogust Goodhead | 620 mil reclamantes, R$ 250 bi. Maior ação coletiva ambiental da história britânica |
| **Vale na SEC (EUA)** | 2022-2023 | Nova York | Securities fraud | SEC | US$ 55,9 mi. Manipulação de dados laboratoriais |
| **Vale em Amsterdã** | Em curso | Holanda | Ação coletiva | Tribunal de Amsterdã | Inclui municípios brasileiros (Mucuri/BA) |

**Fontes nacionais:** MPF Grandes Casos, MPF 4ª CCR, CGU, TCU, IBAMA, ANM, STF/STJ.

### Ações coletivas das instituições de justiça (adição 05/09/2026)

Mapeamento de ações coletivas relevantes para a biblioteca:

| Órgão | Tipo | Caso/Tema | Ano | Status |
|---|---|---|---|---|
| **MPF/MG** | ACP | Repasse de multas ambientais ao Funcap (Fundão + Brumadinho) | 2025 | Em andamento |
| **MPMG** | TAC | Usiminas — redução de poluição por pó-preto em Ipatinga | 2016-2022 | Vigente |
| **MPMG** | TAC | Gerdau — R$ 27 mi para reparação em 5 municípios | 2024 | Vigente |
| **MPMG** | ACP | Sigma Lithium — impactos socioambientais em Araçuaí/Itinga | 2025 | Em andamento |
| **DPU** | Ação Coletiva | Comitê Temático Rio Doce/Brumadinho — atenção a atingidos | 2020-presente | Em atuação |
| **DPU** | Ação Itinerante | Brumadinho — adesão ao acordo de indenização | 2025 | Em andamento |
| **MPF/ES + MPES** | Medida Cautelar | Samarco — monitoramento da onda de lama no Rio Doce | 2015 | Decisão liminar |
| **MPBA** | Programa FPI | Fiscalização Preventiva na Bacia do São Francisco | 2024 | Vigente |
| **STF** | Tema 1.194 | Indenização por danos ambientais: obrigação não prescreve | 2025 | Julgado |
| **STJ** | Tema 707 | Responsabilidade por rompimento de barragem: risco integral | 2023 | Trânsito em julgado |
| **STJ** | Tema 1.204 | Obrigações propter rem: comprador responde por dano ambiental | 2023 | Trânsito em julgado |
| **STJ** | Tema 681 | Risco integral em dano ambiental | 2023 | Trânsito em julgado |
| **STJ** | Tema 438 | Responsabilidade objetiva: culpa de terceiro não exclui | 2022 | Trânsito em julgado |
| **STJ** | Jurisprudência 257 | Dano moral coletivo é presumido; proteção urbana e rural | 2025 | Publicado |

## Entregas finais — espelho, mapa de links, resumo e análise integrada

1. **Baixar todos os documentos que der** — espelho via DocVault → R2
   (`controlepopular-fontes`), fora do repo, com varredura de CPF fail-closed;
   nunca PDF no repositório.
2. **Mapa de links** com resumo e fonte — a base da página de documentos; cada
   link com o resumo da própria fonte (ou sem resumo, declarado).
3. **Resumo final** — o estado da reparação de cada caso, com números vindos do
   dado e lacunas declaradas.
4. **Análise integrada** — cruzamento das vozes (empresas × governos × justiça
   × atingidos), sem conclusão forçada: co-ocorrência não é causalidade (mesmo
   cuidado de `/paraopeba/analise`).

## Regras editoriais específicas

- **Mariana ≠ Brumadinho:** selo de desastre colado a cada item; nenhum
  agregado mistura os dois sem rótulo (a regra da insinuação, AGENTS.md §"A
  regra editorial").
- **"Crime":** a página descreve o que os autos dizem (há ações penais), sem
  afirmar condenação que não exista.
- Número vem do dado; `ficouDeFora` e `barradosPelaTriagem` (régua de dado
  pessoal do build) entram nas coberturas — item barrado não é publicado nem em
  título.
- Link só para a página do item; PDF apenas se a fonte declarar licença aberta.

## Fases de execução

- **Fase 0:** schema + agregador + página com absorção dos 597 itens das ATIs +
  coletor #5 (notícias) → primeira versão no ar, sem coletores novos.
- **Fase 1:** coletores 1–6, um a um (descoberta de endpoint → cabeçalho-doc →
  `--seco` → gravação → varredura de dado pessoal → commit por pathspec).
- **Fase 1.5 (adição 05/09/2026):** coletores 7–10 (notas técnicas de órgãos
  ministeriais e defensorias) — MPMG, MPF, DPU, DPMG. Prioridade: MPMG Coerdoce
  (P1, mais produtivo), MPF Grandes Casos (P1, acervo rico), DPU Comitê Temático
  (P1, foco em atingidos). DPMG e MPF Procuradoria em MG como P2.
- **Fase 2:** `REGISTRY_FONTES`, `FONTES.md`, `ESTADO.md` atualizados.
- **Fase 2.5 (adição 05/09/2026):** expansão regional MG — coletores para
  Quadrilátero Ferrífero (Mina Apolo, Operação Rejeito), Vale do Aço, Jequitinhonha
  (lítio), São Francisco (quilombos), Rio das Velhas (poluição), garimpo ilegal.
  Prioridade: Quadrilátero Ferrífero (crítica) e Vale do Aço (alta).
- **Fase 3:** expansão nacional — casos Fundão, Brumadinho, Pingo d'Água, Xikrin,
  Tapajós, BA Sul. Ações internacionais (BHP Londres, Vale SEC, Vale Amsterdã).
  Temas repetitivos STJ (707, 1.204, 681, 438) e repercussão geral STF (1.194).
- **Fase 4 (futuro):** BA documental (INEMA/MPBA/TJBA), Renova/Fundação Renova,
  ANM, CGU/TCU, Defensorias, comitês de bacia do Doce. Análise integrada.

## Verificação

`npm test` (suíte + `sem-cpf-no-repo.test.ts`), `npx tsc --noEmit`,
`python scripts/checar-dado-pessoal-em-dado.py`,
`python scripts/validar-documentacao.py`, build no home-pc (Neon 402 não
bloqueia: dado é de arquivo). Coletores fora da CI; rotina local ou
`rotina-coletas.mts --fonte`.

## Riscos

- Fontes sem API (sites estáticos/WordPress — resolver com sitemap/wp-json,
  armadilhas já mapeadas em `coletar-biblioteca-ati.py`).
- robots.txt restritivo (precedente FGV documentado em FONTES.md).
- PDFs com CPF (varredura fail-closed; espelho só via DocVault/R2, fora do repo).
- Volumetria: medir com `--seco` antes de decidir asset vs. índice fatiado.
- CIF (cif.org.br) estava inacessível na sondagem de 31/08/2026 — o coletor 1
  precisa de re-sondagem antes de escrever o cabeçalho-doc.
- **MPMG:** URLs de PDFs seguem padrão `mpmg.mp.br/data/files/.../*.pdf` — pode
  mudar sem aviso. Usar HEAD antes de baixar.
- **MPF:** Grandes Casos tem página dedicada, mas PDFs podem estar em links
  embutidos em HTML — parsing cuidadoso, não download direto.
- **DPU:** Comitê Temático é relativamente novo (2020); pode ter poucos documentos
  publicados. Medir com `--seco` antes de projetar.
- **Itatiauçu:** sem fonte específica mapeada. Coberta indiretamente pelo MPMG
  Coordenadoria do Paraopeba — pode ter lacuna documental.
- **Jequitinhonha (trecho BA):** MPBA com atuação incipiente. O coletor cobre
  só o trecho mineiro (MPF/MG e MPMG Jequitinhonha).

## Decisões registradas

1. Biblioteca unificada absorve o DADO das ATIs; `/paraopeba/biblioteca` segue
   contentful (ver seção "Absorção da rota") — absorção de dado, não de rota.
2. Abertura da biblioteca mostra o desastre em foco; ampliar clicando na tag do
   outro caso (dono, 31/08/2026).
3. ES + BA no escopo; BA por notícias na fase 1 (dono, 31/08/2026).
4. Metadado + link, nunca o arquivo — mesmo veredito da biblioteca das ATIs
   (Lei 9.610/98, direitos reservados sem licença declarada).
5. `desastre` é campo obrigatório do item — dois casos não se misturam sem
   rótulo.
6. ATIs existem nos dois desastres: o acervo ATI existente é do programa
   Paraopeba (Brumadinho); as ATIs de Mariana (Cáritas, CTA, AEDAS/ADAI no
   Doce) são fonte nova com `desastre: "mariana"` (correção do dono, 01/09/2026).
7. **Notas técnicas ministeriais e de defensorias entram na Fase 1.5** (dono,
   05/09/2026): MPMG (Coerdoce, Paraopeba, Jequitinhonha), MPF (Grandes Casos,
   Procuradoria em MG), DPU (Comitê Temático), DPMG. Bacias: Rio Doce, Paraopeba,
   Itatiauçu, Jequitinhonha. Prioridade P1: MPMG Coerdoce, MPF Grandes Casos,
   DPU Comitê Temático.
8. **Itatiauçu coberta indiretamente** pelo MPMG Coordenadoria do Paraopeba e
   pelo CBH Paraopeba — não há fonte específica mapeada.
9. **Expansão regional MG** (dono, 05/09/2026): além de Rio Doce e Paraopeba,
   cobrir Quadrilátero Ferrífero (Mina Apolo, Operação Rejeito), Vale do Aço,
   Jequitinhonha (lítio), São Francisco (quilombos), Rio das Velhas (poluição),
   garimpo ilegal no Norte e Sul de MG. 11 regiões mapeadas.
10. **Expansão nacional** (dono, 05/09/2026): cobrir casos de escala nacional —
    Fundão (2015), Brumadinho (2019), Pingo d'Água (2024), Xikrin do Cateté,
    APA Tapajós, Extremo Sul da BA. Ações internacionais: BHP Londres, Vale
    SEC/EUA, Vale Amsterdã.
11. **Ações coletivas das instituições de justiça** (dono, 05/09/2026): mapear
    ACPs, TACs, medidas cautelares do MPF, MPMG, DPU, DPMG, MPES, MPBA. Temas
    repetitivos do STJ (707, 1.204, 681, 438) e repercussão geral do STF (1.194).
    Status: Trânsito em julgado, vigente ou em andamento.

## Origem

Escrito em 31/08/2026 na sessão que criou a rota `/ambiental/crimes-socioambientais`.
Absorve a decisão de `/paraopeba/biblioteca` (597 itens) e o pedido do dono de
radar de notícias sobre reconhecimento de atingidos na Bahia. Sem arquivo
anterior absorvido.
