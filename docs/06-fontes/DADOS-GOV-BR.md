# Catálogo dados.gov.br — o que já usamos e o que vale integrar

> **Tipo:** FONTE
> **Domínio:** global
> **Última medição:** 2026-08-30
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [FONTES.md](FONTES.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** dados.gov.br, catálogo, CKAN, token, dados abertos, fontes, integração

## Sumário

- [Propósito](#propósito)
- [O que já usamos do catálogo federal](#o-que-já-usamos-do-catálogo-federal)
- [A armadilha do token](#a-armadilha-do-token)
- [Sugestões por frente](#sugestões-por-frente)
- [Prioridades recomendadas](#prioridades-recomendadas)
- [Decisões registradas](#decisões-registradas)

## Propósito

Mapear o catálogo de dados abertos do governo federal ([dados.gov.br](https://dados.gov.br/dados/)) contra as seis frentes do portal: o que já está integrado, o que está bloqueado por credencial e quais conjuntos valem a próxima rodada de ETL — com o encaixe concreto de cada um (qual rota ou camada ele alimentaria).

## O que já usamos do catálogo federal

Medido contra o código em 2026-08-30:

| Conjunto | Como entra | Onde no código |
|---|---|---|
| Transferegov/dETRU (convênios federais) | CSV sem chave em `repositorio.dados.gov.br/seges/detru/` — infra do dados.gov.br, fora da API do catálogo | `scripts/coletar-convenios-federais-mg.mts`, `scripts/coletar-convenios-ambientais-mg.mts` |
| Legislação federal do MMA | CKAN próprio do MMA (`dados.mma.gov.br`), não o catálogo federal | `etl/betim/etl/apis/legislacao_mma.py` |
| Convênios ambientais de MG (CGE) | CKAN estadual `dados.mg.gov.br`, dataset `convenios-saida` | `scripts/coletar-convenios-ambientais-mg.mts` |
| Incentivo ao esporte (previsto) | Bloqueado: token expirado | `etl/betim/.env` (`DADOS_GOV_BR_API_TOKEN`) |

Ou seja: do catálogo federal em si (a API de conjuntos de dados), o portal usa **indiretamente quase nada** — o que funciona hoje são os repositórios de arquivo soltos (dETRU) e os CKANs setoriais/estaduais.

## A armadilha do token

A API pública do catálogo (`dados.gov.br/dados/api/publico/conjuntos-dados`) responde **401 sem Bearer token** — medido de novo em 30/08/2026, e já medido antes (PLANO-2026-08-15, item: "401 nos três"). O token é gerado na conta do usuário do portal, e o nosso está **expirado** (ESTADO.md item 15 — a renovação destrava a frente "incentivo ao esporte" inteira).

Consequência prática: qualquer automação que **busque no catálogo** precisa antes renovar `DADOS_GOV_BR_API_TOKEN`. Os **downloads em massa** dos conjuntos listados abaixo, em geral, não precisam — vivem em repositórios de arquivo ou nas fontes primárias.

## Sugestões por frente

### Cidades (finanças municipais, licitações)

| Conjunto | Órgão | Formato | Encaixe |
|---|---|---|---|
| [CNPJ](https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj) | Receita Federal | CSV mensal em massa | cruzar fornecedores de contratos (`/[municipio]/prefeitura`) por cnpj_raiz — grupos econômicos |
| [Compras públicas federais](https://dados.gov.br/dados/conjuntos-dados/compras-publicas-do-governo-federal) | Min. da Gestão | CSV | comparativo de preços contra atas municipais |
| [Resultado do Tesouro Nacional](https://dados.gov.br/dados/conjuntos-dados/resultado-do-tesouro-nacional) | STN | CSV | contexto macro das páginas de economia |

Nota: para finanças municipais de verdade, **SICONFI/FINBRA** (`siconfi.tesouro.gov.br`, CSV direto) e **PNCP** (API REST própria, já usada) são superiores ao catálogo.

### Congresso

| Conjunto | Órgão | Formato | Encaixe |
|---|---|---|---|
| [Informações legislativas da Câmara](https://dados.gov.br/dados/conjuntos-dados/informacoes-legislativas-da-camara-dos-deputados2) | Câmara | CSV/JSON/XML | redundante com a API Dados Abertos v2 já usada — vale como espelho de contingência |

Nota: a frente já se serve das fontes primárias (APIs da Câmara e do Senado), que são mais frescas que o catálogo.

### Judiciário

| Conjunto | Órgão | Formato | Encaixe |
|---|---|---|---|
| [SIRENEJud](https://www.cnj.jus.br/programas-e-acoes/sirenejud/) | CNJ | Parquet/CSV em massa (S3) | **integrado nesta rodada** — `/ambiental/judiciario`, `/judiciario/sirenejud` e camada no globo |
| DataJud | CNJ | API (consulta ao vivo) | já em uso; licença veda derivados (FONTES.md) |
| [Acervo Judiciário](https://dados.gov.br/dados/conjuntos-dados/acervo-judiciario) | verificar | verificar | candidato para `/judiciario/numeros`; abrangência não confirmada |

### Função Social da Terra

| Conjunto | Órgão | Formato | Encaixe |
|---|---|---|---|
| [Acervo Fundiário (SIGEF+SNCI)](https://dados.gov.br/dados/conjuntos-dados/acervo-fundiario) | INCRA | SHP/CSV/WMS | camadas do globo — ⚠️ **licença NC: vedado uso comercial**, decisão a registrar |
| [Cadastro Ambiental Rural (CAR)](https://dados.gov.br/dados/conjuntos-dados/cadastro-ambiental-rural) | SFB/MMA | SHP por UF | base do vazio cadastral (hoje medido por outra via) |
| [Tabela de Terras Indígenas](https://dados.gov.br/dados/conjuntos-dados/tabela-de-terras-indigenas) | FUNAI | CSV/geo | camada já existe via WFS da FUNAI — o catálogo é fallback |
| [SIGMINE](https://dados.gov.br/dados/conjuntos-dados/sistema-de-informacoes-geograficas-da-mineracao-sigmine) | ANM | WMS/SHP | camada já existe via `dadosabertos.anm.gov.br` — idem |
| [Cadastro Nacional de Florestas Públicas](https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-de-florestas-publicas) | SFB | geo | camada nova de terras públicas no globo |

### Paraopeba / Brumadinho

| Conjunto | Órgão | Formato | Encaixe |
|---|---|---|---|
| [Barragens de mineração (SIGBM)](https://dados.gov.br/dados/conjuntos-dados/barragens-de-mineracao) | ANM | CSV/geo | `/ambiental/barragens` e `/paraopeba` — cruza com FEAM/SNISB já coletados |

Notas: séries hidrológicas do Paraopeba saem melhor do **HidroWeb/ANA** (fonte primária). Dados da reparação (Fundação Renova, entidade privada) **não estão no catálogo** — seguem PDFs e painéis.

### Ambiental

| Conjunto | Órgão | Formato | Encaixe |
|---|---|---|---|
| [PRODES](https://dados.gov.br/dados/conjuntos-dados/prodes) | INPE | SHP anual | camada de desmatamento no globo (hoje há INPE parcial) |
| [Licenças do IBAMA](https://dados.gov.br/dados/conjuntos-dados/licencas-ambientais-de-atividades-e-empreendimentos-licenciados-pelo-ibama) | IBAMA | CSV | complementa `/ambiental/licenciamento` (hoje só estadual) |
| [Termos de embargo](https://dados.gov.br/dados/conjuntos-dados/termos-de-embargo) | IBAMA | CSV | já coletado por outra via (`ibama_embargos`) — catálogo como espelho |
| Julgamentos de autos de infração | IBAMA | CSV | desfecho dos autos já coletados (`ibama_autos_infracao`) |
| Família ICMBio (UCs federais, desmatamento e queimadas em UCs) | ICMBio | CSV/geo | camadas do globo + `/ambiental` |
| [Monitoramento de queimadas](https://dados.gov.br/dados/conjuntos-dados/monitoramento-de-queimadas) | MCTI/INPE | CSV/geo | camada de focos no globo |

Nota: **MapBiomas** não está no catálogo — plataforma própria (mapbiomas.org) com downloads e GEE; é a referência de cobertura do solo e deve entrar como fonte complementar.

## Prioridades recomendadas

Custo × benefício para as frentes atuais:

1. **Barragens SIGBM/ANM** — nacional, CSV simples, completa o trio FEAM/SNISB já coletado e alimenta duas frentes (Ambiental e Paraopeba).
2. **Licenças do IBAMA** — fecha a lacuna "só licenciamento estadual" de `/ambiental/licenciamento`.
3. **Julgamentos de autos do IBAMA** — dá desfecho aos autos já publicados; história completa autuação → julgamento.
4. **Cadastro Nacional de Florestas Públicas/SFB** — camada nova de terras públicas no globo, direto na frente Função Social da Terra.
5. **CNPJ/Receita** — habilita o cruzamento por grupo econômico (depende da pesquisa de `fontes-financeiro`).

Antes de qualquer um: **renovar `DADOS_GOV_BR_API_TOKEN`** (ação pequena, destrava também o incentivo ao esporte).

## Decisões registradas

- **Downloads em massa direto da fonte primária quando ela existe** — o catálogo é índice, não fonte: Câmara, Senado, PNCP, SICONFI, ANM e HidroWeb têm serviços próprios mais frescos.
- **Acervo Fundiário do INCRA tem licença NC** — antes de integrar, registrar decisão sobre o vedado uso comercial (o portal é AGPL e sem fins lucrativos, mas a ressalva precisa viajar no FONTES.md).
- **DataJud fora de qualquer coleta** — reafirmado: cláusulas 3.8/3.9 vedam derivados; o SIRENEJud cobre o recorte ambiental em massa e por isso entrou no lugar.
