# -*- coding: utf-8 -*-
"""Extrator multi-layout dos relatorios de inspecao da Corregedoria Nacional.

Implementa `docs/judiciario/CONTRATO-PARSER-INSPECOES.md`, escrito a partir da
medicao dos 6 relatorios grandes do TJMG (2012, 2017 x2, 2019, 2022, 2023) mais
o de 2026.

═══ A PREMISSA QUE GOVERNA TUDO ═══

O produto nao e' "texto extraido". E' uma serie em que a linha de 2012 e a de
2026 da MESMA vara casam. Quando "extrair mais itens" conflitar com "manter a
chave de unidade confiavel", **a chave ganha**: item perdido e' buraco visivel;
chave errada e' conclusao falsa e silenciosa ("essa vara nunca reincidiu"
quando ela reincidiu com outro nome).

═══ CINCO LAYOUTS, NAO SEIS ANOS ═══

O criterio de ramo e' o MARCADOR DE ITEM, nunca o nome da secao nem o ano:

  L1  2012              `a) b) c)` sob `DETERMINACOES:`
  L2  2017 (os dois)    rotulo sozinho na linha, item = bloco de prosa
  L3  2019 e 2023       `1) 2) 3)`
  L4  2022              `(i) (ii) (iii)`, agrupados por destinatario
  L5  2026              `ACHADO 1:` / `DETERMINACAO:` / `RECOMENDACAO:`

⚠️ 2022 e 2023 tem o MESMO nome de subsecao ("Determinacoes e recomendacoes") e
marcadores diferentes; 2019 e 2023 tem nomes diferentes e o MESMO marcador.
Quem detecta por nome erra os dois.

⚠️ Nome de arquivo mente e o corpo tambem: o relatorio de 2017 diz "Poder
Judiciario do Estado de **Pernambuco**" por copiar-e-colar do modelo. Qualquer
heuristica que leia o corpo para decidir o tribunal etiqueta MG como PE.

═══ O QUE ESTE MODULO NAO FAZ, DE PROPOSITO ═══

**Nao afirma reincidencia por semelhanca de nome.** O contrato preve um
`crosswalk_unidades.csv` revisado a mao, com o ato normativo que justifica cada
fusao de vara renomeada/desmembrada. Enquanto ele nao existir, so' se afirma
reincidencia com **chave canonica identica**. Similaridade textual gera
candidato para revisao humana, nunca casamento.

E ha uma via melhor, que o proprio documento oferece: as secoes
**"Pendencias da ultima inspecao"** (52 em 2023, 24 em 2022), onde o CNJ faz a
propria conta do que ficou por cumprir. Ver `pendencias()`. Preferir sempre a
conta do documento a' nossa inferencia.
"""
import hashlib
import io
import re
import unicodedata
from collections import Counter

# ─────────────────────────── pre-processamento ─────────────────────────────

RE_NUM_PAG_SOLTO = re.compile(r"(?m)^[ \t]*\d{1,4}[ \t]*\n(?=[ \t]*\n)")
RE_LINHA_SUMARIO = re.compile(r"(?m)^.*\.{3,}\s*\d+\s*$")
RE_PROCESSO_CNJ = re.compile(r"\b\d{7}-\d{2}\.\d{4}\.2\.00\.\d{4}\b")


def blocos_repetidos(paginas, piso_fracao=0.80, max_linhas=8):
    """Acha o boilerplate MEDINDO, nao por literal de um ano so'.

    ⚠️ Em 2012 e 2019 o boilerplate e' CABECALHO (topo), nao rodape -- e ele se
    intromete NO MEIO de um item quando o item atravessa quebra de pagina.
    Removido depois do regex de item, o item sai truncado e o seguinte herda
    lixo -- **e a contagem nao muda**, entao nenhuma trava numerica acusa.
    Por isso roda primeiro, sempre.
    """
    c = Counter()
    for p in paginas:
        linhas = p.split("\n")
        for n in range(1, max_linhas + 1):
            for i in range(0, max(0, min(len(linhas) - n, 12))):
                c["\n".join(linhas[i:i + n]).strip()] += 1
            ini = max(0, len(linhas) - 14)
            for i in range(ini, max(ini, len(linhas) - n)):
                c["\n".join(linhas[i:i + n]).strip()] += 1
    piso = piso_fracao * len(paginas)
    return sorted((b for b, k in c.items() if k >= piso and len(b) > 25),
                  key=len, reverse=True)


def limpar(paginas):
    """Corpo sem boilerplate, sem linha de sumario e sem numero de pagina solto."""
    return limpar_com_paginas(paginas)[0]


def limpar_com_paginas(paginas):
    """(corpo_limpo, inicios) -- `inicios[i]` e' o offset da pagina i no corpo.

    ⚠️ Os offsets existem para a trava T3, que e' a mais barata e a mais
    valiosa: o sumario declara a pagina de cada secao, e um falso-positivo (um
    "5.111" que e' separador de milhar, um "6.739" que e' numero de lei) quase
    nunca cai perto da pagina declarada. Sem T3, o regex de unidade rendia
    **599 candidatos em 2019 e 2.408 em 2023** -- com ela, 26 e 88.

    Por isso a limpeza acontece PAGINA A PAGINA: juntar tudo e limpar depois
    perderia a fronteira, e sem fronteira nao ha como saber em que pagina um
    casamento caiu.
    """
    lixo = blocos_repetidos(paginas)
    limpas, inicios, acc = [], [], 0
    for p in paginas:
        for b in lixo:
            p = p.replace(b, "\n")
        p = RE_LINHA_SUMARIO.sub("", p)
        p = RE_NUM_PAG_SOLTO.sub("", p)
        inicios.append(acc)
        limpas.append(p)
        acc += len(p) + 1
    return "\n".join(limpas), inicios


def pagina_de(inicios, pos):
    """Indice 0-based da pagina do PDF em que `pos` cai."""
    lo, hi = 0, len(inicios) - 1
    while lo < hi:
        meio = (lo + hi + 1) // 2
        if inicios[meio] <= pos:
            lo = meio
        else:
            hi = meio - 1
    return lo


def medir_offset(indice, inicios, corpo, amostras=40):
    """Diferenca entre a pagina IMPRESSA no sumario e o indice de pagina do PDF.

    ⚠️ NAO SUPOR. Capa, folha de rosto e o proprio sumario deslocam, e o
    deslocamento muda de documento para documento: medido 2 em 2012, 1 em 2019,
    0 em 2022. Um agente reportou 0 para 2023 e o critico mediu 1 -- e offset
    errado por 1 faz T3 rejeitar tudo ou aceitar tudo.

    A medicao usa o proprio par (numero de secao -> pagina declarada): para
    cada numero achado no corpo, a diferenca entre a pagina real e a declarada.
    A moda vence.

    ⚠️ TEM DE OLHAR **TODAS** AS OCORRENCIAS, NAO A PRIMEIRA. A primeira versao
    usava `re.search` e pegava a estreia do numero no documento -- que costuma
    ser uma citacao cruzada ou o resto do sumario, nao o cabecalho real. O
    resultado foram offsets de **-200, -53 e -29**, e T3 passou a rejeitar tudo:
    2012 caiu de 52 unidades para ZERO, sem erro nenhum. Zero unidade por
    offset errado e' indistinguivel de zero unidade por documento vazio.

    Cada (numero, ocorrencia) vota. O offset verdadeiro aparece uma vez por
    cabecalho de verdade e domina; citacao cruzada espalha voto sem maioria.
    """
    diffs = Counter()
    for num, (_titulo, pag) in list(indice.items())[:amostras]:
        for m in re.finditer(r"(?m)^[ \t]*" + re.escape(num) + r"\.[ \t\n]", corpo):
            diffs[pagina_de(inicios, m.start()) - pag] += 1
    if not diffs:
        return 0
    melhor, votos = diffs.most_common(1)[0]
    # Offset plausivel: capa + folha de rosto + sumario. Fora disso a medicao
    # nao convergiu, e assumir 0 e' menos errado que assumir -200.
    return melhor if -5 <= melhor <= 60 and votos >= 3 else 0


def sumario(paginas, ate=None):
    """{numero: (titulo, pagina_declarada)} lido das entradas com pontilhado.

    E' a via independente do proprio documento -- a mesma tatica que pegou o
    pareamento errado no relatorio do JUSTA. Serve para conferir parsing; NAO
    serve para pegar erro editorial do CNJ (vara esquecida no sumario E no
    corpo nao e' detectavel por nada).
    """
    ate = ate or min(45, len(paginas))
    bruto = "\n".join(paginas[:ate])
    # Entrada nova sempre comeca por "N. " ou "N.N. "; o resto e' continuacao.
    junto = re.sub(r"\n(?!\s*\d+(?:\.\d+)*\.?\s)", " ", bruto)
    saida = {}
    for num, tit, pag in re.findall(
            r"(\d+(?:\.\d+)*)\.?\s+(.+?)\s*\.{3,}\s*(\d+)", junto):
        saida.setdefault(num, (re.sub(r"\s+", " ", tit).strip(), int(pag)))
    return saida


# ───────────────────────────── deteccao de ramo ────────────────────────────

ITEM_L1 = re.compile(r"(?m)^[ \t]*([a-z])\)[ \t]")
# ⚠️ O DOIS-PONTOS E' OPCIONAL, E ISSO DECIDE O RAMO. Medido em 2017-Judiciais:
# rotulo sozinho SEM dois-pontos = 5 ocorrencias; COM dois-pontos = **185**.
# A primeira versao exigia sem, pontuou 5, e o arquivo caiu em L3 -- que
# renderia itens plausiveis atribuidos ao esquema errado.
# O que separa L2 de L5 nao e' o dois-pontos: e' o rotulo estar SOZINHO na
# linha (L2) contra vir com numero e texto na mesma linha (L5, "DETERMINAÇÃO 1:
# Determinar a unidade que...").
ITEM_L2 = re.compile(
    r"(?m)^[ \t]*(DETERMINA[ÇC][ÃA]O|RECOMENDA[ÇC][ÃA]O)[ \t]*:?[ \t]*$")
ITEM_L3 = re.compile(r"(?m)^[ \t]*(\d{1,2})\)[ \t\n]")
# ⚠️ `x{0,3}(?:ix|iv|v?i{0,3})` casaria STRING VAZIA -- um "()" solto viraria
# item. Em 2022 nao ha "()", entao dava 590 dos dois jeitos; noutro ano daria
# item fantasma. Fechado com `i{1,3}` e a alternativa `v` explicita.
ITEM_L4 = re.compile(
    r"(?m)^[ \t]*\((x{0,3}(?:ix|iv|v?i{1,3}|v))\)[ \t]*\n?[ \t]*(?=[A-ZÀ-Ý])")
ITEM_L5 = re.compile(
    r"(?:^|[ \t])(ACHADO|DETERMINA[ÇC][ÃA]O|RECOMENDA[ÇC][ÃA]O)"
    r"[ \t]*(\d+)?[ \t]*:", re.M)
# `ACHADO n:` e' assinatura EXCLUSIVA de L5 (2019 e 2022 nao usam a palavra
# como rotulo; 2023 usa "achado" em prosa, sem dois-pontos).
ACHADO_L5 = re.compile(r"(?m)^[ \t]*ACHADO[ \t]*\d*[ \t]*:")
CAB_L1 = re.compile(r"(?m)^[ \t]*\d{1,2}\.\d{1,3}\.1\.?[ \t]*\n?[ \t]*Ocorr[êe]ncias")


class LayoutIndecidivel(Exception):
    """Score baixo ou empate. NAO existe 'ramo padrao'.

    Um relatorio futuro com layout novo tem de falhar alto, nao ser processado
    pelo ramo mais parecido -- que renderia itens plausiveis atribuidos a'
    categoria errada.
    """


def detectar_layout(corpo):
    """Ramo pelo MARCADOR DE ITEM. Nunca por nome de arquivo, ano ou metadado.

    ⚠️ `N)` aparece MUITO em todo ano (116 vezes ate' no relatorio de 2026, em
    listas dentro do texto). Se L3 competisse so' por contagem, ele venceria
    quase sempre -- foi o que aconteceu na primeira versao, que mandou 2026 e
    2017 para L3. Por isso as duas assinaturas EXCLUSIVAS decidem antes de
    qualquer contagem entrar na disputa.
    """
    n_achado = len(ACHADO_L5.findall(corpo))
    n_l2 = len(ITEM_L2.findall(corpo))
    s = {
        "L5": 6 * n_achado,
        "L4": 3 * len(ITEM_L4.findall(corpo))
              + 20 * bool(re.search(r"Determina[çc][õo]es e recomenda[çc][õo]es", corpo)),
        "L3": 3 * len(ITEM_L3.findall(corpo)),
        "L2": 8 * n_l2,
        "L1": 15 * len(CAB_L1.findall(corpo)),
    }
    # Assinatura exclusiva 1: `ACHADO n:` so' existe em L5.
    if n_achado >= 5:
        return "L5", s
    # Assinatura exclusiva 2: rotulo SOZINHO na linha so' existe em L2 -- nos
    # outros ramos o rotulo sempre vem acompanhado (numero, texto ou ambos).
    if n_l2 >= 20 and n_achado == 0:
        return "L2", s
    (vc, vp), (_sc, sp) = sorted(s.items(), key=lambda kv: -kv[1])[:2]
    if vp < 25 or vp < 3 * max(sp, 1):
        raise LayoutIndecidivel(s)
    return vc, s


# ────────────────────────────── unidades ───────────────────────────────────

# Uma ou mais familias por layout. Cada uma devolve (numero, titulo_cru, pos).
#
# ⚠️ UM LAYOUT PODE PRECISAR DE VARIAS FAMILIAS. Medido em 2012: a secao 2
# (varas) ancora em "N.N.1. Ocorrencias", a secao 3 (areas administrativas)
# embute "Ocorrencias no/na X" no proprio titulo, a 3.5.x nao tem ancora
# nenhuma, e a secao 5 (cartorios) e' diferente de todas. Uma familia so'
# cobria 61 das 77 unidades -- e as 16 perdidas eram DUAS SECOES INTEIRAS,
# nao casos isolados.
CAB_UNIDADE = {
    "L1": [
        # Varas e gabinetes: ancoradas pela subsecao "N.N.1. Ocorrencias".
        # ⚠️ "Principais ocorrencias" (minusculo) tambem existe -- exigir so'
        # a maiuscula perdia a unidade 2.46 em silencio.
        re.compile(
            r"(?ms)^[ \t]*(?P<num>\d{1,2}\.\d{1,3})\.?[ \t]*\n?(?P<titulo>.{2,220}?)"
            r"\n[ \t]*(?P=num)\.1\.?[ \t]*\n?[ \t]*(?:Principais[ \t]+)?[Oo]corr[êe]ncias"),
        # Areas administrativas: o titulo JA' e' "Ocorrencias no/na X" -- e as
        # vezes so' "Ocorrencias", com o resto do nome existindo apenas no
        # sumario (3.6).
        re.compile(
            r"(?m)^[ \t]*(?P<num>3\.\d{1,2})\.[ \t]*(?!\d)"
            r"(?P<titulo>[Oo]corr[êe]ncias(?:[ \t]+(?:n[oa]s?|em|d[oa])[ \t]+[^\n]{0,160})?)"),
        # Auditoria financeira (3.5.x): "N.N.N. Titulo" nu, sem ancora.
        # ⚠️ O (?![ \t]*\d) e' essencial: sem ele "3.5.4" recasa 15 vezes, uma
        # por subsecao-neta (3.5.4.2.1, 3.5.4.2.2, ...).
        re.compile(
            r"(?m)^[ \t]*(?P<num>3\.5\.\d)\.[ \t]*(?![ \t]*\d)\n?[ \t]*(?P<titulo>[^\n]{2,160})"),
        # Cartorios extrajudiciais.
        # ⚠️ (?!\d+\.) e nao (?!\d): titulo de cartorio COMECA com digito
        # ("2º Oficio de Registro..."), e rejeitar todo digito derrubava 5 das
        # 7 serventias.
        re.compile(
            r"(?m)^[ \t]*(?P<num>5\.\d{1,2})\.[ \t]{1,4}(?!\d+\.)(?P<titulo>[^\n]{2,160})"),
    ],
    "L2": [re.compile(r"(?m)^[ \t]*(?P<num>\d{1,2}\.\d{1,3})[ \t]+(?P<titulo>\S.{2,200})")],
    # ⚠️ O `(?![0-9])` depois do ponto e' o que separa secao de numero: sem ele,
    # "5.111" (milhar) e "Lei n. 6.739/79" viram cabecalho, e um deles abria um
    # bloco falso que mandava 7 de 59 itens para a unidade errada.
    "L3": [re.compile(
        r"(?m)^[ \t]*(?P<num>\d{1,2}(?:\.\d{1,3})?)\.(?![0-9])[ \t]*\n?"
        r"(?P<titulo>(?:[^a-zà-ÿ\n]{4,140}(?:\n(?![ \t]*\d{1,2}[.)])[^a-zà-ÿ\n]{2,140}){0,3})"
        r"|Desembargador[a]?[ \t]+[^\n]{2,80}|Secretaria[ \t]+d[ao][ \t]+[^\n]{2,80}"
        r"|Setor[ \t]+d[ao][ \t]+[^\n]{2,80})")],
    # ⚠️ O lookahead de palavra-chave (GABINETE|VARA|...) e' o que faz 64/64 em
    # 2022 sem um falso-positivo: o numero sozinho casaria com qualquer
    # paragrafo numerado.
    "L4": [re.compile(
        r"(?m)^[ \t]*(?P<num>\d{1,2}\.\d{1,2})(?!\d)\.[ \t]{1,4}"
        r"(?=(?:[^\n]*\n){0,9}?[^\n]{0,40}"
        r"(?:GABINETE|VARA|UNIDADE|JUIZADO|CENTRAL|TRIBUNAL DO J[ÚU]RI|COMARCA))"
        r"(?P<titulo>[^\n]{0,200})")],
    "L5": [re.compile(r"(?m)^[ \t]*(?P<num>\d+(?:\.\d+)*)\.[ \t]*\n?[ \t]*(?P<titulo>\S.{2,200})")],
}


TOLERANCIA_PAGINA = 2


def unidades_aceitas(corpo, layout, indice, inicios, offset):
    """Unidades que sobrevivem a T3: numero no sumario E pagina batendo.

    ⚠️ ESTA E' A TRAVA QUE TORNA O RESTO POSSIVEL. Sem ela, o regex de unidade
    rendia 599 candidatos em 2019 (26 reais) e 2.408 em 2023 (88 reais) -- e o
    excedente nao e' ruido inofensivo: cada falso-positivo ABRE UM BLOCO, e os
    itens que vem depois sao atribuidos a ele em vez da unidade certa.

    O titulo vem SEMPRE do sumario quando o numero existe la'. No corpo ele
    quebra em ate' 3 linhas (as vezes uma palavra por linha), e titulo truncado
    gera chave truncada -- a unidade parece nova a cada ano e a conclusao do
    projeto vira "nao houve reincidencia", com todo o resto verde.
    """
    vistos, saida = set(), []
    for familia in CAB_UNIDADE[layout]:
        for m in familia.finditer(corpo):
            num = m.group("num").rstrip(".")
            if num in vistos:
                continue
            no_sumario = indice.get(num)
            if not no_sumario:
                continue
            titulo, pag_declarada = no_sumario
            if abs(pagina_de(inicios, m.start()) - offset - pag_declarada) > TOLERANCIA_PAGINA:
                continue
            if len(titulo) < 3:
                continue
            vistos.add(num)
            saida.append((num, titulo, m.start()))
    saida.sort(key=lambda x: x[2])
    return saida


def unidades(corpo, layout, indice):
    """Candidatos SEM a trava T3. Uso solto/diagnostico apenas.

    ⚠️ Producao usa `unidades_aceitas`. Esta funcao superconta de proposito --
    e' com ela que se mede o quanto T3 esta filtrando.
    """
    vistos, saida = set(), []
    for familia in CAB_UNIDADE[layout]:
        for m in familia.finditer(corpo):
            num = m.group("num").rstrip(".")
            if num in vistos:
                continue
            vistos.add(num)
            do_sumario = indice.get(num)
            titulo = do_sumario[0] if do_sumario else re.sub(
                r"\s+", " ", (m.groupdict().get("titulo") or "")).strip()
            if len(titulo) >= 3:
                saida.append((num, titulo, m.start()))
    saida.sort(key=lambda x: x[2])
    return saida


# ─────────────────────────── itens dentro do span ──────────────────────────

CAB_ITEM = {
    # ⚠️ A grafia SINGULAR existe e nao estava catalogada. Medido em 2012:
    # "DETERMINAÇÕES:" 61x, mas tambem "DETERMINAÇÃO:" **13x** e
    # "RECOMENDAÇÃO:" 3x. Sem elas, 16 blocos inteiros ficavam invisiveis --
    # e um bloco invisivel nao gera erro, gera unidade "sem achado".
    "L1": re.compile(
        r"(?m)^[ \t]*(DETERMINA[ÇC][ÃAÕO]O?ES?|RECOMENDA[ÇC][ÃAÕO]O?ES?"
        r"(?:[ \t]*/[ \t]*DETERMINA[ÇC][ÃAÕO]O?ES?)?)[ \t]*:?[ \t]*$"),
    "L3": re.compile(
        r"(?im)^[ \t]*(?:\d{1,2}(?:\.\d{1,3}){1,2}\.[ \t]*)?"
        r"(DETERMINA[ÇC][ÕO]ES(?:[ \t]+E[ \t]+RECOMENDA[ÇC][ÕO]ES)?"
        r"|RECOMENDA[ÇC][ÕO]ES(?:[ \t]+E[ \t]+DETERMINA[ÇC][ÕO]ES)?"
        r"|DETERMINA[ÇC][ÃA]O|RECOMENDA[ÇC][ÃA]O)[ \t]*:?[ \t]*$"),
    # ⚠️ 2022 NAO usa "Determinacoes e recomendacoes" na mesma linha -- medido:
    # **ZERO** ocorrencias. Usa "DETERMINAÇÕES" e "RECOMENDAÇÕES" separados, com
    # o destinatario na linha seguinte ("À Presidência:"), e ainda "Boas
    # práticas". Procurar so' a forma composta rendia 0 item em 60 unidades
    # aceitas -- o pior tipo de falha, porque a unidade aparece e vem vazia.
    "L4": re.compile(
        r"(?im)^[ \t]*(DETERMINA[ÇC](?:[ÃA]O|[ÕO]ES)"
        r"|RECOMENDA[ÇC](?:[ÃA]O|[ÕO]ES)|Boas[ \t]+pr[áa]ticas)"
        r"(?:[ \t]+a[osaà]{0,2}[ \t]+[^\n:]{2,40})?[ \t]*:?[ \t]*$"),
}
MARCA_ITEM = {"L1": ITEM_L1, "L3": ITEM_L3, "L4": ITEM_L4}
# Sequencia esperada de cada marcador, para a trava de continuidade.
ALFABETO = [chr(ord("a") + i) for i in range(26)]
ROMANOS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
           "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"]


def itens_do_span(span, layout):
    """Itens de uma unidade.

    ⚠️ O marcador NAO e' exclusivo de determinacao: `a) b) c)` tambem aparece
    em lista de processos (2012, pag. 21) e `N)` em prosa (2019, 2023). Por
    isso a busca so' roda DENTRO do bloco aberto por um cabecalho de item --
    nunca no corpo inteiro, que superestimaria.
    """
    if layout == "L5":
        marcas = list(ITEM_L5.finditer(span))
        saida = []
        for k, m in enumerate(marcas):
            f = marcas[k + 1].start() if k + 1 < len(marcas) else len(span)
            saida.append({"tipo": m.group(1).upper(),
                          "marcador": m.group(2),
                          "texto": re.sub(r"\s+", " ", span[m.end():f]).strip()})
        return saida

    if layout == "L2":
        marcas = list(ITEM_L2.finditer(span))
        saida = []
        for k, m in enumerate(marcas):
            f = marcas[k + 1].start() if k + 1 < len(marcas) else len(span)
            saida.append({"tipo": m.group(1).upper(), "marcador": None,
                          "texto": re.sub(r"\s+", " ", span[m.end():f]).strip()})
        return saida

    cabs = list(CAB_ITEM[layout].finditer(span))
    saida = []
    for j, cab in enumerate(cabs):
        fim = cabs[j + 1].start() if j + 1 < len(cabs) else len(span)
        bloco = span[cab.end():fim]
        tipo = "RECOMENDAÇÃO" if re.match(r"(?i)recomenda", cab.group(1)) else "DETERMINAÇÃO"
        marcas = list(MARCA_ITEM[layout].finditer(bloco))
        for k, m in enumerate(marcas):
            f = marcas[k + 1].start() if k + 1 < len(marcas) else len(bloco)
            saida.append({"tipo": tipo, "marcador": m.group(1),
                          "texto": re.sub(r"\s+", " ", bloco[m.end():f]).strip()})
    return saida


def sequencia_quebrada(itens, layout):
    """Devolve o primeiro salto na sequencia do marcador, ou None.

    O marcador enumerado e' a UNICA via interna de conferencia de item que
    estes documentos oferecem -- nenhum ano publica totalizador. L2 nao tem
    marcador, e por isso `item_verificado` sai False la'. Ver o contrato.
    """
    if layout in ("L2", "L5"):
        return None
    esperado = ROMANOS if layout == "L4" else (
        ALFABETO if layout == "L1" else [str(i + 1) for i in range(200)])
    vistos = [i["marcador"] for i in itens if i["marcador"]]
    for pos, marca in enumerate(vistos):
        if pos < len(esperado) and marca.lower() != esperado[pos]:
            return {"posicao": pos, "esperado": esperado[pos], "achado": marca}
    return None


# ───────────────────────── normalizacao da unidade ─────────────────────────

RUIDO = re.compile(
    r"\b(JUIZO DA|JUIZO DE|CARTORIO DA|CARTORIO DE|SECRETARIA DA|"
    r"GABINETE DO DESEMBARGADOR|GABINETE DA DESEMBARGADORA|GABINETE DO|"
    r"GABINETE DA|DA COMARCA DE|DO MUNICIPIO DE|DA COMARCA DO)\b")
ORDINAL_EXT = {"primeir": 1, "segund": 2, "terceir": 3, "quart": 4, "quint": 5,
               "sext": 6, "setim": 7, "oitav": 8, "non": 9, "decim": 10}
MATERIAS = [
    ("execucao-penal", r"EXECU[CÇ][AÃ]O(?:ES)? PENA"),
    ("violencia-domestica", r"VIOL[EÊ]NCIA DOM[EÉ]STICA"),
    ("infancia-juventude", r"INF[AÂ]NCIA"),
    ("garantias", r"GARANTIAS"),
    ("toxicos", r"T[OÓ]XICO"),
    ("criminal", r"CRIMINAL|CRIMES?"),
    ("fazenda-publica", r"FAZENDA P[UÚ]BLICA|FEITOS TRIBUT"),
    ("familia", r"FAM[IÍ]LIA"),
    ("civel", r"C[IÍ]VEL|CIVEL"),
    ("consumo", r"CONSUMO|RELA[CÇ][OÕ]ES DE CONSUMO"),
    ("empresarial", r"EMPRESARIAL|FALENC"),
    ("precatorios", r"PRECAT[OÓ]RI"),
    ("juizado-especial", r"JUIZADO ESPECIAL"),
]
TIPOS = [
    ("gabinete", r"GABINETE|DESEMBARGADOR"),
    ("juizado", r"JUIZADO"),
    ("vara", r"\bVARA\b|UNIDADE JURISDICIONAL"),
    ("turma", r"TURMA RECURSAL"),
    ("orgao-central", r"PRESID[EÊ]NCIA|CORREGEDORIA|NUPEMEC|CEJUSC|EJEF|"
                      r"DIRETORIA|SECRETARIA"),
    ("serventia", r"SERVENTIA|TABELIONATO|REGISTRO DE IM[OÓ]VEIS|CART[OÓ]RIO"),
]


def _sem_acento(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def _ordinal(t):
    """O ordinal e' o que separa a 3a da 14a Vara Civel -- perde-lo funde varas.

    ⚠️ `ª` (U+00AA) e `º` (U+00BA) sao caracteres DIFERENTES e ja derrubaram 7
    de 49 unidades de uma serie por char-class, em silencio. Some com "1 ª"
    (com espaco), "1a", "1o" e o ordinal por extenso.
    """
    m = re.search(r"\b(\d{1,2})[ \t]*[ºªoa°]", t)
    if m:
        return int(m.group(1))
    m = re.search(r"\b(%s)[ao]\b" % "|".join(ORDINAL_EXT), t, re.I)
    if m:
        return ORDINAL_EXT[m.group(1).lower()]
    m = re.match(r"^[ \t]*(\d{1,2})[ \t]+[A-Z]", t)
    return int(m.group(1)) if m else None


def _primeiro(pares, t):
    for chave, pad in pares:
        if re.search(pad, t):
            return chave
    return None


def chave_canonica(titulo, comarca_do_capitulo=None, tribunal="tjmg"):
    """Chave estavel entre anos, com o grau de confianca ao lado.

    ⚠️ **NUNCA usar 'Belo Horizonte' como default de comarca.** Default de
    cidade reetiqueta dado -- ja custou caro noutro eixo deste projeto. Sem
    comarca declarada no titulo nem no capitulo, comarca fica `null` e a
    confianca cai; o par vai para revisao humana, nao para o grafico.
    """
    t = _sem_acento(titulo).upper()
    t = re.sub(r"\s+", " ", t).strip()
    tipo = _primeiro(TIPOS, t) or "outra"
    ordinal = _ordinal(t)
    materia = _primeiro(MATERIAS, t)

    m = re.search(r"COMARCA (?:DE|DO|DA) ([A-Z' ]{3,40})", t)
    if m:
        comarca = m.group(1).strip()
    elif re.search(r"MUNIC[IÍ]PIO DE ([A-Z' ]{3,40})", t):
        comarca = re.search(r"MUNIC[IÍ]PIO DE ([A-Z' ]{3,40})", t).group(1).strip()
    else:
        comarca = comarca_do_capitulo

    if tipo == "gabinete":
        # A unidade e' identificada pelo TITULAR, nao pela cadeira. Titular
        # muda por aposentadoria e migra de camara -- reincidencia de gabinete
        # so' e' rastreavel POR PESSOA, e mapear titular->cadeira exige fonte
        # externa que nao esta nestes PDFs. Serie publicada como "por
        # magistrado", rotulada como tal.
        nome = RUIDO.sub("", t).strip(" .")
        return ("%s|gabinete|%s" % (tribunal, _slug(nome)), 0.4)

    limpo = RUIDO.sub("", t).strip(" .")
    conf = 1.0
    if comarca is None:
        conf = 0.5
    if materia is None:
        conf = min(conf, 0.6)
        materia = _slug(limpo)[:40] or "indefinida"
    chave = "%s|%s|%s|%s|%s" % (
        tribunal, tipo, _slug(comarca) if comarca else "null",
        materia, "%02d" % ordinal if ordinal else "00")
    return (chave, conf)


def _slug(s):
    if not s:
        return ""
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-",
                                     _sem_acento(s).lower())).strip("-")


# ───────────────── a conta que o PROPRIO documento faz ─────────────────────

RE_PENDENCIA = re.compile(
    r"(?m)^[ \t]*(\d+(?:\.\d+)*)\.?[ \t]*\n?[ \t]*"
    r"Pend[êe]ncias da [úu]ltima inspe[çc][ãa]o[ \t]*$")


def pendencias(corpo, indice):
    """Secoes "Pendencias da ultima inspecao" -- o CNJ conferindo a si mesmo.

    ⚠️ ESTA E' A MELHOR RESPOSTA A "o que NAO mudou". Medido: 52 secoes em 2023
    e 24 em 2022. E' o proprio orgao dizendo, unidade por unidade, o que foi
    determinado na inspecao anterior e o que continua por cumprir.

    Preferir SEMPRE esta conta a' nossa inferencia por casamento de chave: a
    nossa depende de normalizacao de nome (fragil, ver `chave_canonica`); a
    do documento e' afirmacao do orgao, citavel, e nao depende de nada nosso.
    """
    saida = []
    marcas = list(RE_PENDENCIA.finditer(corpo))
    for k, m in enumerate(marcas):
        fim = marcas[k + 1].start() if k + 1 < len(marcas) else len(corpo)
        bloco = corpo[m.end():fim]
        corte = re.search(r"\n[ \t]*\d{1,2}(?:\.\d{1,3})*\.[ \t\n]", bloco)
        if corte:
            bloco = bloco[:corte.start()]
        texto = re.sub(r"\s+", " ", bloco).strip()
        num = m.group(1)
        pai = ".".join(num.split(".")[:-1])
        saida.append({
            "secao": num,
            "unidadeNumero": pai or None,
            "unidade": (indice.get(pai) or (None,))[0],
            "texto": texto,
            # Contagem crua dos veredictos que o proprio texto usa.
            "mencionaCumprida": len(re.findall(r"\bcumprid", texto, re.I)),
            "mencionaNaoCumprida": len(re.findall(
                r"n[ãa]o (?:foi |foram )?cumprid|descumpri|n[ãa]o atendid", texto, re.I)),
            "mencionaReiterada": len(re.findall(r"reiterad", texto, re.I)),
        })
    return saida


def sha256_de(caminho):
    h = hashlib.sha256()
    with io.open(caminho, "rb") as f:
        for pedaco in iter(lambda: f.read(1 << 20), b""):
            h.update(pedaco)
    return h.hexdigest()
