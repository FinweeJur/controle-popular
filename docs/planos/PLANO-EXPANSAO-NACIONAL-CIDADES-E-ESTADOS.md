# Plano de Expansão Nacional — 27 Estados, 27 Capitais e Polos do Interior

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [FONTES.md](../06-fontes/FONTES.md), [runbook-cidade-nova.md](../dominios/cidades/betim/runbook-cidade-nova.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** expansao, cidades, capitais, interior, estados, brasil, ibge, pncp, siconfi, comunicabr, sapl, custo, saude, datasus, cid-10, risco-a-direitos, teia-de-interesses

## Sumário

- [Propósito](#propósito)
- [Contexto e salvaguardas arquiteturais](#contexto-e-salvaguardas-arquiteturais)
- [Ranqueamento de fontes por custo de ingestão](#ranqueamento-de-fontes-por-custo-de-ingestão)
- [As quatro trilhas de cruzamento crítico](#as-quatro-trilhas-de-cruzamento-crítico)
- [Módulo de saúde e vigilância por CID-10](#módulo-de-saúde-e-vigilância-por-cid-10)
- [O Índice de Risco a Direitos](#o-índice-de-risco-a-direitos)
- [A Teia de Interesses e o Dossiê para o Ministério Público](#a-teia-de-interesses-e-o-dossiê-para-o-ministério-público)
- [Inventário nacional por região geográfica](#inventário-nacional-por-região-geográfica)
- [Arquitetura de navegação e banco de dados](#arquitetura-de-navegação-e-banco-de-dados)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

Definir o plano mestre, as diretrizes de dados, os links de validação e a estratégia técnica para expandir o portal **Controle Popular** (`controlepopular.com.br`) para todas as **27 Unidades Federativas** (26 Estados + DF), todas as **27 Capitais** e mais de **110 cidades estratégicas do interior**, com o **Índice de Risco a Direitos**, a **Teia de Interesses** e a análise epidemiológica hospitalar por **CID-10** conectada ao território.

## Contexto e salvaguardas arquiteturais

1. **Infraestrutura e Servidor Próprio**: Deploy e build através de túnel Cloudflare servido a partir de máquina dedicada com banco Postgres local.
2. **Régua editorial estrita**: "O número vem do dado; o modelo, se houver, só embrulha." Insinuação é dano.
3. **Privacidade e Zero CPF**: Varredura mod-11 em todo campo textual ingerido via `scripts/checar-dado-pessoal-em-dado.py`.
4. **Tipagem nominal IBGE**: 7 dígitos para `id_municipio` e 6 dígitos para `datasus_6dig` e `comunicabr`. Nunca misturar códigos nem inferir por nomes sujeitos a homônimos.

## Ranqueamento de fontes por custo de ingestão

| Tier | Tipo de Custo | Fontes Principais | Esforço Unitário | Cobertura / Impacto |
|---|---|---|---|---|
| **Tier 0** | **Custo Zero / Federal** | • ComunicaBR (SECOM/PR)<br/>• PNCP (Contratos/Licitações)<br/>• Siconfi (Tesouro Nacional - DCA/RREO/RGF)<br/>• Transferegov (Convênios)<br/>• SIGBM/ANM (Barragens)<br/>• SIRENEJud/CNJ (Processos Ambientais)<br/>• DATASUS (SIH-SUS / SIM / Sinan) | R$ 0 / ingestão em lote nacional (~15 KB/cidade) | **100% dos 5.570 municípios** recebem cobertura financeira, de saúde e de justiça |
| **Tier 1** | **Custo Baixo / Padrão Aberto** | • SAPL/Interlegis (Senado Federal - >1.800 câmaras com API REST)<br/>• CKAN de Capitais (SP, BH, Curitiba, Recife, Salvador)<br/>• Diários Oficiais de Associações Estaduais (AMM, FAMURS, FECAM, APRECE) | 1 a 2 horas de seed por cidade | Ativa Câmaras, Vereadores, Proposições e Diários Oficiais |
| **Tier 2** | **Custo Médio / Fornecedores ERP** | • Betha Sistemas (Sul/Centro-Oeste)<br/>• Sonner / WebISS (Sudeste)<br/>• Fiorilli S/C (SIAve/SCPI)<br/>• Aspec Informática (Nordeste)<br/>• IPM Sistemas / Thema (Atende.Net)<br/>• SysSolution / SimpleSystem (MG, BA, ES) | 1 conector por fornecedor atende dezenas de cidades | Extração direta de contratos e empenhos municipais detalhados |
| **Tier 3** | **Custo Alto / Customizado** | • Portais legados fechados ou em PDF escaneado<br/>• Câmaras sem módulo de matérias legislativas | Alto (manutenção de scraping ad-hoc) | **Decisão**: Modo *Degradação Graciosa* (`camara_proposicoes: false`) com exibição de dados Tier 0 e lacuna declarada |

## As quatro trilhas de cruzamento crítico

1. **Trilha 1 (Socioambiental & Fundiária + Legislativo)**: CAR $\times$ SPU $\times$ FUNAI/INCRA $\times$ SIGBM/ANM $\times$ IBAMA embargos $\times$ SIRENEJud $\times$ TSE bens e doações $\times$ Votações nominais Câmaras/Congresso.
2. **Trilha 2 (Finanças, Compras & Integridade)**: PNCP $\times$ Siconfi $\times$ Doadores TSE $\times$ CEIS/CNEP $\times$ Transferegov $\times$ Pareceres TCE.
3. **Trilha 3 (Judiciário & Poder Institucional)**: DataJud/SIRENEJud $\times$ CNJ Corregedoria $\times$ Geopresídios CNIEP $\times$ Vagas e Composição TJ/TRF.
4. **Trilha 4 (Saúde, Clima & Vulnerabilidade)**: DATASUS (SIH/SIM/Sinan) $\times$ AdaptaBrasil MCTI $\times$ INMET $\times$ ComunicaBR.

## Módulo de saúde e vigilância por CID-10

O módulo de saúde em `/[municipio]/saude` monitora as principais causas de internação hospitalar SUS e correlaciona diagnósticos com agressões ambientais:
- **Poeira de Minério & Siderurgia** $\leftrightarrow$ CIDs J60-J69 (Pneumoconioses) e N18 (Insuficiência renal).
- **Queimadas & Material Particulado** $\leftrightarrow$ CIDs J12-J18 (Pneumonias) e J45 (Asma).
- **Intoxicações por Agrotóxicos** $\leftrightarrow$ CIDs T60 e notificações Sinan.
- **Saneamento Inadequado & Enchentes** $\leftrightarrow$ CIDs A00-A09 (Gastroenterites) e A27 (Leptospirose).

### Status do módulo (medido em 2026-08-31)

**Coletor end-to-end rodando.** `etl/betim/etl/bd/sih_cid.py` sincroniza a
tabela `saude_internacoes_cid` (migration `0081`) a partir do BigQuery, e a
página `/[municipio]/saude` já exibe o ranking de CIDs real e o gráfico de
evolução das internações. Rotina mensal: passo `etl.bd.sih_cid --todos-ativos`
declarado em `etl-betim.yml` no bloco monthly (a rotina local lê os crons).

**Schema do SIH verificado ao vivo no BigQuery** (`br_ms_sih.aihs_reduzidas`),
conhecimento crítico para quem tocar o coletor:

- A tabela **não tem** `diagnostico_principal*`. O CID-10 está dividido em
  duas colunas:
  - `cid_principal_categoria` — categoria nua ("J18"), **nula em ~89%** das linhas;
  - `cid_principal_subcategoria` — categoria sem ponto, cobre 100%
    ("J189", "O800"). O DATASUS grava **sem ponto**.
- O ETL usa `COALESCE(categoria, subcategoria)` e normaliza a chave para a
  **categoria** (3 primeiros caracteres, maiúsculo, sem ponto). O join de
  capítulo usa o código **bruto** contra `basedosdados.br_bd_diretorios_brasil.cid_10.subcategoria`
  (tem linha até para a categoria nua).
- Coluna de valor é `valor_aih` (não existe `valor_total` na fonte); a
  sondagem decide em runtime e grava `NULL` com aviso quando ausente.
- O filtro municipal usa `id_municipio_paciente` com o código **DATASUS de 6
  dígitos** (`_datasus_6`); filtrar pelo IBGE de 7 devolve **zero linhas em
  silêncio**.
- `saude_internacoes_cid` é **100% derivada** do BigQuery. Se a normalização
  da chave mudar, o caminho é rebuild total (`DELETE` + `--todos-ativos`),
  não upsert — upsert não remove chaves órfãs.
- Totais por ano batem exatamente com `saude_internacoes` (Betim 2024 =
  24.791 = 24.791). Ranking plausível: O80 parto, I64 AVC, I21 infarto.

## O Índice de Risco a Direitos

O **Índice de Risco a Direitos (0 a 100)** sintetiza o nível de ameaça a direitos fundamentais:
- **Saúde e Vida (30%)**: Taxa de internações por CIDs ambientais + mortalidade prematura evitável.
- **Socioambiental e Climático (30%)**: Barragens em emergência + sobreposição de CAR em Terras Indígenas/Quilombolas.
- **Integridade e Erário (25%)**: Contratos com doadores eleitorais (PNCP $\times$ TSE) + empresas inidôneas (CEIS/CNEP).
- **Opacidade Política (15%)**: Câmaras sem API aberta de votos + descompasso patrimonial.

### Status (medido em 2026-08-31)

O motor puro (`apps/web/lib/risco-direitos.ts`) e o card na home existem, e o
agregador `lib/db/queries/risco-direitos.ts` alimenta o cálculo com **dados
reais do banco** (P4): barragens críticas (FEAM/SNISB), autos IBAMA,
contratos × CEIS/CNEP, contratos × doações TSE (somente CNPJ de doador PJ,
nunca documento), `fontes.camara_proposicoes` e `nota_transparencia`.
A dimensão de saúde usa `saude_internacoes_cid` ∩ CIDs de monitoramento
ambiental.

O card segue a régua editorial de lacuna: o agregador devolve também a
**cobertura** de cada dimensão, e o card só é renderizado na home quando há
dado real em pelo menos uma dimensão — dimensão sem dado mostra "dado ainda
não coletado" em vez de "sem anomalias", e o score global só aparece quando
as 4 dimensões têm dado (senão, "índice parcial N/4").

Ainda em aberto (não fabricado): sobreposição CAR×TI em hectares e taxa de
mortalidade evitável entram como 0 até existir fonte/query que as calcule com
dado real.


## A Teia de Interesses e o Dossiê para o Ministério Público

1. **Grafo Relacional Vetorial (SVG inline)**: Nós de Políticos, Empresas, Imóveis Rurais (CAR), Barragens e Processos Judiciais.
2. **Dossiê Forense do Cidadão**: Emissão de relatório formatado para subsidiar denúncias ao MPF, MPE, MPC e Tribunais de Contas com links imutáveis para certidões no DOU, TSE, IBAMA, PNCP e Diários de Justiça.

## Inventário nacional por região geográfica

Total de **201 municípios estratégicos** mapeados:
- **Norte (31 cidades)**: 7 Capitais + 22 Polos do Interior (ex: Santarém, Marabá, Parintins, Ji-Paraná, Araguaína, Cruzeiro do Sul, Santana).
- **Nordeste (54 cidades)**: 9 Capitais + 45 Polos do Interior (ex: Feira de Santana, Vitória da Conquista, Campina Grande, Caruaru, Petrolina, Mossoró, Arapiraca, Parnaíba, Imperatriz, Itabaiana).
- **Centro-Oeste (24 cidades)**: 4 Capitais/DF + 20 Polos do Interior (ex: Anápolis, Rio Verde, Rondonópolis, Sinop, Dourados, Três Lagoas, Corumbá).
- **Sudeste (54 cidades)**: 4 Capitais + 50 Polos do Interior (ex: Campinas, Ribeirão Preto, Santos, São José dos Campos, Uberlândia, Juiz de Fora, Niterói, Campos dos Goytacazes, Volta Redonda, Serra, Linhares).
- **Sul (38 cidades)**: 3 Capitais + 35 Polos do Interior (ex: Londrina, Maringá, Ponta Grossa, Cascavel, Joinville, Blumenau, Itajaí, Chapecó, Caxias do Sul, Pelotas, Santa Maria, Passo Fundo).

### Status do inventário (medido em 2026-08-31)

O **inventário dos 172 polos do interior agora existe** em
`apps/web/data/polos-interior-ibge.json`, gerado por
`scripts/gerar-polos-interior.cjs` — conferência **ao vivo na API do IBGE**
(`/localidades/municipios`, 5.571 municípios): cada polo casa por nome
normalizado + UF, e qualquer nome ambíguo ou não encontrado fica de fora e é
reportado (a régua "código IBGE nunca digitado à mão" do runbook). O JSON
traz `id_municipio` (7 dígitos), `uf`, `regiao` e `datasus_6dig` (trunca o
dígito verificador).

**O que falta para os seeds 0083-0087** (um por região), na ordem do runbook
`runbook-cidade-nova.md`:
1. **CNPJ da prefeitura e da câmara** conferidos ao vivo (PNCP/Interlegis) —
   por polo. CNPJ errado é pior que ausente: faz o `etl.pncp.contratos`
   coletar contrato de outro ente em silêncio.
2. **Fornecedor da câmara** (SAPL? SysSolution? nenhum?) por polo, para o
   `camara_sistema`/`camara_coletor` certo no `fontes`.
3. `ativo = false` até o ETL rodar pelo menos uma vez; `fontes` com as
   guardas de MG (`paraopeba`, `citrolandia`, `links_uteis_mg`,
   `rotas_legadas`) em `false` para todo polo fora de MG.

As 25 capitais já estão semeadas (migration `0082`, ex-`0061` — renumeração
por colisão de número com `0061_servidores_itinga_diamantina.sql`); BH e SP
existem desde o seed `0027`.

## Arquitetura de navegação e banco de dados

- **Visão Integrada ("Tudo Junto")**:
  - `/[municipio]`: Dashboard com Índice de Risco a Direitos e Alertas Gerais.
  - `/[municipio]/interesses`: Grafo da Teia de Interesses e Gerador de Dossiê.
  - `/funcaosocialterra/mapa`: Globo 3D com sobreposição territorial.
- **Seções Temáticas Especializadas ("Páginas Separadas")**:
  - `/[municipio]/saude`: Ranking de CIDs e internações.
  - `/[municipio]/meio-ambiente`: Barragens, infrações e CAR.
  - `/[municipio]/prefeitura`: Finanças, contratos e CEIS.
  - `/[municipio]/camara`: Vereadores, votações e proposições.
  - `/[municipio]/terras`: Vazios cadastrais e terras públicas.
  - `/[municipio]/educacao`: IDEB e creches.

## Decisões registradas

| Data | Decisão | Racional |
|---|---|---|
| 2026-08-31 | **Adoção do termo "Índice de Risco a Direitos"** | Foco objetivo em violações e ameaças a garantias constitucionais em vez de rótulo genérico de vulnerabilidade. |
| 2026-08-31 | **Módulo de Saúde com Ranking de CIDs e Correlação Ambiental** | Conecta diagnósticos hospitalares do DATASUS (SIH) a vetores de agressão ambiental (mineração, agrotóxicos, saneamento). |
| 2026-08-31 | **Modelo de Dossiê Aberto para MPF/MPE** | Empodera o cidadão e a imprensa com relatórios forenses estruturados contendo links oficiais e certidões. |

## Origem

Plano consolidado a partir do alinhamento `/grill-me`, unificando a expansão geográfica para todas as 27 capitais e 110+ polos com a matriz de cruzamentos críticos intersetoriais.
