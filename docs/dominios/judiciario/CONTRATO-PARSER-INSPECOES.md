# Contrato do extrator único — relatórios de inspeção CNJ/TJMG (2012–2026)

> **Tipo:** DOMINIO
> **Domínio:** judiciario
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** dominio, referencia

## Sumário

- [Propósito](#propósito)
- [0. Premissa que governa o resto](#0-premissa-que-governa-o-resto)
- [1. Taxonomia de layouts](#1-taxonomia-de-layouts)
- [2. Contrato por layout](#2-contrato-por-layout)
- [3. Como o extrator escolhe o ramo](#3-como-o-extrator-escolhe-o-ramo)
- [4. A trava por layout](#4-a-trava-por-layout)
- [5. Campo comum de saída](#5-campo-comum-de-saída)
- [6. O que vai dar errado (do mais provável ao menos)](#6-o-que-vai-dar-errado-do-mais-provável-ao-menos)
- [Origem](#origem)

## 0. Premissa que governa o resto

O produto final não é "texto extraído". É uma tabela longitudinal onde a linha de 2012 e a linha de 2026 da **mesma vara** casam. Toda decisão abaixo é subordinada a isso: quando houver conflito entre "extrair mais itens" e "manter a chave de unidade confiável", a chave ganha. Item perdido é buraco visível; chave errada é conclusão falsa e silenciosa ("essa vara nunca reincidiu" quando ela reincidiu com outro nome).

---

## 1. Taxonomia de layouts

**São 5 layouts, não 7 documentos nem 6 anos.** O critério de agrupamento é o **marcador de item** (o que delimita a unidade mínima de conteúdo) somado à **gramática do cabeçalho de unidade**. Cabeçalho institucional, presença de sumário e formato do rodapé variam *dentro* do mesmo layout e por isso não são critério de ramo — são parâmetros.

| Layout | Documentos | Marcador de item | Cabeçalho de unidade | Fim do item |
|---|---|---|---|---|
| **L1 — Ocorrências/letra** | 2012 | `a)` `b)` `c)` sob heading `DETERMINAÇÕES:` | `N.N. <nome>` ancorado por `N.N.1. Ocorrências` (3 famílias) | próximo heading ou próxima unidade |
| **L2 — rótulo nu, item = bloco** | 2017 Unidades Judiciais **e** 2017 Unidades Administrativas | linha contendo **só** `DETERMINAÇÃO` / `RECOMENDAÇÃO` (4 grafias) | `N.N` + título em 1–3 linhas | próximo rótulo ou próximo `N.N` |
| **L3 — lista arábica** | 2019, 2023 | `1)` `2)` `3)` dentro do bloco de determinações | `N.` (caixa alta, órgão) e/ou `N.N.` (unidade) | próximo cabeçalho numerado |
| **L4 — lista romana + destinatário** | 2022 | `(i)` `(ii)` `(iii)` sob `Determinações e recomendações`, agrupados por destinatário | `N.N. GABINETE/VARA/UNIDADE…` | próximo romano/`(i)` de outra subseção ou próximo `N.N.N` |
| **L5 — rótulo tipado com dois-pontos** | 2026 | `ACHADO 1:` / `DETERMINAÇÃO:` / `RECOMENDAÇÃO:` | seções `N.N. Achados e Determinações` / `N.N. Recomendações`; nome vem do sumário | próximo rótulo tipado |

### Por que os dois 2017 são o mesmo ramo

O item é idêntico: rótulo sozinho na linha, texto corrido até o próximo rótulo, **sem enumeração interna**. O regex de unidade do Judiciais (`^\d{1,2}\.\d{1,2}` + título começando por maiúscula/ordinal) casa literalmente `2.1 Ausência de declaração de imposto de renda e bens` do Administrativas. A diferença é **semântica, não sintática**: um eixo é unidade jurisdicional, o outro é achado temático do Tribunal inteiro. Isso vira um campo (`escopo`), não um branch de parser.

### Por que 2019 e 2023 são o mesmo ramo (e a armadilha de fundir demais)

Ambos: `N)` + verbo imperativo, span terminado pelo próximo cabeçalho numerado. **Mas há uma divergência intra-ramo que precisa estar no contrato:** a medição de 2023 propôs filtrar falso-positivo exigindo maiúscula *sem newline* depois de `N)`. Em 2019 os itens reais têm newline (`"1) \nRetirar, no prazo de 10 dias…"`). **Aplicar o filtro de 2023 em 2019 derruba os 98 itens.** A regra correta, válida para os dois, é: permitir newline e **ancorar o span pelo heading-mãe**, nunca filtrar por micro-tipografia.

### Por que 2022 não entra em L3 apesar do heading igual

2022 e 2023 compartilham o nome da subseção (`Determinações e recomendações`) e mudam o marcador (`(i)` → `1)`). Isso é a prova de que **a detecção de ramo tem de olhar o marcador de item, não o nome da seção**. Se olhasse o nome, 2022 e 2023 cairiam juntos e 2022 renderia 0 itens (ou 590 itens atribuídos errado).

---

## 2. Contrato por layout

### Pré-processamento comum (roda antes de qualquer regex de conteúdo)

```python
import re, unicodedata, hashlib

# 1) boilerplate DINÂMICO: bloco de 1..8 linhas que repete em >=80% das páginas.
#    Nunca hard-codar o cabeçalho de um ano só; a versão literal por layout
#    (abaixo) é apenas o FALLBACK e a asserção de sanidade.
def blocos_repetidos(paginas, min_ratio=0.80, max_linhas=8):
    from collections import Counter
    c = Counter()
    for p in paginas:
        linhas = p.split("\n")
        for n in range(1, max_linhas + 1):
            for i in range(0, min(len(linhas) - n, 12)):        # só topo
                c["\n".join(linhas[i:i+n]).strip()] += 1
            for i in range(max(0, len(linhas) - 14), len(linhas) - n):  # só rodapé
                c["\n".join(linhas[i:i+n]).strip()] += 1
    piso = min_ratio * len(paginas)
    return [b for b, k in c.items() if k >= piso and len(b) > 25]

# 2) número de página solto (topo OU rodapé) — some depois do boilerplate
NUM_PAG_SOLTO = re.compile(r'(?m)^[ \t]*\d{1,4}[ \t]*\n(?=[ \t]*\n)')

# 3) hifenação e quebra de token numérico atravessando página
DEHIFEN   = re.compile(r'(\w)-[ \t]*\n[ \t]*(\w)')          # -> r'\1\2'
PROC_QUEB = re.compile(r'(\d)[ \t]*\n[ \t]*(\d{3}\b)')      # 1.0000.13.0367773/3-\n001
```

Ordem obrigatória: `texto_bruto → strip(boilerplate) → strip(NUM_PAG_SOLTO) → DEHIFEN → regex de unidade → regex de item`. Inverter isso é o defeito nº 1 da seção 6.

Sumário (todos os layouts têm um; usado como índice **e** como trava):

```python
TOC_LINE = re.compile(
    r'(?m)^[ \t]*(?P<num>\d{1,2}(?:\.\d{1,3}){0,2})\.?[ \t]+'
    r'(?P<titulo>.+?)[ \.\u2026]{2,}[ \t]*(?P<pag>\d{1,4})[ \t]*$')
TOC_LINE_SEMDOTS = re.compile(
    r'(?m)^[ \t]*(?P<num>\d{1,2}(?:\.\d{1,3}){0,2})\.?[ \t]+'
    r'(?P<titulo>\S.*?\S)[ \t]{2,}(?P<pag>\d{1,4})[ \t]*$')
```

O range de páginas do sumário é **detectado** (páginas com ≥8 casamentos de `TOC_LINE`), não fixado por ano, e é **excluído do corpo** antes do regex de unidade em todos os layouts.

---

### L1 — 2012

```python
# rodapé: NÃO EXISTE. O poluidor é CABEÇALHO, em 169/170 páginas.
BOILER_L1 = re.compile(
    r'(?m)^[ \t]*\n?(?:[ \t]*\n)*[ \t]*Conselho Nacional de Justi[çc]a[ \t]*\n'
    r'[ \t]*Corregedoria[ \t]*\n'
    r'[ \t]*Inspe[çc][ãa]o no Tribunal de Justi[çc]a e na Justi[çc]a Militar '
    r'do Estado de Minas Gerais[ \t]*\n(?:[ \t]*\n)*[ \t]*\d{1,3}[ \t]*\n')

# UNIDADE — três famílias; usar TODAS ou perde 16 das 77 entradas do índice.
UNI_L1_JUD = re.compile(                       # seções 1 e 2 (61 entradas)
    r'(?ms)^[ \t]*(?P<cap>\d{1,2})\.(?P<sub>\d{1,3})\.[ \t]*\n?'
    r'(?P<titulo>.{2,200}?)\n[ \t]*(?P=cap)\.(?P=sub)\.1\.?[ \t]*\n?[ \t]*Ocorr[êe]ncias')
UNI_L1_ADM = re.compile(                       # seção 3 (3.1–3.6)
    r'(?m)^[ \t]*(?P<cap>3)\.(?P<sub>\d{1,2})\.[ \t]*'
    r'Ocorr[êe]ncias[ \t]+(?:n[oa]s?|em|d[oa])[ \t]+(?P<titulo>[^\n]{2,160})')
UNI_L1_EXT = re.compile(                       # seção 5 (cartórios extrajudiciais)
    r'(?m)^[ \t]*(?P<cap>5)\.(?P<sub>\d{1,2})\.[ \t]*(?P<titulo>[^\n]{0,160})')

# ITEM — só dentro do span entre um heading e o próximo heading/próxima unidade
HEAD_L1 = re.compile(r'(?m)^[ \t]*(RECOMENDA[ÇC][ÕO]ES[ \t]*/[ \t]*DETERMINA[ÇC][ÕO]ES'
                     r'|DETERMINA[ÇC][ÕO]ES|RECOMENDA[ÇC][ÕO]ES)[ \t]*:?[ \t]*$')
ITEM_L1 = re.compile(r'(?m)^[ \t]*(?P<m>[a-z])\)[ \t\n]')
```

- **Sumário:** sim, páginas 2–3, 77 entradas — é o denominador da trava.
- **"Não há":** **nenhuma variante.** Ausência de achado = a seção inteira é omitida. Saída: `ausencia_motivo="secao_omitida"`. Um filtro de `não há` escrito para 2026 aqui casa zero e conclui, errado, que todo heading tem conteúdo real.
- Nota: `UNI_L1_EXT` é permissiva por desenho; ela só roda **restrita ao capítulo 5** delimitado pelo sumário, nunca no corpo inteiro.

### L2 — 2017 (Judiciais + Administrativas)

```python
BOILER_L2 = re.compile(
    r'(?s)PODER JUDICI[ÁA]RIO[ \t]*\n[ \t]*Conselho Nacional de Justi[çc]a[ \t]*\n'
    r'[ \t]*Corregedoria Nacional de Justi[çc]a[ \t]*\n(?:[ \t]*\n)*'
    r'(?:Correi[çc][ãa]o no Poder Judici[áa]rio de Minas Gerais.*?\n'
    r'[ \t]*Processo[ \t][\d./-]+[ \t]*\n(?:[ \t]*\n)*[ \t]*P[áa]gina[ \t]\d+[ \t]*\n'
    r'|[ \t]*\d{1,3}[ \t]*\n)')

UNI_L2 = re.compile(
    r'(?m)^[ \t]*(?P<num>\d{1,2}\.\d{1,2})(?!\d)\.?[ \t]*\n?'
    r'(?P<titulo>[ \t]*-?[ \t]*(?:[A-ZÀ-Ý]|\d{1,2}[ºªoa°])[^\n]{2,150}'
    r'(?:\n(?![ \t]*\d{1,2}\.\d{1,2})(?![ \t]*(?:DAS[ \t]+)?(?:DETERMINA|RECOMENDA))'
    r'[^\n]{2,150}){0,3})')

ITEM_L2 = re.compile(
    r'(?m)^[ \t]*(?:DAS[ \t]+)?(?P<tipo>DETERMINA[ÇC][ÃA]O|DETERMINA[ÇC][ÕO]ES'
    r'|RECOMENDA[ÇC][ÃA]O|RECOMENDA[ÇC][ÕO]ES)[ \t]*[:.]?[ \t]*$')
```

- O `(?!\d)` é o que impede `2.941`, `43.785`, `82.592` (separador de milhar, sempre 3 dígitos) de virarem unidade. Sem ele o falso-positivo é massivo.
- O alternante `\d{1,2}[ºªoa°]` é obrigatório: metade das unidades (49/102) começa por ordinal, e o regex "só maiúscula" mediu 53 em vez de 102.
- **Sumário:** sim (Judiciais 2–8; Administrativas 2–3). No Administrativas a numeração **pula 2.6 e 2.15** — a trava é o conjunto do sumário, nunca contiguidade.
- **"Não há":** **nenhuma variante de seção vazia.** As 86 variantes / 150 ocorrências são achado negativo substantivo ("Não há autos extraviados."). Nenhum dos 207 rótulos é seguido de `Não há` como boilerplate. **Descartar `Não há` aqui joga fora achado real.** Regra: em L2 o filtro de nulo está **desligado por contrato**.
- Colisão de chave: `7.3` aparece 2× com conteúdo diferente. Id de unidade em L2 é `(num, pagina_corpo)`, nunca `num`.

### L3 — 2019 e 2023

```python
BOILER_L3_2019 = re.compile(
    r'(?s)PODER JUDICI[ÁA]RIO[ \t]*\n.*?Corregedoria Nacional de Justi[çc]a[ \t]*\n'
    r'.*?Inspe[çc][ãa]o no Poder Judici[áa]rio do Estado de Minas Gerais.*?'
    r'Processo n\.[ \t]*[\d.\-/]+[ \t]*\n')
# 2023: não há rodapé de assinatura; só NUM_PAG_SOLTO. Não aplicar heurística
# de rodapé de outro ano aqui — ela remove conteúdo real.

UNI_L3 = re.compile(
    r'(?m)^[ \t]*(?P<num>\d{1,2}(?:\.\d{1,3})?)\.[ \t]*\n?'
    r'(?P<titulo>(?:[^a-zà-ÿ\n]{4,140}(?:\n(?![ \t]*\d{1,2}[.)])[^a-zà-ÿ\n]{2,140}){0,3})'
    r'|Desembargador[a]?[ \t]+[^\n]{2,80}'
    r'|Secretaria[ \t]+d[ao][ \t]+[^\n]{2,80}'
    r'|Setor[ \t]+d[ao][ \t]+[^\n]{2,80})')

HEAD_L3 = re.compile(
    r'(?im)^[ \t]*(?:\d{1,2}(?:\.\d{1,3}){1,2}\.[ \t]*)?'
    r'(?P<tipo>DETERMINA[ÇC][ÕO]ES(?:[ \t]+E[ \t]+RECOMENDA[ÇC][ÕO]ES)?'
    r'|RECOMENDA[ÇC][ÕO]ES(?:[ \t]+E[ \t]+DETERMINA[ÇC][ÕO]ES)?'
    r'|DETERMINA[ÇC][ÃA]O|RECOMENDA[ÇC][ÃA]O)[ \t]*:?[ \t]*$')

ITEM_L3 = re.compile(r'(?m)^[ \t]*(?P<m>\d{1,2})\)[ \t]*\n?[ \t]*(?=[A-ZÀ-Ý])')
PEND_L3 = re.compile(r'(?m)^[ \t]*\((?P<t>[DR])\.(?P<m>\d{1,2})\)[ \t]*')   # inspeção ANTERIOR
ACH_L3  = re.compile(r'(?m)^[ \t]*\((?P<rom>x{0,3}(?:ix|iv|v?i{0,3}))\)[ \t]+')  # achados 2023
```

- A classe `[^a-zà-ÿ\n]` cobre `ª` (U+00AA) e `º` (U+00BA), que ficam **fora** do range `À-Ý`/`à-ÿ`. Um char-class que só cobre acentuadas Latin-1 derrubou 7 de 49 unidades da série 7.x de 2023, em silêncio.
- `PEND_L3` e `ACH_L3` existem para **excluir**, não para contar como determinação: `(D.1)` é determinação da inspeção anterior (vai para `tipo="pendencia_anterior"`, `inspecao_origem="anterior"`), e `(i)` em 2023 é achado, não determinação.
- **Sumário:** sim (2019: 2–3; 2023: 2–5). Obrigatório excluir do corpo — os títulos são literalmente idênticos e duplicam a contagem.
- **"Não há":**
  - 2019 — **nenhuma variante de seção vazia**. As 5–6 ocorrências (`Não há edital de remoção.`, `Não havia pendências a serem inspecionadas.`) são resposta de questionário no corpo. Filtro desligado.
  - 2023 — **duas famílias, ambas obrigatórias**:
    ```python
    NULO_2023_DET = re.compile(
        r'N[ãa]o (?:h[áa]|houve) (?:determina[çc][õo]es?|recomenda[çc][õo]es?)'
        r'[^.\n]{0,140}\.', re.I)
    NULO_2023_ACH = re.compile(
        r'(?:a equipe n[ãa]o registrou achados relevantes'
        r'|n[ãa]o (?:foram|foi) identificad[oa]s? achados? relevantes?)', re.I)
    ```
    Um regex `Não há.*achad` não pega **nenhuma** das duas famílias de achado negativo (90 ocorrências). Ambas só valem dentro de 300 caracteres após o heading da subseção correspondente.

### L4 — 2022

```python
FOOT_L4 = re.compile(
    r'(?s)Num\.[ \t]*\d+[ \t]*-[ \t]*P[áa]g\.[ \t]*\d+[ \t]*\n'
    r'Assinado eletronicamente por:.*?\nhttps://www\.cnj\.jus\.br\S*[ \t]*\n'
    r'N[úu]mero do documento:[ \t]*\d+[ \t]*\n?')
# e DEPOIS, obrigatoriamente, NUM_PAG_SOLTO: o número no TOPO da página seguinte
# fica FORA do bloco de rodapé e aparece no meio de listas de processo ("…/0-004,\n28\n\n1.0000…").

UNI_L4 = re.compile(
    r'(?m)^[ \t]*(?P<num>\d{1,2}\.\d{1,2})(?!\d)\.[ \t]{1,4}'
    r'(?P<titulo>(?:GABINETE|VARA|\d{1,2}[ºª][ \t]*VARA|UNIDADE JURISDICIONAL'
    r'|JUIZADO|CENTRAL|TRIBUNAL DO J[ÚU]RI|COMARCA)[^\n]{0,130}'
    r'(?:\n(?![ \t]*\d{1,2}\.\d{1,2}\.\d)[^a-zà-ÿ\n]{2,130}){0,2})')

ITEM_L4 = re.compile(
    r'(?m)^[ \t]*\((?P<rom>x{0,3}(?:ix|iv|v?i{0,3}))\)[ \t]*\n?[ \t]*(?=[A-ZÀ-Ý])')

HEAD_L4 = re.compile(
    r'(?im)^[ \t]*(?:\d{1,2}(?:\.\d{1,3}){1,2}\.?[ \t]*)?'
    r'(?:DETERMINA[ÇC][ÕO]ES(?:[ \t]+E[ \t]+RECOMENDA[ÇC][ÕO]ES)?'
    r'|RECOMENDA[ÇC][ÕO]ES?(?:[ \t]+ao[ \t]+[^\n]{2,40})?)[ \t]*:?[ \t]*$')

DEST_L4 = re.compile(
    r'(?m)^[ \t]*[\u2022\uFFFD\u25CF•\-]?[ \t]*(?:A[oa][ \t]+|[ÀA][ \t]+)?'
    r'(?P<d>Presid[êe]ncia|Corregedoria(?:[ \t]+(?:Geral|Nacional))?|Gabinete'
    r'|Vara(?:/Magistrad[oa])?|Ju[íi]z[oa]?|Magistrad[oa]|Secretaria)[ \t]*[:/]')
```

- O bullet `•` chega como `\uFFFD` no PyMuPDF — o regex de destinatário **não pode depender dele**; ele é opcional.
- Romano reinicia por subseção → id do item é `(num_subsecao, destinatario, rom)`, nunca `rom`.
- **Sumário:** sim, 3–5.
- **"Não há":** **uma única variante de item vazio**, 4 ocorrências:
  ```python
  NULO_2022 = re.compile(
      r'Tendo em vista o bom funcionamento da unidade, n[ãa]o h[áa] '
      r'recomenda[çc][õo]es ou determina[çc][õo]es a serem feitas', re.I)
  ```
  Só vale dentro de 300 chars após `X.Y.Z Determinações e recomendações`. As dezenas de outros `Não há…` são constatação (`Não há apoio de juízes auxiliares`) e contá-las como vazio apaga achado.

### L5 — 2026 (extrator existente, reexpresso)

```python
SEC_L5  = re.compile(r'(?m)^[ \t]*(?P<num>\d{1,2}\.\d{1,3})\.[ \t]*'
                     r'(?P<sec>Achados e Determina[çc][õo]es|Recomenda[çc][õo]es)[ \t]*$')
ITEM_L5 = re.compile(r'(?m)^[ \t]*(?P<tipo>ACHADO[ \t]*(?P<n>\d+)?'
                     r'|DETERMINA[ÇC][ÃA]O|RECOMENDA[ÇC][ÃA]O)[ \t]*:[ \t]*')
```
Nome da unidade **vem do sumário**, porque o cabeçalho do corpo quebra palavra por palavra. `NULO_L5` mantém as duas variantes já implementadas, incluindo `N[ãa]o h[áa], no sentir da Equipe de Inspe[çc][ãa]o, recomenda[çc][õo]es a serem feitas`.

---

## 3. Como o extrator escolhe o ramo

**Nunca por nome de arquivo, nunca por metadado interno do PDF, nunca por ano informado.** O nome mente (`Inspeção_2012.pdf` vs `Relatório_de_Inspeção_-_TJMG_2023.pdf` — convenções diferentes) e o corpo mente também (o relatório de 2017 diz "Poder Judiciário do Estado de **Pernambuco**" por copy-paste do modelo).

```python
def detectar_layout(corpo):        # corpo = texto já sem boilerplate e sem sumário
    s = {}
    s["L5"] = 6 * len(re.findall(r'(?m)^[ \t]*ACHADO[ \t]*\d*[ \t]*:', corpo))
    s["L4"] = 3 * len(ITEM_L4.findall(corpo)) \
            + 20 * bool(re.search(r'Determina[çc][õo]es e recomenda[çc][õo]es', corpo))
    s["L3"] = 3 * len(ITEM_L3.findall(corpo)) \
            + 10 * len(PEND_L3.findall(corpo))
    s["L2"] = 8 * len(ITEM_L2.findall(corpo))
    s["L1"] = 15 * len(re.findall(r'(?m)^[ \t]*\d{1,2}\.\d{1,3}\.1\.?[ \t]*\n?[ \t]*'
                                  r'Ocorr[êe]ncias', corpo))
    # desempate estrutural obrigatório L2 x resto:
    # em L2 o rótulo é linha ISOLADA e NÃO é seguido, nas 3 linhas seguintes,
    # por marcador enumerado. Se for, é L1/L3/L4 com heading parecido.
    ...
    vencedor, segundo = sorted(s.items(), key=lambda kv: -kv[1])[:2]
    if vencedor[1] < 25 or vencedor[1] < 3 * max(segundo[1], 1):
        raise LayoutIndecidivel(s)   # ABORTA. Não escolhe "o mais provável".
    return vencedor[0]
```

Regras que sustentam esse desenho:

1. **O sinal é o marcador de item, não o nome da seção.** 2022 e 2023 têm o mesmo nome de subseção e marcadores diferentes; 2019 e 2023 têm nomes diferentes e o mesmo marcador. Quem detecta por nome erra os dois.
2. **`ACHADO…:` é sinal exclusivo de L5** (2019 e 2022 não usam a palavra como rótulo; 2023 usa achado mas com romano, sem dois-pontos).
3. **Desempate L2:** o traço definidor é a *ausência* de enumeração nas 3 linhas seguintes ao rótulo. É o único layout em que o item não tem marcador próprio.
4. **Empate ou score baixo aborta.** Não existe "ramo padrão". Um relatório futuro (2027+) com layout novo deve falhar alto, não ser processado pelo ramo mais parecido.
5. **Identidade do documento é fixada antes e reconferida depois:** `sha256`, nº de páginas, e o número do processo CNJ extraído da capa (`re.compile(r'\b\d{7}-\d{2}\.\d{4}\.2\.00\.\d{4}\b')`). O mesmo caminho no VHD `X:` já devolveu, na mesma sessão, o texto de **outro** relatório antes de estabilizar. Sem essa checagem o extrator atribui os achados de 2012 ao ano de 2017 e nada acusa.
6. Ano vem do processo CNJ e da capa, com o nome do arquivo apenas como **conferência** — divergência entre os dois é aviso registrado, não decisão.

---

## 4. A trava por layout

Princípio: **fail-closed**. A extração grava em `staging/<sha256>.jsonl`; a promoção para o dataset só ocorre se todas as travas passarem. Nenhuma escrita parcial.

### Travas universais (todos os ramos)

- **T0 — identidade:** `sha256` + páginas + processo CNJ iguais no início e no fim da extração. Diferente ⇒ aborta.
- **T1 — layout decidido:** score do vencedor ≥ 3× o do segundo e ≥ piso. Senão aborta.
- **T2 — cobertura do índice, por família:** todo `num` do sumário tem de ser reivindicado por alguma família de regex de unidade. A verificação é **por prefixo de capítulo**, não por percentual global. É o defeito do gate de 90% herdado de 2026: em 2012 o corpo rende 61 de 77 (79%) e as 16 faltantes são as **famílias inteiras 3.x e 5.x**. Um limiar global de 90% aborta corretamente por acidente; um limiar de 75% passaria e perderia duas seções inteiras em silêncio. A trava correta é: `set(capitulos_sumario) - set(capitulos_corpo) == ∅` **e** cobertura ≥ 95% dentro de cada capítulo.
- **T3 — página declarada bate:** para ≥90% das unidades, `|pagina_corpo - pagina_sumario - offset| ≤ 2`. Esta é a trava mais valiosa e a mais barata: é o documento afirmando por **outra via** onde cada unidade está. Ela mata o falso-positivo de tabela (um "8.13" lido dentro de um número de processo em 2012, um "43.78" de separador de milhar em 2017) porque o falso-positivo nunca cai perto da página que o sumário declara.
- **T4 — CPF antes de gravar:** token **isolado** de exatamente 11 dígitos (fronteira de token, jamais janela deslizante — deslizar mediu 546 falsos em 2022 contra 0 com fronteira) validado por mod-11 ⇒ redigido na origem. 2017-Administrativas tem 11 CPFs reais, crus, em tabela de pessoal. A suíte roda antes do commit do dado.

### Trava de item, por layout

| Layout | Via independente de item | Trava |
|---|---|---|
| **L1** | sim — letras `a) b) c)` | sequência tem de começar em `a` e crescer de 1. Buraco (`a, b, d`) ⇒ aborta com o span |
| **L3** | sim — arábicos `1) 2) 3)` | idem, começa em 1, sem salto |
| **L4** | sim — romanos por subseção | idem, começa em `i`, sem salto, **por (subseção, destinatário)** |
| **L5** | sim — `ACHADO 1:`, `ACHADO 2:` | idem |
| **L2 (2017)** | **NÃO EXISTE** | ver abaixo |

**L2 não tem via independente de conferência no nível de item, e isso é declarado em vez de contornado.** O item é um bloco de prosa sem enumeração: nada no documento afirma quantos são. Se o parser perder um rótulo (grafia nova, rótulo colado ao texto, rótulo que caiu sobre quebra de página), o item desaparece e **nenhuma aritmética do próprio documento acusa**. O que se faz nesse caso:

1. **Cobertura de bytes:** ≥85% dos caracteres do corpo (fora sumário e boilerplate) têm de estar atribuídos a alguma unidade. Não prova o número de itens, mas detecta região inteira não visitada.
2. **Densidade por rótulo:** todo rótulo casado tem de ter ≥200 caracteres de texto até o próximo rótulo/heading. Bloco vazio = rótulo espúrio ou span quebrado ⇒ aborta.
3. **Rótulo órfão:** varrer o corpo por `(?im)DETERMINA[ÇC][ÕA]|RECOMENDA[ÇC][ÕA]` em posição de **início de linha mas com texto na mesma linha** (grafia não prevista). Qualquer ocorrência não consumida pelo `ITEM_L2` ⇒ aborta e exige nova grafia no contrato.
4. **Amostragem humana obrigatória:** 10 blocos sorteados por documento, conferidos contra o PDF, registro versionado.
5. **`item_verificado: false` no output de 2017**, propagado até a análise. A série longitudinal precisa saber que o denominador de 2017 é o menos confiável dos seis. Um gráfico de "determinações por ano" que trate 2017 como igual aos demais está mentindo por omissão.

Observação sobre a natureza do sumário como via: ele é **outra via de renderização do mesmo documento**, não uma fonte externa. Basta para pegar erro de parsing (é isso que se quer). **Não** basta para pegar erro editorial do próprio CNJ — se o relatório esqueceu uma vara no sumário *e* no corpo, nada detecta. Nenhum destes seis documentos publica um totalizador de determinações; portanto **não existe, em nenhum ano, via independente para o número de itens** — só a continuidade do marcador, que é interna. Isso é um limite do corpus, não do extrator.

---

## 5. Campo comum de saída

Duas tabelas: `unidade` (uma linha por unidade por relatório) e `item` (uma linha por determinação/recomendação/achado).

```jsonc
// unidade
{
  "doc_sha256": "…",                 // identidade física
  "processo_cnj": "0004263-41.2019.2.00.0000",
  "ano_inspecao": 2019,              // do processo/capa, NUNCA do nome do arquivo
  "layout": "L3",
  "tribunal": "TJMG",                // da capa; NUNCA inferido do corpo (2017 diz "PERNAMBUCO")
  "escopo": "unidade | tema | orgao_central | extrajudicial",
  "num_secao": "7.22",
  "num_secao_id": "7.22@p283",       // num + página: 7.3 repete em 2017
  "pagina_sumario": 283, "pagina_corpo": 283,
  "titulo_raw": "2ª VARA DE FEITOS TRIBUTÁRIOS DO\nMUNICÍPIO DE BELO HORIZONTE",
  "titulo_join": "2ª VARA DE FEITOS TRIBUTÁRIOS DO MUNICÍPIO DE BELO HORIZONTE",
  // --- campos de casamento ---
  "tipo": "vara|gabinete|juizado|central|secretaria|cartorio|orgao_adm|tema",
  "comarca": "BELO HORIZONTE",       // null se não declarada. NUNCA default.
  "ordinal": 2,                      // null se não houver
  "materia": "feitos-tributarios",   // vocabulário controlado
  "titular": null,                   // só gabinetes; fora da chave
  "chave_canonica": "tjmg|vara|belo-horizonte|feitos-tributarios|02",
  "chave_confianca": 0.9,
  "item_verificado": true,           // false em L2/2017
  "sem_item": false,
  "sem_item_motivo": null            // "secao_omitida"|"texto_nulo_declarado"|"nao_aplicavel"
}
// item
{
  "doc_sha256":"…", "num_secao_id":"7.22@p283",
  "tipo": "determinacao|recomendacao|achado|pendencia_anterior",
  "inspecao_origem": "atual|anterior",     // (D.1)/(R.1) de 2023 são da anterior
  "marcador": "1)", "ordem": 1,
  "destinatario": "vara",                  // 2022 explícito; demais inferido do escopo
  "texto": "…", "texto_sha1": "…",
  "prazo_dias": 30,                        // r'(?:no )?prazo de (\d{1,3}) \(?[^)]{0,20}\)? ?dias'
  "pagina_inicio": 283
}
```

### Normalização do nome da unidade (o pipeline de casamento)

```
1. JUNTAR linhas do título até a próxima numeração/subseção (2–3 linhas em 2012,
   2017, 2022, 2023; palavra-por-palavra em 2026 — daí o sumário ser a fonte lá).
2. NFKD → remover diacríticos → upper → colapsar espaços.
3. Normalizar ordinal ANTES de tudo: "1ª"(U+00AA), "1º"(U+00BA), "1 ª", "1a",
   "1o", "PRIMEIRA", "PRIMEIRO" → inteiro. Regex:
   r'\b(\d{1,2})[ \t]*[ºªoa°]?\b|(?i:\b(primeir|segund|terceir|quart|quint|sext|setim|oitav|non|decim)[ao]\b)'
4. Remover ruído: "JUIZO DA", "JUIZO DE", "CARTORIO DA", "SECRETARIA DA",
   "GABINETE DO/DA DESEMBARGADOR(A)", "DA COMARCA DE", "DO MUNICIPIO DE".
5. Extrair COMARCA: só quando declarada no título OU no cabeçalho de capítulo
   que engloba a seção (ex.: cap. 7 de 2023 = "COMARCA DE BELO HORIZONTE").
   Se nenhuma das duas declara → comarca = null e chave_confianca ≤ 0.5.
   NUNCA default "Belo Horizonte" — default de cidade reetiqueta dado.
6. Mapear MATÉRIA por vocabulário controlado, com sinônimos versionados em
   materia_sinonimos.csv (revisado por humano, nunca aprendido do texto).
7. chave_canonica = tribunal|tipo|slug(comarca)|slug(materia)|ordinal(2 dígitos)
```

Exemplos reais, atravessando anos:

| Ano | Título cru | chave_canonica |
|---|---|---|
| 2012 | `2.1 3ª Vara Cível de Belo Horizonte` | `tjmg\|vara\|belo-horizonte\|civel\|03` |
| 2017 | `8.56 JUÍZO DA 14ª VARA CÍVEL DA COMARCA DE BELO HORIZONTE` | `tjmg\|vara\|belo-horizonte\|civel\|14` |
| 2023 | `7.22. 2ª VARA DE FEITOS TRIBUTÁRIOS DO MUNICÍPIO DE BELO HORIZONTE` | `tjmg\|vara\|belo-horizonte\|feitos-tributarios\|02` |
| 2012 | `2.20 2ª Vara dos Feitos da Fazenda Pública Municipal` | `tjmg\|vara\|null\|fazenda-publica-municipal\|02` conf. 0.5 |

As duas últimas são, muito provavelmente, **a mesma vara renomeada**. O extrator **não afirma isso**. Ele emite as duas chaves e o par vai para `crosswalk_unidades.csv` — arquivo versionado, par a par, com o ato normativo que justifica a fusão. Regra dura: **reincidência só é afirmada quando (a) as chaves canônicas são idênticas, ou (b) o par está no crosswalk aprovado.** Similaridade textual (fuzzy) **gera candidato para revisão humana, nunca casamento**.

### Casamentos que serão impossíveis, e por quê

1. **Gabinetes de desembargador.** A unidade é identificada pelo **titular**, não pela cadeira. 2012 (`Desembargadora Hilda Maria…`), 2017 (`7.1 Desembargador LUÍS CARLOS GAMBOGI`), 2022/2023 (`GABINETE DO DESEMBARGADOR X`). Titular muda por aposentadoria/promoção e migra entre câmaras. Reincidência de gabinete só é rastreável **por pessoa**, não por unidade. Mapear titular→cadeira exige fonte externa (composição do TJMG por ano, atos de posse) que **não está nestes PDFs**. Até existir essa fonte: `chave_canonica = tjmg|gabinete|…|<slug do titular>`, `chave_confianca = 0.4`, e a série de gabinetes é publicada como "por magistrado", rotulada como tal.
2. **2017-Administrativas.** Não tem unidade: são 18 achados temáticos sobre o Tribunal inteiro. Casa com as seções de órgão central de 2019 (`PRESIDÊNCIA`, `CORREGEDORIA-GERAL`) **por tema**, não por unidade. Precisa de um eixo paralelo `tema_canonico` com vocabulário controlado (declaração de bens, cargos em comissão, controle interno, frota, teletrabalho…). Um parser feito para "unidade = vara" casa **zero** e falha calado neste arquivo.
3. **Cartórios extrajudiciais.** Inspecionados em 2012 (seção 5) e 2017 (seção 9); ausentes nos demais. Não têm contraparte — a série é de 2 pontos, não de 6.
4. **Varas desmembradas, fundidas ou renumeradas por resolução.** O PDF nunca declara a sucessão. Só o crosswalk resolve, e ele exige o ato normativo do TJMG.
5. **Unidades que existiram só num ano** (mutirões, centrais criadas e extintas). São observação única por construção; qualquer "não reincidiu" sobre elas é vazio.
6. **Itens entre 2017 e os demais anos.** Determinações de 2017 são blocos de prosa sem granularidade comparável a `1)`/`(i)`. Contar "determinações por unidade" comparando 2017 com 2023 compara coisas diferentes. A saída carrega `granularidade_item: "bloco"|"enumerado"` e a análise deve segmentar por ela.

---

## 6. O que vai dar errado (do mais provável ao menos)

1. **Boilerplate no meio do item.** Confirmado em 2012 (cabeçalho corta o item 2.6.b ao meio) e 2019 (cabeçalho de 8 linhas, 310 ocorrências, corta a determinação 1). Se a remoção rodar depois do regex de item — ou se o literal do ano mudar uma palavra e o fallback dinâmico estiver desligado — o item fica truncado e o seguinte herda lixo. **A contagem não muda**, então nenhuma trava numérica acusa. Só a inspeção do texto acusa.
2. **Título de unidade cortado na primeira linha.** Quebra em 2–3 linhas em 2012 (≥20 de 61), 2017, 2022 (`JULIANA CAMPOS HORTA\nDE ANDRADE`), 2023 (`…CONTRA\nMULHER…`). Chave canônica truncada ⇒ a unidade parece nova a cada ano ⇒ **a conclusão vira "não há reincidência"**. É o erro mais caro do projeto inteiro e o mais fácil de não notar, porque tudo mais fica verde.
3. **`ª` U+00AA vs `º` U+00BA.** Já mediu: derrubou 7 de 49 unidades da série 7.x de 2023, em silêncio, por char-class. Some com `1 ª` (espaço), `1a`, e ordinal por extenso.
4. **Detecção de ramo em documento híbrido.** 2023 já tem três esquemas concorrentes no mesmo arquivo (`1)`, `(i)`, `(D.1)`). Um relatório futuro que misture `(i)` de 2022 com `N)` de 2023 pode pontuar alto no ramo errado e render itens plausíveis mas atribuídos à categoria errada.
5. **Sumário ausente, parcial ou em imagem.** A trava T2/T3 inteira depende dele. Se um PDF vier escaneado ou com o sumário sem camada de texto, o extrator tem de **parar**, não seguir sem trava. O modo "extrai sem conferência" não deve existir no código.
6. **Marcador de item fora da seção.** `a) b) c)` em lista de processos (2012, pág. 21); `N)` em prosa (2019, 2023). Sobrecontagem se o span não for delimitado por heading. Aqui o erro é para cima e a continuidade do marcador pode até "fechar", mascarando.
7. **Número de página solto no topo, dentro do item** (2022: `…0/0-004,\n28\n\n1.0000…`). Fica fora do bloco de rodapé. Contamina `texto_sha1` e pode ser lido como parte de número de processo ou como prazo.
8. **Três semânticas distintas de "sem achado" tratadas como uma.** 2012 omite a seção; 2022/2026 escrevem frase-padrão; 2017/2019 escrevem achado negativo em prosa que **não** é seção vazia. Colapsar isso produz "unidade limpa" onde há apenas ausência de dado — e, pior, em 2017/2019 **apaga achados reais** se o filtro de `não há` for aplicado.
9. **Separador de milhar e número de processo lidos como seção.** `2.941`, `43.785` (2017); `8.13.0017` (2012). Mitigado por `(?!\d)` e por T3 (página declarada), mas um número que por acaso caia perto da página certa passa.
10. **Número de seção reaproveitado.** `7.3` duas vezes em 2017 com conteúdo distinto. Chave por número puro sobrescreve em silêncio — a segunda ocorrência simplesmente some.
11. **CPF.** 11 reais, crus, válidos por mod-11, em tabela de pessoal de 2017-Administrativas. Se a redação rodar depois da gravação, vaza para o dataset. E mod-11 sobre janela deslizante gera 546 falsos em 2022 (números de processo). Fronteira de token, na origem, antes do commit.
12. **Estado/tribunal inferido do corpo.** 2017 afirma "Pernambuco" por copy-paste. Qualquer heurística que leia o corpo para determinar o tribunal etiqueta um relatório de MG como PE.
13. **Identidade do arquivo trocando embaixo do processo.** O mesmo caminho no VHD `X:` já devolveu, na mesma sessão, um relatório de 2012 antes de estabilizar em 2017. Sem T0, achados migram de ano sem nenhum sinal.
14. **Ordem de leitura do `fitz` em tabela de duas colunas** (folha de pagamento por volta da pág. 101 de 2012): valores fatiados intercalam com o texto seguinte e entram no `texto` do item.
15. **Encoding confundido com corrupção.** `ç`/`ã` chegam corretos como codepoint e o terminal do Windows mostra `�`. Checar `ord()` antes de "consertar" algo que não está quebrado — e não confundir com o caso real de perda (o bullet `•` de 2022, que **de fato** chega como `\uFFFD`).
