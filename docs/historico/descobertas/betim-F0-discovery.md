# F0 — Discovery & Verification Log

> **Tipo:** HISTORICO
> **Domínio:** betim
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, descoberta, f0

## Sumário

- [Propósito](#propósito)
- [1. Portal da Transparência da Prefeitura de Betim — **MUDANÇA DE PLANO**](#1-portal-da-transparência-da-prefeitura-de-betim-mudança-de-plano)
- [2. Câmara de Betim (camarabetim.mg.gov.br)](#2-câmara-de-betim-camarabetimmggovbr)
- [3. Radar da Transparência / PNTP (ATRICON) — **MUDANÇA DE PLANO**](#3-radar-da-transparência-pntp-atricon-mudança-de-plano)
- [4. ANP — Postos de combustível](#4-anp-postos-de-combustível)
- [5. Sejusp-MG (segurança pública)](#5-sejusp-mg-segurança-pública)
- [6. ALMG — Emendas parlamentares estaduais](#6-almg-emendas-parlamentares-estaduais)
- [7. Base dos Dados — tabelas de saúde](#7-base-dos-dados-tabelas-de-saúde)
- [8. Datajud/CNJ (processos judiciais)](#8-datajudcnj-processos-judiciais)
- [9. CMBH (Câmara de Belo Horizonte) — para F11](#9-cmbh-câmara-de-belo-horizonte-para-f11)
- [10. Portal da prefeitura — Servidores (mapeado em 2026-07-20, sessão F5)](#10-portal-da-prefeitura-servidores-mapeado-em-2026-07-20-sessão-f5)
- [11. Base dos Dados — schema real confirmado (2026-07-20, sessão pós-GCP)](#11-base-dos-dados-schema-real-confirmado-2026-07-20-sessão-pós-gcp)
- [12. IBGE servicodados.ibge.gov.br — integrado (2026-07-20)](#12-ibge-servicodadosibgegovbr-integrado-2026-07-20)
- [13. ComunicaBR (comunicabr.presidencia.gov.br) — candidato novo, NÃO integrado](#13-comunicabr-comunicabrpresidenciagovbr-candidato-novo-não-integrado)
- [14. CFEM, royalties, FUNDEB, FPM — já cobertos pelo SICONFI (2026-07-20)](#14-cfem-royalties-fundeb-fpm-já-cobertos-pelo-siconfi-2026-07-20)
- [15. DataJud (CNJ) — API pública NÃO expõe nome de partes — **BLOQUEIO CONFIRMADO**](#15-datajud-cnj-api-pública-não-expõe-nome-de-partes-bloqueio-confirmado)
- [Itens ainda pendentes de verificação](#itens-ainda-pendentes-de-verificação)

## Propósito

> Atualizado: 2026-07-20. Cada item resolve um `[VERIFY]` do `Betim.ai — Executable Plan.md`. > > **Arquivo histórico, anterior à unificação em monorepo (2026-07-28).** Caminhos citados aqui (`etl/apis/...`, `supabase/migrations/...`) são do repo antigo `betim-ai` — no monorepo atual viraram `etl...

> Atualizado: 2026-07-20. Cada item resolve um `[VERIFY]` do `Betim.ai — Executable Plan.md`.
>
> **Arquivo histórico, anterior à unificação em monorepo (2026-07-28).** Caminhos citados aqui (`etl/apis/...`, `supabase/migrations/...`) são do repo antigo `betim-ai` — no monorepo atual viraram `etl/betim/etl/...` e `supabase/betim/migrations/...`. Menções a Supabase são do banco de então; hoje é Neon. O raciocínio e os achados de fonte continuam valendo, só o mapa de arquivo mudou.

## 1. Portal da Transparência da Prefeitura de Betim — **MUDANÇA DE PLANO**

- **Host real:** `http://servicos.betim.mg.gov.br/transparencia/` (link "Portal da Transparência" a partir de www.betim.mg.gov.br). `transparencia.betim.mg.gov.br` não resolve (confirmado no plano original).
- **Descoberta crítica:** é uma SPA Angular que consome uma **API REST JSON pública, sem autenticação**, em `http://servicos.betim.mg.gov.br/transparencia/rest/`. Isso **substitui a necessidade de Playwright** prevista no plano original (§5.2 `etl.prefeitura.b3106705`) — podemos ler direto via `requests`/`httpx`.
- Padrão de endpoints confirmado via inspeção de rede:
  - `rest/APIServico/ListarServicos` → lista todos os módulos do portal (Gestão de Pessoas, Despesas, Contratos, Licitações, Receitas, Diárias, Obras, Legislação, Emendas Parlamentares, Dívida Ativa, Educação, Órgão Oficial, Bolsa Família, Radar da Transparência, Dados Abertos, Empresas Sancionadas, Convênios, Prestação de Contas — TODOS os módulos que o plano precisa).
  - `rest/APIParametro/BuscarParametroValor?Parametronome=X` → metadados do órgão.
  - **Despesas/Empenhos:** `rest/APIEmpenho/ListarOrgaos?Exercicio=2026`, `ListarFuncoes`, `ListarProgramas`, `ListarDespesas`, `ListarResultados?Exercicio=2026&Registrosporpagina=10&Registroinicial=0` (paginado), `TotalizarResultados?Exercicio=2026`.
  - Resposta real capturada (amostra) — campos: `EmpenhoId, EmpenhoNumero, EmpenhoData, EmpenhoCredorNome, EmpenhoContaDespesaNome, EmpenhoOrgaoCodigo, EmpenhoUnidadeCodigo, EmpenhoValor, EmpenhoValorLiquidado, EmpenhoValorPago, EmpenhoValorAPagar, EmpenhoValorConsignado`.
  - Módulo "Gestão de Pessoas" (`gestao-pessoas`) existe mas endpoints específicos (servidores/folha) ainda não mapeados — mapear em F5 com o mesmo método (abrir a página no browser, ler Network).
- **Ação para F5 (`etl.prefeitura.b3106705`):** reescrever de "Playwright scraping" para "cliente REST simples". Precisamos apenas repetir esta técnica de inspeção de rede (abrir cada aba do portal e capturar as chamadas `rest/API*`) para mapear os endpoints de Contratos, Licitações, Servidores/Folha, Diárias, Obras, Legislação — provável reaproveitamento do mesmo padrão `APIxxx/ListarResultados`.
- **Nota:** contratos e licitações já vêm do PNCP (fonte primária no plano); esta API da prefeitura serve principalmente para Despesas/Empenhos, Receitas, Servidores/Folha, Diárias, Obras, Legislação — dados que o PNCP não cobre.
- Diário Oficial: `https://www.betim.mg.gov.br/portal/diario-oficial/`.
- Dados Abertos nativos do portal: link "Dados Abertos" existe no menu (`ServicoLink` a mapear).

## 2. Câmara de Betim (camarabetim.mg.gov.br)

- Site carrega normalmente em navegação real (o erro "Algo deu errado" da tentativa anterior via WebFetch foi um falso negativo — o fetch headless não executa JS SPA corretamente). Não é bloqueado por Blazor de forma incontornável; **ainda assim requer browser real/Playwright** para renderizar (confirma a estratégia original do plano).
- **Sistema legislativo:** "PROLEGIS - Sistema de Processo Legislativo" — sistema próprio da Câmara para tramitação de projetos, normas jurídicas e sessões plenárias. Precisa localizar a URL exata do PROLEGIS em F5/F6 (não capturada nesta sessão).
- Menu confirma existência de TODAS as seções do plano, hospedadas no próprio site principal (não precisa de portal LAI separado):
  - Transparência (LAI, Lei 12.527/2011), Legislação, Licitações, Contratos, Orçamento 2026, Plano Plurianual 2026-2029, Órgão Oficial, Parlamentares, Comissões, Legislaturas, Reuniões Ordinárias, Pautas das Reuniões, Sessões Plenárias, Atas das Reuniões.
- **20ª Legislatura confirmada:** 2025–2028 (bate com o plano). Reuniões Ordinárias às terças-feiras 09:00 (confirmado: "24ª Reunião Ordinária ... 14/07/2026 às 09:00").
- Licitações têm dados estruturados na home (modalidade, objeto, data/hora abertura, valor) — bom sinal para scraping estruturado.
- **Ação para F6:** usar Playwright como planejado; investigar se PROLEGIS expõe alguma API/relatório exportável antes de assumir scraping puro de DOM.

## 3. Radar da Transparência / PNTP (ATRICON) — **MUDANÇA DE PLANO**

- **Não é uma API JSON escondida** — é muito mais simples: `https://radardatransparencia.atricon.org.br/downloads.html` disponibiliza **ZIPs de dados prontos por ano**:
  - `https://radardatransparencia.atricon.org.br/dados/dados_pntp_2025.zip`
  - `.../dados_pntp_2024.zip`, `dados_pntp_2023.zip`, `dados_pntp_2022.zip`
  - Também: `criterios_de_avaliacao_pntp_2026.zip` (metodologia/critérios).
- **Ação para F9 (`etl.apis.pntp`):** baixar o ZIP do ano corrente, extrair (provavelmente CSV/XLSX), filtrar por município Betim (3106705) e por todos os municípios de MG para o ranking estadual. Muito mais simples e estável que fazer scraping do site.

## 4. ANP — Postos de combustível

- Consulta pública: `https://cdp.anp.gov.br/ords/r/cdp_apex/consulta-dados-publicos-cdp/consulta-de-postos-lista` — formulário com filtro por Município, permite export CSV ("Exportar" e "Exportar com tancagem").
- PMQC (qualidade de combustível) tem arquivos CSV mensais em padrão previsível: `https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/pmqc/{ano}/pmqc-{ano}-{mes}.csv` (confirmado pelo menos para 2025-12).
- **Ação para F7 (`etl.apis.anp`):** confirmar em F7 se o CDP tem endpoint de export direto (ORDS/Oracle APEX geralmente expõe REST — vale inspecionar rede como fizemos com o portal de Betim) ou baixar CSV mensal do PMQC + registro cadastral de revendedores via dados.gov.br/ANP.

## 5. Sejusp-MG (segurança pública)

- Portal de Dados Abertos do Estado de MG: `https://dados.mg.gov.br/dataset/crimes-violentos` — dataset "Crimes Violentos", cobre os 853 municípios de MG, atualização mensal, formatos Excel/CSV.
- **Ação para F9:** ETL baixa o dataset do dados.mg.gov.br (portal CKAN, deve ter API REST padrão `/api/3/action/...`) filtrando Betim.

## 6. ALMG — Emendas parlamentares estaduais

- Dados abertos: `dadosabertos.almg.gov.br` (mencionado nas buscas) e painel "Assembleia em Números" com filtro por município.
- Portal de Emendas MG dedicado: `https://www.emendas.mg.gov.br/` — provavelmente mais direto que ALMG para valores por município/ano.
- **Ação para F9:** verificar qual dos dois expõe dados tabulares/API mais facilmente; `emendas.mg.gov.br` parece purpose-built.

## 7. Base dos Dados — tabelas de saúde

- `br_ms_sih` (Sistema de Informações Hospitalares) confirmado existente, cobertura 2008-01 a 2026-05.
- `br_ms_sim` (Sistema de Informações sobre Mortalidade) confirmado existente, cobertura 1979–2022.
- Nomes exatos de tabela (dataset_id.table_id) **ainda não confirmados** — precisa rodar `bd.get_table_columns()` ou `basedosdados.list_datasets()` em Python quando o ambiente estiver pronto (F3 gate, conforme já previsto no plano).
- `br_cgu_beneficios_cidadao` — dataset "Benefícios ao Cidadão" existe na Base dos Dados (Bolsa Família e outros), alimentado do Portal da Transparência federal.

## 8. Datajud/CNJ (processos judiciais)

- API pública confirmada: `https://api-publica.datajud.cnj.jus.br/api_publica_{sigla_tribunal}/_search` (ex.: `api_publica_tjmg`, `api_publica_tre-mg`).
- Requer **chave pública de autenticação** gerada pelo CNJ, disponível na Wiki: `https://datajud-wiki.cnj.jus.br/api-publica/` (chave pode mudar; não precisa de cadastro formal de conta, é uma chave pública compartilhada — **verificar a chave vigente no momento do F6**, não fixar no código).
- Documentação completa: `https://datajud-wiki.cnj.jus.br/api-publica/acesso/`.

## 9. CMBH (Câmara de Belo Horizonte) — para F11

- Não encontrado `dadosabertos.cmbh.mg.gov.br` (assumido no plano original). O que existe: `https://www.cmbh.mg.gov.br/transparencia-principal` (Portal da Transparência da Câmara).
- Prefeitura de BH tem portal de dados abertos separado: `https://dados.pbh.gov.br/` e `https://databh.pbh.gov.br/dados-abertos`.
- **Ação para F11:** reavaliar — pode não ser mais simples que Betim; verificar se o portal da Câmara de BH usa o mesmo tipo de SPA+REST descoberto em Betim (mesma técnica de inspeção de rede).

## 10. Portal da prefeitura — Servidores (mapeado em 2026-07-20, sessão F5)

Endpoint confirmado via inspeção de rede (mesma técnica do item 1), REST, sem auth:

- `rest/APIServidor/ListarResultados?Servidortipo={1-6}&Ano=YYYY&Mes=M&Ordenacao=C&Registrosporpagina=N&Registroinicial=0` — roster paginado.
- `rest/APIServidor/TotalizarResultados?Servidortipo={1-6}&Ano=YYYY&Mes=M&Ordenacao=C` — contagem total.
- `rest/APIServidor/ListarCargos?Servidortipo={1-6}&Ano=YYYY&Mes=M`, `rest/APIServidor/ListarSecretarias?Ano=YYYY` — filtros auxiliares.
- Campos confirmados (amostra real, `Mes=6/2026`): `ServidorNome, ServidorCargoNome, ServidorSecretariaNome, ServidorVinculo, ServidorRegime, ServidorCargaHoraria, ServidorAdmissaoData, ServidorExoneracaoData`.
- **`Servidortipo` mapeado por amostragem de conteúdo** (não documentado, inferido pelos valores de `ServidorRegime`/`ServidorVinculo` retornados): `1=Efetivos, 2=Efetivos em Comissão e Função de Confiança, 3=Comissonados, 4=Função Pública, 5=Estagiários, 6=Temporários [VERIFY - não testado diretamente, só inferido pela ordem da lista de serviços]`.
- **Nota importante:** o mês corrente (`Mes=7` para hoje 2026-07-20) retornou `{}` vazio — a folha do mês em andamento ainda não é publicada; o ETL deve sempre puxar o mês fechado mais recente (mês atual − 1, com fallback para trás se também vazio).
- **`folha_pagamento` (valores agregados de remuneração) não tem endpoint JSON encontrado** — "Remuneração - PMB/TransBetim/ECOS/Funarbe" abrem apenas listas de **PDFs mensais** (`sistemas.betim.mg.gov.br/transparencia/docs/gestao_pessoal/...`), não uma API estruturada. Para popular `folha_pagamento.total_bruto` seria necessário parsing de PDF — descopado desta rodada, `servidores` (roster) é o que fica pronto agora.

## 11. Base dos Dados — schema real confirmado (2026-07-20, sessão pós-GCP)

GCP liberado (projeto `controle-popular`, service account `controlepopularmunicipal@...`,
exceção de política de organização para permitir a chave). Todas as 9 tabelas do F3
(`etl/bd/*.py`) foram testadas ao vivo contra o BigQuery real e corrigidas — a maioria
dos nomes de coluna/tabela originalmente estimados no plano estava errada ou a tabela
nem existia com esse nome. Detalhes completos nos comentários de cada módulo; resumo:

- `br_me_siconfi.municipio_despesas_funcao`: **não tem** coluna `funcao` — `conta` já é a função (ex. "Saúde", "Educação").
- `br_ibge_pib.municipio`: **não tem** `pib_per_capita` — calculado em Python (pib está em R$ puro, confirmado: Betim 2023 ≈ R$ 52,6 bi).
- `br_inep_ideb.{municipio,escola}`: formato longo (rede/ensino/anos_escolares + coluna única `ideb`), não colunas largas iniciais/finais.
- `br_inep_censo_escolar.escola`: **zero** colunas de identificação/geo — nome/endereço/lat/lng vêm de `br_bd_diretorios_brasil.escola`.
- `br_ms_cnes.estabelecimento`: **zero** colunas de nome/endereço/geo, e nenhuma outra tabela do dataset (nem diretórios) preenche isso — módulo escopado só para id_cnes/tipo/profissionais.
- `br_ms_sih.microdados` **não existe** — tabela real é `br_ms_sih.aihs_reduzidas`, e ela usa o **código DATASUS de 6 dígitos** (`310670`), não o IBGE de 7 dígitos (`3106705`) — retornava 0 linhas silenciosamente com o código errado.
- `br_ms_sim.microdados`: `causa_basica` é código CID-10 cru — agora faz join com `br_bd_diretorios_brasil.cid_10` pra pegar o capítulo real.
- `br_mdr_snis.municipio_residuos_solidos` **não existe**. Coluna de cobertura de esgoto tinha nome errado (correto: `indice_coleta_esgoto`).
- `br_tse_eleicoes`: chave de join é `sequencial_candidato`/`candidatos.sequencial`, não `sq_candidato`. **CPF do doador não vem mascarado** nesta tabela (TSE publica completo, é transparência legal de campanha) — a suposição do plano original de "mascarado" estava errada.
- `br_me_cnpj.estabelecimentos`/`socios`: nomes de coluna bem diferentes do estimado (`id_municipio` em vez de `municipio`; `nome`/`documento` em vez de `nome_socio`/`cpf_cnpj_socio`).

## 12. IBGE servicodados.ibge.gov.br — integrado (2026-07-20)

Já estava citada no plano (§2) só como referência usada para confirmar o código
IBGE de Betim (3106705), sem nunca ter virado um módulo ETL de verdade. Explorada
a API completa (`/api/docs/` lista 20 sub-APIs); duas são úteis e simples, sem
autenticação:

- **Localidades** (`/api/v1/localidades/municipios/{id}`): hierarquia administrativa
  completa (microrregião → mesorregião → UF → região; região imediata/intermediária).
- **Malhas Geográficas** (`/api/v3/malhas/municipios/{id}?formato=application/vnd.geo+json`):
  polígono GeoJSON do contorno do município — útil pra mapa na home/"Cidade em Dados".

Ambas testadas ao vivo pra Betim e implementadas: `etl/apis/ibge.py` +
`supabase/migrations/0004_ibge_geo.sql` (`municipios.regiao_ibge` / `.malha_geojson`).
Cron trimestral (dado praticamente estático). As outras sub-APIs (Agregados/SIDRA,
CNAE, Nomes, Notícias, Países, Pesquisas) não têm uso claro no escopo atual —
Agregados poderia complementar indicadores do censo no futuro se o BD ficar
insuficiente, mas não há necessidade agora.

## 13. ComunicaBR (comunicabr.presidencia.gov.br) — candidato novo, NÃO integrado

Painel de indicadores federais (Presidência da República) com filtro por UF/Município.
Descoberta via inspeção de rede: é um Next.js consumindo `/api/v2/indicadores` e
`/api/v1/estados`, sem autenticação. Resposta confirmada em nível **Brasil**
(população, eleitorado, receita estimada, PIB per capita) e por **UF** (usa `id`
interno de `/api/v1/estados`, ex. MG=31) — inclui dados valiosos que não temos hoje:
**transferências federais** (FPM, Bolsa Família, BPC, seguro-desemprego, benefícios
previdenciários) por ano, com série histórica.

**Não integrado ainda** porque o filtro por **município** não foi decifrado — tentei
`codigo_ibge=3106705`, `municipio=3106705`, `/api/v1/estados/31/municipios` e
`/api/v1/municipios?codigo_ibge=...`, nenhum retornou dado de Betim (caiu no
default "Brasil" ou 404). A tela usa dois `<select>` (UF/Município) que provavelmente
disparam uma chamada com um `id` interno de município (análogo ao `id` de estado),
não o código IBGE direto — precisa inspecionar a chamada de rede feita pela própria
UI ao selecionar Betim (não consegui automatizar isso nesta sessão; o painel de
browser travou nas interações de dropdown). Retomar quando o Supabase estiver
pronto e sobrar tempo — dado federal de transferências (Bolsa Família/BPC/FPM) é
um bom complemento pra `/emendas` ou pra um indicador novo em `indicadores` (F9).

## 14. CFEM, royalties, FUNDEB, FPM — já cobertos pelo SICONFI (2026-07-20)

Usuário pediu CFEM (compensação de mineração), "outros tributos", compensações
ambientais estaduais e fundos públicos. Antes de sair procurando fonte nova,
conferi o que `etl.bd.siconfi` já traz de `br_me_siconfi.municipio_receitas_orcamentarias`
(consulta `INFORMATION_SCHEMA`-style, `DISTINCT conta`) — **já está tudo lá**,
como linhas individuais de `conta` dentro da tabela `receitas` que o F3 já
sincroniza mensalmente:

- **CFEM**: `Cota-parte da Compensação Financeira pela Exploração de Recursos
  Minerais - CFEM` — confirmado com valor real pra Betim: R$ 1.550.394,87 em
  2024, R$ 1.181.806,24 em 2023 (Betim tem extração mineral na região do
  Quadrilátero Ferrífero, faz sentido).
- **Royalties de petróleo**: `Cota-parte Royalties Petróleo`, `Cota Royalties
  Produção/Especial/Excedente`, `Cota-Parte do Fundo Especial do Petróleo - FEP`.
- **Fundos**: FUNDEB, FNDE, FNAS, FPM (Fundo de Participação dos Municípios) —
  todos com múltiplas linhas de `conta` distintas.
- **Outros tributos municipais**: ISSQN (R$ 209 mi em 2024), ITBI (R$ 23 mi) —
  confirmados com valor real; provavelmente IPTU/taxas também estão lá sob
  outro rótulo exato (não testado, mas o padrão se repete).

**Não precisa de nova integração** — é só uma questão de **exibição**: hoje
`receitas`/`despesas` guardam cada `conta` como linha solta (sem agrupamento
temático tipo "royalties e compensações" vs "impostos próprios" vs "fundos
federais"). Isso é trabalho de frontend/agregação pra F9 (`/economia` ou
`/prefeitura` overview), não de ETL.

**Ainda não coberto**: compensação ambiental **estadual** de MG (SEMAD/IEF —
mecanismo de licenciamento ambiental, verba geralmente vai pra unidades de
conservação específicas, não necessariamente pro orçamento municipal via
SICONFI) — depende do portal CKAN de dados.mg.gov.br, que já é um item
pendente (ver abaixo).

## 15. DataJud (CNJ) — API pública NÃO expõe nome de partes — **BLOQUEIO CONFIRMADO**

- API pública: `https://api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search`
  (Elasticsearch), chave pública fixa publicada pelo CNJ (`Authorization:
  APIKey ...`, ver `datajud-wiki.cnj.jus.br/api-publica/acesso/`). Testado
  ao vivo 2026-07-21 contra `api_publica_tjmg`.
- **Os documentos retornados só têm**: `numeroProcesso, tribunal, grau,
  classe, assuntos, orgaoJulgador, movimentos, dataAjuizamento, sistema,
  formato, nivelSigilo` — **nenhum campo de parte (autor/réu/polo)**.
  Confirmado inspecionando as chaves de um documento real via
  `match_all`. Não é um problema de query/sintaxe — o índice público
  simplesmente não indexa nomes de partes (proteção de privacidade/LGPD
  do próprio CNJ; a Portaria 160 que rege a API é sobre metadados
  processuais, não sobre partes).
- **Consequência**: é impossível buscar "processos do vereador X" nessa
  API sem já saber o `numeroProcesso` de antemão — não há como descobrir
  processos novos por nome de pessoa. `etl.apis.datajud` (F6, tabela
  `processos_judiciais`) **não é implementável com a API pública do
  DataJud** como o plano original previa.
- **Alternativas não exploradas** (ficam pra decisão de produto, não
  pesquisa técnica): (a) serviços privados que já indexam partes via
  scraping dos tribunais (ex. Escavador, JusBrasil) — pagos, fora do
  escopo de "só fontes públicas oficiais" do projeto; (b) scraping direto
  do site do TJMG (e-SAJ ou PJe) por nome de parte, se esses sistemas
  expuserem busca pública — não verificado ainda, mas mesmo se existir é
  um scraper novo e frágil, não uma reutilização do DataJud.

## Itens ainda pendentes de verificação

- [x] Endpoints de Servidores no portal da prefeitura — ver item 10. `Servidortipo=6` (Temporários) e valores de remuneração (`folha_pagamento`) seguem pendentes (só PDF).
- [x] Nomes exatos das tabelas BD — ver item 11 acima, todas as 9 confirmadas e corrigidas.
- [x] IBGE servicodados (Localidades + Malhas) — ver item 12, integrado.
- [x] URL exata do PROLEGIS — ver item F6 no TODO.md: é `legislativo.camarabetim.mg.gov.br`, login-gated na raiz, mas `Materia/BuscaAvancada` e `Materia/DadosMateria/{id}` são públicos.
- [x] DataJud — ver item 15 acima: API pública não expõe partes, bloqueio confirmado.
- [ ] Confirmar se CDP/ANP (Oracle APEX/ORDS) expõe REST direto via inspeção de rede.
- [ ] Portal CKAN do dados.mg.gov.br — confirmar endpoint API REST padrão.
- [ ] ComunicaBR — descobrir o parâmetro de filtro por município (ver item 13).
