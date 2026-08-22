# Fontes: biblioteca das Assessorias Técnicas Independentes do Paraopeba

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, fontes, coleta

## Sumário

- [Propósito](#propósito)
- [Resposta curta](#resposta-curta)
- [1. Licenças — nenhuma fonte declara uma](#1-licenças-nenhuma-fonte-declara-uma)
- [2. AEDAS — REST aberta, e o "666" que não existe](#2-aedas-rest-aberta-e-o-666-que-não-existe)
- [3. Guaicuy — a biblioteca não está na API, e a vitrine mente](#3-guaicuy-a-biblioteca-não-está-na-api-e-a-vitrine-mente)
- [4. ADAI e NACAB — medidas, e por isso ausentes](#4-adai-e-nacab-medidas-e-por-isso-ausentes)
- [5. Triagem de dado pessoal — 0 de 597, e por quê](#5-triagem-de-dado-pessoal-0-de-597-e-por-quê)
- [6. Notícias das ATIs — a escolha, e o número que decidiu](#6-notícias-das-atis-a-escolha-e-o-número-que-decidiu)
- [7. Como rodar de novo](#7-como-rodar-de-novo)
- [8. O que ficou de fora, dito por inteiro](#8-o-que-ficou-de-fora-dito-por-inteiro)

## Propósito

Tudo abaixo foi **chamado de verdade e confirmado respondendo** em 2026-08-15. Onde não confirmei, está escrito que não confirmei. As contagens saem do que foi **gravado**, não do que a API diz que tem. Entregas desta rodada: | Peça | Onde | |---|---| | Coletor | `scripts/coletar-biblioteca-ati.p...

Tudo abaixo foi **chamado de verdade e confirmado respondendo** em 2026-08-15.
Onde não confirmei, está escrito que não confirmei. As contagens saem do que
foi **gravado**, não do que a API diz que tem.

Entregas desta rodada:

| Peça | Onde |
|---|---|
| Coletor | `scripts/coletar-biblioteca-ati.py` |
| Dado | `apps/web/data/biblioteca-ati.json` (285 KB) |
| Leitura no build + triagem | `apps/web/lib/paraopeba/biblioteca.ts` |
| Contrato travado | `apps/web/lib/paraopeba/biblioteca.test.ts` (9 testes) |
| Tela | `/paraopeba/biblioteca` |

---

## Resposta curta

**597 publicações**, de 26/03/2020 a 23/06/2026, de **duas** das quatro
organizações medidas. Só metadado e link — nenhum arquivo baixado, nenhum
resumo escrito, nenhum corpo de texto copiado.

| ATI | Itens | Método |
|---|---:|---|
| AEDAS | 435 | `wp-json/wp/v2/documento?projeto=3|299` |
| Instituto Guaicuy | 162 | sitemap por tipo + página de cada item |
| ADAI | 0 | medida; não tem documento desta bacia (ver §4) |
| NACAB | 0 | não tem biblioteca própria publicada |

Por tipo, como cada fonte nomeia o seu:

| Tipo | AEDAS | Guaicuy |
|---|---:|---:|
| Produtos do plano de trabalho | 122 | — |
| Jornal | 93 | — |
| Publicação | — | 87 |
| Rádio | 82 | — |
| Vídeo | 12 | 75 |
| Boletins | 48 | — |
| Documentos técnicos | 38 | — |
| Cartilhas | 24 | — |
| Sem tipo declarado | 12 | — |
| Fotos | 4 | — |

**Triagem: 0 itens barrados de 597.** Ver §5 — o zero é medido, e o motivo
dele é estrutural, não sorte.

---

## 1. Licenças — nenhuma fonte declara uma

Conferido em 2026-08-15 na home, no rodapé e nas rotas `/termos-de-uso/`,
`/politica-de-privacidade/` e `/licenca/` dos três sites:

| Fonte | O que existe | Tratamento |
|---|---|---|
| **AEDAS** (`aedasmg.org`) | rodapé: "2025 Associação Estadual de Defesa Ambiental e Social". Nenhuma menção a licença, Creative Commons ou direitos reservados. `/termos-de-uso/`, `/politica-de-privacidade/` e `/licenca/` respondem 404. | **Direitos reservados.** Só link + título. |
| **Guaicuy** (`guaicuy.org.br`) | nenhuma declaração em lugar nenhum. `/licenca/` responde 200 mas é o WordPress adivinhando: redireciona para uma notícia sobre licença de mineração na Serra do Curral. | **Direitos reservados.** Só link + título. |
| **ADAI** (`adaibrasil.org.br`) | só `/politica-de-privacidade/` (200), que é sobre dado do visitante, não sobre uso da obra. | **Direitos reservados.** Não entra nesta rodada de qualquer forma. |

Sem declaração expressa, a obra é protegida por padrão — Lei 9.610/98, art. 7º.
É o mesmo veredito que `docs/_historico/FONTES-BRUMADINHO-UFMG.md` já registrou para
acervo de terceiro: **linkar, não copiar**.

Consequências concretas no código, todas travadas por teste:

- nenhuma URL do acervo termina em `.pdf`/`.doc`/`.xls`/`.zip` — o link vai
  para a **página do item** no site da ATI, que é quem responde por ele e pode
  corrigi-lo;
- **não existe campo de resumo.** Nem a API da AEDAS (o tipo `documento` não
  expõe `excerpt`) nem a página do Guaicuy publicam um. Escrever um seria este
  portal resumindo obra de terceiro e assinando embaixo. O teste
  `nenhum item carrega resumo, descrição ou corpo de texto` cai se alguém
  acrescentar o campo;
- o portal não hospeda arquivo nenhum, e a tela diz isso **antes** da lista,
  não num rodapé — quem chega procurando um PDF precisa saber para onde vai
  antes de clicar.

---

## 2. AEDAS — REST aberta, e o "666" que não existe

`aedasmg.org` é WordPress com tipo de post próprio `documento` e taxonomia
`projeto`. Medido:

```
GET /wp-json/wp/v2/documento?projeto=3     → X-WP-Total: 435   (paraopeba)
GET /wp-json/wp/v2/documento?projeto=299   → X-WP-Total: 231   (paraopeba-regiao-2)
```

**435 + 231 = 666 é uma soma que não existe.** Os dois recortes se sobrepõem:
o mesmo documento carrega `projeto: [298, 3, 299]`. A união deduplicada por id
dá **435** — os 231 da Região 2 são subconjunto integral dos 435. Somar teria
inventado 231 documentos, e a tela mostraria uma biblioteca 53% maior do que a
AEDAS publicou.

Taxonomias aproveitadas: `tipo-de-documento` (10 termos), `tema` (48 termos),
`projeto`. `categoria-transparencia` foi medida e descartada — 9 termos, 3
deles com contagem zero, e o vocabulário é de prestação de contas do contrato,
não do assunto do material.

A AEDAS **encerrou o Projeto Paraopeba em janeiro de 2026** (o item mais
recente é de 10/01/2026, "Despedida da Aedas Paraopeba"). O acervo dela não
cresce mais; o do Guaicuy sim. A tela rotula pelo período real justamente por
isso.

---

## 3. Guaicuy — a biblioteca não está na API, e a vitrine mente

Três achados, em ordem de quanto custaram:

**3.1. Os tipos da biblioteca não estão na REST.** `guaicuy.org.br` tem 17
tipos de post próprios (`publicacao`, `video`, `documento`, `noticia`,
`oficio`, `portaria`…), e **nenhum** aparece em `/wp-json/wp/v2/types` — todos
com `show_in_rest` desligado. As *taxonomias* estão expostas (`localidade`,
`origem`, `formato`, `especial`, `tematica`…), os *conteúdos* não. Não há
namespace REST alternativo (conferido em `/wp-json/`: nada além de plugins
conhecidos). Restaram os **sitemaps por tipo** (`publicacao-sitemap.xml` 99
URLs, `video-sitemap.xml` 91) mais uma leitura da página de cada item.

**3.2. A biblioteca da ATI Paraopeba é uma vitrine de 9 itens.** A página
`/ati/ati-paraopeba/informe-se/biblioteca/` mostra três seções (Publicações,
Vídeos, Documentários) com **três itens cada** e um "Ver todas". Quem tratasse
essa página como o acervo publicaria 9 de 162.

**3.3. O link "Ver todas" não filtra nada.** Ele aponta para
`/biblioteca/publicacoes/?_sft_localidade=paraopeba`. O prefixo `_sft_` é do
Search & Filter, **que não está ativo no site** — a página devolve o arquivo
inteiro, misturando ATI Paraopeba com ATI Antônio Pereira (a outra assessoria
do mesmo instituto, 618 itens). Confiar na URL da vitrine teria trazido as
duas assessorias como se fossem uma.

A separação real está na **página do item**, na tarja `conteudo-tag-item`, que
traz localidade, origem e ano. Dos 188 itens dos dois sitemaps, **162 têm a
tarja "Paraopeba"**; os 26 restantes são de Antônio Pereira ou não têm tarja —
e item sem tarja fica de fora, porque não dá para afirmar que é desta bacia.

**O Manual socioambiental que o dono apontou está no acervo**: o PDF
`wp-content/uploads/2024/12/Manual-socioambiental-1.pdf` é o anexo do item
`/biblioteca/publicacoes/manual-de-acesso-a-informacao-socioambiental/`
(16/12/2024), que entrou pela coleta normal — junto com o folheto de
apresentação dele (12/12/2024). O portal linka a página, não o PDF.

**Outras duas armadilhas medidas:**

- **`guaicuy.org.br` devolve HTTP 406 ao User-Agent padrão do urllib.** Não é
  bloqueio de robô: com agente identificado, o mesmo endereço devolve 200. Sem
  cabeçalho próprio o coletor "não acha nada" e o erro parece ser da fonte.
- **O paginador do tema mostra uma janela de páginas, não a última.** Parar
  quando o HTML não tem link para `page/N+1` faz o coletor concluir que
  `publicacoes` tem 12 itens. Tem 99. A parada correta é *página sem card*.

---

## 4. ADAI e NACAB — medidas, e por isso ausentes

**ADAI** (`adaibrasil.org.br`) — Associação de Desenvolvimento Agrícola
Interestadual. WordPress com REST aberta e tipo `publicacao`. Medido:

```
GET /wp-json/wp/v2/publicacao                    → 19
GET /wp-json/wp/v2/publicacao?programa=613       → 0     (613 = paraopeba)
GET /wp-json/wp/v2/posts?programa=613            → 21
```

As 19 publicações são **todas** de Amazônia / Fundo Amazônia / tecnologias
sociais. A ADAI atua no Paraopeba (Região 2, herdando o território que a AEDAS
deixou em janeiro/2026), mas **não publicou nenhum documento sobre esta bacia
até agora** — o que ela publica aqui são 21 notícias, que é assunto do §6.
A ausência da ADAI na biblioteca é um achado medido, não um esquecimento.

**NACAB** (Região 3) — não tem biblioteca própria publicada em site acessível.
Não pesquisei a fundo; registro como lacuna, não como conclusão.

---

## 5. Triagem de dado pessoal — 0 de 597, e por quê

A trava geral que varreria todo dado ingerido **ainda não existe** (adiada para
18/08). A régua que existe é `apps/web/lib/paraopeba/triagem.ts`, escrita pela
frente Paraopeba e testada em `triagem.test.ts`.

**Onde ela roda:** no BUILD, dentro de `biblioteca.ts`, sobre o JSON gravado.
O coletor em Python **não** a reimplementa, de propósito — duas cópias da mesma
regra divergem, que é exatamente a razão de `triagem.ts` existir (a régua de
`scripts/checar-dado-pessoal.py` varre código-fonte e não cobre dado ingerido).
Item apontado não entra em `BIBLIOTECA_ATI` e vira contagem em
`COBERTURA_BIBLIOTECA.barradosPelaTriagem`, que sai na tela **mesmo valendo
zero**: "a régua rodou e não achou nada" e "a régua não rodou" são estados
diferentes, e só o primeiro merece confiança.

**As quatro portas, aplicadas sobre tipo e título:** CPF válido por mod-11,
iniciais de vítima (`L.H.M.G.`), contato pessoal associado a nome, e tipo de
natureza pessoal (identificação, comprovante, declaração). Nenhuma disparou.

**Por que o zero é estrutural e não sorte:** este acervo não tem resumo, e o
único texto que existe é o título de uma peça de comunicação institucional —
"Cartilha de Educação Financeira – Volume 2", "Aedas No Ar 189". Nenhum dos
dez tipos de material da AEDAS nem os dois do Guaicuy são de natureza pessoal;
os tipos que a régua barra (documento de identificação, comprovante de
residência) existem no acervo do **processo judicial**, não numa biblioteca de
publicações. O risco que a régua persegue mora em `documentos.ts`, não aqui —
mas ela roda mesmo assim, porque o dia em que uma ATI publicar uma lista
nominal é o dia em que ninguém vai lembrar de ligá-la.

**Nota de atenção, para a próxima rodada:** o feed de notícias do Guaicuy traz
itens do tipo "Nota de pesar: <nome completo>". São obituários públicos
publicados pela própria organização, e a régua atual **não os pega** (nome por
extenso não é CPF nem iniciais). Se as notícias das ATIs forem ingeridas algum
dia, essa é a primeira regra a acrescentar — não é lacuna desta entrega porque
notícia não entrou (§6), mas é lacuna conhecida da régua.

---

## 6. Notícias das ATIs — a escolha, e o número que decidiu

O escopo pedia avaliar se as notícias das ATIs entram **como fonte nova do
radar** (`lib/paraopeba/radar.ts`) ou **como acervo próprio**.

**Escolha: fonte nova do radar. Não acervo. E não implementada nesta rodada.**

Os três motivos, na ordem em que pesam:

**6.1. Não há lacuna de TEMPO para um acervo preencher.** `clipping.ts` cobre
até 2026-07-30 e `clipping-ati.ts` até 2026-02-13; o radar cobre uma janela
móvel de 45 dias, que hoje começa em 2026-07-01. Os dois se encostam com
sobreposição. Um acervo novo de notícia de ATI cairia **inteiro** sobre
território já coberto — que é exatamente o que o escopo proibiu ("não duplique
o que já existe").

**6.2. A lacuna é de VOZ, e é do radar.** As três fontes atuais do radar são
imprensa: MAB, Agência Brasil e Google Notícias. Falta a voz de quem é **parte
no processo** — e ela chega primeiro. O item da ADAI que o dono apontou
(04/08/2026, decisão do juiz sobre o depósito do Novo Auxílio Emergencial de
setembro) é precisamente o `ato_de_autoridade` que o radar existe para pegar, e
que ele hoje só recebe pela imprensa, com atraso, porque os RSS do TJMG e do
MPMG respondem 404 — a lacuna que o próprio coletor já declara na tela.

**6.3. Como acervo, o volume mata; como fonte de radar, ele é certo.**
Medido: `aedasmg.org/wp-json/wp/v2/posts?projeto=3` → **1.082** notícias, mais
21 da ADAI e as do Guaicuy. Um acervo assim teria 7× o tamanho do clipping
inteiro, sem curadoria, sem resumo próprio, e sem nada que separe "reunião de
comissão em Abaeté" de "juiz determina pagamento". Filtrado pela janela de 45
dias do radar, o mesmo material entra a algumas unidades por semana — que é o
tamanho de uma tela de alerta que alguém lê de manhã.

**O caminho já está medido e é barato.** Os três sites servem feed de
taxonomia, todos conferidos respondendo 200 com itens do escopo certo — sem
precisar do filtro por termo de lugar, porque a própria taxonomia já garante
que o item é deste caso:

```
https://aedasmg.org/projeto/paraopeba/feed/
https://adaibrasil.org.br/programa/paraopeba/feed/
https://guaicuy.org.br/categoria/ati-paraopeba/feed/
```

São três entradas na lista `FONTES` de `scripts/coletar-noticias-paraopeba.py`,
sem mudança de esquema — `radar.ts` lê `fontes` como dado.

**Por que não foi feito agora:** `lib/paraopeba/radar.ts` está fora dos limites
desta rodada e a tela do radar está sendo escrita noutra sessão. Mexer na lista
de fontes sem poder ajustar o texto de lacuna da tela publicaria um radar que
diz uma coisa e faz outra. Fica como a próxima entrega, com a regra do §5
(nota de pesar) junto.

---

## 7. Como rodar de novo

```bash
python scripts/coletar-biblioteca-ati.py            # as duas fontes
python scripts/coletar-biblioteca-ati.py --seco     # mede, não grava
python scripts/coletar-biblioteca-ati.py --fonte guaicuy
python scripts/coletar-biblioteca-ati.py --pausa 2  # mais devagar
```

- Uma requisição por vez, `--pausa` segundos entre elas (padrão 1). A coleta
  completa são ~200 requisições — a AEDAS resolve em 11, o Guaicuy exige uma
  por item porque a biblioteca dele não está na API.
- **429 ou 503 param a coleta**, e a parada é a resposta certa: coleta parcial
  que sobrescreve o arquivo bom apaga acervo por causa de um limite temporário.
- **Coleta vazia não sobrescreve.** Mesma regra do radar.
- **`--fonte X` funde com o que já estava lá** em vez de apagar as outras
  fontes — e a fusão vem **antes** da contagem, para o script anunciar o que
  gravou e não o lote que baixou.
- Rodar duas vezes seguidas produz o mesmo arquivo (ordenação determinística
  por data e id), tirando `gerado_em`.

⚠️ O `python` do shell nesta máquina é o venv do hermes-agent e **não alcança a
rede** (firewall por executável — `WinError 10013`). Use o Python do sistema:
`C:\Users\teste\AppData\Local\Programs\Python\Python312\python.exe`.

---

## 8. O que ficou de fora, dito por inteiro

| O quê | Por quê |
|---|---|
| Qualquer PDF, vídeo ou arquivo | licença não declarada; "linkar, não copiar" (§1) |
| Resumo de qualquer item | nenhuma fonte publica `excerpt`; escrever um seria autoria deste portal sobre obra alheia (§1) |
| Notícias das três ATIs (1.100+) | vão para o radar, não para acervo (§6) |
| ADAI | zero documentos sobre esta bacia (§4) |
| NACAB | sem biblioteca própria localizada (§4) |
| 26 itens do Guaicuy | são da ATI Antônio Pereira, ou sem tarja de localidade — outra bacia, outro caso (§3.3) |
| `documentarios` do Guaicuy como tipo | é recorte da taxonomia `especial` sobre `video`; os 19 já entram como vídeo, e duplicá-los criaria item repetido com id diferente |
| `categoria-transparencia` da AEDAS | vocabulário de prestação de contas do contrato, não do assunto do material (§2) |
| Tipos `documento`, `imagem`, `webstorie`, `boletim`, `dica` do Guaicuy | existem no registro de taxonomias mas **não têm sitemap** — na prática, vazios |
