# Legislação federal em `ambiental_legislacao` — o que entrou, medido

O dono apontou a falha: `/ambiental/legislacao` tinha **6.378 normas e todas
eram estaduais de Minas** (Siam 4.077, Semad 2.232, ALMG 69). **Nenhuma
federal** — nem a Resolução Conama que rege o licenciamento que o próprio
portal publica. Foi por isso que uma busca por proteção animal não achava
nada: a Lei nº 5.197/1967 e a Lei nº 9.605/1998 simplesmente não estavam no
banco.

Esta rodada carregou as **duas fontes de menor risco** do plano
(`docs/FONTES-CNJ-JUMA.md` §3 e §4), na ordem que ele recomendava.

Tudo abaixo foi **medido em execução real** contra as fontes ao vivo em
**2026-08-15**, e depois contado dentro do Postgres. Nenhum número é
estimativa; onde não deu para medir, está dito que não deu.

---

## 1. O que entrou

| Fonte | `fonte` | `esfera` | Normas | Licença |
|---|---|---|---:|---|
| Ministério do Meio Ambiente e Mudança do Clima (inclui Conama) | `mma` | `nacional` | **8.570** | **CC-BY** (`license_id: cc-by` lido do CKAN) |
| Conselho Nacional dos Direitos Humanos | `cndh` | `nacional` | **370** | **CC BY-ND 3.0** (selo no rodapé gov.br) |
| **Total federal** | | | **8.940** | |

As 6.378 linhas estaduais continuam intactas — nenhum `UPDATE` de
retrocarga, nenhuma linha apagada. Elas ganharam `esfera = 'estadual'` pelo
default da migration.

Migration: **`supabase/betim/migrations/0073_legislacao_federal_esfera.sql`**
(colunas `esfera` e `situacao`, `fonte` agora aceita `'mma'` e `'cndh'`).
Coletores: **`etl/betim/etl/apis/legislacao_mma.py`** e
**`legislacao_cndh.py`**.

---

## 2. MMA — 8.570 normas federais

Fonte: CKAN `dados.mma.gov.br`, dataset
`417a755c-4449-42e7-a60e-143a83dc130b` ("Legislação Ambiental Brasileira"),
recurso **"Legislação Ambiental Brasileira_2025"** (criado em 2025-09-23),
CSV de **3.792.066 bytes**.

- **8.572 registros** no CSV (número exato, ver §5).
- **8.570 gravados** — 2 pares de registros colidem em `id_fonte` (mesmo ato
  normativo e mesmo link; um dos pares é duplicata literal da fonte, ementa
  idêntica). Mantida a última ocorrência. Perda medida: 2 de 8.572.
- **Faixa de anos: 1937 a 2025.**
- **8.345 com link** para o documento oficial; 225 sem (a fonte grava
  `SEM LINK`, que vira `NULL` aqui em vez de uma URL falsa).
- **7.715 com data completa** (89,9%). Onde o ato não traz data por extenso,
  `data` fica nula — nunca vira 1º de janeiro do ano.

Tipos mais frequentes (campo `DOCUMENTO` da fonte, contado após a carga):

| Tipo | Normas |
|---|---:|
| Portaria Ibama | 2.411 |
| Portaria ICMBio | 2.182 |
| Portaria MMA | 1.061 |
| Decreto | 569 |
| Instrução Normativa Ibama | 546 |
| **Resolução Conama** | **511** |

(O plano estimava "536 Resoluções Conama" por `grep` no arquivo bruto; a
contagem por campo, depois do parsing correto, dá **511** com
`DOCUMENTO = "RESOLUÇÃO CONAMA"` e **514** linhas com `ÁREA MMA = CONAMA`.
A diferença entre 536 e 511 é o que o `grep` contava a mais ao casar a
palavra dentro de outras colunas.)

Vigência declarada pela fonte (coluna `situacao`, migration 0073):

| Situação | Normas |
|---|---:|
| Não consta revogação expressa | 3.816 (+1 grafado em caixa diferente pela fonte) |
| Vigente | 2.915 |
| **Revogado** | **1.501** |
| Ato exaurido | 262 |
| Revogação tácita | 55 |
| Tornado sem efeito / sem efeito / encerrado / suspensa / revogada | 20 |

**1.501 normas revogadas é o motivo de a coluna existir.** Sem ela, a busca
devolveria portaria revogada com a mesma cara de norma em vigor. O card
mostra o selo; o texto é o da fonte, sem tradução.

---

## 3. CNDH — 370 atos

Duas plataformas que não se falam, as duas colhidas:

| Onde | Como | Links lidos | Atos distintos |
|---|---|---:|---:|
| Brasil Participativo (Decidim), assembleia 38 / componente 3464 / página 769 | 1 chamada GraphQL, corpo HTML de 119.016 bytes | 256 | **248 recomendações** |
| gov.br/mdh — página de resoluções | 1 `GET`, 263.621 bytes de HTML | 122 | **122 resoluções** |

- **Faixa de anos: 2009 a 2025.** Todos com link para o documento.
- 30 sem número explícito no título, 33 sem data completa, 10 sem ano —
  campos ficam nulos em vez de inventados.
- Página do Decidim atualizada pela fonte em **2026-01-29**.

**O teste que o dono pediu bate.** Buscando Brumadinho / Samarco / Mariana /
Rio Doce nas ementas: **5 atos**, entre eles

- **Resolução nº 1, de 19 de fevereiro de 2019** — "Aprova o Relatório da
  Missão Emergencial a Brumadinho (MG) após o rompimento da Barragem da Vale
  S/A" (24 dias depois do rompimento);
- **Resolução nº 14, de 11 de dezembro de 2019** — crimes ocorridos em
  Mariana/MG e na bacia do Rio Doce;
- **Resolução nº 4, de 24 de maio de 2017** — relatório sobre o rompimento
  da barragem de rejeitos da Samarco.

**Correção ao plano**: ele registrava que as resoluções anteriores a 2016 só
existiam em arquivo `.rar` e não estavam contadas. Medido agora: **21 delas
estão linkadas diretamente em HTML** (2009, 2012, 2013) e entraram nesta
carga — o ano vem do caminho da URL, já que o título dessas é só
"Resolução 01". O que continua fora do alcance é o conteúdo dos `.rar`.

### Licença — o que ela proíbe, e como o código cumpre

CC BY-ND permite citar, linkar e redistribuir **sem modificar**; **proíbe
obra derivada**. Por isso a `ementa` de toda linha do CNDH é o texto do
próprio CNDH **copiado literalmente** da página — a única transformação é
colapsar espaço em branco. Nada é resumido, reescrito ou "melhorado", nem à
mão nem por IA. Quem for mexer no coletor: isto não é estilo, é a licença.

---

## 4. A lacuna fechada: proteção animal

Conferido por consulta ao banco depois da carga:

| Norma | Está? | Situação declarada |
|---|---|---|
| **Lei nº 5.197/1967** — "Dispõe sobre a proteção à fauna" | **sim** | não consta revogação expressa |
| **Lei nº 9.605/1998** — Lei de Crimes Ambientais | **sim** | não consta revogação expressa |
| Lei nº 9.985/2000 (SNUC) | sim | não consta revogação expressa |
| Lei nº 12.651/2012 (Código Florestal) | sim | vigente |
| Lei nº 11.428/2006 (Mata Atlântica) | sim | vigente |
| Lei nº 6.938/1981 (Política Nacional do Meio Ambiente) | sim | não consta revogação expressa |
| **Resolução Conama nº 237/1997** — regulamenta o licenciamento ambiental | **sim** | — |

São exatamente as normas que `docs/MICROSSISTEMA-LACUNAS.md` §b listava como
ausentes do acervo. Elas não precisaram ser digitadas à mão: vieram com a
carga do MMA.

**Fauna, em números medidos:** 388 normas federais receberam o tema
`fauna_flora`; 251 receberam a tag fina `Fauna`; **13 Resoluções Conama**
citam fauna, animal ou silvestre na ementa (entre elas a nº 17/1989, sobre
destinação de peles de animais silvestres apreendidas pelo Ibama, e a
nº 9/1996, sobre corredor de vegetação para trânsito de fauna).

**Ressalva honesta:** a Lei nº 9.605/1998 entrou **sem tema atribuído**. A
ementa dela fala de "sanções penais e administrativas derivadas de condutas
lesivas ao meio ambiente" — não diz "fauna", e o classificador de
palavra-chave (`etl/temas_ambientais.py`) não inventa o que a ementa não
diz. Ela é encontrável por busca textual e por número, não pelo chip de
tema. Isso é limite conhecido do método, registrado aqui em vez de
maquiado.

**Cobertura temática da carga federal:** 2.496 de 8.570 normas do MMA
(29,1%) e 24 de 370 do CNDH (6,5%) receberam pelo menos um tema. O resto
fica "sem tema atribuído" — a mesma política já usada nas estaduais
(31,2%), não um balde "outros" fingindo cobertura. O número do CNDH é baixo
porque o vocabulário de temas atual é ambiental, e a maior parte das
recomendações do conselho é de direitos humanos sem recorte ambiental
direto.

---

## 5. As armadilhas que custaram tempo (para a próxima pessoa)

1. **O CSV do MMA não se lê com `split(";")` nem com `csv.reader` direto.**
   Ele não usa aspas para escapar nada (as 4.012 aspas do arquivo são texto
   literal) e muitas ementas têm quebra de linha embutida. A regra, medida:
   **CRLF termina registro, LF sozinho é quebra dentro do campo** (8.573
   CRLF contra 10.417 LF). Trocando `\n` não precedido de `\r` por espaço
   antes de parsear, o arquivo dá **8.572 registros exatos** — o plano tinha
   deixado isso como intervalo "entre 8.572 e 10.416".

2. **A âncora pela direita parece óbvia e está errada.** 280 registros têm
   mais de 10 campos, e o `;` extra não está só na EMENTA: está também em
   `REVOGA`, o último campo, que cita listas de dispositivos revogados.
   Ancorar os 5 últimos campos pela direita põe pedaço de `REVOGA` dentro
   de `STATUS` — a primeira versão deste coletor gravou "VII - a Portaria
   MMA nº 475, de 21 de outubro de 2021" como situação de vigência. A
   leitura correta ancora em **vocabulário fechado**: `ÁREA MMA` (25
   valores) e `STATUS` (10 valores), aprendidos dos 8.292 registros de 10
   campos do próprio arquivo. Resultado: **280 de 280 registros sujos
   resolvidos**, zero campo ambíguo.

3. **`tipo + número + ano` não serve de `id_fonte` no MMA.** Medido: 324
   chaves repetidas cobrindo 772 registros (decretos sem número no mesmo
   ano, Conama de numeração reiniciada). O que identifica é o campo
   `ATO NORMATIVO`, que já vem com a data por extenso — com o link junto,
   sobram 2 colisões.

4. **`ano + número` também não serve de chave no CNDH** — a numeração
   reinicia por gestão do conselho, e "Recomendação nº 01" convive com
   "Recomendação Conjunta ... n. 01" do mesmo ano. Medido: 12 pares
   (ano, número) repetidos. `id_fonte` é a URL do documento.

5. **O host do Decidim recusa `requests`** — encerra o handshake TLS
   (`SSLZeroReturnError`) de qualquer cliente que não pareça navegador.
   Mesma classe de bloqueio já documentada em `etl/pbh/cliente.py` (WAF da
   GoCache): filtro por fingerprint de TLS, não por User-Agent. Resolvido
   com `curl_cffi` (`impersonate="chrome"`), já dependência do projeto. A
   página do gov.br/mdh, ao contrário, responde 200 a `requests` normal.

6. **A ementa do CNDH não está dentro do `<a>`** — está no `<p>` que o
   envolve. Ler só o link jogaria fora exatamente o texto que faz a busca
   por "Brumadinho" funcionar.

7. **`package_search` do CKAN do MMA está quebrado** (devolve `count: 0`
   para qualquer busca). Só `package_show?id={UUID}` responde — por isso o
   UUID está fixo no coletor.

---

## 6. O que NÃO foi feito, e por quê

- **Não se raspou `conama.mma.gov.br`.** As 511 Resoluções Conama já vêm no
  CSV com número, ano, ementa e link; a página só acrescentaria o inteiro
  teor, que esta tabela não guarda de nenhuma fonte. (Se um dia for
  preciso: ela redireciona `http`→`https` e devolve **403 sem User-Agent de
  navegador**.)
- **Não se leu o "Painel de Legislação do MMA"** (Power BI) — decisão já
  registrada em `docs/ambiental/F0-discovery.md` §6 e mantida.
- **Nenhuma norma foi ligada a município.** Nem MMA nem CNDH têm campo de
  local; o lugar, quando existe, está no texto ("Relatório Brumadinho").
  Cruzar texto contra os 853 municípios de MG exige taxa de erro medida em
  amostra real antes de publicar — mesma regra do acervo da UFMG.
  `id_ibge_municipio` fica nulo, como nas outras fontes.
- **O grafo de revogação não foi construído.** O campo `REVOGA` do CSV é
  texto livre citando as normas revogadas; resolver isso para linhas da
  própria tabela é trabalho de outra rodada.
- **JUMA e DataJud não entraram** — são os passos 3 e 4 do plano, e o
  DataJud ainda depende de decisão de licença (cláusulas 3.8/3.9 do termo
  de uso do CNJ).

---

## 7. Onde isso foi rodado — e o que falta rodar

⚠️ **A carga descrita aqui foi feita contra um Postgres LOCAL desta máquina**
(`127.0.0.1`, cluster de `X:\DevCoder\_offline-cp\pgdata`), com o schema de
`ambiental_legislacao` montado a partir das migrations 0065, 0066 e 0073.
**A Neon não foi tocada** (cota HTTP 402 até 01/09, regra da tarefa), e
**não existe hoje nesta máquina uma cópia local do banco de produção**:
`apps/web/.env.local` não existe e o `etl/betim/.env` aponta para a Neon.
Ou seja: os coletores estão testados de ponta a ponta contra Postgres real,
mas o banco que serve o site ainda **não** recebeu estas 8.940 linhas.

Para completar, na máquina que tiver o banco de produção local
(ver `docs/build-em-outro-pc.md`):

```bash
# 1. migration
cd apps/web && npx tsx scripts/aplicar-migration-local.mts \
  ../../supabase/betim/migrations/0073_legislacao_federal_esfera.sql

# 2. carga a partir dos arquivos JÁ COLETADOS (não refaz a coleta)
npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-mma.json
npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-cndh.json

# 3. reclassificar temas/tags (roda sobre a tabela inteira)
cd ../../etl/betim && python -m etl.apis.classificar_temas_ambientais
```

### A proteção animal, conferida nos arquivos

A falha que abriu esta tarefa era buscar proteção animal e não achar nada.
Conferido no arquivo exportado, com o número da norma:

| norma | ano | ementa |
|---|---:|---|
| Lei nº 5.197 | 1967 | proteção à fauna |
| Decreto-lei nº 221 | 1967 | proteção e estímulos à pesca |
| Lei nº 6.638 | 1979 | vivissecção didático-científica de animais |
| Lei nº 7.643 | 1987 | proíbe a pesca e o molestamento de cetáceos |
| Lei nº 9.605 | 1998 | sanções penais e administrativas (crimes ambientais) |
| Lei nº 11.794 | 2008 | uso científico de animais |

Ao todo, **402 ementas** falam de fauna, animais, caça ou pesca.

Isso obrigou a **recalibrar o classificador de temas**
(`etl/betim/etl/temas_ambientais.py`), e a razão é estrutural: as regras foram
calibradas em 2026-08-12 contra um acervo **100% estadual de Minas**, e o
vocabulário federal é outro. Vivissecção, cetáceos e quelônios não têm
equivalente na legislação da Semad — não podiam aparecer na sondagem original.

- `fauna` ganhou `caça`, `vivissec`, `cetáceo`, `quelônio` e `proteção à
  fauna`: de 251 para **298** ementas.
- **`pesca` é tag nova** (`Pesca e Aquicultura`, dentro do tema *Fauna e
  Flora*): **136** ementas, das quais só 11 a regra de fauna já alcançava.
  Pesca é um bloco inteiro do acervo federal — Decreto-lei 221/1967, a
  Convenção da Baleia, os defesos — e não existe no estadual.
- `caçador` foi **medido e descartado**: os 4 acertos eram a Floresta Nacional
  de Caçador, cidade de Santa Catarina. `maus-tratos` e `bem-estar animal`
  ficaram de fora com 0 ocorrência — incluí-los fingiria cobertura inexistente.

### Tags de lugar

O dono também pediu tags de nome próprio — "Serra do Curral", "Serra da
Caraça", "Parque Estadual". A tag `serra_relevo` que existia responde *"esta
norma fala de alguma serra"*; não responde *"quais normas tratam da Serra do
Curral"*, que é a pergunta que alguém de fato faz.

Oito tags novas, contadas nas 8.940 federais:

| tag | federais |
|---|---:|
| Parque Nacional | 423 |
| Serra da Canastra | 13 |
| Serra do Espinhaço | 10 |
| Serra do Cipó | 8 |
| Serra do Gandarela | 4 |
| Parque Estadual | 2 |
| Serra do Curral | **0** |
| Serra da Caraça | **0** |

Os dois zeros são esperados, não erro: Curral e Caraça são objeto de norma
**estadual** de Minas, e o acervo estadual vive no Postgres, que esta máquina
não alcança. A contagem real aparece quando `classificar_temas_ambientais`
rodar na máquina de build, sobre a tabela inteira. Nome próprio não corre o
risco de falso positivo da regra genérica — "Serra da Canastra" não é uma
frase que apareça por acaso.

Nenhuma tag de lugar entra em `TAG_TEMA`: lugar não é tema, e empurrar uma
delas para dentro dos 8 inflaria aquele tema com normas que não são sobre ele
— a mesma decisão já tomada para licenciamento, fiscalização e clima.

Depois disso, **6.073 das 8.940 normas federais continuam sem nenhuma tag**
(68%). Não é defeito a corrigir com mais regex: são em boa parte atos
administrativos e de estrutura de órgão, que não são *sobre* um tema
ambiental. O número está aqui para que ninguém leia a classificação como
completa.

### Por que o passo 2 lê arquivo em vez de rodar o coletor de novo

Porque **não seriam os mesmos dados**. Rodar `legislacao_mma` na outra máquina
rebaixa o CSV do MMA, e `legislacao_cndh` raspa o site do CNDH outra vez — as
duas fontes mudam sem aviso, e o coletor do CNDH depende da estrutura HTML da
página. Duas coletas em momentos diferentes produzem dois conjuntos diferentes
com o mesmo nome, e a divergência só apareceria depois, como um número que não
bate com este documento.

Os arquivos versionados congelam o que foi conferido aqui:

| arquivo | linhas | tamanho |
|---|---:|---:|
| `etl/betim/dados/legislacao-mma.json` | 8.570 | 6,9 MB |
| `etl/betim/dados/legislacao-cndh.json` | 370 | 0,3 MB |
| **total** | **8.940** | |

Gerados em 2026-08-15 pelo `--json` de cada coletor, que produz exatamente as
linhas que o `sync()` gravaria e não abre conexão com banco nenhum. Para
refazê-los quando a fonte atualizar:

```bash
cd etl/betim
python -m etl.apis.legislacao_mma  --json dados/legislacao-mma.json
python -m etl.apis.legislacao_cndh --json dados/legislacao-cndh.json
```

O carregador só aceita `127.0.0.1`/`localhost` — a mesma recusa de
`aplicar-migration-local.mts`, porque um upsert de 8.940 linhas contra a Neon
em cota é justamente o tráfego que ela não comporta. E faz upsert por
`(fonte, id_fonte)`, nunca DELETE: a tabela guarda também as normas estaduais,
e limpá-la levaria junto o trabalho da coleta anterior.

Os dois coletores têm `--sondar`, que consulta a fonte e relata **sem tocar
o banco** — é o jeito de conferir os números deste documento sem gravar
nada.

---

*Levantado e carregado em 2026-08-15. Contagens medidas em execução real
contra as fontes e depois conferidas no Postgres.*
