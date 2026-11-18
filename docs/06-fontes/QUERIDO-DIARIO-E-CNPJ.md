# Querido Diário e CNPJ: duas fontes gratuitas provadas

> **Tipo:** GUIA
> **Domínio:** fontes externas (diário municipal e cadastro de fornecedor)
> **Última medição:** 2026-11-18
> **Leitura estimada:** média (10–20 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [COLETA-ETICA.md](COLETA-ETICA.md), [FONTES.md](FONTES.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md)
> **Palavras-chave:** querido-diario, diario-oficial, municipal, cnpj, brasil-api, fornecedor, fonte-externa, coleta-etica, licenca, rate-limit

## Sumário

- [O que foi provado](#o-que-foi-provado)
- [Querido Diário: diário oficial municipal](#querido-diário-diário-oficial-municipal)
  - [Cobertura medida](#cobertura-medida)
  - [Armadilha 1: o domínio da API mudou](#armadilha-1-o-domínio-da-api-mudou)
  - [Armadilha 2: a busca é fuzzy e não serve para contar](#armadilha-2-a-busca-é-fuzzy-e-não-serve-para-contar)
  - [O que a amostra mediu](#o-que-a-amostra-mediu)
  - [Limites, licença e ritmo](#limites-licença-e-ritmo)
- [Brasil API: enriquecimento de CNPJ](#brasil-api-enriquecimento-de-cnpj)
  - [O que existe hoje no repositório](#o-que-existe-hoje-no-repositório)
  - [Limite de uso e decisão registrada](#limite-de-uso-e-decisão-registrada)
  - [O que a amostra mediu](#o-que-a-amostra-mediu-1)
- [Como o portal usaria](#como-o-portal-usaria)
- [O que não é permitido](#o-que-não-é-permitido)
- [Arquivos e comandos](#arquivos-e-comandos)
- [O que falta](#o-que-falta)

## O que foi provado

Duas fontes gratuitas, sem chave e sem cadastro, que o portal ainda não
cobria, foram medidas em **18/11/2026** com amostra pequena e fechada:

| Fonte | Prova | O que ficou versionado |
|---|---|---|
| Querido Diário (Open Knowledge Brasil) | 3 cidades de MG, janela de 7 dias, 22 linhas de menção a 4 termos | `apps/web/data/querido-diario/atos.json` (13,7 KB) |
| Brasil API (Receita Federal) | 20 consultas de CNPJ, 17 fornecedores versionados | `apps/web/data/fornecedores/enriquecido.json` (10,3 KB) |

As duas têm coletor próprio, teste de contrato e este documento. Nenhuma
delas exige pagamento, chave de API ou login.

## Querido Diário: diário oficial municipal

O projeto do Open Knowledge Brasil raspa diários oficiais de prefeituras e
publica a API pública em `https://api.queridodiario.org.br`. Ele resolve o
problema mais chato do eixo municipal: cada cidade publica num sistema
diferente (SIGPub, DOM próprio, PDF solto), e sem esse intermediário o portal
teria de escrever um raspador por prefeitura.

**Cuidado com a expectativa:** o Querido Diário **não classifica ato**. Ele
entrega diário (data, edição, URL do PDF e do `.txt`) e trecho de busca. Não
existe campo "decreto", "portaria" ou "licitação". Qualquer contagem por tipo
é heurística declarada — este documento e o coletor dizem qual radical foi
contado, e o JSON repete isso em `metodo`.

### Cobertura medida

Medido em 18/11/2026, na API v0.19.0:

- **510 cidades** em nível 3 (o mais completo) no país;
- **20 cidades de Minas** em nível 3;
- a sugestão inicial desta tarefa — Betim, **Mariana** e **Brumadinho** — não
  fecha: Mariana e Brumadinho respondem nível **0**, com
  `availability_date` vazio em `/cities/{ibge}`. Elas continuam no JSON, em
  `semCobertura`, para ninguém repetir a tentativa no escuro;
- a amostra usa **Betim (3106705)**, **Contagem (3118601)** e
  **Uberaba (3170107)** — as três em nível 3 e com diário na janela.

Cidade em nível 0 não é erro do coletor: é a realidade da fonte. O portal que
mostrar "diário oficial" para Mariana precisa dizer que a fonte ainda não
cobre o município, e não exibir lista vazia como se não houvesse publicação.

### Armadilha 1: o domínio da API mudou

O host que a documentação pública ainda cita,
`api.queridodiario.ok.org.br`, está com o **TLS quebrado**: handshake failure
em OpenSSL (Windows, Alpine e WSL), em `curl` e no Brave. O certificado mais
recente no CT logs expirou em **02/10/2026**. HTTP responde, mas devolve 301
para o HTTPS que não completa o handshake.

O serviço vivo é `https://api.queridodiario.org.br` — o site institucional
também migrou para `queridodiario.org.br`. O coletor usa o host novo e guarda
o link da documentação antiga no JSON, porque é onde o método está descrito.

> Regra prática: quando a fonte parecer "fora do ar", confira o redirect do
> site institucional antes de concluir que o serviço morreu.

### Armadilha 2: a busca é fuzzy e não serve para contar

A busca `/gazettes?querystring=` casa por semelhança. Medido: a consulta por
`portaria` devolveu trecho destacando **"Porto"**, nome de pessoa. Entre
aspas (`"portaria"`) o token fica exato, mas aí o plural "portarias" some.

Consequência de projeto: **a contagem não usa a busca**. O coletor baixa o
`.txt` oficial do diário, conta o radical no texto e descarta o texto. A busca
fica de fora da contagem de propósito.

### O que a amostra mediu

Janela de **7 dias** (10 a 16/11/2026), até 3 diários por cidade. Como a
fonte tinha 2 diários por cidade na janela, todos foram contados.

| Cidade | Diários | decreto | portaria | licitação | nomeação |
|---|---|---|---|---|---|
| Betim | 2 | 46 (2 diários) | 99 (2) | 4 (1) | 20 (1) |
| Contagem | 2 | 123 (2) | 28 (2) | 18 (2) | 8 (2) |
| Uberaba | 2 | 140 (2) | 99 (2) | 147 (2) | 18 (2) |
| **Total** | **6** | **309** | **226** | **169** | **46** |

São **750 ocorrências** de radical e **22 linhas** de evidência (cidade,
termo, diário), cada uma com trecho de até 200 caracteres e link para o
diário. O que fica versionado é isso — nunca o texto inteiro.

Radicais contados (declarados em `radicais` no JSON):

- `decreto` → `\bdecretos?\b`
- `portaria` → `\bportarias?\b`
- `licitacao` → `\blicita\w*` (licitação, licitações, licitado, licitante)
- `nomeacao` → `\bnome[aeiou]\w*` (nomeação, nomeado, nomeou, nomeia)

A contagem é de **menção**, não de ato praticado. "portaria do Condomínio
Terramaris", num decreto de denominação de rua, conta como menção a
`portaria`. É o limite honesto do dado: para separar ato de menção seria
preciso classificar texto, e isso é trabalho de outra frente.

### Limites, licença e ritmo

- **Limite:** a documentação não impõe cota; pede bom senso e cita
  **60 requisições/minuto** como referência. O coletor faz uma chamada a cada
  **1,5 s** (~40/min no pior caso) e, na amostra, fez 11 requisições.
- **Licença:** código MIT; informações da plataforma em **CC-BY 4.0**. O
  portal pode usar com atribuição — e atribui, no campo `fonte` de cada linha.
- **robots.txt:** `Allow: /` para `User-agent: *`, com Content-Signal
  `use=reference` — exatamente o uso daqui (índice e trecho).
- **User-Agent:** `finweejur/github artur colito`, nunca UA de navegador.

## Brasil API: enriquecimento de CNPJ

`https://brasilapi.com.br/api/cnpj/v1/{cnpj}` devolve o cadastro da Receita
Federal em JSON, sem chave. O ganho para o portal não é "ter o CNPJ" — isso o
PNCP já dá. É **qualidade do campo**:

- situação cadastral em texto (`ATIVA`, `BAIXADA`, `INAPTA`), não em código
  numérico. O módulo `etl/betim/etl/apis/brasilapi.py` já registra que comparar
  código com texto produziu **97,6% de falso positivo** (562 de 576 contratos
  marcados) num alerta antigo;
- descrição do CNAE, que a Base dos Dados não traz;
- data de início de atividade, natureza jurídica, município e UF.

### O que existe hoje no repositório

- `apps/web/data/contratos-pncp-consolidado.json` — 20 contratos, 13 CNPJ
  distintos (um deles é a máscara `000.000.000-00` de identificação protegida,
  que não é CNPJ e não gasta requisição);
- `apps/web/data/eleicoes/gastos-2026/fornecedores.json` — 40 fornecedores de
  gasto eleitoral, todos com CNPJ;
- o módulo `etl/betim/etl/apis/brasilapi.py`, que já documenta o limite e a
  fila pontual do ETL do Betim.

O script novo **não substitui** o ETL: ele só prova a fonte numa amostra
versionada.

### Limite de uso e decisão registrada

O README da Brasil API pede, em letras claras: *"por favor não utilize formas
automatizadas para fazer crawling dos dados da API. O volume de consultas deve
ter a natureza de uma pessoa real requisitando um determinado dado."* O
`robots.txt` responde `Disallow: /api/*`.

Essa é a exceção aprovada pelo dono, e fica registrada aqui como manda a regra
do repositório:

- amostra **fechada**, teto de 20 CNPJ que **já estão** em `apps/web/data`;
- **uma** consulta por CNPJ, sem enumerar faixa, sem laço sobre tabela, sem
  retomada automática em massa;
- pausa de **2,5 s**; espera de 60/120/180 s em 429 e nova tentativa;
- rodada única de prova. Para volume, a fonte do projeto continua sendo a Base
  dos Dados (`etl/betim/etl/bd/cnpj.py`).

Se o uso virar rotina, isso precisa de outra decisão — não é para agendar.

### O que a amostra mediu

- **20 CNPJ consultados**, **17 fornecedores versionados**, **3 descartados**;
- os 3 descartados são `Empresário (Individual)`: CNPJ válido, mas a razão
  social é o nome da pessoa. Ficam em `naoVersionados`, só com o número e o
  motivo — sem nome, sem CPF;
- todas as 17 situações vieram **ATIVA**; o valor da amostra está na descrição
  do CNAE e na data de início de atividade;
- nenhuma consulta devolveu 429 nesta rodada, no ritmo de 2,5 s.

Campos gravados por fornecedor: `cnpj`, `razaoSocial`, `situacaoCadastral`,
`dataSituacao`, `dataInicioAtividade`, `cnae{codigo,descricao}`,
`naturezaJuridica`, `municipio`, `uf`, `origem`, `consultaEm`, `fonte`,
`coletadoEm`. A lista é **fechada no teste**: campo novo só entra com revisão.

## Como o portal usaria

**Municipal (Querido Diário).** Numa página de cidade, o bloco "diário oficial"
mostraria: última publicação, nº de diários no mês e os temas mais mencionados
(licitação, nomeação, decreto), sempre com link para o diário e o aviso de que
é menção, não classificação. Cidade em nível 0 mostraria "fonte ainda não
cobre este município" — o que já é informação útil para quem procura o diário.

**Fornecedor (Brasil API).** Na ficha de fornecedor, situação cadastral em
texto, CNAE e data de início ao lado dos contratos que já existem. Isso
responde à pergunta que o leitor faz primeiro: "essa empresa ainda existe?".
Nunca ao lado de sócio, porque sócio não é dado que o portal publica.

Nos dois casos, a fonte entra como **enriquecimento de página existente** — não
como frente nova.

## O que não é permitido

- **Copiar o diário inteiro.** O repositório guarda metadado, contagem e
  trecho de até 200 caracteres. O texto completo fica no link oficial.
- **Guardar CPF, sócio, telefone ou e-mail.** O coletor de CNPJ nem lê o
  `qsa`; o de diário troca sequência de 10+ dígitos por `[numero]`. O teste
  reprova 11 dígitos e campo fora da lista.
- **Burlar o limite.** Nem paralelizar, nem baixar o intervalo, nem rodar a
  Brasil API em laço sobre tabela. O teto é 20 e é de prova.
- **Apresentar menção como ato.** "Citou portaria" não é "publicou portaria".
- **Usar a busca fuzzy como contagem.** Já custou um número errado na primeira
  versão deste coletor.

## Arquivos e comandos

| Peça | Caminho |
|---|---|
| Coletor do diário | [`scripts/coletar-querido-diario.py`](/scripts/coletar-querido-diario.py) |
| Coletor de CNPJ | [`scripts/enriquecer-cnpj.py`](/scripts/enriquecer-cnpj.py) |
| Dado do diário | [`apps/web/data/querido-diario/atos.json`](/apps/web/data/querido-diario/atos.json) |
| Dado de fornecedor | [`apps/web/data/fornecedores/enriquecido.json`](/apps/web/data/fornecedores/enriquecido.json) |
| Teste de contrato | [`apps/web/lib/fontes-externas/querido-diario.test.ts`](/apps/web/lib/fontes-externas/querido-diario.test.ts) |

```bash
python scripts/coletar-querido-diario.py            # janela fixa, 3 cidades
python scripts/coletar-querido-diario.py --seco     # mede sem gravar
python scripts/enriquecer-cnpj.py --seco            # lista os 20 alvos
python scripts/enriquecer-cnpj.py --max 5           # amostra menor

cd apps/web && npx vitest run lib/fontes-externas
```

Os dois diretórios de saída já estão cobertos por `DIRETORIOS_DADO` em
[`scripts/checar-dado-pessoal-em-dado.py`](/scripts/checar-dado-pessoal-em-dado.py),
porque a varredura inclui `apps/web/data`.

## O que falta

- **Cobertura municipal real:** 20 cidades de MG em nível 3 é pouco para um
  portal de Minas. A lista completa está em `/cities?levels=3`; falta medir
  quais têm diário recente, porque várias responderam 0 na janela.
- **Classificação de ato:** hoje só existe contagem de radical. Separar
  "decreto de nomeação" de "decreto orçamentário" exige parser ou modelo — e
  isso é gasto que precisa de autorização.
- **Histórico:** a amostra é uma semana. Série mensal por cidade é outra
  rodada, com outra janela e o mesmo ritmo.
- **Vínculo fornecedor↔contrato na interface:** o dado enriquecido existe,
  mas nenhuma página o consome ainda. Isso é entrega de UI, fora do escopo
  desta prova.
- **Cidade em nível 1 ou 2:** Juiz de Fora, Montes Claros e Diamantina
  aparecem com cobertura parcial. Vale medir se o que existe serve antes de
  descartar.
