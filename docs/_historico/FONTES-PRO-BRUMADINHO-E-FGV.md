# Fontes: Pró-Brumadinho (Governo de MG) e auditoria da FGV

As duas fontes que o dono pediu para a frente Paraopeba. As duas descrevem o
mesmo Acordo Judicial de Reparação de Brumadinho (R$ 37,6 bi, 04/02/2021) —
e **descrevem partes diferentes dele**, o que é a informação mais importante
deste documento.

Tudo abaixo foi **aberto e confirmado respondendo** em **2026-08-15**. Onde
não medi, está escrito que não medi.

---

## Resposta curta

| # | Pergunta | Resposta |
|---|---|---|
| 1 | `mg.gov.br/pro-brumadinho` é SPA com API? | **Não.** Drupal com HTML servido pelo servidor. Nada de SPA, nada de API REST. |
| 2 | Tem dado bom lá? | **Sim, três blocos.** 853 municípios com valor de repasse, 209 documentos oficiais, e o quanto a Vale já pagou ao Estado. |
| 3 | Custa caro coletar? | **Não.** Uma requisição por página, sem paginação, sem autenticação. |
| 4 | A FGV é SPA com API? | **Sim.** Páginas-casca em Bootstrap + jQuery; o dado vem de **4 JSON estáticos** de caminho fixo. |
| 5 | Dá para ampliar a FGV de Betim para a bacia? | **Sim, e foi feito nesta rodada** — 26 municípios, 234 projetos, 450 linhas de execução. |
| 6 | Há impedimento de acesso? | **Sim, dois, e nenhum é técnico.** `robots.txt` da FGV veda rastreamento do host inteiro; e o portal de MG está em **bloqueio eleitoral** desde 25/06/2026. |

**A decisão desta rodada:** ingeri a **FGV** (barata, dado forte, e o pedido
era justamente ampliar) e **catalogei** o Pró-Brumadinho com plano — não por
ser cara ou fraca, mas porque a tabela dos 853 municípios é estadual, não da
bacia, e pertence a outra tela. Ver §5.

---

## 1. Pró-Brumadinho — como o site serve o dado

### Não é SPA. É Drupal, com HTML pronto

```
GET https://www.mg.gov.br/pro-brumadinho
→ 200 · 116.850 bytes · text/html; charset=UTF-8 · 0,41 s
```

Medido no HTML da home: **348 `<div>`, 119 `<a>`, 11 `<script>`, 0 `<iframe>`**
— e o menu inteiro, com os 33 destinos, já vem no corpo. Cabeçalhos de
resposta `X-Drupal-Cache` / `X-Drupal-Dynamic-Cache` confirmam Drupal.

Sondei a API que um Drupal moderno costuma expor:

```
GET /jsonapi → 404 (página de erro HTML, 61.487 bytes)
```

**Não há API.** Quem quiser o dado lê o HTML. Isso é bom notícia, não má: a
página é estável, o conteúdo é servidor-renderizado e um `fetch` simples
basta — sem navegador, sem esperar JavaScript.

### Estrutura, medida

Percorri as **35 rotas do menu principal**, uma por vez, com 1,2 s de pausa:

| | |
|---|---:|
| rotas que responderam 200 com conteúdo | **32** |
| rotas em bloqueio eleitoral (302) | **2** |
| rotas com 403 "Acesso negado" | **1** |
| tamanho das páginas | 71 KB a **347 KB** |
| URLs de arquivo distintas em todo o conjunto | **209** |
| — PDF | 156 |
| — ZIP | 28 |
| — XLSX | 25 |
| amostra aleatória de 20 arquivos, testada uma a uma | **20/20 responderam 200** |

`robots.txt` de `www.mg.gov.br`: **`/pro-brumadinho` é permitido**, sem
`Crawl-delay`. Os `Disallow` são os padrões de Drupal (`/core/`, `/admin/`,
`/user/login`, `/search/`).

### As três páginas que carregam dado de verdade

#### 1.1. Repasse aos 853 municípios de Minas — a mais forte

`/pro-brumadinho/pagina/reparacao-brumadinho-repasses-aos-853-municipios-de-mg`
— 347.464 bytes, **atualizada em 11/08/2026** (quatro dias antes desta
medição). Três tabelas HTML, contadas linha a linha:

| Tabela | Linhas de município | Total | Base legal |
|---|---:|---:|---|
| Rateio principal, por população IBGE 2019, em 3 parcelas | **853** | R$ 1.498.250.000,00 | Lei 23.830/2021, art. 5º e Anexo V |
| Repasse complementar, parcela única | **142** | R$ 59.300.000,00 | Resolução SEGOV nº 38, de 03/11/2021 |
| Repasse complementar, parcela única | **219** | R$ 88.246.000,00 | Resolução SEGOV nº 28, de 28/06/2022 |

Total declarado na própria página: **R$ 1.645.796.000,00**.

Colunas da tabela principal: `MUNICÍPIO`, `POPULAÇÃO ESTIMADA 2019`,
`VALOR TOTAL REPASSE`, `1ª parcela (40%) paga em 30 de agosto de 2021`,
`2ª parcela (30%) - até 31 de janeiro de 2022`, `3ª parcela (30%) - até 1º
de julho de 2022`.

Faixa real: de **R$ 50.000.000,00** (Belo Horizonte, 2.512.070 hab.) a
**R$ 750.000,00** (Serra da Saudade, 781 hab. — o menor município do país).
O rateio é proporcional à população **com piso e teto**: BH tem 3.217× a
população de Serra da Saudade e recebeu 67× mais.

**Por que isto importa para este portal:** é a única fonte que liga o desastre
de Brumadinho a **todos os 853 municípios de MG**, inclusive os que ficam a
600 km da bacia. Qualquer página municipal do Controle Popular pode dizer
"esta cidade recebeu R$ X da reparação de Brumadinho, e a lei diz no que pode
gastar" — e a página lista o que pode e o que não pode (pavimentação,
drenagem, pontes, unidades de saúde, acessibilidade; e as vedações).

#### 1.2. Obrigações de pagar da Vale ao Estado

`/pro-brumadinho/pagina/reparacao-brumadinho-obrigacoes-de-pagar-da-vale-ao-estado`
— duas tabelas de 8 linhas cada, **com data de corte explícita: 31/07/2026**.

| Objeto | Previsto no Acordo | Arrecadado até 31/07/2026 |
|---|---:|---:|
| Anexo I.3 — Projetos para a Bacia do Paraopeba | R$ 232.460.000,00 | R$ 331.770.637,22 |
| Anexo I.4 — Estrada Distrito Industrial Brumadinho | R$ 120.000.000,00 | R$ 145.158.743,03 |
| Anexo II.3 — Segurança Hídrica | R$ 2.050.000.000,00 | R$ 3.730.893.463,31 |
| Anexo III — Mobilidade | R$ 4.950.000.000,00 | R$ 6.542.247.695,77 |
| Anexo IV — Fortalecimento do Setor Público | R$ 3.650.000.000,00 | R$ 5.013.830.206,09 |
| Ressarcimentos e contratações temporárias | R$ 310.000.000,00 | R$ 544.371.116,39 |
| Cláusula 4.4.9.2 — Novo Complexo de Saúde (HOPE) | R$ 67.000.000,00 | R$ 72.987.279,14 |
| Estruturas de apoio | R$ 100.000.000,00 | — |
| **TOTAL** | **R$ 11.479.460.000,00** | **R$ 16.381.259.140,95** |

⚠️ **A segunda coluna ser maior que a primeira não é sobra.** É correção
monetária: o Acordo é de 2021 e os valores arrecadados chegam corrigidos.
Publicar "arrecadado − previsto = R$ 4,9 bi de excedente" seria erro grosseiro.

#### 1.3. Legislações e publicações oficiais

`/pro-brumadinho/pagina/reparacao-brumadinho-legislacoes-e-publicacoes-oficiais-documentos-sobre-o-acordo-judicial`
— 112.218 bytes, âncoras por ano de **2019 a 2026**, **99 itens fora do menu**
(66 PDF + planilhas XLSX + nós internos `/pro-brumadinho/documento/<slug>`).

É o acervo normativo do Acordo: Lei 23.291/2019 (política estadual de
barragens), Decreto NE 176 (Comitê Gestor), o **Acordo Judicial em texto e em
fac-símile assinado**, Lei 23.830/2021 (o crédito suplementar que virou o
repasse dos 853), as **28 Deliberações do Conselho Superior** (cada uma com
PDF + XLSX de valores por projeto) e as decisões judiciais de conversão de
obrigação de fazer em obrigação de pagar.

A Deliberação mais recente é a **nº 28**, com tabela XLSX atualizada em
10/08/2026. Ou seja: a fonte está viva.

---

## 2. As armadilhas do Pró-Brumadinho, confirmadas

### 2.1. Bloqueio eleitoral — 302 que vira 200 e engana

```
GET /pro-brumadinho/noticias
→ 302 Found
   Location: https://www.mg.gov.br/pro-brumadinho/periodo-eleitoral
   X-Drupal-Periodo-Eleitoral-Redirect: 1
```

Com `curl -L`, isso vira **HTTP 200 com 67.514 bytes de HTML bem formado** —
e o texto real do corpo é:

> "Em função do período eleitoral, esta página está indisponível até que o
> Tribunal Regional Eleitoral oficialize o término das eleições."
> (página atualizada em 25/06/2026)

Um coletor que valide status devolve "200, coletado com sucesso" e grava zero
notícias sem reclamar. **A validação tem que ser de conteúdo.** O caminho
barato aqui é o cabeçalho `X-Drupal-Periodo-Eleitoral-Redirect`, que o próprio
Drupal manda — mas o cabeçalho pode sumir numa atualização, então o teste
final é procurar um título de notícia no corpo.

Rotas afetadas hoje, medidas: **`/pro-brumadinho/noticias`** e
**`/pro-brumadinho/pagina/reparacao-brumadinho-implantacao-da-biofabrica-wolbachia-e-reestruturacao-da-funed`**.
As outras 32 respondem normalmente. **Não coletar notícias do portal enquanto
o bloqueio durar** — não porque seja proibido, mas porque não há o que coletar,
e um acervo vazio publicado como "notícias oficiais" mente por omissão.

### 2.2. "Buscar documentos" está no menu e responde 403 ao público

```
GET /pro-brumadinho/busca-documentos
→ 403 · 63.657 bytes · corpo: "Acesso negado — Você não está autorizado a acessar esta página."
```

Testado com dois User-Agents (um identificando o projeto, um de navegador
puro): **403 nos dois**. A busca de documentos que o megamenu anuncia em todas
as 35 páginas exige login. Não é rate-limit e não é bloqueio a robô.

Consequência prática: **o índice de documentos do portal não existe para o
público.** A única forma de listar os 209 arquivos é varrer as páginas —
que é o que este levantamento fez.

### 2.3. Link quebrado apontando para a FGV

A home do Pró-Brumadinho tem um botão **"EXECUÇÃO DE PROJETOS PELOS
MUNICÍPIOS"** para
`https://www18.fgv.br/projetorioparaopeba/projetos-convertidos.html` →
**404, 1.245 bytes**. O destino não existe mais no site da FGV.

Ou seja: o caminho oficial que o Governo de MG oferece ao cidadão para ver a
execução por município está morto. O dado existe — só que na página de
informações financeiras da FGV, que o portal não linka (§3).

### 2.4. O que **não** medi

- **Licença formal.** Não achei termo de uso próprio do Pró-Brumadinho nem
  string de licença. Tratar como dado público de órgão estadual regido pela
  LAI (Lei 12.527/2011) e pelo Decreto federal 8.777/2016, com atribuição ao
  Governo de Minas / Seplag. Mesmo tratamento que `FONTES-TERRITORIO-E-MINERACAO.md`
  §5.2 dá ao SIGMINE. **Item a confirmar antes de publicar, se quisermos rigor total.**
- **Painéis externos.** A home e cinco páginas embutem um Power BI
  (monitoramento do saneamento) e dois Looker Studio (monitoramento das
  iniciativas do Estado, e um segundo em `/s/pHlfBbkBrsE`). Não abri nem
  tentei extrair — painel de BI de terceiro é outra ordem de esforço, e o
  dado subjacente pode estar disponível em planilha na mesma página.
- **Conteúdo dos 209 arquivos.** Testei que 20 de 20 abrem; **não li nenhum**.
  Não sei quantas páginas têm, se algum é digitalização sem texto, nem se há
  dado pessoal dentro. Antes de qualquer ingestão de conteúdo, rodar
  `scripts/checar-dado-pessoal.py`.

---

## 3. FGV — Projeto Rio Paraopeba: onde o dado realmente mora

### É SPA, e a API é de arquivos estáticos

`https://www18.fgv.br/projetorioparaopeba/dados-abertos.html` tem **8.542
bytes** e a tabela vem com `<tbody></tbody>` **vazio**. O conteúdo é montado
por `library/js/main_excel.js?v=12.34` (89.901 bytes). Lendo o JS, os quatro
endpoints:

| Endpoint | Bytes | O que traz |
|---|---:|---|
| `library/json/01_status_projetos.json` | **157.386** | 455 linhas de situação por projeto × município |
| `library/json/02_projetos_andamento.json` | **1.351.258** | 499 linhas com avanço FÍSICO aninhado |
| `library/json/03_saldo_dos_municipios.json` | **219.027** | a execução financeira — o melhor arquivo |
| `library/json/04_saldo_dos_municipios_grafico_pizza.json` | **6.018** | 26 linhas, resumo já agregado para o gráfico |

Todos `200 · application/json`, sem autenticação, sem paginação, sem chave.
Há ainda `library/svg/mapas/{cidade}.svg` (um SVG por município, não medido) e
as planilhas mensais:

```
projetos-dados/dados-abertos/geral-MM-AAAA.xlsx     # 06/2026 → 272.154 bytes
library/dados-abertos/financeiro-AAAA-MM.xlsx       # 06/2026 → 424.229 bytes
```

Medido: **`geral-07-2026.xlsx` responde 404**; `06-2026` é o mês mais recente
disponível em 15/08/2026, e a série começa em **09/2024** (`geral-09-2024.xlsx`,
181.363 bytes, existe). O `Last-Modified` de todos é 31/07/2026 — o servidor
regrava o lote inteiro a cada publicação.

⚠️ A tabela de "Dados abertos" da FGV **gera** os links por laço de meses, sem
verificar existência. O ETL antigo (`etl/betim/etl/apis/fgv_paraopeba.py`) já
trata isso recuando até 4 meses — continua correto.

### As datas que a própria FGV declara

| Campo | Valor em 15/08/2026 |
|---|---|
| `dataAtualizacaoRelatorio` (arquivo de status) | **20/07/2026** |
| menu do arquivo financeiro | "Última atualização em **15/07/2026**" |
| `changedWhen` (carimbo de publicação) | 31/07/2026 14:37 |

A cadência é mensal. Recoletar com mais frequência não traz dado novo — e é o
principal argumento contra automatizar (§3.3).

### 3.1. As quatro armadilhas, todas medidas

#### (a) O município mora numa célula mesclada

`Síntese Mun.por Projeto` tem **483 linhas, e 424 delas não têm a chave
`Município`**. A planilha de origem mescla a célula: o nome aparece só na
primeira linha do bloco de cada cidade, e as seguintes herdam. Ler linha a
linha sem propagar joga fora **88% do acervo**.

Este é o irmão exato do `sub_items[]` do ComunicaBR: o valor está um nível
mais fundo do que a primeira leitura sugere — só que aqui "mais fundo" é para
trás, na linha anterior.

#### (b) Rodapé disfarçado de município

No mesmo campo `Município` a FGV grava também `"Betim Total"` (subtotal de
bloco, 26 deles), `"Total Geral"`, `"Observações:"` e **cinco notas de rodapé
numeradas**. Contagem ingênua:

| Leitura | Municípios | Projetos |
|---|---:|---:|
| ingênua (`length` / valores distintos) | 59 | 483 |
| **real** | **26** | **450** |

Mesmo padrão em `Síntese Municípios Geral` (32 linhas → **26** municípios) e
em `Síntese Projetos Especiais` (9 linhas → **3** projetos).

#### (c) "Todos os Municípios de Minas Gerais" não é um município

`01_status_projetos.json` traz **27 nomes distintos** no campo `Municipios`.
Os 26 da bacia mais este rótulo, que marca projeto de alcance estadual.
Casar por nome sem tratar isso cria uma cidade que não existe — e é
exatamente o tipo de erro que `etl_default_de_cidade` já custou uma vez.

#### (d) A mesma coluna vem como número e como string

`"Valor do Acordo Atual (R$) (2) "` chega ora como `90878377.86` (número JS),
ora como `"90,878,377.86 "` — formato americano, com separador de milhar por
vírgula **e espaço rígido U+00A0 no fim**. Idem para os nomes de município
(`"Abaeté "`). Um parser que faça `parseFloat` direto grava `NaN`
silencioso, e a tela mostra "R$ NaN".

E uma quinta, menor: **os arquivos vêm com BOM UTF-8**. `res.json()` do Node
falha; é preciso ler o texto e tirar o `﻿`.

#### (e) Redundância que engana sobre o volume

`02_projetos_andamento.json` tem 499 linhas somando **6.933 entradas de avanço
físico** — mas são só **428 pares (projeto, município) distintos**, e o array
inteiro de avanço é **repetido idêntico em cada linha de município** (conferido:
as 25 linhas do projeto `DSO-00000001` carregam o mesmo array de 25 entradas).
Deduplicado, o mesmo conteúdo cabe em **112.084 bytes, 10.042 depois do gzip**
— 12× menor que o arquivo bruto.

### 3.2. Licença e termos

**Não encontrei termo de uso, licença nem política de dados** no site do
Projeto Rio Paraopeba. O que existe é a página `dados-abertos.html`, cujo
subtítulo é *"Salve os dados deste portal em planilha"* — convite explícito ao
download — e o e-mail de contato no rodapé, `projetorioparaopeba@fgv.br`.

Contexto que sustenta o uso: a FGV é auditora **nomeada pelo Juízo da 2ª Vara
da Fazenda Pública** para o Acordo, e o portal oficial do Governo de MG a
apresenta como "AUDITORIA SOCIOECONÔMICA" do Acordo. É dado de interesse
público sobre execução de acordo judicial. Uso com atribuição é defensável.

### 3.3. ⚠️ `robots.txt` da FGV veda o host inteiro

```
GET https://www18.fgv.br/robots.txt → 200
User-Agent: *
Disallow: /
```

Sem exceção, sem `Allow`. **`www18.fgv.br` é um host compartilhado de projetos
da FGV**, e a regra tem cara de política de infraestrutura, não de decisão
sobre este projeto — mas é uma manifestação explícita do servidor, e a regra
da casa é ser educado com ele.

Como esta rodada conciliou as duas coisas, e por quê:

- **duas requisições, não um rastreamento.** `scripts/coletar-execucao-fgv.mts`
  não segue link nenhum: pede dois JSON de caminho fixo, os mesmos que o
  navegador de qualquer visitante pede ao abrir a página financeira.
- **manual, nunca em CI.** Nada de agendador. A referência muda uma vez por
  mês; recoletar mais que isso não traz dado novo.
- **User-Agent que identifica o projeto** e 1,5 s de pausa entre as duas.
- **canal aberto:** se isso virar rotina, o caminho certo é pedir autorização
  em `projetorioparaopeba@fgv.br` **antes** de aumentar a frequência.

Registro honesto: o `etl/betim/etl/apis/fgv_paraopeba.py`, que já existe no
repositório desde 24/07/2026, baixa deste mesmo host **sem nenhuma dessas
ressalvas** — e com User-Agent de navegador falso. Isso é dívida, não
precedente. Fica anotado em `docs/TODO-PROXIMAS-RODADAS.md`.

---

## 4. O que foi ingerido nesta rodada

Ampliação do que já existia: `apps/web/lib/betim/paraopeba.ts` (migration
0022) traz a FGV **só para Betim**, e por banco — 19 iniciativas. Agora a
bacia inteira entra como **dado versionado e estático**, no padrão de
`lib/paraopeba/clipping-ij.ts`.

| Arquivo | O que é |
|---|---|
| `scripts/coletar-execucao-fgv.mts` | coletor manual, 2 requisições, valida conteúdo e aborta em vez de gravar torto |
| `apps/web/lib/paraopeba/execucao-fgv.ts` | dado gerado, 232.266 bytes |
| `apps/web/lib/paraopeba/execucao-fgv.test.ts` | **16 testes** travando cada uma das armadilhas de §3.1 |
| `apps/web/app/paraopeba/execucao/page.tsx` | a tela, servidor-renderizada |

### Os números que entraram, medidos

| | |
|---|---:|
| municípios | **26** |
| linhas (município × projeto) | **450** |
| projetos especiais | **3** |
| linhas de situação | **455** |
| **projetos distintos por trás dessas 455 linhas** | **234** |
| projetos de alcance estadual, marcados como tal | 3 |

Situação, **por projeto distinto** (não por linha): Em execução 176 ·
Concluído 24 · Em definição de viabilidade 12 · Cancelado 7 · Em processo de
conversão de obrigação 7 · Em detalhamento pela Vale 6 · Em análise pela FGV 2.
Soma 234, conferido.

Dinheiro, do arquivo da FGV, referência 20/07/2026:

| | |
|---|---:|
| acordo original nos 26 municípios | R$ 3.999.999.999,10 |
| corrigido pelo IPCA desde 04/02/2021 | **R$ 5.484.273.356,84** |
| reservado em projetos autorizados | R$ 4.780.952.787,38 (87,2%) |
| efetivamente pago | R$ 4.048.729.210,06 (73,8%) |

⚠️ **Divergência de arredondamento na própria fonte, medida:** somar o acordo
original dos 26 municípios dá R$ 4.000.000.000,01 contra os
R$ 3.999.999.999,10 que a FGV declara como Total Geral — **91 centavos**. A
soma do acordo corrigido, essa, bate ao centavo. Por isso o arquivo gravado
guarda o **total declarado pela FGV**, e a tela usa ele; um teste trava a
ordem de grandeza da divergência (menos de R$ 1) para avisar se uma linha
entrar ou sair.

⚠️ **R$ 5,48 bi não é o Acordo.** São os Anexos I.3 e I.4 — 14,6% dos R$ 37,6
bi. Mobilidade, segurança hídrica, fortalecimento do serviço público e
reparação socioambiental correm por fora, sob gestão do Estado. A tela diz
isso **antes** de mostrar o primeiro número, porque quem lê "R$ 5,48 bi" logo
depois de "Acordo de R$ 37,6 bi" conclui sozinho que 86% sumiram.

⚠️ **"Executado" é desembolso, não obra pronta.** A FGV chama a coluna de
"Execução Atualizada": é dinheiro que saiu. Avanço físico é o outro arquivo,
que esta coleta não traz (§5.2).

### Payload, medido

O risco de `docs/HANDOFF-PAYLOAD-LEGISLACAO.md` foi tratado antes de escrever
a tela: **não há componente de cliente**. A tabela é montada no servidor e o
detalhamento por município abre em `<details>` nativo — zero props
serializadas.

Medido no dev server da porta 3034, descontando as `<script>` que só existem
em desenvolvimento: **211.472 bytes de markup, 17.317 depois do gzip**
(~17 KiB). O teto do Worker é 25 MiB por asset. É aproximação (não é o
`.cache` do build), mas está três ordens de grandeza abaixo.

`execucao-fgv.ts` ficou **fora do barril** `lib/paraopeba/index.ts` de
propósito: reexportá-lo puxaria os 232 KB para dentro de qualquer componente
de cliente que importe o barril, que é exatamente como o payload da
legislação estourou.

---

## 5. O que ficou de fora, e o plano

### 5.1. Repasse aos 853 municípios — ✅ INGERIDO em 15/08/2026

> **Feito**, e na tela que este plano recomendou. Coletor
> `scripts/coletar-repasse-brumadinho-mg.mts`, dado em
> `apps/web/data/repasse-brumadinho-mg.json` (291 KB), camada em
> `apps/web/lib/brumadinho/repasse.ts` com 27 testes, e o bloco por cidade em
> `/[municipio]/prefeitura`. **1.214 de 1.214 linhas casaram** (853 + 142 +
> 219), 853 municípios distintos, e as três somas fecham em CENTAVOS com o
> TOTAL impresso na própria página: R$ 1.645.796.000,00. As três parcelas de
> cada uma das 853 cidades somam o total dela, e a população somada dá
> 21.168.791 — a de Minas em 2019, que é a testemunha de que a coluna lida é
> a certa.
>
> Duas correções ao plano abaixo, medidas na execução:
>
> 1. **O casamento por nome precisou de 5 apelidos, não de aproximação.**
>    Normalizar (caixa + acento) resolve 1.209 das 1.214 linhas. As 5 que
>    sobram — `SÃO THOMÉ DAS LETRAS`, `DONA EUSÉBIA`, `AMPARO DA SERRA`,
>    `SANTA RITA DO IBITIPOCA`, `CÓRREGO DANTAS` — são divergência de grafia
>    OFICIAL, não de digitação, e nenhuma normalização as alcança. Estão
>    resolvidas à mão em `APELIDOS`, com o código IBGE escrito por extenso
>    para poder ser conferido sem rodar nada. Distância de edição não foi
>    usada de propósito: `CÓRREGO DANTAS` tem três vizinhos plausíveis em
>    Minas (Córrego Danta, Córrego Fundo, Córrego Novo), e a linha vale
>    R$ 500 mil.
> 2. ⚠️ **O par de exemplo da armadilha do código IBGE circula ERRADO neste
>    projeto.** A anotação que abriu a rodada dizia "Betim é `3106200` (7) e
>    `310670` (6)". `3106200` é **Belo Horizonte** — o par curto dele é
>    `310620`. Betim é `3106705`, e é dele que sai `310670`, tirando o dígito
>    verificador. Quem pegou foi um teste que compara código com NOME; a
>    leitura humana passou por cima porque dois códigos começados em `3106`
>    ocupam o mesmo lugar na frase. Os dois pares estão travados em
>    `repasse.test.ts`.
>
> E a malha dos 853 com código de 7 dígitos **já existia no repositório** —
> não precisou de coleta nova nem de casar nome nenhum: `risco-climatico.json`
> tem os 853 códigos de 7 dígitos e `comunicabr-31.json` tem os 853 nomes do
> IBGE com o prefixo de 6. A junção pelo prefixo é exata, 853/853, sem colisão
> e sem sobra. Ver `malhaMinas()`.

**O plano original, mantido para registro:** é barato (uma
requisição, uma página, três tabelas HTML) e o dado é forte (853 municípios,
R$ 1,65 bi, base legal citada, atualizado em 11/08/2026). Mas é **estadual**,
não da bacia: colocá-lo em `/paraopeba` misturaria "os 26 que foram atingidos"
com "os 853 que receberam repasse", que é justamente a confusão que o portal
não deve criar.

O lugar natural é a **página de cada município** (`/[municipio]`) e/ou a
camada de dinheiro. Plano:

1. `scripts/coletar-repasse-brumadinho-mg.mts` — 1 requisição, parse das três
   tabelas, casamento por nome contra a malha de 853 municípios já existente
   no repositório. ⚠️ **A grafia do nome muda de tabela para tabela, e medi
   que muda dentro da mesma tabela:** a tabela 1 usa grafia normal
   (`"Belo Horizonte"`); as tabelas 2 e 3 gravam **os 361 nomes em CAIXA
   ALTA**, e a acentuação é inconsistente — na tabela 2, **44 de 142** têm
   acento (`"CARMÉSIA"`, `"CLÁUDIO"`) e as outras 98 não (`"ANGELANDIA"`,
   `"ARAPORA"`); na tabela 3, **0 de 219** têm acento (`"ACUCENA"`,
   `"ALPINOPOLIS"`). Normalizar (maiúsculas + remoção de diacríticos) nos
   dois lados antes de casar, e **recusar com motivo** o que não casar,
   nunca aproximar.
2. Grava `apps/web/data/repasse-brumadinho-mg.json` (estimativa: ~80 KB, não
   medido — o arquivo ainda não existe).
3. Teste travando 853 / 142 / 219 e os três totais.
4. Uma linha na página do município: quanto recebeu, em quantas parcelas, e o
   link para a lista do que a lei permite gastar.

### 5.2. Avanço físico da FGV (`02_projetos_andamento.json`)

**Recomendo ingerir depois, com tela própria.** É o dado que responde "a obra
andou?", que é diferente de "o dinheiro saiu?" — e é justamente o par que
falta para a tela de execução não ser lida como entrega. Deduplicado cabe em
10 KB gzip (§3.1e).

Não entrou nesta rodada por uma razão de escopo, não de custo: exige
deduplicação própria, uma decisão de produto sobre como mostrar
"planejado × executado" sem sugerir atraso onde não há, e o campo
`terminoReplanejado` (presente em 6.882 das 6.933 entradas) precisa de texto
que explique que **replanejar não é atrasar**.

### 5.3. Os 209 documentos do Pró-Brumadinho

**Não recomendo ingerir o conteúdo.** Recomendo catalogar os metadados (título,
ano, URL, tipo) das **99 entradas da página de legislações**, que já vêm com
título descritivo e âncora por ano — é uma requisição e casa com o padrão de
`lib/paraopeba/documentos.ts`. Baixar e indexar os 156 PDFs é outra ordem de
grandeza e passa pela checagem de dado pessoal.

### 5.4. Notícias do portal

**Bloqueado até o TRE oficializar o fim das eleições** (§2.1). Revisitar
depois; até lá, `RADAR-NOTICIAS-PARAOPEBA.md` continua sendo o caminho.

### 5.5. Painéis de BI

Power BI e dois Looker Studio, não abertos. Antes de tentar raspá-los, conferir
se o mesmo dado não está em XLSX na própria página — a página de legislações
publica planilha de valores por projeto em toda Deliberação.

---

## 6. Endpoints confirmados — resumo para a próxima ingestão

```bash
# Pró-Brumadinho (Governo de MG) — HTML servido, sem API, robots.txt permite
https://www.mg.gov.br/pro-brumadinho/pagina/reparacao-brumadinho-repasses-aos-853-municipios-de-mg
  # 347.464 bytes · 3 tabelas · 853 + 142 + 219 municípios · atualizada 11/08/2026
https://www.mg.gov.br/pro-brumadinho/pagina/reparacao-brumadinho-obrigacoes-de-pagar-da-vale-ao-estado
  # 2 tabelas · previsto x arrecadado até 31/07/2026
https://www.mg.gov.br/pro-brumadinho/pagina/reparacao-brumadinho-legislacoes-e-publicacoes-oficiais-documentos-sobre-o-acordo-judicial
  # 99 itens, âncoras 2019–2026
https://www.mg.gov.br/pro-brumadinho/busca-documentos     # 403 — exige login
https://www.mg.gov.br/pro-brumadinho/noticias             # 302 → bloqueio eleitoral
https://www.mg.gov.br/jsonapi                             # 404 — não há API

# FGV — Projeto Rio Paraopeba. ⚠️ robots.txt = Disallow: / (ver §3.3)
https://www18.fgv.br/projetorioparaopeba/library/json/03_saldo_dos_municipios.json   # 219.027 B
https://www18.fgv.br/projetorioparaopeba/library/json/01_status_projetos.json        # 157.386 B
https://www18.fgv.br/projetorioparaopeba/library/json/02_projetos_andamento.json     # 1.351.258 B
https://www18.fgv.br/projetorioparaopeba/library/json/04_saldo_dos_municipios_grafico_pizza.json # 6.018 B
https://www18.fgv.br/projetorioparaopeba/projetos-dados/dados-abertos/geral-06-2026.xlsx      # 272.154 B
https://www18.fgv.br/projetorioparaopeba/library/dados-abertos/financeiro-2026-06.xlsx       # 424.229 B
https://www18.fgv.br/projetorioparaopeba/projetos-convertidos.html   # 404 — link quebrado no portal de MG
```

---

*Levantado em 2026-08-15. Todos os endpoints desta página foram chamados e
responderam; todas as contagens e todos os bytes foram medidos, não estimados.
O que não foi confirmado está marcado como tal em §2.4, §3.2 e §5.*
