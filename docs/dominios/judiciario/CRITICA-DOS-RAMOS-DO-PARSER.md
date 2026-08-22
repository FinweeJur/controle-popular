# Crítica adversarial — 5 ramos, regex rodados contra os PDFs

> **Tipo:** DOMINIO
> **Domínio:** judiciario
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** dominio, referencia

## Sumário

- [Propósito](#propósito)
- [L1-2012 — **APROVADO COM RESSALVA**](#l1-2012-aprovado-com-ressalva)
- [L3-2019 — **APROVADO COM RESSALVA** (itens perfeitos, âncora de unidade defeituosa)](#l3-2019-aprovado-com-ressalva-itens-perfeitos-âncora-de-unidade-defeituosa)
- [L4-2022 — **APROVADO COM RESSALVA**](#l4-2022-aprovado-com-ressalva)
- [L3-2023 — **REPROVADO**](#l3-2023-reprovado)
- [L5-2026 — **REPROVADO**](#l5-2026-reprovado)
- [Tabela final](#tabela-final)
- [Origem](#origem)

Todas as medições abaixo foram feitas rodando os regex propostos, literalmente, com PyMuPDF 1.28 / Python 3.11. Scripts em `C:\Users\teste\AppData\Local\Temp\claude\C--Users-teste-Documents-Obsidian-Vault\187c81cb-ff06-4c21-b502-414df83fc936\scratchpad\crit\`.

Contagem de páginas confere nos 5: 170 / 310 / 445 / 910 / 1388.

**Item 6 (ordinal) — resolvido de uma vez para os 5 arquivos.** `ª` U+00AA e `º` U+00BA sobrevivem intactos à extração em todos: L1 131ª/239º, L3-2019 233/448, L4-2022 173/118, L3-2023 460/340, L5-2026 669/1640. Zero mojibake, zero `1o` cru, zero U+1D52. Testei unidade de cada grafia onde as duas existem: L1 `2.1 3ª Vara Cível` (ª) e `5.2 2º Ofício de Registro` (º) — ambas aceitas. Em L4-2022 nenhuma das 64 unidades usa `º` (o glifo existe no doc, mas só em "2º Região"), então nesse arquivo o teste de `º` é vazio, não aprovado.

---

## L1-2012 — **APROVADO COM RESSALVA**

### O que reproduziu exatamente
Rodei as 4 famílias + T3 + HEAD_L1 + ITEM_L1 escopado:

| | agente | eu |
|---|---|---|
| candidatas | 79 | **79** |
| aceitas | 77 | **77** |
| rejeitadas | 2 (`2.49`, `3.5`) | **2, os mesmos** |
| cabeçalhos | 79 (61/13/1/3/1) | **79, distribuição idêntica** |
| itens | 195 | **195** |
| por tipo | 172/14/9 | **172/14/9** |
| sequência a,b,c | 0 quebras | **0 quebras nos 79 blocos** |
| offset | 2 | **2, em 169/169 páginas com boilerplate** |
| unidades sem head | 11 | **11, mesma lista** |

O offset não é estimado: o boilerplate carrega o número impresso, e `impressa − idx = 2` em 169 páginas sem um único desvio. T3 realmente foi aplicado — as duas rejeições caem por não estar no dicionário curado de 77, e as 77 aceitas batem com **distância de página 0**, não 2.

A restrição de escopo do ITEM_L1 é mais importante do que o agente disse: `ITEM_L1` no corpo inteiro casa **265** vezes; escopado head→head dentro da unidade, 195. O escopo bloqueia 70 falsos positivos, não os poucos da pág. 21. Varri a cauda das 195: **zero** casos cujo texto começa com número de processo. Limpo.

### O que derrubei

**1. "15 blocos com 0 itens, TODOS dentro de 3.5.1–3.5.4" — falso.** São 13 em `3.5.x` e **2 em `3.6`** (Área de Tecnologia da Informação, pág. impressa 128). Li as duas: são RECOMENDAÇÃO: reais, em prosa ("O TJMG deverá implantar trilhas de auditoria de acordo com a Resolução 91"). Não é auditoria financeira; é um segundo formato de recomendação que o ramo perde.

**2. Truncamento de título: reportado 3 casos, medidos 8.** Comparei caractere a caractere os 77 títulos capturados contra o sumário:

| num | capturado | sumário |
|---|---|---|
| 3.2 | `Ocorrências na Corregedoria Geral da Justiça` | `...da Justiça de Minas Gerais` |
| 3.6 | `Ocorrências` | `Ocorrências na Área de Tecnologia da Informação` |
| 5.2 | `2º Ofício de Registro de Imóveis da Comarca de` | `...de Belo Horizonte` |
| 5.3 | `4º Ofício ... da Comarca de` | `...de Belo Horizonte` |
| **5.4** | `Cartório de Registro de Imóveis da Comarca de` | `...de São João Del Rei` |
| 5.5 | `1º Ofício ... da Comarca de` | `...de Conselheiro Lafaiete` |
| **5.6** | `1º Ofício ... da Comarca de` | `...de Barbacena` |
| **5.7** | `2º Ofício ... da Comarca de` | `...de Barbacena` |

Ou seja **6 das 7 unidades do capítulo 5**, não 3. Note 5.6 e 5.7: truncados, os dois viram a mesma string `1º/2º Ofício de Registro de Imóveis da Comarca de` — se alguém deduplicar por título, colide.

Além disso, `2.48` não é truncamento e sim divergência real: corpo diz `Primeira Unidade Jurisdicional...`, sumário diz `1ª Unidade Jurisdicional...`. Casar unidade por título entre anos vai falhar aqui.

**3. Subcontagem declarada mas não fechada.** 195 itens + 15 blocos D/R em prosa sem marcador = a contagem verdadeira de "determinações emitidas" é 210, não 195. O agente ofereceu o número mas deixou 195 no campo.

### Regex corrigido
As 4 famílias estão certas. A correção é de **uso**, não de forma: `UNI_L1_EXT` e `UNI_L1_ADM` não devem ter o grupo `titulo` consumido. Se for para capturar título do corpo, o EXT precisa da mesma técnica multi-linha do JUD:

```python
UNI_L1_EXT = r'(?ms)^[ \t]*(?P<num>5\.\d{1,2})\.[ \t]{1,4}(?!\d+\.)(?P<titulo>.{2,160}?)\s*\n[ \t]*(?:\d|$)'
```

Mas a recomendação real é: **título sempre do sumário**, e usar o do corpo só como asserção de sanidade.

---

## L3-2019 — **APROVADO COM RESSALVA** (itens perfeitos, âncora de unidade defeituosa)

### O que reproduziu
| | agente | eu |
|---|---|---|
| sumário | 35 | **35, entrada por entrada** |
| offset | 1 | **1, em 5 âncoras independentes** |
| aceitas | 26 únicos / 28 ocorrências | **26 / 28** |
| HEAD_L3 | — | **28** |
| ITEM corrigido no corpo | 98 | **98** |
| itens ancorados | 59 | **59** |
| por tipo | 5 det / 54 rec | **5 / 54** |
| sequência 1..N | contínua | **0 quebras nos 11 blocos** |
| blocos 0-item no apêndice | 17 | **17** |

Os 11 blocos reais e suas contagens: `[4]`, `[35]`, `[7]`, `[1]`, `[2]`, `[1]`, `[1]`, `[1]`, `[1]`, `[1]`, `[5]`. Confirmei que o apêndice (pág. 292–310) é mesmo a tabela `ACHADOS | RECOMENDAÇÕES` que reenuncia o corpo, e que o capítulo 4 (Vice-Presidências) genuinamente não tem seção no apêndice — logo não há determinação perdida ali.

### O que derrubei

**1. Dois dos 26 números têm DUAS ocorrências aceitas, e a primeira é lixo. Isto é o supercasamento que T3 deixou passar.**

```
num "5": pos 190799 pág.114  titulo='111 3º CAROT'      <-- "2º CAROT \n5.111 \n3º CAROT" (separador de milhar)
         pos 191064 pág.114  titulo='CORREGEDORIA-GERAL DA JUSTIÇA'   <-- a real

num "6": pos 284342 pág.167  titulo='739/79 A C'        <-- "Lei n. \n6.739/79" (número de lei)
         pos 286812 pág.169  titulo='SECRETARIA DAS CÂMARAS'          <-- a real
```

O agente reportou "28 casamentos, 26 números únicos" e nunca perguntou quais números duplicaram. Os dois suspeitos do briefing — separador de milhar e número de processo/lei — estão exatamente ali, e **passaram T3**: o de milhar cai na mesma página do cabeçalho real; o da lei cai a 2 páginas, dentro da tolerância ±2.

**Consequência medida, não hipotética.** O falso `6.` está em `pos 284342`; o bloco `5.2 RECOMENDAÇÕES:` está em `pos 285019`. Se a primeira ocorrência vence (que é o que o código do agente faz), a fronteira da unidade 6 abre **antes** do 5.2, e as **7 recomendações da Corregedoria/Extrajudicial migram para "SECRETARIA DAS CÂMARAS"**. São 7 de 59 itens, 12%, atribuídos à unidade errada.

**2. Título quebrado em 6 de 26** — e o agente não reportou nenhum:

| num | capturado | sumário |
|---|---|---|
| 3.1 | `TECNOLOGIA DA INFORMAÇÃO O PJ` | `TECNOLOGIA DA INFORMAÇÃO` (invadiu a linha seguinte) |
| 4 | `ADMISSIBILIDADE DE RECURSOS ESPECIAIS` | `...E EXTRAORDINÁRIO – 1ª VICE-PRESIDÊNCIA E 3ª VICE-PRESIDÊNCIA` |
| **5** | `111 3º CAROT` | `CORREGEDORIA-GERAL DA JUSTIÇA` |
| **6** | `739/79 A C` | `SECRETARIA DAS CÂMARAS` |
| 7.9 | `Desembargadora Maria Beatriz Madureira Pinheiro Costa` | `...Costa Caires` |
| 9 | `CONCLUSÃO O` | `CONCLUSÃO` |

**3. "26 unidades" é inflado.** Quatro dos 26 aceitos — `3.3 DETERMINAÇÕES:`, `3.4 RECOMENDAÇÕES:`, `5.2 RECOMENDAÇÕES:`, `6.4 Recomendação:` — são cabeçalhos de determinação que o TJMG numerou como se fossem seção. Não são unidades inspecionadas. Unidades reais ≈ **22**. Para série, contar 26 unidades em 2019 contra 64 em 2022 e 126 em 2026 já parte torto.

**4. "Zero blocos com 0 itens dentro da faixa do sumário (pág. ≤292)" — falso.** Há um: `RECOMENDAÇÕES` na pág. 292, que é o cabeçalho da primeira tabela do apêndice. Trivial, mas a afirmação foi feita como medida.

**5. "Cai de 98 para 11 com o lookahead" — medi 38, não 11.** A conclusão (remover o lookahead) continua certa; a evidência citada está errada por 3,5x.

### Regex corrigido — uma guarda de um token resolve tudo

```python
UNI_L3_2019 = re.compile(
  r'(?m)^[ \t]*(?P<num>\d{1,2}(?:\.\d{1,3})?)\.(?![0-9])[ \t]*\n?'
  r'(?P<titulo>(?:[^a-zà-ÿ\n]{4,140}(?:\n(?![ \t]*\d{1,2}[.)])[^a-zà-ÿ\n]{2,140}){0,3})'
  r'|Desembargador[a]?[ \t]+[^\n]{2,80}|Secretaria[ \t]+d[ao][ \t]+[^\n]{2,80}'
  r'|Setor[ \t]+d[ao][ \t]+[^\n]{2,80}'
  r'|(?i:DETERMINA[ÇC][ÃA]O|DETERMINA[ÇC][ÕO]ES|RECOMENDA[ÇC][ÃA]O|RECOMENDA[ÇC][ÕO]ES)[ \t]*:?)')
```

O `(?![0-9])` depois do ponto final. Medido: **candidatos brutos 599 → 26**, aceitos **26 ocorrências / 26 únicos, zero duplicata**, cobertura do sumário idêntica. Elimina milhar, número de lei e número de processo de uma vez. `ITEM_L3` sem lookahead e `HEAD_L3` ficam como estão — validados.

---

## L4-2022 — **APROVADO COM RESSALVA**

### O que reproduziu
| | agente | eu |
|---|---|---|
| sumário total / N.N | 75 / 64 | **75 / 64** |
| candidatas / aceitas / rejeitadas | 64 / 64 / 0 | **64 / 64 / 0** |
| offset | 0 | **0** |
| HEAD | 127 | **127** |
| itens (romano) | 590 | **590** |
| NULO_2022 com `\s+` | 4 | **4** |
| subseções `9.N` | 8 | **8** |

O offset eu medi por **via independente da deles**: para cada uma das 64 unidades, procurei no corpo o padrão `N.N.` seguido das 4 primeiras palavras do título do sumário com whitespace flexível. **64 de 64 ancoraram, todas com `declarada − idx = 0`.** Não usei o rodapé PJe. T3 foi de fato aplicada e de fato é folgada aqui — mas é folgada porque não sobra nada, não porque não filtra.

**Título está seguro neste ramo.** Testei os 64: o título do sumário aparece **literalmente** no início do corpo em 64/64 depois de normalizar whitespace. A decisão de não capturar título no regex e puxar do sumário está certa, e o caso `7.40` (título em 9 linhas de uma palavra) não quebra nada.

### O que derrubei

**1. `itensPorTipo` não fecha aritmeticamente e está trocado.** O agente diz `determinacao=298, recomendacao=279, boa_pratica=4, sem_tipo=2` → soma **583**, com 590 itens e "9 sem bloco". 583 + 9 = 592. Não fecha por nenhum caminho.

Minha medição, atribuindo cada item ao HEAD imediatamente anterior:

```
DETERMINAÇÕES  281  +  DETERMINAÇÃO   5  =  286  determinação
RECOMENDAÇÕES  298  +  RECOMENDAÇÃO   2  =  300  recomendação
BOAS PRÁTICAS    4
                                    total  590   ✓ fecha
```

O `298` do agente está do lado da determinação; no documento o 298 é de **recomendações**. Em 2022 o TJMG recebeu mais recomendação do que determinação — o relatório inverte isso.

**2. `sequenciaContinua: true` é falso.** Segmentando por `HEAD | destinatário` (que é a segmentação que o próprio agente diz ser a correta), **12 de 215 blocos com item quebram a sequência romana**, não 5. Casos reais medidos:

```
'DETERMINAÇÕES: À Presidência (i) Adotar as pro...'   -> [1,2,1,2]
'À Presidência: (i) A análise da viabilidade...'      -> [1,2,3,4,1,2,3,4,5,6]
'À Corregedoria: (iii) Regulamentar o envio...'       -> [3]      (começa em iii)
'À Presidência: (ii) Realizar treinamento...'         -> [2]      (começa em ii)
```

Os que começam em `ii`/`iii` são itens cortados por fronteira de seção — indicam item perdido ou fronteira errada, não só numeração do TJMG.

**3. A cobertura de itens é pior do que "só varas e gabinetes".** Distribuí os 590 itens por região do documento:

```
antes da 1ª unidade N.N  (caps 1–6, nível 1: Presidência, 3 VPs, Corregedoria)   16
dentro das 64 unidades N.N                                                      505
depois da última N.N     (caps 8/9/10: Unid. Administrativas, TI)                69
```

**85 dos 590 itens (14,4%) pertencem a unidades que este ramo não sabe nomear.** Não são 8 subseções de contexto — são 69 itens só no fim do documento, incluindo todo o bloco de TIC (os últimos 12 itens do PDF são recomendações de TI com `Prazo:`).

**4. Órfãos são 15, não 9**, e estão todos em `7.15.7` e `7.33.7` — as duas unidades onde o primeiro bloco vai direto de prosa para `À <destinatário>:` sem cabeçalho. Com atribuição por HEAD mais próximo, esses 15 herdam o tipo do **bloco da unidade anterior** — contaminação entre unidades, não só "tipo inferido".

### Regex corrigido

`regexUnidade`, `regexCabecalhoItem` e `regexMarcadorItem` ficam como estão — os três validados. Duas correções fora do regex:

- Cortar o span de item no cabeçalho de seção numerada, nunca só no próximo HEAD, para que os 15 órfãos de 7.15.7/7.33.7 não herdem tipo da unidade anterior.
- O `rom` do marcador aceita string vazia (`x{0,3}(?:ix|iv|v?i{0,3})` casa `""`). Neste arquivo não há `()` solto, então dá 590 dos dois jeitos — mas em outro ano `()` viraria item. Fechar:

```python
ITEM_L4 = r'(?m)^[ \t]*\((?P<rom>x{0,3}(?:ix|iv|v?i{1,3}|v))\)[ \t]*\n?[ \t]*(?=[A-ZÀ-Ý])'
```

---

## L3-2023 — **REPROVADO**

Este é o ramo onde o produto do projeto está em jogo (novo vs. cobrança de antigo), e é o ramo com o maior buraco.

### O que reproduziu — todas as contagens brutas
`UNI_L3` brutos **2408** ✓ · `HEAD_L3` **111** ✓ · `ITEM_L3` **521** ✓ · `PEND_L3` **21** ✓ · romano **142** ✓ · 93 cabeçalhos `N.N.k Determinações e recomendações` · itens novos com corte de escopo real **516** ✓ · 35 blocos com sequência quebrada ✓ (causa confirmada: **226** preâmbulos `Determina-se ... que` para 93 cabeçalhos, ~2,4 por cabeçalho, cada um reiniciando em `1)`).

Honestidade do agente sobre o supercasamento 5,5x está correta: medi **média 5,51 ocorrências aceitas por unidade**, com `6.2`, `6.12`, `6.13`, `6.15`, `6.16` casando 9 vezes cada.

### O que derrubei

**1. `offsetPaginaSumarioParaPdf: 0` está errado — é 1.**
Método: para cada uma das entradas do sumário, achei no corpo `N.N.` seguido das 4 primeiras palavras do título. **88 de 91 âncoras dão `declarada − idx = 1`.** Confirmação independente: o número impresso no topo de cada página é `idx + 1` em **907 de 910** páginas. O agente ancorou em 3 títulos de capítulo e leu errado. Efeito prático: T3 roda com viés sistemático de uma página, transformando a janela ±2 em [−1, +3]. Num ramo que já aceita 5,5 casamentos por unidade, é meia trava desperdiçada.

**2. Subcasamento grave — dois capítulos inteiros rendem ZERO item.**
Distribuí os marcadores por capítulo:

```
cap                 pgs   N)  roman   a)  (D.N)  "Determina-se"
1 PRESIDENCIA        28    3      0    8      0        3
2 1a VICE-PRES       18    8      0    0     21        1
3 2a VICE-PRES        5    0      0    0      0        0
4 3a VICE-PRES        8    0      6    1      0        1
5 CORREGEDORIA       22    5      1    6      0        1
6 GABINETES         265   84      0    7      0       54
7 VARAS             404  395     84    5      0      117
8 PRECATORIOS        37    0     34   25      0        4     <-- 0 itens contados
9 UNID. ADMINIST     57    0     17   22      0       44     <-- 0 itens contados
10 TIC               57   26      0    0      0        1
11 CONCLUSAO          2    0      0    0      0        0
```

Os capítulos 8 e 9 somam **94 páginas** e **48 preâmbulos "Determina-se"**, e `ITEM_L3` (`N)`) captura **zero**. O formato ali é marcador de LETRA. Texto literal medido no cap. 9:

> `a) Determina-se que a Presidência impulsione a realização de avaliações e estudos...`
> `b) Determina-se que a Presidência apresente informações detalhadas sobre as medidas...`

Rodando `[a-z])` + `(i)` nesses 94 páginas: **70 itens reais recuperáveis** (22 letra + 48 romano). O total verdadeiro de itens novos em 2023 é ≈ **586**, não 516. O agente mencionou o cap. 8 num limite e não quantificou; nunca mencionou o cap. 9, que é o pior dos dois.

**3. Novo vs. antigo — o agente errou nas duas direções.**

*Lado NOVO — melhor do que reportaram.* Refiz a classificação com corte de escopo de verdade (cabeçalho `Pendências da última inspeção` em linha própria → próximo cabeçalho numerado), em vez de bisect pela frase solta:

```
marcadores DENTRO dos 50 blocos de pendência:  N) = 0   (D.N) = 21   romano = 24
```

**Zero.** Nenhum marcador de formato novo cai dentro de bloco de pendência. Os "5 vazamentos" que o agente relatou não são pendência — li os 5: são a lista `5.6. Autoavaliação da unidade / projetos e boas práticas: 1) PROGRAMA DE GESTÃO DAS SERVENTIAS VAGAS ...`. É falso positivo do `ITEM_L3` em lista de auto-elogio, e ficou rotulado como pendência.

*Lado ANTIGO — muito pior do que reportaram.* `pendencia_anterior = 21` subconta em pelo menos 2x:
- 24 marcadores romanos dentro de blocos de pendência são determinações antigas transcritas com a formatação do relatório de origem (amostra: `DETERMINAÇÕES À 3ª Vice-Presidência: (i) Desenvolver mecanismo que permita a avaliação dos conciliadores...`). O agente identificou isso num limite e **excluiu de `itensTotais`**. Antigo real ≥ **45**.
- **42 dos 50 blocos de pendência não têm marcador nenhum.** Trazem a pendência numa tabela `Unidade avaliada | Determinação | Medidas adotadas`, com o campo declarado `Quantidade de determinações pendentes: N`. Esses blocos são invisíveis aos três regex.

**4. Não há separação determinação/recomendação alguma.** `itensPorTipo` rotula por *forma de marcador* (`novo_arabico`, `pendencia_anterior`), não por tipo. E o tipo é recuperável: no corpo inteiro, `Determina-se` aparece **226** vezes e `Recomenda-se` **1** vez. Ou seja, 2023 emitiu essencialmente só determinações — fato que não aparece em lugar nenhum do relatório, e que torna a comparação de série com 2019 (5 det / 54 rec) e 2022 (286/300) enganosa.

**5. Título.** Com o regex do contrato e "primeira ocorrência vence", 2 unidades saem com título-lixo (`'11. D'`, `'6. D'` — leitura truncada de cabeçalho de 3 níveis). Com a guarda abaixo, **87 de 88 títulos ficam exatos**.

### Regex corrigido

```python
# (a) mesma guarda de 2019 — mata o supercasamento de 3 níveis
UNI_L3_2023 = re.compile(
  r'(?m)^[ \t]*(?P<num>\d{1,2}(?:\.\d{1,3})?)\.(?![0-9])[ \t]*\n?'
  r'(?P<titulo>(?:[^a-zà-ÿ\n]{4,140}(?:\n(?![ \t]*\d{1,2}[.)])[^a-zà-ÿ\n]{2,140}){0,3})'
  r'|Desembargador[a]?[ \t]+[^\n]{2,80}|Secretaria[ \t]+d[ao][ \t]+[^\n]{2,80}'
  r'|Setor[ \t]+d[ao][ \t]+[^\n]{2,80})')
# medido: brutos 2408 -> 171 ; aceitos 88 ocorrencias / 88 unicos (1:1) ; titulos 87/88 exatos
# offset correto = 1, NAO 0

# (b) marcador de item para caps 8 e 9 (formato letra), hoje ausente do ramo
ITEM_L3_LETRA = re.compile(r'(?m)^[ \t]*(?P<m>[a-z])\)[ \t]*\n?[ \t]*(?=[A-ZÀ-Ý])')
# medido nos caps 8+9: 22 letra + 48 romano = 70 itens reais hoje perdidos

# (c) tipo do item vem do preambulo, nao do cabecalho
TIPO_L3_2023 = re.compile(r'(Determina|Recomenda)-se\b')
```

E o escopo de pendência precisa ser **cabeçalho em linha própria + corte no próximo cabeçalho numerado**, não `bisect` pela frase solta — foi essa diferença que produziu os 5 falsos "vazamentos".

---

## L5-2026 — **REPROVADO**

### O que reproduziu, e é bastante
| | agente | eu |
|---|---|---|
| cabeçalhos SEC (3 variantes) | 247 (123/118/6) | **247 (123/118/6)** |
| unidades derivadas | 126 | **126** |
| 11 frases de nulo | 65/4/10/7/4/1/5/5/3/1/1 = 106 | **contagem literal idêntica, uma a uma** |
| seções em branco | 7 | **7** (confirmei as 4 que meu corte inicial não pegou: só rodapé PJe entre o cabeçalho e o título da unidade seguinte) |
| sequência `ACHADO N` | 27/29 ok, quebra em 6.60.4 e 6.65.5 | **27/29, exatamente as duas** |

O catálogo de 11 frases-padrão e a descoberta da 3ª variante `Achados e Recomendações` são achados sólidos e verificados literal por literal. A 4ª semântica de "sem achado" (bloco deixado em branco por lapso editorial) é real.

### O que derrubei

**1. `offsetPaginaSumarioParaPdf: 1` está errado — é 0.** Três medições concordantes:
- Comparei os 247 cabeçalhos SEC contra a página declarada no sumário para o mesmo `num`: **246 de 247 dão `declarada − idx = 0`**.
- `1. PRESIDÊNCIA` está no idx **41**; o sumário declara **41**.
- O rodapé PJe da página idx 518 diz `Num. 6650764 - Pág. 518`.

**2. `itensTotais: 180` está errado — o regex deles dá 228.** Rodei `regexMarcadorItem` literal, case-insensitive, ancorado em início de linha, no corpo inteiro:

```
        agente      eu
ACHADO      51      57
DETERMINAÇÃO 93     135
RECOMENDAÇÃO 36      36   <- unico que bate
             ---     ---
             180     228
```

O buraco de 48 é localizável: **cap. 7 = 21 determinações, cap. 9 = 15 determinações + 4 recomendações**. É exatamente a região que o próprio limite #7 deles admite não ter validado ("não validei estatisticamente os capítulos 7, 8, 10 e 11") — e a suspeita se confirmou como 21% de subcontagem.

**3. O defeito de título é 30x maior do que reportado.** O agente diz que `TOC_LINE` falha "para uma fração não medida dos 40 gabinetes", medindo 2 casos. Medi os 126:

**60 das 126 unidades (48%) não têm título nenhum recuperável por `TOC_LINE`.** São 28 do cap. 4 (gabinetes), 31 do cap. 6 (varas), mais `5.1` e `10.5`. Causa confirmada lendo o sumário: o título quebra em duas linhas **dentro do próprio sumário**, antes do pontilhado:

```
4.12. GABINETE DO DESEMBARGADOR GENIL ANACLETO RODRIGUES
FILHO ....................................................... 205

10.5. CARTÓRIO DO 5º ÓFÍCIO DE NOTAS DE BELO HORIZONTE - MINAS
GERAIS ...................................................... 1242
```

O agente escreveu parser stateful de sumário para 2019 e 2023 e **não escreveu para 2026**, que é justamente onde a quebra é mais frequente. Como "o nome vem do sumário" é a solução adotada, metade das unidades de 2026 sai sem nome.

**4. T3 é parcialmente circular.** As 126 unidades são derivadas dos cabeçalhos do **corpo** (`num.rsplit('.',1)[0]`), não do sumário. Como 60 delas não têm entrada em `TOC_LINE`, T3 não tem contra o que comparar em 48% dos casos. `unidadesCandidatas == unidadesAceitas == 126` é verdade, mas não é evidência de trava — é evidência de que a trava não teve o que rejeitar.

**5. Cobertura de item: 51 de 247 seções.** Apenas **51 dos 247 cabeçalhos SEC contêm ao menos um marcador tipado**; 196 não contêm nenhum. Descontando 106 nulas + 7 em branco, sobram 134 com conteúdo, das quais **83 (62%) são prosa pura sem marcador**. Confere com o limite #1 deles (84/134) — mas significa que os "180 itens" (na verdade 228) cobrem 38% das seções com achado. E as 119 páginas depois do último SEC (idx 1269→1388) não têm **nenhum** marcador tipado.

### Regex corrigido

`regexUnidade`, `regexCabecalhoItem` e `regexMarcadorItem` estão certos e validados. As correções são de pipeline:

```python
# offset = 0, NAO 1

# titulo: TOC_LINE de uma linha perde 60/126. Trocar por scanner stateful:
def toc_stateful(txt):
    ent, buf = {}, ''
    for ln in txt.split('\n'):
        s = ln.strip()
        if not s: continue
        if not buf and not re.match(r'^\d', s): continue
        buf = (buf + ' ' + s).strip()
        m = re.search(r'^(?P<n>\d{1,2}(?:\.\d{1,3})*)\.\s+(?P<t>.*?)\s*\.{2,}\s*(?P<p>\d{1,4})$', buf)
        if m:
            ent[m.group('n')] = (re.sub(r'\s+',' ',m.group('t')).strip(), int(m.group('p'))); buf=''
        elif len(buf) > 400: buf = ''
    return ent
```

O 4º rótulo `texto_ausente` para as 7 seções em branco é uma proposta correta e deve entrar.

---

## Tabela final

| layout | unidades | itens | confiável para série? | por que |
|---|---|---|---|---|
| **L1-2012** | **77** (reproduzi 79 cand → 77 aceitas, 2 rejeitadas idênticas) | **195** contados, **210** reais | **sim** | Todas as contagens reproduziram ao número. Offset 2 medido em 169/169 páginas. Sequência a,b,c sem uma quebra em 79 blocos. Cauda dos 195 itens sem um único falso positivo. Ressalvas: 8 títulos truncados no corpo (não 3) — mas título vem do sumário, então não sangra; 15 blocos D/R em prosa rendem 0 item (2 deles em `3.6`, não em `3.5.x` como afirmado), logo o total verdadeiro é 210. |
| **L3-2019** | **26** aceitas, das quais **~22 são unidades reais** | **59** | **parcial** | Itens impecáveis: 59, 5 det / 54 rec, sequência perfeita, 11 blocos, offset 1 em 5 âncoras — tudo reproduzido. Mas a âncora de unidade tem 2 falsos positivos que **passaram T3**: `5.111` (milhar) e `Lei n. 6.739/79`. O falso `6.` abre antes do bloco `5.2`, mandando 7 dos 59 itens (12%) para a unidade errada. 6 de 26 títulos quebrados, 2 deles lixo total. 4 dos 26 "unidades" são cabeçalhos D/R. Confiável **depois** da guarda `\.(?![0-9])`, que testei: 599→26 brutos, 1:1, zero duplicata. |
| **L4-2022** | **64** (64/64/0, exato) | **590** | **parcial** | Unidade e marcador validados de ponta a ponta: 64/64 aceitas, offset 0 confirmado por 64 âncoras de título independentes, 590 itens, 127 cabeçalhos, 4 nulos, 8 subseções `9.N`, títulos do sumário achados literalmente no corpo em 64/64. Mas: `itensPorTipo` não fecha (583 ≠ 590) e está invertido — o real é **286 det / 300 rec / 4 boas práticas**; `sequenciaContinua: true` é falso (12 de 215 blocos quebram, incluindo blocos que começam em `ii`/`iii`); e **85 dos 590 itens (14%) caem fora das 64 unidades** (16 nos caps 1–6, 69 nos caps 8/9/10, incluindo todo o bloco de TIC). |
| **L3-2023** | 88–95 (5,5 casamentos por unidade com o regex do contrato) | 542 declarados; **novos reais ≈ 586, antigos reais ≥ 45** | **não** | Contagens brutas todas reproduzidas (2408/111/521/21/142), e o agente foi honesto sobre a duplicação. Mas: **offset medido como 0 é 1** (88/91 âncoras + numeração impressa em 907/910 páginas); **caps 8 e 9 (94 páginas, 48 "Determina-se") rendem ZERO item** porque usam marcador de letra — 70 itens reais perdidos; a pendência antiga está subcontada em >2x (21 reportados vs 21 `(D.N)` + 24 romanos, e 42 dos 50 blocos usam tabela sem marcador); e não há separação determinação/recomendação nenhuma, num documento onde `Determina-se` aparece 226x e `Recomenda-se` 1x. A distinção novo/antigo, que é o produto do projeto, está certa de um lado (zero `N)` dentro de pendência — melhor do que reportaram) e furada do outro. |
| **L5-2026** | **126**, mas **60 (48%) sem nome recuperável** | 180 declarados; **228 reais** | **não** | O trabalho de "sem achado" é excelente e verificado literal a literal: 11 frases somando 106, 7 seções em branco confirmadas, 247 cabeçalhos com a 3ª variante, sequência `ACHADO` 27/29 com as duas quebras exatas. Mas três medições estão erradas: **offset é 0, não 1** (246/247 cabeçalhos + rodapé PJe + `1. PRESIDÊNCIA` no idx 41); **itensTotais é 228, não 180** (achado 57 não 51, determinação 135 não 93 — as 48 faltantes estão nos caps 7 e 9, a região que eles admitem não ter validado); e o defeito mais caro do projeto está aqui em escala máxima — **60 de 126 unidades ficam sem título** porque o sumário quebra o nome em duas linhas e não escreveram parser stateful para 2026, embora tenham escrito para 2019 e 2023. Além disso T3 é circular para essas 60, e só 51 das 247 seções têm marcador tipado. |
