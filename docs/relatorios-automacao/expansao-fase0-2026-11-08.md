# Expansao para as 853 cidades de MG - Fase 0

> **Tipo:** RELATORIO
> **Dominio:** cidades
> **Ultima medicao:** 2026-11-08
> **Leitura estimada:** media (10-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md)
> **Palavras-chave:** expansao, municipios, MG, AMM, SIGPub, SAPL, PNCP, build, fase 0

## Sumario

- [Resumo](#resumo)
- [1. Catalogo das 853](#1-catalogo-das-853)
- [2. Matriz de fontes](#2-matriz-de-fontes)
- [3. Piloto real](#3-piloto-real)
- [4. Teto de build](#4-teto-de-build)
- [5. Riscos e bloqueios](#5-riscos-e-bloqueios)
- [6. Ondas propostas](#6-ondas-propostas)
- [7. Comandos e reprodutibilidade](#7-comandos-e-reprodutibilidade)
- [8. Verificacao](#8-verificacao)

## Resumo

Fase 0 entrega catalogo, matriz de fontes, cinco pilotos medidos e teto de build.
Nada foi ativado no portal; `ativo=false` em todas as 853 cidades.

| Entrega | Resultado |
|---|---|
| `apps/web/data/expansao-mg.json` | 853 cidades: 1 capital, 21 polos do catalogo, 831 municipios |
| `apps/web/data/expansao-fontes-mg.json` | matriz por cidade, compactada em 485 KB |
| Diario oficial AMM-MG | 499/853 com alguma entidade; 473 prefeitura, 133 camara, 109 com ambas, 354 sem entidade |
| Camara | 22 hosts confirmados; 831 apenas com SAPL previsto (`sapl.<slug>.mg.leg.br`) |
| PNCP | API por `codigoMunicipioIbge` cobre as 853; manifesto so classifica as 203 do catalogo |
| Piloto | 5 cidades fora do catalogo, outubro/2026: 580 materias, 48,1 s, 4,46 MB, zero erro |
| Build atual | 232,6 s medidos; 690 rotas pre-renderizadas; 12 cidades no `CIDADES_DO_BUILD` |
| Build com 853 no alvo atual | nao cresce por cidade: pagina de cidade e on-demand |
| Build estatico com 853 | 58.004 paginas estimadas; 3,2-6,3 h de build; nao executado |

O gargalo real da expansao nao e o build: e a fonte. O coletor SIGPub do repo
esta defasado e falha contra o site de 08/11/2026. Sem corrigir o coletor,
nenhuma cidade nova coleta diario.

## 1. Catalogo das 853

Arquivo: `apps/web/data/expansao-mg.json` (165 KB, 853 registros).

Fonte: `apps/web/data/municipios-mg.json`, gerado do IBGE por
`scripts/etl/municipios/seed-municipios-mg.mts`.

Campos por cidade: `id_municipio` (7 digitos, string), `nome`, `slug`, `uf`
(`MG`), `regiao` (mesorregiao do IBGE), `tipo`, `ativo` (`false`).

Regras aplicadas:

- `slug`: nome sem acento, minusculo, nao alfanumerico vira hifen;
  `Belo Horizonte` usa `bh`, o mesmo slug ja publicado.
- `tipo`: `capital` para Belo Horizonte (1); `polo-interior` para as 21
  cidades mineiras do catalogo das 203; `municipio` para as 831 restantes.
  "Polo-interior" e designacao de planejamento, nao sinonimia de interior.
- `Paraopeba` colide com a rota estatica `/paraopeba` (o eixo do desastre).
  O slug do municipio virou `paraopeba-mg` para nao ser sombreado pelo Next.
  E a unica colisao entre os 853 slugs e as rotas estaticas de `apps/web/app`.
- `regiao` usa `mesorregiao`; a matriz guarda a mesma regiao para conferencia.

Distribuicao por mesorregiao:

| Mesorregiao | Cidades | Com diario AMM | Com camara AMM |
|---|---:|---:|---:|
| Triangulo Mineiro/Alto Paranaiba | 66 | 46 | 19 |
| Central Mineira | 30 | 23 | 9 |
| Zona da Mata | 142 | 99 | 26 |
| Vale do Rio Doce | 102 | 40 | 5 |
| Oeste de Minas | 44 | 23 | 7 |
| Vale do Mucuri | 23 | 17 | 3 |
| Norte de Minas | 89 | 53 | 12 |
| Sul/Sudoeste de Minas | 146 | 82 | 23 |
| Campo das Vertentes | 36 | 14 | 4 |
| Jequitinhonha | 51 | 30 | 5 |
| Metropolitana de Belo Horizonte | 105 | 56 | 17 |
| Noroeste de Minas | 19 | 16 | 3 |
| **Total** | **853** | **499** | **133** |

## 2. Matriz de fontes

Arquivo: `apps/web/data/expansao-fontes-mg.json` (485 KB, JSON compacto).
E um objeto por `id_municipio`; nome, slug e regiao ficam no catalogo para nao
duplicar dado. Cada entrada tem `diario`, `camara`, `pncp` e `cobertura`.

### 2.1 Diario oficial: AMM-MG / SIGPub

Fonte: `https://www.diariomunicipal.com.br/amm-mg/`.

Prova: o seletor de entidade da busca (`busca_avancada[entidade]`) tinha 751
opcoes em 08/11/2026 (750 entidades reais + "Todos os municipios"). Os nomes
foram normalizados e casados com as 853 do IBGE. 621 entidades foram atribuidas
a 499 cidades. As outras 129 sao consorcios, associacoes, fundos, servicos
autonomos sem nome de municipio ou entidades de outro estado.

| Situacao | Cidades |
|---|---:|
| Alguma entidade AMM | 499 |
| Prefeitura | 473 |
| Camara | 133 |
| Prefeitura e camara | 109 |
| So outra entidade (ex.: SAAE) | 2 |
| Nenhuma entidade | 354 |

Limite: cadastro no dropdown prova adesao, nao uso ativo. O proprio repo ja
registrou esse risco em `docs/historico/descobertas/diario-oficial-sigpub-mapeamento.md`
(Aracuai e Itinga cadastradas, mas com diario proprio). A cobertura real sera
medida cidade a cidade na Onda 1.

### 2.2 Camara

| Origem | Cidades | O que prova |
|---|---:|---|
| `CIDADES_DO_BUILD` + catalogo das 203 | 22 | host e sistema confirmados no repo |
| SAPL previsto | 831 | apenas `https://sapl.<slug>.mg.leg.br/`, nao testado |

`scripts/coletar-199-cidades-completo.py:90-91` so preenche host ausente do
catalogo com `https://www.camara<slug>.<uf>.gov.br`; ele nao descobre SAPL.
O padrao `sapl.<slug>.mg.leg.br` e candidato, nao fonte confirmada. A Onda 2
precisa testar host por host, em lote, antes de ativar cidade.

### 2.3 PNCP

`etl/betim/etl/pncp/client.py:134` consulta por `codigoMunicipioIbge`, entao a
API cobre qualquer um dos 853 municipios. O `manifesto.py` e outra coisa: le
`apps/web/data/cidades-estrategicas.json` (`manifesto.py:26`), que tem 203
linhas, e classifica so elas.

Rodado com `--sem-banco` em 08/11/2026:

| Status no manifesto | Total | MG |
|---|---:|---:|
| `pronta` | 0 | 0 |
| `bloqueada-cnpj` | 172 | 17 |
| `delegada` | 25 | 0 |
| `excluida-principal` | 6 | 5 |

Sem o merge de CNPJ do banco, nenhuma das 203 nasce pronta. As 831 cidades fora
do catalogo nao entram no manifesto; para elas, a consulta por IBGE e o caminho,
mas o coletor de contratos ainda exige CNPJ/orgaos no banco.

## 3. Piloto real

Cinco cidades fora do catalogo das 203, escolhidas por terem prefeitura e
camara cadastradas na AMM. Uma coleta de prefeitura por cidade, mes fechado de
outubro/2026, markup atual do site. Bruto nao foi commitado.

| Cidade | IBGE | Entidade AMM | Registros | Tempo | Bytes | Reqs | Erro |
|---|---|---:|---:|---:|---:|---:|---|
| Abadia dos Dourados | 3100104 | 24197 | 31 | 3,09 s | 302.817 | 2 | - |
| Bocaiuva | 3107307 | 2192382 | 91 | 6,67 s | 699.391 | 4 | - |
| Formiga | 3126109 | 11944 | 343 | 30,56 s | 2.558.112 | 14 | - |
| Boa Esperanca | 3107109 | 833 | 43 | 2,93 s | 350.836 | 2 | - |
| Catas Altas | 3115359 | 566 | 72 | 4,88 s | 543.877 | 3 | - |
| **Total** | | | **580** | **48,13 s** | **4.455.033** | **25** | **0** |

Medias por cidade-mes: 116 materias, 9,63 s, 891 KB, 5 requisicoes. Mediana:
72 materias, 4,88 s, 544 KB, 3 requisicoes. O menor mes teve 31 materias e o
maior, 343 (Formiga).

Projecao para um mes de prefeitura:

| Cobertura | Materias | Tempo | Bytes | Requisicoes |
|---|---:|---:|---:|---:|
| 499 cidades com entidade AMM | 57.884 | 1,3 h | 444 MB | 2.495 |
| 853 cidades, se todas tivessem fonte | 98.948 | 2,3 h | 760 MB | 4.265 |

As camaras das cinco cidades tambem estao localizadas na AMM (IDs 40180,
3981901, 9715, 4077813, 93469), mas nao foram coletadas nesta passada.

### 3.1 Erro exato do coletor do repo

O caminho oficial, `python -m etl.camaras.sigpub --sondar --entidade-usuaria
24197 --desde 2026-10 --ate 2026-10`, falhou em 08/11/2026 com:

```
RuntimeError: token CSRF (busca_avancada[_token]) nao encontrado em
https://www.diariomunicipal.com.br/amm-mg/pesquisar - a pagina pode ter mudado
de forma; revise `_extrair_token`.
```

O site mudou em tres pontos, todos no caminho do coletor:

| Coletor hoje | Site em 08/11/2026 |
|---|---|
| `busca_avancada[_token]` (`sigpub.py:291,393`) | nao existe mais token no form |
| `busca_avancada[entidadeUsuaria]` (`sigpub.py:409`) | `busca_avancada[entidade]` |
| `table#datatable > tbody` (`sigpub.py:313-317`) | `ul.lista-materias > li.materia-card` |
| datas `dd/mm/yyyy` | inputs `type=date`, valor ISO `AAAA-MM-DD` |

O piloto usou um wrapper temporario fora do repo, com o formulario atual e os
parsers antigos apenas para classificacao. A correcao do coletor e pre-requisito
da Onda 1; sem ela, a expansao coleta zero.

Corrigido na Fase 1: [expansao-fase1-2026-11-08.md](expansao-fase1-2026-11-08.md).

## 4. Teto de build

### 4.1 O que foi medido

Build do checkout canonico em 08/11/2026, extraido de `apps/web/.next/trace`:

| Metrica | Valor |
|---|---:|
| Duracao total | 232,6 s |
| `static-generation` | 70,4 s |
| `run-turbopack` | 65,0 s |
| `run-typescript` | 46,9 s |
| Rotas pre-renderizadas | 690 |
| Cidades no `CIDADES_DO_BUILD` | 12 (11 MG + SP) |
| `page.tsx` sob `app/[municipio]` | 68 |
| `route.ts` sob `app/[municipio]` | 12 |
| Subdiretorios sob `app/[municipio]` | 48 |

O numero de cidades do build e **12**, nao 13. E o numero de paginas por cidade
e **68**, nao 48: 48 e a contagem de subdiretorios; cada diretorio pode ter mais
de uma `page.tsx`.

### 4.2 Alvo atual: a cidade nao entra no build

No alvo de producao (Azure/standalone, e tambem Cloudflare),
`generateStaticParams` devolve lista vazia quando nao e `output: export`
(`apps/web/lib/betim/staticParams.ts:70`). A zona `[municipio]` renderiza sob
demanda com cache. O `prerender-manifest.json` confirma: existe a rota dinamica
`/[municipio]`, nao existe `/betim` pre-renderizado.

Consequencia: **adicionar 841 cidades ao banco nao multiplica o build atual por
68**. O build continua na ordem de 233 s. O que cresce:

- o sitemap, que enumera todas as cidades × sufixos
  (`apps/web/app/sitemap.ts:542-544`) — dezenas de milhares de URLs;
- a primeira visita a cada pagina de cidade, que le o Postgres;
- o volume do banco e o tempo de coleta, nao o tempo de compilacao.

O `TETO_PAGINAS_ESTATICAS = 1500` (`apps/web/lib/alvo-de-build.ts:42`) nao
protege a zona Cidades: ele e usado nas rotas do Congresso.

### 4.3 Cenario `output: export` (GitHub Pages)

Se a expansao for para HTML estatico, cada cidade gera 68 paginas:

```
853 cidades x 68 rotas = 58.004 paginas
```

O numero de 40.944 (48 × 853) subestima em 42%. Extrapolacao com duas medicoes
do proprio repo:

| Base | Paginas | Tempo | Por pagina |
|---|---:|---:|---:|
| Build saudavel de 01/10/2026 | 5.427 | 1.074 s | 198 ms |
| Teto com Postgres lento em 01/10/2026 | 5.427 | 2.100 s | 387 ms |

Para 58.004 paginas: **3,2 h a 6,3 h** de build, sem contar o custo de banco e
o risco do limite de 1 GB do GitHub Pages. As rotas de detalhe
(`noticias/[slug]`, `vereadores/[slug]`) adicionam paginas por registro, entao
58.004 e piso, nao teto. Nao rodar esse build agora.

## 5. Riscos e bloqueios

1. **Coletor SIGPub defasado (bloqueia a Onda 1).** Token, nome do parametro e
   markup mudaram. Erro exato na secao 3.1. Sem correcao, zero coleta.
2. **Cobertura AMM de 58,5%.** 354 cidades sem entidade no diario estadual.
   Precisam de diario proprio ou ficam sem fonte; cadastro nao prova uso.
3. **Camara: 831 hosts nao testados.** `sapl.<slug>.mg.leg.br` e candidato.
   Ativar cidade com host nao verificado repete o 404 medido em 03/09.
4. **PNCP: 17 cidades MG do catalogo bloqueadas por CNPJ.** As 831 fora do
   catalogo nao estao no manifesto; o coletor de contratos exige CNPJ/orgaos.
5. **Sitemap e runtime.** 853 cidades × sufixos = dezenas de milhares de URLs
   no sitemap `force-static`; primeira visita de cada pagina le o banco. Medir
   antes de ativar em massa.
6. **Colisao de slug.** `Paraopeba` sombrearia `/paraopeba`; ja resolvido com
   `paraopeba-mg`. Qualquer cidade futura precisa passar pela mesma checagem.
7. **LGPD/CPF no diario.** A coleta de diario traz atos com nome e CPF. A
   varredura de CPF por mod-11 e as listas de sinteticos precisam rodar antes de
   qualquer commit de dado bruto (regras 5.2 e 5.8).

## 6. Ondas propostas

| Onda | Escopo | Gate de saida |
|---|---|---|
| 0 | Catalogo, matriz, 5 pilotos, teto de build | este relatorio |
| 1 | Corrigir SIGPub; coletar 1 mes das 109 cidades com prefeitura+camara; medir | 0 erro de parser; volume e bytes por cidade |
| 2 | Testar SAPL/camara em lote; resolver 354 cidades sem AMM | fonte verde por cidade |
| 3 | Ativar 5-10 cidades no `CIDADES_DO_BUILD`; medir build, sitemap e runtime | build estavel; sem 404 |
| 4 | Resto de MG por mesorregiao; depois Centro-Oeste, Norte, Sul, Nordeste, Sudeste | mesma receita, uma regiao por vez |

Regra: cidade so entra no build depois de fonte verde e pagina medida. Nao
ativar as 853 de uma vez.

## 7. Comandos e reprodutibilidade

Catalogo e matriz foram gerados por script temporario fora do repo, a partir de
`apps/web/data/municipios-mg.json`, do dropdown da AMM e do CSV do manifesto.
As regras estao na secao 1 e 2. Para reproduzir a classificacao PNCP:

```powershell
cd etl/betim
python -m etl.pncp.manifesto --sem-banco --saida <fora-do-repo>/manifesto-pncp.csv
```

Piloto (wrapper temporario; o comando oficial ainda falha no token):

```powershell
cd etl/betim
python -m etl.camaras.sigpub --sondar --entidade-usuaria 24197 --desde 2026-10 --ate 2026-10
```

IDs usados no piloto: Abadia dos Dourados 24197; Bocaiuva 2192382; Formiga
11944; Boa Esperanca 833; Catas Altas 566.

Conferir a matriz:

```powershell
node -e "const f=require('./apps/web/data/expansao-fontes-mg.json'); console.log(Object.keys(f.por_cidade).length, f.resumo)"
```

## 8. Verificacao

- `node` leu os dois JSONs; 853 ids e 853 slugs unicos; `ativo=false` em todos.
- As chaves de `por_cidade` batem com os 853 `id_municipio` do catalogo.
- Nenhuma colisao de slug com as rotas estaticas apos `paraopeba-mg`.
- 621 entidades AMM atribuidas; 129 restantes sao consorcios/associacoes/etc.
- `python scripts/validar-documentacao.py` isenta `docs/relatorios-automacao`;
  falhas remanescentes, se houver, sao de docs de outros agentes.
- Nao foi rodado `npm test` nem build: a mudanca e dado JSON + documento, sem
  codigo TypeScript. O build medido e o do checkout canonico, nao um rebuild
  deste worktree.
