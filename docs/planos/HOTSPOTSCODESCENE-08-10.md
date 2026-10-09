# HOTSPOTS CodeScene — fila de refatoração

> **Tipo:** PLANO
> **Domínio:** global (CodeScene, refatoração de hotspots)
> **Última medição:** 2026-10-09
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** codescene, hotspots, refatoracao, saude, divida, bus factor, decline

## Sumário

- [Como esta leitura foi feita](#como-esta-leitura-foi-feita)
- [Fila — os 18, ao vivo](#fila--os-18-ao-vivo)
- [Declínio medido](#declínio-medido)
- [Próximos passos](#próximos-passos)
- [Já fechados — o que o número confirma](#já-fechados--o-que-o-número-confirma)
- [Bus factor / knowledge maps](#bus-factor--knowledge-maps)
- [Regras](#regras)

## Como esta leitura foi feita

**O job da nuvem está parado, e isso é o achado do dia.** Os 18 scores que a
API do CodeScene devolve hoje (job `7854262`) são **idênticos, casa por casa,
aos valores de ANTES das refatorações** — `sobre/page.tsx` vem 7,268 da nuvem
e está 10,0 na máquina; `Catalogo100PaginasClient.tsx` vem 2,170 e está 10,0.
Ou seja: dashboard e portões de PR estão decidindo com dado velho.

Por isso esta leitura é **local**, com o próprio analisador:

```bash
cs review <arquivo>     # requer CS_ACCESS_TOKEN; mede o arquivo na hora
cs delta <base> <head>  # mede o que os commits mudaram
```

Nunca presumir melhora — medir (regra 5, lá embaixo).

## Fila — os 18, ao vivo

Medição de 09/10/2026, `cs review` em cada hotspot. Saúde de 0 a 10;
quanto menor, mais caro de mexer. Ordenado do pior para o melhor.

| Saúde | Arquivo | Nuvem (velha) | Δ | Situação |
|---|---|---|---|---|
| 7,03 | `apps/web/app/components/CompanheiroFlutuante.tsx` | 7,038 | 0,00 | 🟡 **pior amarelo que resta** |
| 7,30 | `apps/web/lib/db/queries/betim.ts` | 7,090 | +0,21 | 🟡 |
| 7,96 | `apps/web/app/indice/page.tsx` | 7,982 | −0,02 | 🟡 micro-queda |
| **9,09** | `etl/betim/etl/common.py` | 6,870 | **+2,22** | 🟢 **VERDE** (6,97 → 9,09) |
| **9,53** | `apps/web/lib/assistente/escada-determinista.ts` | 1,454 | **+8,08** | 🟢 **verde** (1,36 → 9,53; piso de verde = 9,00) |
| **9,68** | `apps/web/lib/ambiental/licencas-unificada.ts` | 5,729 | **+3,95** | 🟢 **VERDE** (6,64 → 9,68 em 4 commits) |
| **10,00** | `etl/betim/etl/pg_adapter.py` *(novo em 09/10)* | — | — | ✅ nota perfeita |
| 8,01 | `apps/web/app/components/PlayerRadio.tsx` | 8,014 | 0,00 | 🟢 |
| 8,15 | `apps/web/app/[municipio]/vereadores/[slug]/page.tsx` | 7,312 | +0,84 | 🟢 |
| 8,32 | `apps/web/app/funcaosocialterra/page.tsx` | 8,327 | −0,01 | 🟢 micro-queda |
| 8,45 | `apps/web/public/terras/globo/js/ui/rotulos.js` | 6,463 | +1,99 | 🟢 |
| 8,46 | `apps/web/app/components/TopNav.tsx` | 8,463 | 0,00 | 🟢 |
| 8,98 | `apps/web/app/layout.tsx` | 8,982 | 0,00 | 🟢 |
| 9,06 | `apps/web/app/ambiental/page.tsx` | 8,058 | +1,00 | 🟢 |
| 9,38 | `apps/web/lib/assistente/acervo.ts` | 6,982 | +2,40 | 🟢 |
| **10,00** | `apps/web/app/indice/Catalogo100PaginasClient.tsx` | 2,170 | +7,83 | ✅ nota perfeita |
| **10,00** | `apps/web/app/page.tsx` | 7,487 | +2,51 | ✅ nota perfeita |
| **10,00** | `apps/web/app/components/SeuNono.tsx` | 7,946 | +2,05 | ✅ nota perfeita |
| **10,00** | `apps/web/app/sobre/page.tsx` | 7,268 | +2,73 | ✅ nota perfeita |

## Declínio medido

**Só um arquivo regrediu de verdade: `escada-determinista.ts`.**
Passou de 1,454 para **1,36**, e estava no vermelho com **9 problemas**.

### Primeiro remendo: os dois piores degraus (09/10/2026)

Os dois métodos mais caros do projeto saíram do arquivo e viraram **tabela
de dados** casada por `primeiroCartao()`:

| Arquivo novo | Saúde | O que saiu do arquivo |
|---|---|---|
| `lib/assistente/escada-empresas.ts` | **10,00** | `degrau3Empresas` — cc 31, 158 linhas |
| `lib/assistente/escada-ferramentas.ts` | **10,00** | `degrau4Ferramentas` — cc 54, 216 linhas (o pior do repo) |
| `lib/assistente/escada-base.ts` | **10,00** | tipos `AtalhoAcao`/`ResultadoEscada` + casador |

Medido na hora com `cs review`: o orquestrador subiu de **1,36 para 2,51**
e o arquivo caiu de 1.373 para **960 linhas** — abaixo do aviso de
*Lines of Code in a Single File* (piso de 1.000). Os três arquivos novos
fecharam em **10,00**.

**Prova de equivalência (obrigatória, regra 2).** O módulo decide a resposta
do assistente — erro aqui é resposta errada para o cidadão. Script mecânico
leu os `if`s do commit anterior via `git show` e comparou com as tabelas:
**8 blocos/30 termos (empresas) e 10 blocos/53 termos (ferramentas)
idênticos, na mesma ordem**, `tsc` 0, `eslint` 0 e os 12 testes de
`escada-determinista.test.ts` verdes.

### O resto da rodada, no mesmo dia (09/10/2026)

A mesma receita repetida **seis vezes, um commit por etapa**, cada um
com a sua prova e o portão do CodeScene verde antes de subir:

| Commit | Arquivo novo | Saúde | O que saiu do orquestrador |
|---|---|---|---|
| `9365c658` | `escada-empresas.ts`, `escada-ferramentas.ts` | **10,00** | cc 31 e cc 54 (o pior do repo) |
| `aee8076c` | `escada-cidades.ts` | **10,00** | `degrau2Cidades` — cc 27 |
| `a286de10` | `escada-bases.ts` | **10,00** | `degrau45Bases` — cc 26 |
| `a32a08f9` | `escada-tabelas.ts`, `escada-justica.ts` | **10,00** | cc 19 (90 linhas) e cc 18 (119 linhas) |
| `37fe6b1b` | `escada-internacional.ts` | **10,00** | `degrau65Internacional` — cc 24 |
| `9fb128ff` | `escada-noticias.ts` | **10,00** | `degrau6Noticias` — cc 12, o último |

**Trajetória medida com `cs review`, arquivo a arquivo:**
**1,36 → 2,51 → 3,44 → 4,69 → 7,55 → 8,81 → 9,53**.
O orquestrador caiu de 1.373 para **270 linhas** e **entrou no verde** —
o piso de verde é 9,00.

**Três provas diferentes, porque os degraus são diferentes:**

1. **Termos dos `if`s** (`prova-escada.mts`): lê o original via `git show`
   e compara bloco a bloco os conjuntos `exatos`/`contem`/`comecaCom`/
   `terminaCom`/`regex`. Tabelas simples.
2. **Conteúdo dos cartões** (`prova-cartoes.mts`): extrai todos os objetos
   `return {` do commit `1e2decfa` e confere que cada um dos 42 cartões
   novos existe lá. Pega texto trocado por engano, que a prova de termos
   não vê — e pegou: ela **barrou** a primeira versão do degrau de
   notícias, porque eu renomeei uma variável e o texto do cartão deixou de
   bater byte a byte (ver abaixo).
3. **Diferencial** (`prova-internacional.mts`): o degrau de internacional
   não cabe em tabela (o cartão muda de idioma dentro do objeto), então a
   função ANTIGA foi extraída de `a32a08f9` e as duas rodaram a MESMA
   matriz de 45 perguntas — **0 divergências, campo a campo**.

### O que ainda pesa (depois de toda a rodada)

O arquivo está em **9,53 — verde**, com **dois avisos** e nenhum
método complexo:

- **`avaliarEscadaDeterminista` em cc 9**, na fronteira exata do aviso;
- ***bumpy road* em `degrau5Curada`** (2 aninhamentos).

Os dois avisos são da MESMA cadeia: `avaliarEscadaDeterminista` chama os
oito degraus em `??` e ainda tem a lógica de correção ortográfica. Não há
mais nenhum `Complex Method` — o último (`degrau6Noticias`, cc 12) saiu
em `9fb128ff`.

O padrão que resolveu vale para todos eles: **if-chain → tabela**, com
`exatos` (igualdade) e `contem` (substring) separados, ordem preservada e
prova de equivalência. O que não cabe em tabela vira **função própria** —
o que não cabia em tabela, no degrau de internacional, virou **registro
por variação + função que escolhe**.

**A prova de conteúdo é o que impede texto errado no ar.** No degrau de
notícias (`9fb128ff`) eu escrevi o cartão com a variável `noticia` em vez
de `noticiaCorrespondente` — mesma resposta para o cidadão, texto
diferente. A prova falhou, eu voltei o nome original e documentei no
cabeçalho por que ele fica. **Prova quebrada por estilo é prova que
ninguém conserta.**

**Por que a refatoração anterior não subiu a nota.** O commit `cad5f8fa`
fez "156 inserções, 0 deleções". As regras que derrubam a nota aqui são
*Lines of Code in a Single File*, *Large Method* e *Complex Method* —
as três pioram ou não mudam quando só se **soma** linha. Separar em mais
funções sem quebrar as antigas não resolve; as funções grandes precisam
ser divididas de verdade.

Os três outros declínios são ruído de arredondamento (−0,01 e −0,02),
provavelmente do próprio arquivo ter mudado desde o job velho — não
merecem fila própria.

`cs delta e9431edd HEAD` (a semana das refatorações + este trabalho)
respondeu **"No issues found"**: nenhum commit introduziu problema novo.
O declínio é de arquivo velho, não de commit recente.

### Segundo alvo: `licencas-unificada.ts` — 6,64 → **9,68, VERDE**

Era o **pior amarelo** da fila (5,73 → 6,64 no commit antigo `6788cc43`,
ainda amarelo). Foram **4 commits em 09/10**, todos verificados por prova
de equivalência antes de ir para o ar, e o arquivo saiu de amarelo a
verde. A trajetória medida com `cs review`:

| Saída | O que mudou | Commit |
|---|---|---|
| 6,89 | `casaNaRegra` (cc 11) e `construirLinkOficial` (cc 9) viraram `condicoesDeOrgao()` + `condicaoDeCategoria()` + `processoUtil()`; os `PROCESSO_SEM_CONSULTA` viraram `Set` (evita aviso de *Complex Conditional*) | `6075e8fb` |
| 7,21 | `extrairValor` (cc 14, *Bumpy Road*) virou `valorDeNumero()` → `valorDeTexto()` → `valorDeBusca()`, encadeadas com `??` — fiel porque **cada uma devolve `null`, nunca `0`** | `fc21c6fa` |
| 8,67 | `normalizarBaciaIgam` (cc 18, o **último Complex Method**) virou a tabela `BACIAS_IGAM` casada por `find` | `bcbfdf65` |
| **9,68** | `texto`, `ehPac` e `extrairTamanho` saíram do aviso de *Complex Conditional*: `||`/`&&` encadeados na mesma linha viraram guardas em linhas separadas + `Set` | `23b8d4cb` |

**A ordem da tabela `BACIAS_IGAM` é regra, não detalhe.** `find` devolve
o primeiro que casa, então trocar duas linhas de lugar muda a resposta
(`"SM DOCE"` cairia em Doce em vez de Mucuri; `PARANAIBA` perderia para
`PARAIBA`). Por isso a prova cobre **todos os pares ordenados** de termos.

**Prova de equivalência em duas etapas.** Esta função não tem teste
próprio em `licencas-unificada.test.ts`, então a prova é **diferencial**:
a versão antiga foi extraída de `git show HEAD:<arquivo>` para um módulo
temporário, e as duas rodaram a mesma matriz — **615 entradas, 0
divergências** (`prova-bacia.mts`, copiada para `apps/web/` só para rodar,
porque o import relativo precisa do `cwd` certo). Para a prova alcancar o
código de verdade a função precisou ser **`export`**: sem `export`, o
script só leria o texto, não conseguiria roda-la.

**O único aviso que sobrou é escolha, não dívida.** `inferirPorte` tem 5
argumentos (`clas`, `pac`, `tipo`, `microresumo`, `tags`). Reduzir exigiria
trocar a assinatura e reescrever o teste que a cobre, e o ganho seria
estético. Registrado de propósito, para a próxima sessão não tentar de
novo achando que é pendência.

### Terceiro alvo: `etl/betim/etl/common.py` — 6,97 → **9,09, VERDE**

O portão de pré-commit (`cs delta --staged --error-on-warnings`) **barrou
a primeira tentativa**, e o motivo é o achado do dia: o arquivo já estava
**acima do teto de 600 linhas** do CodeScene (619 medidos), e qualquer
commit que o aumentasse falhava. Refatorar `common.py` no lugar não é
possível — é preciso **diminuí-lo**.

A saída foi partir por **coesão, não por número** (commit `df7dbaf5`):

| Arquivo | Saúde | O que mora lá |
|---|---|---|
| `etl/pg_adapter.py` *(novo)* | **10,00** | só o que fala com o banco: `PgAPIError`, `_Response`, `_adapt`, `_row_out`, `_rows_out`, `_colunas_de`, `_inserir_lotes`, `_QueryBuilder` |
| `etl/common.py` | **9,09** | `PgClient` e as funções de negócio (`get_db`, `carregar_municipio`, `resolver_municipio_mg`, `fetch_all`, `refresh_completo_seguro`, `upsert_com_colunas_opcionais`) |

**Nenhum chamador mudou.** `common.py` re-exporta tudo — inclusive os
nomes com `_` — porque `common_test.py` importa `_QueryBuilder` de lá, e
uns ~30 módulos do ETL fazem `from etl.common import ...`. A separação é
interna; a superfície pública é a mesma.

**Achado: o teste de `common.py` estava MORTO desde 08/10.** Os três
testes de `_executar_*` passavam o cursor na mão
(`q._executar_delete(cursor, tabela)`), mas o refator daquela data mudou a
assinatura para `q._executar_delete(tabela)` — o método abre o cursor
sozinho. Ninguém atualizou, e o arquivo ficou sem rede de segurança.

Foram consertados e **ganharam mais 10 testes de INSERT/UPSERT** (18 no
total). O cursor falso grava `(sql, params)`, então o que se confere é o
**SQL exato** que o adapter mandaria ao banco, sem banco nenhum. A prova
diferencial temporária da extração virou teste permanente — que é o
destino certo de prova.

⚠️ **Armadilha nova, medida:** depois do split, o teste de fatiamento
patcheava `etl.common._TETO_PLACEHOLDERS` e **parou de funcionar** — a
constante mora agora em `etl.pg_adapter`, e cada módulo tem seu próprio
*namespace*. `rebinding` em um não muda o outro. O teste passou a
patchear o módulo dono.


## Próximos passos

1. **🟢 Fechado:** todos os oito degraus saíram do arquivo em 09/10 —
   empresas, ferramentas, cidades, bases, tabelas, justica, internacional
   e notícias —, cada um num módulo de **10,00**. O orquestrador está em
   **9,53, verde**, com **nenhum método complexo**.
   **Só restam dois avisos**, e os dois são da mesma cadeia:
   `avaliarEscadaDeterminista` (cc 9, a fronteira exata) e o *bumpy road*
   de `degrau5Curada` (2 aninhamentos). Tira-los deve subir a nota para
   9,6+; mas **9,53 já é verde** — a régua do projeto é 10,00, e a diferença
   entre 9,53 e 10 aqui é regra de gosto, não dívida.
   O próximo esforço rende mais nos **amarelos do item 4**.
2. **🔁 Disparar re-análise na nuvem.** Enquanto o job `7854262` não
   atualizar, o dashboard e os portões de PR avaliam dado de antes da
   refatoração — hoje eles ainda mostram **1,36**. Vale conferir depois em
   codescene.io.
3. **🎯 Registrar metas de dívida técnica** — o CodeScene mostra
   `technical debt goals` **vazio**. Sem meta, ele não avisa declínio
   sozinho. Sugerida: nenhum hotspot abaixo de 7,00, e
   `escada-determinista.ts` **nunca abaixo de 9,00** (o verde, que custou
   sete etapas para conquistar).
4. **🟡 Amarelos que sobraram** — **só três**, todos medidos 09/10:
   `CompanheiroFlutuante.tsx` (7,03, o pior), `betim.ts` (`lib/db/queries`,
   7,30), `indice/page.tsx` (7,96). `licencas-unificada.ts` (9,68) e
   `common.py` (9,09) saíram da lista — os dois viraram **verde**.
   `pg_adapter.py` nasceu em **10,00** e entra na régua como arquivo novo.
5. **📝 `common.py` ainda tem três avisos, e os três são escolha, não
   dívida:** `refresh_completo_seguro` está cc 11 e tem **9 argumentos** —
   é API pública chamada por ~30 módulos, e agrupar num objeto de opções
   trocaria a legibilidade de todo *call site* por um ponto de saúde; e
   `upsert_com_colunas_opcionais` tem 5. Registrar evita que a próxima
   sessão repita o trabalho.

## Já fechados — o que o número confirma

A fila original de 08/10 dizia "12 de 18 fechados". O número de hoje
**confirma 4 com nota perfeita** e mostra o resto como *melhorado, não
fechado*:

| Saúde hoje | Arquivo | Commit | Veredito |
|---|---|---|---|
| 10,00 | `app/indice/Catalogo100PaginasClient.tsx` | `a4a7f213` | ✅ fechado |
| 10,00 | `app/page.tsx` | `cafcb712` | ✅ fechado |
| 10,00 | `app/components/SeuNono.tsx` | `e9431edd` | ✅ fechado |
| 10,00 | `app/sobre/page.tsx` | `23b37453` | ✅ fechado |
| 9,38 | `lib/assistente/acervo.ts` | `7ba60b26` | 🟢 melhorou (6,98 → 9,38) |
| 9,06 | `app/ambiental/page.tsx` | `4c7cf656` | 🟢 melhorou (8,06 → 9,06) |
| 8,45 | `public/terras/globo/js/ui/rotulos.js` | `23b37453` | 🟢 melhorou (6,46 → 8,45) |
| 8,15 | `app/[municipio]/vereadores/[slug]/page.tsx` | `23b37453` | 🟢 melhorou (7,31 → 8,15) |
| 7,30 | `lib/db/queries/betim.ts` | `bb6387d1` | 🟡 melhorou pouco (7,09 → 7,30) |
| **9,09** | `etl/betim/etl/common.py` | `df7dbaf5` | 🟢 **VERDE (6,97 → 9,09)** |
| **10,00** | `etl/betim/etl/pg_adapter.py` *(novo)* | `df7dbaf5` | ✅ nota perfeita |
| **9,68** | `lib/ambiental/licencas-unificada.ts` | `23b8d4cb` | 🟢 **VERDE (6,64 → 9,68)** |
| **9,53** | `lib/assistente/escada-determinista.ts` | `9fb128ff` | 🟢 **VERDE (1,36 → 9,53)** |
| 10,00 | `lib/assistente/escada-empresas.ts` | `9365c658` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-ferramentas.ts` | `9365c658` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-base.ts` | `9365c658` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-cidades.ts` | `aee8076c` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-bases.ts` | `a286de10` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-tabelas.ts` | `a32a08f9` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-justica.ts` | `a32a08f9` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-internacional.ts` | `37fe6b1b` | ✅ nota perfeita |
| 10,00 | `lib/assistente/escada-noticias.ts` | `9fb128ff` | ✅ nota perfeita |

## Bus factor / knowledge maps

**O que é.** Bus factor é o risco de uma pessoa só ser dona de um pedaço do
código: se ela sair, ninguém mais entende aquilo (o nome vem do "motorista
do ônibus"). No CodeScene isso vira o mapa de conhecimento — quanto mais
diferentes forem os donos de um arquivo, mais seguro ele está.

**Medição de 09/10/2026** (`code_ownership_for_path`, projeto 85760):

| Arquivo | Saúde | Revisões | Donos | Bus factor |
|---|---|---|---|---|
| `apps/web/app/page.tsx` | 10,00 | 51 | `FinweeJur` | **1** |
| `apps/web/app/components/TopNav.tsx` | 8,46 | 40 | `FinweeJur` | **1** |
| `apps/web/app/layout.tsx` | 8,98 | 38 | `FinweeJur` | **1** |
| `apps/web/app/components/SeuNono.tsx` | 10,00 | 36 | `FinweeJur` | **1** |
| `apps/web/lib/db/queries/betim.ts` | 9,09 | 32 | `FinweeJur` | **1** |
| `apps/web/public/terras/globo/js/ui/rotulos.js` | 8,45 | 16 | `FinweeJur` | **1** |
| `etl/betim/etl/common.py` | 9,09 | 10 | `FinweeJur` | **1** |
| `etl/betim/etl/pg_adapter.py` | 10,00 | 10 | `FinweeJur` | **1** |
| `apps/web/lib/companheiro/passo.ts` | 10,00 | 1 (novo\*) | `FinweeJur` | **1** |
| `apps/web/lib/db/queries/betim-saude.ts` | 10,00 | 1 (novo\*) | `FinweeJur` | **1** |
| `apps/web/lib/db/queries/betim-nucleo.ts` | 10,00 | 1 (novo\*) | `FinweeJur` | **1** |

\* Criados na refatoração de 09/10/2026. A nuvem ainda NÃO os indexou (o job
`7854262` está parado): a saúde acima é a medição LOCAL (`cs review`) e o dono
é dedução da conta única, não leitura do mapa de conhecimento.

**Leitura — e o cuidado para não alarmar.** Todo arquivo medido tem bus
factor 1, mas aqui **1 não é fragilidade**: o repo é do dono, e todas as
sessões de agente empurram para o MESMO `FinweeJur` — vale a conta do
GitHub, não a pessoa. O que isso de fato mede é: **um único ponto de
entrada** para o histórico do projeto.

Onde o número passa a valer de verdade: se um dia entrar outra conta
(terceiro, robô dedicado), aí sim uma diferença de donos passa a mostrar
quem entende o quê. Recalcular nessa hora.

### Onboarding de uma pessoa nova — lacunas medidas (09/10/2026)

O projeto já tem [CONTRIBUTING.md](/CONTRIBUTING.md),
[docs/LEIA-PRIMEIRO.md](../LEIA-PRIMEIRO.md) e [AGENTS.md](/AGENTS.md). O que
FALTA, medido hoje — cada item reduz atrito para quem chega:

1. **Ligar o hook era manual e era esquecido. ✅ RESOLVIDO (09/10/2026).**
   `git config core.hooksPath .githooks` já foi medido VAZIO nesta máquina
   (01/10/2026) e é a única camada que barra CPF antes do push. Agora o
   `postinstall` do `package.json` roda `scripts/configurar-hooks.mjs`: liga
   sozinho no `npm install`/`npm ci` e nunca derruba a instalação. `npm run
   setup` re-liga à mão quando preciso.
2. **Não existe `CODEOWNERS`.** Nem em `.github/`, nem na raiz. Com a conta
   única de hoje é inócuo, mas é o mecanismo que roteia revisão e faz o bus
   factor virar AÇÃO no dia em que a segunda pessoa entrar.
3. **Não existe glossário de siglas.** O portal usa ETL, RAG, CAR, CEIS/CNEP,
   IDEB, CAGED, CDP, TCE, LAI, ONSA... Sem uma página que os defina, quem chega
   trava na primeira leitura. Um glossário de uma página baixa a barreira.
4. **Identidade por pessoa.** Enquanto todo commit é `FinweeJur`, o mapa de
   conhecimento não distingue quem entende o quê — o bus factor 1 é artefato da
   conta, não medição. Dar identidade Git própria a cada contribuidor é o que
   faz o número medir algo real.

**Dashboard (knowledge maps):**
[hotspots](https://codescene.io/projects/85760/jobs/7854262/results/code/technical-debt/system-map?max-code-health=10.00&min-change-freq=0&showHotspotsOnly=true&min-coverage=0.00&max-coverage=100.00#hotspots)
e
[biomarkers](https://codescene.io/projects/85760/jobs/7854262/results/code/biomarkers).

## Regras

1. **Só refatorar o que está nesta fila** — nunca por intuição (AGENTS §7).
2. **Prova de equivalência**: diff com 0 deleções (mecânico) ou dump
   sha256 idêntico (tabelas de dados).
3. **Testes antes e depois**: cada hotspot ganha teste em `lib/` (vitest)
   ou harness próprio (Python/JS estático).
4. **Um hotspot por commit**, com mensagem citando o commit original e a
   prova de equivalência.
5. **Saúde renasce na próxima leitura** — não marcar como "melhorado" sem
   número do CodeScene.
6. **Nuvem parada ≠ saúde boa** — se o job não rodou, o número da nuvem é
   o de antes. Confirme sempre com `cs review` local (medido 09/10).
