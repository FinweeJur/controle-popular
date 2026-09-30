# Plano de memória: resistências, revoltas e lutas populares

> **Tipo:** PLANO
> **Domínio:** global (cidades + páginas temáticas)
> **Última medição:** 2026-09-30
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md), [PRODUTO.md](../01-produto/PRODUTO.md), [FONTES.md](../06-fontes/FONTES.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** memoria, resistencia, revolta, luta popular, quilombo, povos indigenas, conflito no campo, greve, ditadura, anistia, fonte oficial, cartao-carimbo, cidade, estado, regiao, pais, biblioteca, chatbot, acessibilidade

## Sumário

- [Propósito](#propósito)
- [O que já existe (medido em 29/09/2026)](#o-que-já-existe-medido-em-29092026)
- [Princípios: a memória aqui não é enfeite](#princípios-a-memória-aqui-não-é-enfeite)
- [Arquitetura de conteúdo em quatro camadas](#arquitetura-de-conteúdo-em-quatro-camadas)
- [Esquema de dados](#esquema-de-dados)
- [Fontes por tipo de luta](#fontes-por-tipo-de-luta)
- [Regra de vinculação e o teste da vizinhança](#regra-de-vinculação-e-o-teste-da-vizinhança)
- [Onde renderiza](#onde-renderiza)
- [Escala: por que não são 5.570 verbetes à mão](#escala-por-que-não-são-5570-verbetes-à-mão)
- [Acessibilidade e as seis qualidades](#acessibilidade-e-as-seis-qualidades)
- [Fases, esforço e critério de pronto](#fases-esforço-e-critério-de-pronto)
- [Riscos e o que NÃO fazer](#riscos-e-o-que-não-fazer)
- [Decisões registradas (dono, 29/09/2026)](#decisões-registradas-dono-29092026)
- [Origem](#origem)

## Propósito

Resgatar e ampliar o fio de memória do portal: contar, em cada cidade e
em cada página, a história das resistências, revoltas e lutas populares
que **já aconteceram ali** — do país à região, do estado ao município —
sempre com fonte pública fechada, link direto e registro reverente.

O portal já faz isso em miniatura. Este plano transforma o bloco
"Já aconteceu aqui" (hoje: 6 cidades, 3 delas sem memória) em uma camada
de conteúdo com quatro níveis, regra editorial dura e caminho de escala
honesto: **verbete por cidade só onde há fonte; nos demais, a camada do
estado, da região ou do país aparece com a lacuna declarada.**

Não é um museu nem um calendário cívico de enfeite. É a memória das
pessoas que perguntaram antes — na gramática do campo popular
([PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md)), com o rigor do
[AGENTS.md](/AGENTS.md): número vem do dado, insinuação é dano,
lacuna é informação.

## O que já existe (medido em 29/09/2026)

| Peça | Onde | Estado |
|---|---|---|
| Voz e princípios da memória | `docs/planos/PLANO-COPY-VOZ.md` (v3 "memória com alegria") | publicado |
| Copy por cidade | `apps/web/lib/memoria-cidades.ts` — 83 linhas, **6 cidades**: sp, bh, diamantina, betim, araçuai, itinga | 3 com memória, 3 com `memoria: null` (Betim, Araçuaí, Itinga) |
| Render no painel da cidade | `apps/web/app/[municipio]/page.tsx` — `memoriaDaCidade(slug)` (linha 30) | ativo |
| Guarda editorial | `memoria: null` ⇒ a linha de memória **não** renderiza; cidade sem fonte confirmada nunca ganha marco inventado | ativo |
| Padrão de copy única | `apps/web/lib/zonas.ts` (376 linhas) — mesma filosofia: texto em um lugar, lido por qualquer página | ativo |
| Base de municípios | `apps/web/data/municipios-*.json` — **27 UFs** presentes (o Brasil inteiro) | publicado |
| Página que já é casa disso | `/direitos-em-movimento`, além de `/historico`, `/biblioteca`, `/funcaosocialterra`, `/paraopeba`, `/mineracao`, `/terra-e-territorios` | ativas |

**Medição:** 853 municípios em MG (`apps/web/data/municipios-mg.json`) e
5.570 no Brasil (`municipios-brasil.json`, 1,26 MB). As camadas país,
região e UF estão completas (6 + 5 + 27 verbetes, F2). A camada município
abriu no F3 (medido 30/09/2026): **4 verbetes com fonte local fechada** —
Betim, Ipatinga, Araçuaí e Brumadinho em `lib/memoria/municipios.ts`.

## Princípios: a memória aqui não é enfeite

1. **Só entra com fonte fechada.** Verbete sem fonte no padrão do repo
   não publica: a cidade mostra a camada do estado ou a lacuna, nunca um
   marco inventado para enfeitar cartão. (`memoria: null` é a regra que
   já existe e continua valendo.)
2. **Sujeito de direitos, não vítima decorativa.** Quilombola, indígena,
   camponês, atingido, trabalhador em greve aparecem como quem lutou —
   nunca como paisagem de sofrimento.
3. **Nada de insinuação, nada de dois dados verdadeiros montando um
   terceiro falso** (§7 do AGENTS.md). Verbete diz o que a fonte diz.
4. **Luto tem registro próprio.** Massacre, chacina e morte violenta:
   zero humor, zero metáfora, zero verso de poema por perto. Nomes
   assassinados só em registro reverente (regra já escrita no
   [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md)).
5. **Lacuna declarada.** "Não há verbete com fonte para este município
   ainda" é resposta melhor que silêncio e muito melhor que invenção.
6. **Resumo de máquina não é o portal falando** (§7). Se um modelo
   ajudar a rascunhar, a tela rotula: gerado por máquina, data, modelo —
   e a fonte oficial vem colada ao número, nunca longe dele.
7. **Pessoa viva exige cuidado.** Verbete sobre luta em curso só com
   fonte pública e sem dado pessoal novo — a varredura
   `scripts/checar-dado-pessoal-em-dado.py` roda antes de qualquer
   commit de dado, como manda o §5.2.
8. **Sem apropriação de tom.** A memória de um povo não é do portal:
   citar com atribuição, nunca "nós descobrimos".

## Arquitetura de conteúdo em quatro camadas

Cada página resolve a memória **descendo a escada**: usa o nível mais
específico que tem fonte e mostra o nível acima como contexto.

| Nível | Cobre | Onde renderiza | Exemplo |
|---|---|---|---|
| **País** | processos nacionais (abolição, ditadura, anistia, Constituinte, Diretas) | home, `/sobre`, `/direitos-em-movimento`, `/historico`, assistente | Diretas Já (1983-84); Comissão Nacional da Verdade (2012-14) |
| **Região** | 5 macrorregiões e biomas/territórios (Amazônia, Cerrado, Sertão, Vale do Jequitinhonha, Bacia do Paraopeba) | páginas temáticas e de território | "O Vale do Jequitinhonha molda barro e memória" (já existe para Araçuaí) |
| **Estado (UF)** | datas e movimentos estaduais; camada-padrão para os municípios sem verbete | futuras páginas de UF, `/cidades`, cabeçalho de estado no painel municipal | Minas: Inconfidência (1789), Revolta de Carrancas (1833), greves metalúrgicas do ABC paulista é SP |
| **Município** | o marco local, com ano e lugar | cartão-carimbo do painel `[municipio]` | BH: Praça da Estação, 1984 (já publicado) |

**Regra de ouro da escada:** o verbete municipal nunca substitui o
estadual — os dois podem aparecer (município primeiro, estado em uma
linha de contexto), e o leitor sempre enxerga qual nível está lendo.

## Esquema de dados

Evolui `lib/memoria-cidades.ts` para um módulo com as quatro camadas,
mantendo o padrão de copy única (`zonas.ts`). Campos por verbete:

```ts
interface VerbeteMemoria {
  nivel: "pais" | "regiao" | "uf" | "municipio";
  chave: string;            // "br" | "sudeste" | "mg" | "3106200" (código IBGE!)
  titulo: string;           // "Diretas Já"
  periodo: string;          // "1983-1984"
  resumo: string;           // 1-2 frases, português direto
  tipo: ("revolta" | "resistencia" | "greve" | "quilombo" |
          "indigena" | "campo" | "direitos" | "anistia")[];
  lugar?: string;           // "Praça da Estação, Belo Horizonte"
  fonte: {
    autor: string;          // ABNT: autor
    titulo: string;         // obra/documento
    ano: string;
    url: string;            // link direto, conferido na coleta
    orgao: string;          // instituição responsável
  }[];
  guarda?: string;          // "reverente" | "sem-humor" | "so-com-fonte"
  tom?: "principio" | "coragem" | "alegria" | "luto";
}
```

**Decisão técnica:** cidade se casa por **código IBGE**, nunca por nome
(grafia diverge entre tabelas oficiais — armadilha já paga no repo). O
slug da rota é só a chave de renderização.

## Fontes por tipo de luta

Toda fonte entra com **autor, título, ano, URL direto e órgão**, no
formato ABNT com botão "Fonte" (§8 do AGENTS.md). URLs abaixo são
referências de instituição e **serão conferidas uma a uma na coleta**
(nunca colar link de memória — regra "API responde 200 e mente" do
AGENTS.md vale para link também).

| Tipo de luta | Fonte primária candidata | Natureza |
|---|---|---|
| Repressão política e resistência à ditadura | **Memórias Reveladas** (Arquivo Nacional) — fundo da repressão com recorte por UF | oficial, arquivística |
| Violações e memória da ditadura | **Comissão Nacional da Verdade** (relatório 2014, digital, por estado) | oficial |
| Revoltas e movimentos históricos | **Hemeroteca Digital Brasileira** (Biblioteca Nacional) — jornais de época, domínio público | oficial |
| Povos indígenas | **FUNAI** (terras e processos) e **ISA** (Instituto Socioambiental) | oficial / OSC com dados abertos |
| Quilombos | **Fundação Cultural Palmares** (certidões) e **IPHAN** (patrimônio) | oficial |
| Conflito no campo | **CPT — Conflitos no Campo Brasil** (relatórios anuais) e **DATALUTA/NERA-UNESP** (dados abertos) | OSC / academia |
| Greve e mundo do trabalho | **DIEESE** e **Arquivo Edgard Leuenroth (Unicamp)** | OSC / arquivo universitário |
| Patrimônio e lugares de memória | **IPHAN**, **Museu da Inconfidência**, **Memorial da Resistência (SP)**, **Memorial da Anistia (UFMG)** | oficial / equipamento público |
| Contexto histórico estadual | **IBGE** (Brasil: 500 anos de povoamento; biblioteca) e arquivos públicos estaduais (MG: **Arquivo Público Mineiro**) | oficial |
| Camada terciária de mapa (não decide verbete) | **Wikidata / Wikipédia** (CC BY-SA) | terciária — só ponte, nunca fonte única |
| ⚠️ CPDOC/FGV | `www18.fgv.br` responde `Disallow: /` no robots.txt (medido no repo) — usar no máximo como **link citado**, nunca coletor | restrição registrada |

**Regra da fonte única:** um verbete pode ter várias fontes; a primeira
é sempre a mais local e mais oficial. Se só houver fonte terciária, o
verbete não entra.

**Duas fontes novas incorporadas em 29/09/2026** (pedido do dono), já
transformadas em dados:

1. **Aos que virão — Calendário Insurgente**, de **Gustavo Seferian**
   (2020; `aosquevirao.home.blog`) — 17 páginas de listagem colhidas por
   script; **158 entradas** com link direto do post e a **data da citação
   tirada do próprio post**, conforme decisão do dono.
2. **Calendário Histórico dos Trabalhadores e Trabalhadoras**, do **MST,
   2009** (organização de Ângelo Diogo Mazin, Janaina Strozake e Miguel
   Enrique Almeida Stádile) — texto extraído do `.doc` em 29/09/2026
   (UTF-16LE + limpeza de ruído binário); entradas sem URL, porque o
   documento não tem página pública.

**Regra do dono (29/09/2026): fato sem dia ou sem ano NÃO se perde.**
O que tem dia/mês entra no dia (o campo de ano fica vazio quando a fonte
não datou — 147 entradas assim); o que não tem data nenhuma vira
`semData: true` e preenche, de forma determinística (semente sha1 do
próprio texto), os dias do ano que ficaram sem fato. A tela avisa quando
o fato foi posto ali para não deixar o dia vazio.

Resultado: **523 entradas cobrindo o ano inteiro** (`apps/web/lib/memoria/calendario.ts`,
gerado por script, nunca à mão). A mística do dia consome esse acervo.

## Regra de vinculação e o teste da vizinhança

Como decidir que um marco "é da" cidade:

1. **Lugar nomeado** — o fato aconteceu em um lugar que a própria cidade
   reconhece (praça, bairro, rio, comunidade, portão de fábrica).
2. **Fonte local fecha** — documento oficial, arquivo, jornal de época
   ou acervo do movimento daquele território.
3. **Teste da vizinhança** — a frase soaria justa para quem mora lá? Se
   soa como lição de fora, não entra (regra de tom do
   [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md): orgulho de vizinhança,
   nunca museu).
4. **Sem empurrão de sentido** — dois fatos verdadeiros que juntos
   sugerem um terceiro falso ficam separados (§7 do AGENTS.md).

## Onde renderiza

| Página | O que recebe |
|---|---|
| `/` (home) | faixa de memória nacional (1 take) + ponte para o acervo |
| `/sobre` | manifesto longo — já coberto pelo PLANO-COPY-VOZ |
| **`/[municipio]`** | **cartão-carimbo v2**: memória local (ou do estado, rotulada) + cultura viva + ponte, com botão **Fonte** em cada marco |
| `/[municipio]/historico` | linha do tempo da cidade (memória local + estadual + nacional) |
| `/cidades` | visão de cobertura: quantos verbetes, por UF (lacuna declarada) |
| Páginas de frente (`/congresso`, `/judiciario`, `/funcaosocialterra`, `/paraopeba`, `/mineracao`, `/terra-e-territorios`) | epígrafe de memória ligada ao tema (ex.: Judiciário ⇄ Luís Gama e Esperança Garcia, já aprovados no PLANO-COPY-VOZ) |
| `/direitos-em-movimento` | vitrine das lutas, com tipo, período, lugar e fonte |
| `/biblioteca` | verbetes como acervo pesquisável (busca tolerante a acento, facetas por tipo/UF/período) |
| Assistente (Seu Nonô / Alceu Dispor) | verbetes no RAG, com tag de contexto e link oficial na resposta |

## Escala: por que não são 5.570 verbetes à mão

**Medição honesta:** um verbete curado no padrão deste repo (fonte
local fechada, dois olhares, varredura de dado pessoal) custa **30-60
minutos**. Cobrir 5.570 municípios à mão seria 3.000-5.500 horas — fora
de qualquer orçamento de agente.

Por isso o desenho é **camadas + alvo**:

- **Camada país, região e UF**: cobertura total, poucas dezenas de
  verbetes — entrega valor a **todas** as páginas de cidade desde o dia
  um (toda cidade passa a ter, no mínimo, contexto do estado e do país).
- **Camada município**: cresce por ciclos, começando pelas cidades que
  já existem no portal e pelas maiores.
- **Alvo do primeiro ciclo (MG):** 100 municípios com verbete próprio,
  priorizando (a) cidades já publicadas, (b) maiores populações,
  (c) territórios com luta documentada — Jequitinhonha, Paraopeba,
  regiões de quilombo e de conflito no campo.

**A cidade sem verbete nunca fica vazia:** mostra a memória do estado
(rotulada "Minas Gerais") e a linha honesta — "ainda não há verbete
deste município com fonte fechada".

## Acessibilidade e as seis qualidades

- **Texto antes de cor**: cada tipo de luta tem rótulo por extenso, não
  só cor de etiqueta (cor nunca é o único canal).
- **Busca** tolerante a acentos e filtros por tipo, UF, período e lugar.
- **Ordenação** por data, tipo e UF (nominal, monetário não se aplica).
- **Microresumo e cartões de topo** com contagem medida e datada:
  "N verbetes, M municípios cobertos, medido em <data>" — nunca digitado
  à mão.
- **Exportação**: CSV com BOM e `;` + impressão vetorial do recorte
  filtrado, quando o acervo virar lista.
- **Chatbot** com tags contextuais e resposta acolhedora; toda resposta
  aponta o link oficial.
- **Acessibilidade**: verbete é texto curto, com estrutura de títulos,
  e o cartão-carimbo não depende de hover nem de imagem.

## Fases, esforço e critério de pronto

| Fase | Entrega | Esforço | Pronto quando |
|---|---|---|---|
| **F0 — inventário** | mapa do que existe (medido acima) + lista de URLs conferidas por fonte | 0,5 dia | cada fonte da tabela tem URL aberta e verificada, ou é descartada |
| **F1 — esquema e guarda** | `lib/memoria/` com as 4 camadas + `memoria.test.ts` (fonte obrigatória, código IBGE, `memoria: null` não inventa) | 1 dia | testes cobrem as guardas editoriais acima |
| **F2 — camadas país, região, UF** | ~10 (país) + 5 (regiões) + 27 (UFs) verbetes, todos com fonte | 3-5 dias | toda página tem contexto mínimo com fonte |
| **F3 — piloto MG municipal** | 20-30 cidades com verbete (as 6 atuais completas + maiores + territórios de luta) | 5-8 dias | 🚧 em andamento: 4 verbetes com fonte local fechada (Betim, Ipatinga, Araçuaí, Brumadinho) em `lib/memoria/municipios.ts`, medido 30/09/2026 — faltam as demais cidades do piloto |
| **F4 — escala MG** | rumo aos 100 municípios, por ciclos | contínuo | cobertura medida em `/cidades` |
| **F5 — UI e páginas** | cartão-carimbo v2, linha do tempo, blocos nas frentes, `/cidades` de cobertura | 3-4 dias | acessibilidade e impressão conferidas em cada tela |
| **F6 — RAG e exportação** | verbetes no assistente + CSV/print + tags | 2 dias | resposta do chatbot cita fonte oficial |
| **F7 — manutenção** | varredura de link quebrado na CI + revisão anual | 0,5 dia | link morto falha o build, não a confiança |

**Regra de sequência:** F2 antes de F4 — melhor 42 verbetes de camada
superior cobrindo o país inteiro do que 100 verbetes municipais ilhados.

## Riscos e o que NÃO fazer

| Risco | Regra |
|---|---|
| Inventar marco para "completar" a cidade | proibido — `memoria: null` e lacuna declarada |
| Trivializar massacre (piada, verso, metáfora) | proibido perto de luto; zero epígrafe |
| Tom de repressão glamourizado, "luta" como espetáculo | tom é princípio, coragem e alegria; nunca violência |
| Fonte terciária decidindo verbete | só ponte; verbete exige fonte primária/oficial |
| Derivar dado do CNJ ou de acervo com termo restritivo | mantida a regra atual (nada em disco) |
| Nome de pessoa viva sem cuidado | fonte pública + varredura de dado pessoal antes do commit |
| Cobrir 5.570 cidades à mão | não: camadas primeiro, município onde há fonte |
| Usar resumo de modelo como afirmação do portal | se houver, rotular máquina + data + modelo |

## Decisões registradas (dono, 29/09/2026)

1. **Fontes não estatais entram** — com citação e link, marcadas como
   "organização civil / academia" na ficha da fonte. Memória de luta
   raramente está só no Estado.
2. **Ordem de preferência da fonte** — movimentos sociais (CPT, MAB),
   entidades acadêmicas (Dataluta/NERA-UNESP, AEL/Unicamp, CPDOC) e
   páginas oficiais (**Senado, Câmara, EBC, IBGE**, além de ANM, IPHAN,
   Arquivo Nacional, Palmares, FUNAI, arquivos estaduais). **Wikipédia
   só como camada terciária** — ponte para lugar e período, nunca no
   campo `fonte`.
3. **Vocabulário "resistência" mantido** — a gramática do campo popular
   do [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md) segue valendo.
4. **Sequência** — memória em andamento (subagente); na volta,
   continuar com o plano de mapeamento da mineração ilegal.
5. **Mística do Dia na home** — entregue em 29/09/2026: bloco abaixo da
   nav bar e do letreiro "✦ OLHO ABERTO ✦", acima da capa-hero
   (`app/components/MisticaDoDia.tsx`), com a luta do dia e a citação
   ABNT. Sem entrada do dia, o bloco não renderiza (lacuna declarada).
   O calendário entra por chunk separado — 133 KB não podem pesar no
   bundle da página mais visitada.

## Origem

- Pedido do dono em 29/09/2026: resgatar o plano de memória com a
  história das resistências, revoltas e lutas populares de cada estado,
  região ou país, e acrescentar em cada cidade e página.
- Herdeiro direto do [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md) v3
  ("memória com alegria", 02/09/2026) e do código
  `apps/web/lib/memoria-cidades.ts` (6 cidades, 3 pendentes de fonte).
- Regras editoriais: [AGENTS.md](/AGENTS.md) §7 (regra editorial) e §8
  (as seis qualidades); fontes: [FONTES.md](../06-fontes/FONTES.md).
