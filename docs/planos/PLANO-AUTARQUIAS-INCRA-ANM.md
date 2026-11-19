# Plano — autarquias federais: INCRA e ANM (atos, relatórios, documentos, produtos e atividades)

> **Tipo:** PLANO
> **Domínio:** federal (autarquias) — INCRA e ANM na primeira onda
> **Última medição:** 2026-11-16 (banco) e 2026-11-11 (fontes)
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [FONTES.md](../06-fontes/FONTES.md), [COLETA-ETICA.md](../06-fontes/COLETA-ETICA.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [ESTADO.md](../02-estado/ESTADO.md), [PRODUTO.md](../01-produto/PRODUTO.md)
> **Palavras-chave:** incra, anm, autarquias, etl, atos, portarias, relatorios, documentos, produtos, atividades, assentamentos, mineracao, cfem, scm, sigbm, sigmine, tah, sople, protocolo-digital, anmlegis, dou, dados-abertos, cobertura-por-uf

## Sumário

- [Propósito](#propósito)
- [O que conta como atividade, produto, relatório, documento e portaria](#o-que-conta-como-atividade-produto-relatório-documento-e-portaria)
- [O que já existe no repositório](#o-que-já-existe-no-repositório)
- [Medição de 11/11/2026 — o que responde e o que não responde](#medição-de-11112026--o-que-responde-e-o-que-não-responde)
- [Arquitetura alvo](#arquitetura-alvo)
- [Contrato de dados](#contrato-de-dados)
- [Fichas de fonte — ANM](#fichas-de-fonte--anm)
- [Fichas de fonte — INCRA](#fichas-de-fonte--incra)
- [Análise posterior — indicadores e cruzamentos](#análise-posterior--indicadores-e-cruzamentos)
- [Publicação no portal](#publicação-no-portal)
- [Fases de execução](#fases-de-execução)
- [Verificação e portões](#verificação-e-portões)
- [Riscos e armadilhas medidas](#riscos-e-armadilhas-medidas)
- [Navegador automatizado — quando ajuda e quando é burla](#navegador-automatizado--quando-ajuda-e-quando-é-burla)
- [Expansão para todas as autarquias federais](#expansão-para-todas-as-autarquias-federais)
- [Decisões do dono](#decisões-do-dono)
- [Origem / Histórico](#origem--histórico)

## Propósito

Planejar o mapeamento e o ETL das **atividades, produtos, relatórios, documentos e
portarias** do **INCRA** e da **ANM** em **todos os estados**, com análise
posterior conforme as oito qualidades da informação do portal.

A escolha das duas primeiras autarquias não é arbitrária:

- **ANM** já tem 60% do caminho andado aqui: SIGMINE nacional, SIGBM e CFEM
  municipal estão no ar. O que falta é o **resto** — títulos minerários por
  estado, arrecadação nacional, protocolo digital, atos normativos e relatórios
  de gestão.
- **INCRA** é o oposto: o dado territorial (quilombolas) está no ar, mas os
  sistemas centrais (**painel**, **Acervo Fundiário**, **SIGEF**, **SNCR**)
  não responderam nesta medição. É a fonte mais difícil e a de maior valor
  social.

O desenho nasce **genérico**: um núcleo de ETL e um registro de fontes que
servem para qualquer autarquia federal. A segunda onda (IBAMA, ICMBio, FUNAI,
ANA, DNIT, ANTT, ANAC, ANEEL, ANS, IBGE, INSS…) não deve reescrever nada.

**Custo do plano: zero.** Todas as fontes medidas são públicas, sem chave e
sem cobrança por requisição. O gasto é banda e disco.

⚠️ Este documento **não autoriza coleta em produção**. Aprova o desenho.
A execução começa pela Fase 0 — medir, provar e catalogar.

## O que conta como atividade, produto, relatório, documento e portaria

Os cinco nomes do pedido não são cinco tabelas. São **classes de registro**
que se repetem em qualquer autarquia. Fixar isso agora evita cinco ETLs
diferentes para a mesma coisa.

| Classe | O que é | Exemplo ANM | Exemplo INCRA |
|---|---|---|---|
| **ato** | norma que cria regra: portaria, resolução, instrução normativa | Resolução ANM nº 155/2024 (ANMlegis); Portarias no DOU | Instrução Normativa do INCRA; Portaria de criação de assentamento |
| **documento** | peça publicada que não é norma: manual, guia, edital, anexo | manuais da agenda regulatória; anexos do Protocolo Digital | PDA do INCRA (2021); publicações e cartilhas |
| **relatorio** | prestação de contas e resultado: gestão, auditoria, ouvidoria, anual de atividades | Relatório de Gestão; relatórios da CGU; auditorias 2017–2019 | Relatório de Gestão; prestação de contas anual |
| **produto** | entrega finalística, mensurável | título minerário (Portaria de Lavra, Alvará, Licenciamento); área ofertada (SOPLE); barragem cadastrada (SIGBM) | assentamento criado; família assentada; título de domínio; RTID quilombola |
| **atividade** | ação-meio ou de fiscalização que gera registro | autuação CFEM; dívida ativa; compra (SICOP); investimento em pesquisa (DIPEM) | vistoria; seleção de famílias; contrato (PNCP) |
| **processo** | o invólucro administrativo que liga tudo | Protocolo Digital (PD); processo minerário (SCM) | processo eletrônico (SEI); processo de obtenção de terra |

Toda linha publicada carrega **uma classe** e **uma chave natural**
(`processo`, `número do ato`, `código do título`). Sem chave natural, o dado
não entra: vira texto solto e não sobrevive à segunda coleta.

**A dimensão "todos os estados"** se resolve de duas formas, e a ficha de
cada fonte diz qual:

1. **UF explícita** na fonte (coluna `UF`, `Municipio(s)` + UF).
2. **UF derivada** por código IBGE do município (`CodigoMunicipio`) — o
   caminho preferido, porque nome de município erra (o caso Brazópolis ×
   Brasópolis já custou 9 licenças).
3. **UF por geometria** só quando não há município (SIGMINE não traz
   município; o DBF já registra essa lacuna).

## O que já existe no repositório

Medido no checkout em 11/11/2026. Nada aqui é para refazer.

| Peça | Onde | Estado |
|---|---|---|
| SIGMINE nacional, 27 UFs | `apps/web/data/sigmine-nacional.json` (9,3 MB) | ✅ 274.659 processos, `gerado_em` 16/09/2026, `truncado=true` |
| Barragens SIGBM/ANM | `apps/web/data/barragens-sigbm.json` (94 KB) + `etl/betim/etl/apis/sigbm_anm.py` | ✅ 909 barragens no Brasil, 320 em MG |
| CFEM por município (MG) | `etl/betim/etl/apis/anm_cfem.py` → tabela `royalties_cfem` | ✅ com a ressalva "não somar entre municípios" gravada no schema |
| Quilombolas INCRA (WFS) | camadas do globo + `[municipio]/terras/cruzamentos` | ✅ 22 feições em MG, GML, eixo lat,lon |
| Atos federais no DOU | `scripts/coletar-dou.py` | 🚧 decisão de escopo registrada no cabeçalho do coletor |
| Catálogo de fonte com teste | `apps/web/lib/fontes/registry.ts` + `registry.test.ts` | ✅ recusa caminho de arquivo inexistente |
| Frescor das fontes | `scripts/vigia-coletores.mts` | ✅ 34 fontes monitoradas |
| Varredura de CPF no dado | `scripts/checar-dado-pessoal-em-dado.py`, `lib/sem-cpf-no-repo.test.ts` | ✅ mod-11 |
| Data do dado visível | `scripts/checar-data-coleta.py` | ✅ porteiro D1 |

**Consequência direta:** o ETL novo **reaproveita** `sigmine-nacional.json`,
`sigbm_anm.py` e `anm_cfem.py`. Não se cria um segundo caminho para o mesmo
dado — dois caminhos divergem e ninguém sabe qual está certo.

## Medição de 11/11/2026 — o que responde e o que não responde

Todas as requisições usaram **User-Agent honesto** `finweejur/github artur colito`,
**1,5 s entre requisições no mesmo host** e **leitura prévia do `robots.txt`**,
conforme [COLETA-ETICA.md](../06-fontes/COLETA-ETICA.md). Nada de login, CAPTCHA
ou contorno de bloqueio.

| Fonte | Resultado medido | Leitura |
|---|---|---|
| `www.gov.br/robots.txt` | 200, libera o conteúdo, publica sitemap | ✅ portal do INCRA e da ANM é acessível |
| `dadosabertos.anm.gov.br` | 200 — **é servidor de arquivos**, sem API e sem chave | ✅ 14 pastas, arquivos com carimbo do mesmo dia |
| `dadosabertos.anm.gov.br/robots.txt` | 404 | ✅ não há restrição declarada |
| `www.gov.br/anm/.../dados-abertos` | 200 — lista bases, ANMlegis, DIPAR, SIAF | ✅ |
| `www.gov.br/anm/.../institucional/atos-normativos` | 200 — é **embed do ANMlegis** | ✅ atos vivem no ANMlegis |
| `anmlegis.datalegis.net/robots.txt` | 200 — bloqueia **GPTBot, Google-Extended, CCBot, DataForSeoBot**; libera o resto; publica sitemap | ⚠️ nosso UA não é crawler de treino; manter ritmo baixo |
| `sei.anm.gov.br/robots.txt` | 200 — `User-agent: *` / `Disallow:` (vazio) | ✅ publicações do SEI liberadas |
| `ral.anm.gov.br` | **503** (robots e home) | ⛔ RAL indisponível na medição |
| `geo.anm.gov.br` | 200 (portal ArcGIS), robots 404 | ✅ |
| `sople.anm.gov.br/portalpublico` | 200 | ✅ |
| `sistemas.anm.gov.br/arrecadacao/...` | **403** ao UA honesto | ⚠️ WebForms fecha para bot; o CSV em massa substitui |
| `www.gov.br/anm/.../acoes-e-programas/relatorio-gestao` | **404** (link quebrado no próprio site) | ⚠️ relatório de gestão está em outra rota — achar na Fase 0 |
| `dados.gov.br` (API e robots) | **401** ao UA honesto | ⛔ exige chave por conjunto |
| `www.gov.br/incra/pt-br/...` (acesso, dados, legislação, publicações, transparência, painel, sistemas) | 200 em todas | ✅ páginas vivas |
| `www.gov.br/incra/.../composicao/superintendencias-regionais` | 200, mas o corpo é **"Em breve — Texto apresentação"** | ⛔ a página das SRs está vazia |
| `painel.incra.gov.br` | **DNS não resolveu** | ⛔ medir de outra rede antes de declarar morte |
| `acervofundiario.incra.gov.br` | **DNS não resolveu** | ⛔ idem |
| `sigef.incra.gov.br` | **timeout** | ⛔ idem |
| `sncr.serpro.gov.br` | **403** | ⛔ fechado para bot |
| `www.in.gov.br/robots.txt` | **`Disallow: /`** | ⛔ DOU só sob a exceção já registrada no coletor |
| `www.in.gov.br/consulta/-/buscar/dou` | 200 | 🚧 funciona, mas é a rota sob `Disallow` |

### Leitura honesta da medição

1. **A ANM entrega dado estruturado em arquivo. Não precisa de scraping.**
   É a fonte mais fácil do plano inteiro.
2. **O INCRA não entrega.** Nesta rede, os três sistemas que importam não
   responderam e a página das superintendências está vazia. Onde há dado, é
   Power BI embutido ou PDF.
3. **DOU não é caminho livre.** O `robots.txt` proíbe tudo. O coletor atual já
   registra a decisão do dono, com escopo reduzido, pausa de 2 s, UA honesto e
   fora da CI. Este plano **não amplia** esse escopo sem nova decisão.
4. **`dados.gov.br` exige chave.** Não é bloqueio: é cadastro humano.
   Fica fora da Fase 0.

## Arquitetura alvo

Um núcleo só, uma pasta por órgão, e a fonte declarada em um lugar.

```
etl/autarquias/
  nucleo/
    http.py          UA honesto, leitura de robots.txt, 1,5 s/host, retry, checkpoint
    normalizar.py    datas ISO, UF/município IBGE, CNPJ, remoção de CPF, hash
    escrever.py      JSON compacto + geradoEm + ficha de proveniência
  registro.py        órgão → fonte → cadência → licença → camada → rota
  anm/
    scm.py           títulos e requerimentos (CSV por tipo)
    cfem.py          arrecadação, distribuição, autuação (agregado + linhas)
    tah.py           taxa anual por hectare (junção por processo)
    sigbm.py         reaproveita etl/betim/etl/apis/sigbm_anm.py
    sigmine.py       reaproveita o coletor nacional existente
    amb.py           produção mineral declarada
    dipem.py         investimento em pesquisa por município
    sople.py         estoque e rodadas de áreas
    pd.py            Protocolo Digital (índice; anexos fora do repo)
    participa.py     contribuições e propostas normativas
    anmlegis.py      atos normativos com URL canônica
    relatorios.py    gestão, CGU, auditorias, ouvidoria (PDF: link + hash)
  incra/
    paginas.py       dados abertos, transparência, publicações, legislação
    relatorios.py    relatório de gestão / prestação de contas
    painel.py        painéis públicos (Power BI) — só se houver export
    lai.py           protocolo dos pedidos (não coleta; registra prazo)
```

### Camadas de dado (as mesmas do `registry.ts`)

| Camada | O que vai | Regra prática |
|---|---|---|
| `data-json` | agregados por UF, por ano, por município; listas curtas | < 2 MB por arquivo |
| `public-assets` | GeoJSON/gzip, recortes grandes | 500 KB–10 MB, com exclusão do bundle do Worker |
| `banco` | linhas individuais (título, lançamento CFEM, protocolo) | paginação no servidor (§5.1) |
| `etl` | intermediário bruto→limpo, fora do bundle | gitignorado |
| `ao-vivo` | nada neste plano | consulta não se coleta |

### Regra de ouro do volume

O bruto **não entra no Git**. Só entra o derivado pequeno e o agregado.
Medido: os arquivos grandes da ANM somam ~1,4 GB. O repositório não é
depósito de CSV.

### Banco — medido em 16/11/2026

Medição por conexão de leitura ao Postgres do app `controle-popular`
(`DATABASE_URL` de `apps/web/.env.local`; a credencial não foi impressa nem
copiada para nenhum arquivo):

| Medida | Valor |
|---|---|
| Banco inteiro | **537 MB** (562.611.487 bytes) |
| Teto do plano `essential-0` | **1 GB** — 4.000 tabelas, 20 conexões |
| Livre | **~487 MB** |
| Tabelas de usuário | 134 |
| Versão | PostgreSQL 18.4 |

As cinco maiores tabelas já ocupam 337 MB: `licitacoes` (183 MB),
`servidores` (58 MB), `cap_autos_infracao` (37 MB), `contratos` (33 MB) e
`presencas_plenario` (24 MB).

O que cabe nos 487 MB livres:

| Carga | Estimativa no banco | Cabe? |
|---|---|---|
| SCM (311.646 linhas, 72 MB de CSV) | ~150–250 MB com índices | ✅ sim |
| CFEM autuação (21.030 linhas, 3 MB) | < 20 MB | ✅ sim |
| PD/Protocolo (952.955 linhas) | ~300–400 MB | ⚠️ não junto com o SCM |
| CFEM arrecadação + distribuição cheias (560 MB de CSV) | ~1,2–1,6 GB | ⛔ não |

**Conclusão medida:** a primeira rodada cabe. SCM + CFEM autuação somam
~270 MB e levam o banco a ~810 MB de 1 GB (79%). CFEM cheia e PD entram só
como agregado, ou depois de subir de plano.

⚠️ O preço do `essential-1` (10 GB) **não foi verificado**: a chave
`HEROKU_API_KEY` do `.env.local` foi recusada pela API da Heroku em
16/11/2026 e a página de preço é renderizada por JavaScript. Custo só se
confirma no painel.

## Contrato de dados

Três formatos, e nada além disso.

### 1. Registro (uma linha de acervo)

```ts
type ClasseRegistro = "ato" | "documento" | "relatorio" | "produto" | "atividade" | "processo";

interface RegistroAutarquia {
  id: string;                       // sha1(orgao|classe|fonte|chaveNatural)
  orgao: "INCRA" | "ANM";
  unidade: string | null;           // SR do INCRA / superintendência da ANM
  classe: ClasseRegistro;
  tipo: string;                     // "Portaria de Lavra", "Relatório de Gestão"
  numero: string | null;
  ano: number | null;
  data: string | null;              // ISO 8601, só quando a fonte traz
  titulo: string;
  uf: string | null;                // UF quando a fonte permite
  municipioIbge: string | null;     // código de 7 dígitos, nunca nome solto
  titular: {
    tipo: "PF" | "PJ" | null;
    nome: string | null;
    cnpj: string | null;            // 14 dígitos; CPF nunca
  };
  chaves: { processo?: string; titulo?: string; protocolo?: string };
  valores: Array<{ chave: string; valor: number; unidade: "BRL" | "t" | "ha" | "un" }>;
  fonte: {
    nome: string;
    urlOficial: string;
    urlRegistro: string;            // link direto do registro (qualidade 1)
    licenca: string;
    coletadoEm: string;             // ISO, nascido na escrita bem-sucedida
    hash: string;                   // sha256 do arquivo de origem
  };
}
```

### 2. Agregado (o que a página lê)

```json
{
  "geradoEm": "2026-11-11T14:22:00Z",
  "fonte": "https://dadosabertos.anm.gov.br/SCM/",
  "recorte": "uf=MG;ano=2026",
  "total": 12345,
  "resumo": { "porFase": {}, "porSubstancia": {} },
  "ressalva": "texto que impede a leitura errada",
  "cobertura": { "ufsComDado": 27, "ufsSemDado": 0 }
}
```

### 3. Ficha de proveniência

Um JSON por fonte, com `url`, `licenca`, `cadencia`, `hash`, `coletadoEm`,
`linhas`, `colunas`, `armadilhas` medidas. É o que o `vigia-coletores`
consome e o que a página mostra no rodapé.

### Normalização — as cinco decisões que não se tomam no meio do caminho

1. **CPF nunca.** O campo `CPF/CNPJ do titular` (SCM), `CPF_CNPJ` (CFEM e
   TAH) e `NRCpfCnpj` (TAH) trazem os dois. Guarda-se **CNPJ de 14 dígitos** e
   o indicador `titular.tipo`; CPF é descartado **antes** de gravar, e o
   arquivo passa pelo mod-11 mesmo assim (§5.2).
2. **Município por código IBGE.** Nome só entra como apelido auditável.
3. **Data só quando existe.** `ANO` não vira data; `ULT_EVENTO` é texto livre
   (já documentado no `sigmine-nacional.json`).
4. **Nunca somar o que a fonte não soma.** CFEM entre municípios; fases
   minerárias como se fossem minas.
5. **Toda linha tem `urlRegistro`.** Se a fonte não oferece link por registro,
   a linha sai com `urlRegistro` = URL da base e `ressalva` explícita — nunca
   um link genérico fingindo ser específico.

## Fichas de fonte — ANM

Tudo abaixo foi medido em 11/11/2026 em `dadosabertos.anm.gov.br`. O volume é
o tamanho real do arquivo; a contagem é real, exceto onde diz `aprox.`
(extrapolada de amostra de 8 MB).

### Pastas do servidor de dados abertos

| Pasta | Arquivo | Tamanho | Linhas | O que é | Ação |
|---|---|---|---|---|---|
| SCM | `Portaria_de_Lavra.csv` | 3,6 MB | 15.591 | títulos de lavra publicados | **produto** → banco |
| SCM | `Alvara_de_Pesquisa.csv` | 26,3 MB | 112.710 | alvarás | **produto** → banco |
| SCM | `Cessoes_de_Direitos.csv` | 13,7 MB | 55.535 | cessões | **produto** → banco |
| SCM | `Guia_de_Utilizacao_Autorizada.csv` | 1,9 MB | 12.323 | guias | **produto** → banco |
| SCM | `Licenciamento.csv` | 4,6 MB | 21.677 | licenciamentos | **produto** → banco |
| SCM | `PLG.csv` | 724 KB | 3.253 | permissão de lavra garimpeira | **produto** → banco |
| SCM | `Registro_de_Extracao_Publicado.csv` | 846 KB | 4.016 | registro de extração | **produto** → banco |
| SCM | `Relatorio_de_Pesquisa_Aprovado.csv` | 3,7 MB | 15.970 | relatório aprovado | **relatorio** → banco |
| SCM | `Requerimento_de_Lavra.csv` | 5,0 MB | 21.390 | pedido | **processo** → banco |
| SCM | `Requerimento_de_Licenciamento.csv` | 2,1 MB | 9.073 | pedido | **processo** → banco |
| SCM | `Requerimento_de_Pesquisa.csv` | 4,4 MB | 18.420 | pedido | **processo** → banco |
| SCM | `Requerimento_de_PLG.csv` | 4,6 MB | 19.306 | pedido | **processo** → banco |
| SCM | `Requerimento_de_Registro_de_Extracao_Protocolizado.csv` | 548 KB | 2.382 | pedido | **processo** → banco |
| SCM | `microdados/microdados-scm.zip` | 181,5 MB | — | microdados completos | ⛔ não baixar na 1ª rodada |
| CFEM | `CFEM_Arrecadacao.csv` | 263,1 MB | ~2.049.201 aprox. | arrecadação por guia | **atividade** → agregado + banco |
| CFEM | `CFEM_Distribuicao.csv` | 296,7 MB | ~2.236.096 aprox. | distribuição aos entes | **atividade** → agregado + banco |
| CFEM | `CFEM_Autuacao.csv` | 3,0 MB | 21.030 | autuações | **atividade** → banco |
| CFEM | recortes 2002–2026 | 25,8–84,1 MB | — | arrecadação por janela | mesma trilha do arquivo cheio |
| TAH | `Tah.csv` | 97,1 MB | ~602.192 aprox. | taxa anual por hectare | **atividade** → agregado |
| SOPLE | `EstoqueAreas.csv` | 21,9 MB | 150.506 | áreas ofertadas | **produto** → agregado + banco |
| SOPLE | `ResultadoRodadaDisponibilidade.csv` | 3,7 MB | — | resultado das rodadas | **produto** |
| SOPLE | `ResultadoAvaliacaoSocial.csv` | 61 KB | — | avaliação social | **produto** |
| SOPLE | `InteressadoParticipante.csv` | 1,3 MB | — | participantes | ⚠️ varredura de dado pessoal |
| AMB | `Producao_Bruta.csv` | 992 KB | 6.308 | produção declarada (ROM) | **produto** → agregado |
| AMB | `Producao_Beneficiada.csv` | 679 KB | 3.983 | produção beneficiada | **produto** → agregado |
| AMB | `Agua_Mineral_Producao.csv` | 72 KB | 433 | água mineral | **produto** |
| DIPEM | `InvestimentoPesquisaMineralMunicipio.csv` | 9,3 MB | 112.475 | investimento em pesquisa | **atividade** → agregado |
| DIPEM | `InvestimentoPesquisaMineralUf.csv` | 1,3 MB | 14.192 | idem por UF | **atividade** |
| PD | `Protocolo.txt` | 166,9 MB | ~952.955 aprox. | protocolos do SEI | **processo** → índice |
| PD | `ProtocoloAnexoSei.txt` | 166,3 MB | — | anexos por protocolo | ⛔ índice só; anexo fora do repo |
| PD | `Assunto*.txt` | 74–155 KB | — | tabelas de assunto | **documento** (domínio) |
| REPEM | `PlanoPesquisaRepem.csv` | 140,7 MB | ~1.142.234 aprox. | planos de pesquisa | **relatorio** → agregado |
| REPEM | `RequerimentoPesquisaMineral.csv` | 8,3 MB | — | requerimentos | **processo** |
| SICOP | `Sicop.csv` | 211,1 MB | ~1.603.344 aprox. | compras públicas | **atividade** → agregado |
| SDA | `Procuradoria_DividaAtiva.csv` | 12,0 MB | 76.695 | dívida ativa | **atividade** → banco |
| PARTICIPA-ANM | `Contribuicao.csv` | 5,1 MB | 1.991 | contribuições em consulta | **documento** |
| PARTICIPA-ANM | `PropostaNorma.csv` | 526 KB | — | propostas normativas | **documento** |
| SIGBM | `Barragens.csv` | 3,4 MB | 909 | barragens de mineração | ✅ já existe coletor |
| SIGMINE | `PROCESSOS_MINERARIOS/*.zip` | 27 UFs + BRASIL (127,5 MB) | 274.659 (nacional) | processos minerários | ✅ já existe coletor |

### Colunas reais medidas (não inferidas)

| Arquivo | Cabeçalho |
|---|---|
| `SCM/*.csv` | `Superintendência; Processo; Tipo de requerimento; Fase Atual; CPF/CNPJ do titular; Titular; Municipio(s); Substância(s); Tipo(s) de Uso; Situação` |
| `CFEM_Autuacao.csv` | `ProcessoCobrança; AnoPublicação; MêsPublicação; Tipo_PF_PJ; CPF_CNPJ; NomeTitular; NúmeroAuto; ProcessoMinerário; Substância; Município; UF; Valor` |
| `AMB/Producao_Bruta.csv` | `Ano base; UF; Classe Substância; Substância Mineral; Quantidade Produção - Minério ROM (t); …` |
| `TAH/Tah.csv` | `NRProcesso; NRAnoProcesso; NRCpfCnpj; NMPessoa; DSFaseProcesso; NMSuperintendencia; NRHectares; DTQuitacao; VLPago; VLTotal` |
| `PD/Protocolo.txt` | `IdentificadorProtocolo; DataProtocolo; Processo; IdentificadorAssunto; Assunto; UnidadeProtocolizadora; TipoProcesso; TipoProtocolo; Interessado; …` |
| `DIPEM/...Municipio.csv` | `CodigoMunicipio; Municipio; UF; Substancia; Ano; ValorAnaliseFisica; …` |
| `SAD/AvaliacaoDesempenhoIndividual.csv` | `Ciclo; DataInicioPeriodoAvaliacao; DataFimPeriodoAvaliacao; Cargo; NivelCargo; NotaFinal` |
| `SIGBM/Barragens.csv` | 124 colunas (já documentado no coletor) |

### Três armadilhas que mudam o desenho

1. **`TAH` não tem UF nem município.** O corte por estado exige **junção por
   `NRProcesso` com o `SCM`**. Sem isso, TAH é um número nacional cego.
2. **`SCM` tem `Municipio(s)` no plural.** Uma linha pode ter mais de um
   município. Ou se explode em N linhas (com contador), ou se marca
   `multimunicipal=true`. Somar linhas como se fossem um município só
   infla qualquer total.
3. **`PD/Protocolo` tem `Interessado` e `UsuarioProtocolizacao`.** É nome de
   pessoa e de servidor. Entra só o necessário para o índice; a varredura de
   CPF roda antes do commit (§5.2).

### O que a ANM tem além do CSV

| Peça | Rota medida | Estado | Papel |
|---|---|---|---|
| ANMlegis | `anmlegis.datalegis.net` | 200; robots libera (exceto robôs de treino de IA) | **fonte canônica de atos**, com URL pública por ato |
| SEI/ANM | `sei.anm.gov.br/sei/publicacoes/...` | 200; robots libera | publicações oficiais e processos |
| DIPAR | `sistemas.anm.gov.br/dipar/` | link publicado | declaração de investimento |
| SIAF/SOPHIA | `sistemas.anm.gov.br/sophia/` | link publicado | arrecadação |
| Painéis Power BI | `app.powerbi.com/view?r=…` (2 IDs) | embutidos | 8ª qualidade: sem export, não há coleta |
| Auditorias | `.../auditorias/relatorios-da-auditoria` | 200; 2017, 2018, 2019 | **relatorio** (PDF + hash) |
| Relatório de gestão | link do site devolve **404** | ⚠️ achar rota real na Fase 0 | **relatorio** |
| RAL | `ral.anm.gov.br` | **503** | ⛔ reavaliar; produção declarada já vem pelo AMB |

## Fichas de fonte — INCRA

O INCRA é o inverso da ANM: **página viva, dado morto**. O plano trata isso
como **lacuna declarada**, não como falha de coletor.

| Fonte | Rota medida | Estado | O que dá | Ação |
|---|---|---|---|---|
| Portal e acesso à informação | `www.gov.br/incra/pt-br/...` | ✅ 200 | notícias, estrutura, PDA 2021 | **documento** |
| Dados abertos | `.../acesso-a-informacao/dados-abertos` | ✅ 200, mas só o PDA de 2021 | plano, não base | **documento** |
| Legislação | `.../centrais-de-conteudos/legislacao` | ✅ 200, mas é **busca por tag** no gov.br | não há URL canônica por ato | ⚠️ qualidade 1 não fecha |
| Publicações | `.../centrais-de-conteudos/publicacoes` | ✅ 200 | cartilhas, relatórios | **documento** |
| Transparência | `.../transparencia-e-prestacao-de-contas` | ✅ 200 | prestação de contas | **relatorio** |
| Painel | `www.gov.br/incra/pt-br/painel` | ✅ 200; Power BI embutido | políticas do Incra | ⚠️ sem export, sem coleta |
| Sistemas | `.../assuntos/sistemas` | ✅ 200, lista de links | ponte para SIPRA/SNCR/SIGEF | **documento** |
| Superintendências Regionais | `.../composicao/superintendencias-regionais` | ⛔ corpo "Em breve" | deveria ser a dimensão estadual | **lacuna** |
| Painel legado | `painel.incra.gov.br` | ⛔ DNS não resolveu | — | LAI |
| Acervo Fundiário | `acervofundiario.incra.gov.br` | ⛔ DNS não resolveu | certificação, assentamentos | LAI |
| SIGEF | `sigef.incra.gov.br` | ⛔ timeout | parcelas certificadas | LAI |
| SNCR | `sncr.serpro.gov.br` | ⛔ 403 | cadastro rural | LAI |
| Quilombolas (WFS) | camadas do globo | ✅ já usado | territórios | manter |

### Como o INCRA entra sem depender do que não responde

1. **O que já existe**: quilombolas (WFS) e o que o DOU já trouxe (atos).
2. **O que a página entrega**: publicações, PDA, prestação de contas,
   notícias datadas — volume pequeno e linkável.
3. **O que só vem por LAI**: assentamentos por UF, famílias, titulações,
   acervo fundiário, SIGEF. São **dois pedidos**, não dez: um territorial
   (assentamentos + titulações por UF) e um fundiário (certificação).
4. **O que não vem de jeito nenhum sem sistema**: dado vivo por município.
   Isso vira **lacuna declarada** na página, com a data da tentativa e a
   rota que falhou. Lacuna declarada é informação; silêncio é mentira.

⚠️ A decisão 11 do [ESTADO.md](../02-estado/ESTADO.md) já diz "Protocolo da
LAI do INCRA: o dev cuida — ⛔ pendente". Este plano **fecha** essa pendência
com dois protocolos nomeados na Fase 4.

## Análise posterior — indicadores e cruzamentos

Análise aqui não é "gráfico bonito". É responder pergunta cívica com número
medido, datado e linkado, sem inventar causalidade.

### Indicadores por estado (UF)

| Indicador | Fonte | Conta | Cuidado obrigatório |
|---|---|---|---|
| Títulos minerários ativos por UF | SCM | contagem por `Situação` | requerimento ≠ título |
| Tempo entre protocolo e decisão | PD + SCM por `Processo` | dias entre `DataProtocolo` e data de fase | só onde as duas datas existem |
| Área titulada por UF (ha) | TAH `NRHectares` + SCM | soma por UF após junção | junção falha = lacuna, não zero |
| CFEM arrecadada por UF/ano | CFEM | soma por UF | **nunca somar entre municípios** |
| CFEM distribuída × arrecadada | CFEM | razão por ente | distribuição ≠ arrecadação |
| Produção declarada × CFEM | AMB × CFEM | R$/t por substância | AMB é **autodeclarada** |
| Investimento em pesquisa × produção | DIPEM × AMB | R$ investido por R$ produzido | defasagem de anos |
| Áreas ofertadas × arrematadas | SOPLE | razão por rodada/UF | rodada sem resultado ≠ fracasso |
| Autuações × arrecadação | CFEM_Autuacao × CFEM | contagem e valor | autuação não é condenação |
| Dívida ativa por UF | SDA | soma | pode repetir processo |
| Barragens por UF e nível | SIGBM | contagem por nível | alerta ≠ emergência |

### Cruzamentos com o acervo que já existe

1. **Mineração dentro de território tradicional.** SIGMINE × quilombolas
   (INCRA) × terras indígenas (FUNAI), com a geometria real. Já há precedente
   em `[municipio]/terras/cruzamentos`.
2. **Assentamento × processo minerário.** Só na Fase 4, quando o INCRA
   responder. Até lá, a página diz "sem camada de assentamento".
3. **Barragem × município × título.** SIGBM × SCM: quem opera, onde, em que
   fase.
4. **Cava detectada × cadastro.** O trabalho de cavas já existe; o SCM dá o
   título que o cadastro tem e o satélite não viu.
5. **Atos × processos afetados.** ANMlegis + SEI: quais portarias mudaram
   regra de título, e quantos processos estavam na fase afetada.

### Regras de análise (não negociáveis)

- **Número medido e datado.** Nada digitado à mão; o agregado carrega
  `geradoEm` e a página mostra a data da coleta (8ª qualidade).
- **Processo não é mina.** Fase de requerimento não autoriza extrair.
- **Autodeclarado é autodeclarado.** AMB, RAL e produção vêm do titular.
- **Lacuna declarada.** UF sem dado aparece como "sem registro na fonte",
  com a data da tentativa.
- **Sem insinuação.** O portal informa; não imputa crime ou intenção
  ([REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md)).
- **Toda linha linkável.** Sem URL específica, a linha não vira destaque.

## Publicação no portal

### Rotas propostas (sujeitas à decisão do dono)

| Rota | Conteúdo | Observação |
|---|---|---|
| `/autarquias` | hub: as duas casas, o que cada uma entrega, cobertura por UF | nova frente ou dentro de "Estado e Economia" |
| `/autarquias/anm` | títulos, CFEM, produção, barragens, atos | paginação no servidor |
| `/autarquias/incra` | o que existe + lacuna declarada + pedidos de LAI | honestidade antes de volume |
| `/autarquias/[orgao]/[uf]` | recorte estadual com os mesmos cartões | 27 UFs |
| `/autarquias/atos` | busca de atos por órgão, ano, tipo, número | ANMlegis + DOU (escopo atual) |

### Onde a frente encaixa nos eixos (para a decisão de rota)

Os quatro eixos do portal, como estão em
[PRODUTO.md](../01-produto/PRODUTO.md):

| Eixo | Hub | Cobre |
|---|---|---|
| **1. Terra e Território** | `/terra-e-territorios` | mineração, barragens, cavas, bacias, terras indígenas e quilombolas, CAR, clima |
| **2. Direitos em Movimento** | `/direitos-em-movimento` | saúde, educação, trabalho, conselhos, **LAI e transparência**, denúncia, acesso à justiça |
| **3. Estado e Economia** | `/estado-e-economia` | orçamento, compras e PNCP, concessões, convênios, repasses, Congresso, Assembleias, Judiciário, empresas |

Eixo 4 é a Central ONSA (ferramentas), sem conteúdo temático.

O problema medido: **esta frente atravessa três eixos ao mesmo tempo**.

| Conteúdo | Eixo natural |
|---|---|
| títulos minerários, CFEM, barragens, produção mineral | 1 — Terra e Território |
| assentamentos, titulações, acervo fundiário do INCRA | 1 — Terra e Território |
| relatório de gestão, compras SICOP, dívida ativa, atos normativos | 3 — Estado e Economia |
| pedidos de LAI, lacunas declaradas, canal de acesso à informação | 2 — Direitos em Movimento |

Pendurar a frente num eixo só esconde dois terços dela. Um hub `/autarquias`
com cartões que apontam para os eixos mantém a navegação atual e dá um lugar
único para o leitor cobrar cobertura.

### As oito qualidades, aplicadas

1. **Linkável** — cada título tem `urlRegistro`; ato tem URL do ANMlegis ou
   do DOU.
2. **Buscável** — busca tolerante a acento + facetas UF, ano, substância,
   fase, situação.
3. **Ordenável** — todas as colunas, inclusive valor e data.
4. **Resumo e cartões** — "quantos títulos, quanta área, quanto arrecadado",
   do agregado, nunca do array inteiro.
5. **Seu Nonô** — cada base entra no RAG com tags e ressalva.
6. **CSV com BOM** — só o filtrado na tela; `;` e `\uFEFF`.
7. **Celular** — tabela rola dentro do quadro; 390 px sem rolagem lateral.
8. **Data do dado** — `geradoEm` visível e derivado do arquivo.

### Limite de bundle

`apps/web/data` **não** recebe linha individual de SCM, CFEM, TAH ou PD.
Recebe **agregado**. A linha individual vive no banco e é servida por rota
paginada — regra §5.1, e o motivo é medido: um `.ts` de 14,6 MB já quebrou
o TypeScript deste repositório.

## Fases de execução

Esforço é **estimativa**, não promessa. Custo em dinheiro: **zero**.

### Fase 0 — medir, catalogar, decidir (3–5 h)

- Abrir os `metadados-*.ods` das 14 pastas e registrar licença, cadência e
  dicionário de colunas.
- Contar linhas por UF nos arquivos que têm UF (SCM, CFEM autuação, DIPEM).
- Rodar o mod-11 em amostra de SCM, CFEM, TAH, PD, SOPLE.
- Confirmar download do ZIP do SIGMINE com UA honesto (FONTES.md registra
  que já exigiu UA de navegador em outro caminho).
- Achar a rota real do relatório de gestão da ANM (o link do site dá 404).
- Escrever o catálogo `docs/06-fontes/FONTES-INCRA-ANM.md` e as entradas do
  `registry.ts` (o teste exige caminho existente).
- **Saída:** catálogo medido + decisões pendentes respondidas.

### Fase 1 — núcleo comum do ETL (1–2 dias)

- `etl/autarquias/nucleo/`: HTTP com robots, ritmo, retry e checkpoint;
  normalizador (IBGE, data, CNPJ, CPF); escritor com `geradoEm`.
- `etl/autarquias/registro.py`: órgão, fonte, cadência, licença, camada.
- Testes de unidade do normalizador (nome→IBGE com apelido, CPF descartado,
  data inválida não vira `null` silencioso).
- **Saída:** um coletor de brinquedo que baixa, normaliza e grava agregado.

### Fase 2 — ANM, dados em massa (2–3 dias)

Ordem por valor e por risco:

1. SCM (13 arquivos, 311.646 linhas) → banco + agregado por UF/município/fase.
2. CFEM autuação (21.030) → banco.
3. CFEM arrecadação e distribuição (recortes por janela) → agregado por
   UF/município/ano/substância.
4. TAH (junção por processo) → agregado por UF.
5. SOPLE, DIPEM, AMB, SDA, PARTICIPA → agregado.
6. PD: índice de protocolo (sem anexos) → banco, com varredura de dado
   pessoal.
7. SIGBM e SIGMINE: **reaproveitar** os coletores existentes.

**Antes de carregar**, medir o armazenamento disponível no Heroku. Se não
couber, entra primeiro o agregado e o banco fica só com SCM + CFEM autuação.

✅ Mediado em 16/11/2026: 537 MB usados de 1 GB, ~487 MB livres. SCM + CFEM
autuação cabem (~270 MB). Detalhe na seção "Banco — medido".

### Fase 3 — ANM, atos e relatórios (1–2 dias)

- ANMlegis: busca por tipo/ano, URL canônica por ato, ementa.
- SEI: índice de publicações (título, data, unidade, link).
- Relatórios de gestão, CGU, auditoria 2017–2019, ouvidoria: PDF com hash e
  link **e cópia em R2** (decisão do dono, 16/11) — medir o volume antes do
  primeiro upload.
- **Saída:** `/autarquias/atos` com dado real.

### Fase 4 — INCRA (2–3 dias + prazo de LAI)

- Páginas: publicações, PDA, prestação de contas, notícias datadas.
- Legislação: registrar que a busca é por tag; **não** fabricar URL canônica.
- Abrir **dois** pedidos de LAI (territorial e fundiário), com protocolo,
  prazo e órgão anotados em `docs/06-fontes/LAI-PROTOCOLOS.json`.
- Reavaliar `painel`, `acervofundiario`, `sigef` de outra rede antes de
  declarar morte.
- **Saída:** página do INCRA com o que existe e a lacuna datada.

### Fase 5 — análise e publicação (3–5 dias)

- Hub e páginas por UF com as oito qualidades.
- Indicadores da seção de análise, começando pelos três que já fecham com
  dado em mãos: títulos por UF, CFEM arrecadada × distribuída, tempo de
  protocolo.
- CSV, RAG, impressão, 390 px.

### Fase 6 — expansão para todas as autarquias (contínua)

Cada autarquia nova preenche **cinco perguntas**. Zero código novo no núcleo.

## Verificação e portões

Antes de cada commit da execução:

```bash
npx tsc --noEmit                              # em apps/web
npx vitest run lib/sem-cpf-no-repo.test.ts    # CPF não pode vazar
npx eslint <arquivos do diff>                 # só o que mudou
rg "text-\[(9|10|11)px\]" apps/web/app        # fonte mínima 12 px
python scripts/validar-documentacao.py        # se mexeu em docs/
python scripts/checar-dado-pessoal-em-dado.py # sobre o dado ingerido
python scripts/checar-data-coleta.py          # data do dado
npx vitest run lib/fontes/registry.test.ts    # caminho de fonte existe
```

Antes do push: `npm test`. Antes do deploy: ordem do dono, nunca por conta
própria.

Portões específicos deste plano:

- **Nenhum CSV bruto no Git** (`*.zip` já é ignorado; CSV grande precisa de
  regra explícita).
- **Nenhum arquivo em `apps/web/data` acima de 10 MB** para esta frente.
- **Toda fonte nova no `registry.ts`** com licença e camada.
- **Toda página com dado** mostra `geradoEm`.

## Riscos e armadilhas medidas

| Risco | Medição | Mitigação |
|---|---|---|
| INCRA indisponível | 3 hosts não responderam; página de SR vazia | LAI + lacuna declarada; reavaliar de outra rede |
| `robots` do DOU proíbe tudo | `Disallow: /` em 11/11/2026 | manter a exceção já registrada, sem ampliar escopo |
| ANMlegis bloqueia robôs de treino | regras para GPTBot/CCBot/DataForSeoBot | UA honesto, ritmo baixo, sem uso de treino |
| CPF em SCM/CFEM/TAH/PD | colunas `CPF/CNPJ`, `CPF_CNPJ`, `NRCpfCnpj` | descarte antes de gravar + mod-11 |
| Dupla contagem de CFEM | guia inteira em cada município | nunca somar entre municípios |
| Município múltiplo no SCM | `Municipio(s)` no plural | explodir com contador |
| TAH sem UF | cabeçalho sem UF/município | junção por processo; sem junção vira lacuna |
| Arquivo gigante no repo | ~1,4 GB no total; 296 MB num só CSV | agregado no repo, bruto fora |
| Bundle do Worker | teto de 3 MiB gzip por rota | paginação no servidor (§5.1) |
| Banco pequeno | medido 16/11: 537 MB de 1 GB, 487 MB livres | SCM + CFEM autuação cabem; CFEM cheia e PD só como agregado |
| Power BI sem export | 2 painéis embutidos | decisão do dono: usar só via lícita (CSV/API) e o resto virar LAI |
| Espelho de PDF em R2 | decisão do dono: link + cópia | cópia perene; medir o volume antes do primeiro upload |
| Fonte muda de layout | ANM publica diariamente | hash do arquivo + comparação de colunas |
| Hora de coleta ausente | 8ª qualidade | `geradoEm` na escrita, nunca digitado |

## Navegador automatizado — quando ajuda e quando é burla

Pergunta do dono em 16/11/2026: "pelo navegador do opencode ou Playwright não
tem como coletar?". **Tem** — o repositório já roda Chromium do Playwright em
rotinas (ver [OPERACAO.md](../05-operacao/OPERACAO.md)). Mas capacidade técnica
não muda a regra do site. São três casos diferentes, e só dois são legítimos.

| Caso | Navegador resolve? | Por quê |
|---|---|---|
| Página **liberada** por `robots.txt`, mas com HTML montado por JavaScript | ✅ sim | a lista só existe depois do JS; a requisição simples não vê o dado |
| Página com **paginação por link/JS** e sem login | ✅ sim | navegar é o uso normal da página |
| Área **autenticada** (login, sessão, certificado) | ⛔ não | a regra proíbe contornar login; o dado vira pedido de LAI |
| `robots.txt` com **`Disallow`** ou bloqueio anti-bot | ⛔ não | passar por challenge com navegador real é exatamente "burlar" |
| Host **fora do ar** (DNS, timeout, 503) | ⛔ não | navegador não conserta rede nem servidor caído |

### Onde o navegador entra de verdade neste plano

- **ANMlegis** (`anmlegis.datalegis.net`) — app JavaScript; a lista de atos não
  vem no HTML cru. `robots.txt` libera nosso caso (bloqueia só GPTBot,
  Google-Extended, CCBot e DataForSeoBot).
- **SEI/ANM** (`sei.anm.gov.br`) — `User-agent: *` / `Disallow:` vazio. A
  paginação é por link; navegador com UA honesto resolve.
- **Portal do INCRA** (`www.gov.br/incra/...`) — páginas liberadas; só as de
  publicações e transparência precisam de navegador.

Em todos: UA honesto também no navegador (`finweejur/github artur colito`),
sem login, 1–2 s entre navegações, checkpoint e fora da CI.

### Onde o navegador NÃO entra

- **DOU.** `Disallow: /` medido. O navegador não transforma proibição em
  permissão. Continua valendo só a exceção já registrada no cabeçalho do
  coletor: termos exatos, 2 s, fora da CI, escopo mínimo.
- **Power BI embutido.** O painel é publicado por `app.powerbi.com` com token,
  no formato que o órgão escolheu. Extrair a tabela por trás do visual é
  contornar o formato de publicação. Decisão do dono (16/11): pegar o que
  existe por via lícita — CSV, API, portal de dados abertos — e o resto pedir
  por LAI.
- **INCRA bloqueado.** `painel`, `acervofundiario` e `sigef` não responderam
  (DNS e timeout), e `sncr.serpro.gov.br` deu 403. Não é filtro de bot: é host
  fora de alcance. A ação é remedir de outra rede, não trocar de ferramenta.
- **`sistemas.anm.gov.br/arrecadacao`.** 403 ao UA honesto. O CSV em massa da
  pasta CFEM entrega o mesmo dado sem contorno.

## Expansão para todas as autarquias federais

O plano vale para qualquer autarquia porque as **cinco classes** e o
**núcleo** não mudam. O que muda é a ficha.

### As cinco perguntas de triagem

1. Publica **arquivo em massa** (CSV/ZIP) sem chave? → onda fácil.
2. Tem **sistema de atos** com URL por ato (datalegis, SEI)? → atos de graça.
3. Publica **relatório de gestão** e prestação de contas? → relatório anual.
4. Tem **unidade descentralizada por UF**? → define a dimensão estadual.
5. Tem **geodado** (WFS/ArcGIS/shapefile)? → cruzamento territorial.

| Resposta | Onda | Exemplos |
|---|---|---|
| 4–5 "sim" | **A** — semanas | ANM, IBAMA, ICMBio, FUNAI, ANA |
| 3 "sim" | **B** — 1 a 2 meses | DNIT, ANTT, ANAC, ANEEL, ANS, ANVISA, IBGE, INSS |
| 1–2 "sim" | **C** — depende de LAI | INCRA (hoje), Fundação Palmares, sudestes regionais |
| 0 "sim" | **D** — só depois de LAI e decisão | autarquias sem portal de dados |

### Checklist de entrada de uma autarquia nova

- [ ] Registrar órgão, sigla, ministério e licença no `registro.py`.
- [ ] Responder as cinco perguntas por escrito, com data e URL medida.
- [ ] Rodar `robots.txt` e termos de uso antes de qualquer requisição.
- [ ] Definir a chave natural (processo, número de ato, código de título).
- [ ] Medir volume e decidir camada (agregado × banco).
- [ ] Varredura de CPF antes do primeiro commit de dado.
- [ ] Entrada no `registry.ts`, no `vigia-coletores` e no RAG.
- [ ] Página com as oito qualidades e a data da coleta visível.

### O que NÃO se faz na expansão

- Não se cria um repositório por órgão.
- Não se copia o normalizador.
- Não se publica "todos os órgãos" num só gráfico sem dizer o que falta.
- Não se transforma ausência de dado em zero.

## Decisões do dono

Registradas em 16/11/2026. Cada uma muda algo concreto no plano.

### Resolvidas

| # | Decisão | Efeito no plano |
|---|---|---|
| 4 | Medir o banco antes de carregar e reportar o custo | ✅ medido: **537 MB de 1 GB**, 487 MB livres. SCM + CFEM autuação cabem (~270 MB). Preço do upgrade não verificado |
| 5 | Nome de titular **pessoa física aparece** na tela | CNPJ e nome entram; **CPF nunca**. Vale a regra editorial: estar na base não é condenação, e requerimento não é autorização de lavra |
| 6 | Power BI: usar só por via lícita, o resto vai para LAI | CSV, API e dados abertos primeiro; painel embutido não se raspa. O que faltar entra no pedido de LAI da ANM |
| 7 | Relatórios e auditorias: **link + cópia** | PDF espelhado em R2 além do link oficial, para não depender do site do órgão. Medir volume antes do primeiro upload |

### Abertas

1. **Onde a frente mora.** Hub `/autarquias` (recomendado — a frente atravessa
   os eixos 1, 2 e 3) ou pendurar em Terra e Territórios (eixo 1) e Estado e
   Economia (eixo 3)? Detalhe na seção "Onde a frente encaixa nos eixos".
2. **DOU.** A exceção registrada hoje: `www.in.gov.br/robots.txt` responde
   `Disallow: /`; o dono autorizou coletar a **busca pública** com termos
   exatos, pausa de 2 s, UA honesto e fora da CI — está no cabeçalho de
   `scripts/coletar-dou.py`. Pergunta: manter essa exceção para os atos das
   autarquias ou congelar a coleta nova? Sem resposta, ato do INCRA fica sem
   fonte; o da ANM entra pelo ANMlegis.
3. **INCRA por LAI.** Autorizar os dois pedidos (territorial e fundiário) e
   dizer quem protocola. Sem isso, a Fase 4 entrega só o que a página diz.

## Origem / Histórico

- **16/11/2026 — decisões do dono.** Banco medido (537 MB de 1 GB, 487 MB
  livres); nome de titular PF aparece na tela com CPF descartado; Power BI só
  por via lícita, o resto vai para LAI; relatórios e auditorias ficam com link
  e cópia em R2. Seguem abertas a rota da frente, o escopo do DOU e a
  autorização dos dois LAIs do INCRA.
- **16/11/2026 — plano escrito.** Pedido do dono: mapear e estruturar ETL de
  atividades, produtos, relatórios, documentos e portarias do INCRA e da ANM
  em todos os estados, com análise posterior pelas regras do repositório.
- **11/11/2026 — medição das fontes.** Sondagem com UA honesto em
  `dadosabertos.anm.gov.br` (14 pastas, 29 arquivos medidos, contagem de
  linhas real em 22 e extrapolada em 7), portal da ANM, ANMlegis, SEI, RAL,
  SIGEF, SNCR, painel e Acervo Fundiário do INCRA, `dados.gov.br` e
  `robots.txt` do DOU. Resultados na seção de medição; nada foi copiado de
  documentação antiga sem conferir.
- **Base anterior:** SIGMINE nacional (16/09/2026), SIGBM (30/08/2026) e CFEM
  municipal (07/08/2026) já estavam no ar; este plano não os refaz.
