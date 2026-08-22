# -*- coding: utf-8 -*-
"""Serie longitudinal dos relatorios de inspecao do TJMG (2012 -> 2026).

Roda `cnj_layouts` sobre todos os relatorios de um orgao e produz UM dataset
comparavel entre anos, com as travas do contrato
(`docs/judiciario/CONTRATO-PARSER-INSPECOES.md`) aplicadas antes de gravar.

═══ AS DUAS PERGUNTAS, E POR QUE ELAS TEM RESPOSTAS DE QUALIDADE DIFERENTE ═══

**"Quem traz mais problema no TJMG?"** -- respondida com o dado de UM ano, por
unidade. E' robusta: nao depende de casar nome entre anos.

**"O que NAO mudou ao longo dos anos?"** -- tem DUAS respostas, e elas nao
valem o mesmo:

  (a) A conta do PROPRIO CNJ, nas secoes "Pendencias da ultima inspecao"
      (52 em 2023, 24 em 2022). E' afirmacao do orgao, citavel, e nao depende
      de nada nosso. **E' a resposta que vai para a tela.**

  (b) Nossa inferencia por chave canonica repetida entre anos. Depende de
      normalizar nome de vara, e o proprio contrato avisa que titulo truncado
      faz a unidade parecer nova todo ano -- o que produziria "nao ha
      reincidencia" com tudo verde. **Sai como indicio, sempre rotulada, e
      nunca sozinha.**

⚠️ Reincidencia so' e' afirmada com chave canonica IDENTICA. Semelhanca textual
gera candidato para revisao humana, jamais casamento -- o crosswalk de varas
renomeadas exige o ato normativo do TJMG, que nao esta nestes PDFs.
"""
import argparse
import glob
import io
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

from cnj_layouts import (  # noqa: E402
    LayoutIndecidivel, chave_canonica, detectar_layout, itens_do_span,
    limpar_com_paginas, medir_offset, pendencias, sequencia_quebrada,
    sha256_de, sumario, unidades, unidades_aceitas, RE_PROCESSO_CNJ)
from cnj_temas import cobertura, temas_de  # noqa: E402
from cnj_inspecoes import redigir_cpf  # noqa: E402

DADOS = os.path.abspath(os.path.join(AQUI, "..", "..", "dados"))
MIN_CHARS = 1000
# L2 nao tem marcador enumerado, entao nao ha via interna de conferencia de
# item. O contrato manda declarar isso e propagar ate' a analise: um grafico de
# "determinacoes por ano" que trate 2017 como igual aos demais mente por
# omissao.
SEM_VERIFICACAO_DE_ITEM = {"L2"}


def ano_de(texto, caminho):
    """Ano pelo CONTEUDO, com o nome do arquivo so' como conferencia.

    ⚠️ Nome de arquivo mente (convencoes diferentes por ano) e o corpo tambem:
    o relatorio de 2017 diz "Poder Judiciario do Estado de Pernambuco" por
    copiar-e-colar do modelo. Por isso o ano sai de data explicita no texto, e
    a divergencia com o nome vira AVISO registrado, nao decisao silenciosa.
    """
    do_nome = re.search(r"(20\d{2})", os.path.basename(caminho))
    do_nome = int(do_nome.group(1)) if do_nome else None
    anos = [int(a) for a in re.findall(r"\b(20[0-2]\d)\b", texto[:8000])]
    do_texto = max(set(anos), key=anos.count) if anos else None
    aviso = None
    if do_nome and do_texto and do_nome != do_texto:
        aviso = ("ano do nome do arquivo (%d) diverge do mais citado no inicio "
                 "do texto (%d); usado o do nome" % (do_nome, do_texto))
    return (do_nome or do_texto), aviso


def comarca_do_capitulo(indice, num):
    """Comarca herdada do capitulo que engloba a secao, quando ele a declara.

    ⚠️ NUNCA cair para 'Belo Horizonte' por default -- default de cidade
    reetiqueta dado, e ja custou caro noutro eixo deste projeto.
    """
    partes = num.split(".")
    for corte in range(len(partes) - 1, 0, -1):
        t = (indice.get(".".join(partes[:corte])) or ("",))[0]
        m = re.search(r"COMARCA (?:DE|DO|DA) ([A-ZÁÉÍÓÚÂÊÔÃÕÇ' ]{3,40})", t.upper())
        if m:
            return m.group(1).strip()
    return None


def extrair(caminho, tribunal="tjmg"):
    import fitz

    sha_antes = sha256_de(caminho)
    doc = fitz.open(caminho)
    paginas = [p.get_text() for p in doc]
    n_pag = doc.page_count
    doc.close()

    bruto = "\n".join(paginas)
    if len(bruto.strip()) < MIN_CHARS:
        return {"arquivo": os.path.basename(caminho), "estado": "digitalizado",
                "paginas": n_pag, "caracteres": len(bruto.strip()),
                "motivo": ("PDF de imagem, sem camada de texto. Sem OCR nao ha "
                           "o que extrair -- e gravar lista vazia afirmaria "
                           "que o ano nao teve achado nenhum.")}

    # T4: CPF redigido ANTES de qualquer coisa ser guardada.
    texto, n_cpf = redigir_cpf(bruto)
    paginas = [redigir_cpf(p)[0] for p in paginas]
    corpo, inicios = limpar_com_paginas(paginas)
    indice = sumario(paginas)
    # ⚠️ Offset MEDIDO, nunca suposto: 2 em 2012, 1 em 2019, 0 em 2022. Errar
    # por 1 faz T3 rejeitar tudo ou aceitar tudo.
    offset = medir_offset(indice, inicios, corpo)

    try:
        layout, scores = detectar_layout(corpo)
    except LayoutIndecidivel as e:
        return {"arquivo": os.path.basename(caminho), "estado": "layout_indecidivel",
                "paginas": n_pag, "scores": e.args[0],
                "motivo": ("Nenhum ramo venceu por 3x. NAO existe ramo padrao: "
                           "processar pelo mais parecido renderia itens "
                           "plausiveis atribuidos ao esquema errado.")}

    ano, aviso_ano = ano_de(texto, caminho)
    proc = RE_PROCESSO_CNJ.search(texto)

    candidatos = unidades(corpo, layout, indice)
    uns = unidades_aceitas(corpo, layout, indice, inicios, offset)
    registros = []
    for k, (num, titulo, pos) in enumerate(uns):
        fim = uns[k + 1][2] if k + 1 < len(uns) else len(corpo)
        span = corpo[pos:fim]
        its = itens_do_span(span, layout)
        if not its:
            continue
        quebra = sequencia_quebrada(its, layout)
        chave, conf = chave_canonica(
            titulo, comarca_do_capitulo(indice, num), tribunal)
        texto_junto = " ".join(i["texto"] for i in its)
        registros.append({
            "secao": num,
            "unidade": titulo,
            "chaveCanonica": chave,
            "chaveConfianca": conf,
            "paginaDeclarada": (indice.get(num) or (None, None))[1],
            "itens": its,
            "temas": temas_de(texto_junto),
            "caracteres": len(texto_junto),
            "sequenciaQuebrada": quebra,
        })

    pends = pendencias(corpo, indice)

    # ─── travas, ANTES de devolver ───────────────────────────────────────
    problemas = []
    if sha256_de(caminho) != sha_antes:
        problemas.append("T0: o arquivo mudou embaixo da extracao (sha256 diferente)")
    cap_sumario = {n.split(".")[0] for n in indice if "." in n}
    cap_corpo = {r["secao"].split(".")[0] for r in registros}
    faltando = sorted(cap_sumario - cap_corpo)
    quebradas = [r["secao"] for r in registros if r["sequenciaQuebrada"]]

    # ─── o documento serve para a serie? diga, nao deixe adivinhar ───────
    #
    # ⚠️ Extracao fraca NAO PODE entrar na serie como se fosse igual as outras.
    # Um ano que rende 1 unidade de 124 entradas de sumario, colocado no mesmo
    # grafico que um ano que rende 75 de 81, produz uma "queda" que e' defeito
    # do parser, nao do TJMG. E ninguem olhando o grafico saberia.
    aceitas_frac = len(uns) / max(len(candidatos), 1)
    confiavel, motivo = True, None
    if layout == "L5":
        confiavel = False
        motivo = ("O ramo generico de L5 rende 1.122 'unidades' aceitas (o "
                  "sumario deste relatorio tem 1.155 entradas, quase todas "
                  "subsecao) e so' 8 com item. Para 2026 vale o extrator "
                  "dedicado, `cnj_inspecoes.py --achados`, que ancora nas "
                  "secoes 'Achados e Determinacoes' e rende 123 secoes em 98 "
                  "unidades. Nao somar os dois.")
    elif len(registros) < 5:
        # ⚠️ O corte e' por unidade COM ITEM, nao por unidade aceita. Um
        # documento pode aceitar 6 unidades e so' duas terem conteudo -- e' o
        # caso dos dois relatorios de 2017 (L2), onde o rotulo de item nao tem
        # marcador e o cabecalho nao ancora em nada. Contar as aceitas deixava
        # 2017 entrar na serie representado por DUAS unidades, ao lado de anos
        # com sessenta.
        confiavel = False
        motivo = ("So' %d unidade(s) com item, de %d aceitas e %d entradas de "
                  "sumario. O layout L2 nao tem marcador enumerado e o "
                  "cabecalho nao ancora em nada -- a extracao deste documento "
                  "nao esta resolvida."
                  % (len(registros), len(uns), len(indice)))
    elif faltando:
        motivo = ("Capitulos do sumario sem nenhuma unidade no corpo: %s. Nao "
                  "invalida o ano, mas a cobertura e' parcial." % ", ".join(faltando))

    return {
        "arquivo": os.path.basename(caminho),
        "estado": "ok",
        "sha256": sha_antes,
        "paginas": n_pag,
        "caracteres": len(texto),
        "ano": ano,
        "avisoAno": aviso_ano,
        "processoCnj": proc.group(0) if proc else None,
        "layout": layout,
        "offsetDePagina": offset,
        "unidadesCandidatas": len(candidatos),
        "unidadesAceitasPorT3": len(uns),
        "fracaoAceitaPorT3": round(aceitas_frac, 3),
        "confiavelParaSerie": confiavel,
        "motivoDeRessalva": motivo,
        "scoresDeLayout": scores,
        "itemVerificado": layout not in SEM_VERIFICACAO_DE_ITEM,
        "granularidadeItem": "bloco" if layout == "L2" else "enumerado",
        "cpfsRedigidos": n_cpf,
        "entradasNoSumario": len(indice),
        "unidadesComItem": len(registros),
        "itensTotais": sum(len(r["itens"]) for r in registros),
        "capitulosDoSumarioSemCorpo": faltando,
        "secoesComSequenciaQuebrada": quebradas,
        "problemasDeTrava": problemas,
        "pendenciasDaUltimaInspecao": pends,
        "registros": registros,
    }


def serie(pasta, tribunal="tjmg"):
    docs = []
    for p in sorted(glob.glob(os.path.join(pasta, "*.pdf"))):
        docs.append(extrair(p, tribunal))
    ok = [d for d in docs if d["estado"] == "ok"]

    # Reincidencia (b): chave canonica IDENTICA em anos diferentes.
    por_chave = {}
    for d in ok:
        if not d.get("confiavelParaSerie"):
            continue
        for r in d["registros"]:
            if r["chaveConfianca"] < 0.9:
                continue  # chave fraca nao entra em afirmacao de reincidencia
            por_chave.setdefault(r["chaveCanonica"], set()).add(d["ano"])
    reincidentes = sorted(
        ({"chaveCanonica": k, "anos": sorted(v)} for k, v in por_chave.items()
         if len(v) > 1),
        key=lambda x: -len(x["anos"]))

    confiaveis = [d for d in ok if d.get("confiavelParaSerie")]
    plana = [{"ano": d["ano"], "temas": r["temas"]}
             for d in confiaveis for r in d["registros"]]

    return {
        "fonte": "Corregedoria Nacional de Justiça (CNJ) — relatórios de inspeção",
        "orgao": tribunal.upper(),
        "extraidoEm": "2026-08-22",
        "contrato": "docs/judiciario/CONTRATO-PARSER-INSPECOES.md",
        "avisoComparabilidade": (
            "Os anos NÃO são igualmente confiáveis. Onde `itemVerificado` é "
            "false (layout L2, os dois relatórios de 2017), o item é um bloco "
            "de prosa sem marcador enumerado: nada no documento afirma quantos "
            "são, e um item perdido não é detectável por aritmética. Gráfico "
            "de 'itens por ano' que trate esses anos como iguais aos demais "
            "mente por omissão."
        ),
        "avisoReincidencia": (
            "`reincidentesPorChave` é INDÍCIO nosso, não afirmação do CNJ: "
            "depende de normalizar nome de vara entre anos, e vara renomeada "
            "ou desmembrada quebra a chave sem aviso. A resposta boa para 'o "
            "que não mudou' está em `pendenciasDaUltimaInspecao`, onde o "
            "próprio CNJ faz a conta."
        ),
        "documentos": [{k: v for k, v in d.items() if k != "registros"} for d in docs],
        "anosNaSerie": sorted({d["ano"] for d in confiaveis}),
        "anosForaDaSerie": [
            {"ano": d["ano"], "arquivo": d["arquivo"], "motivo": d.get("motivoDeRessalva")}
            for d in ok if not d.get("confiavelParaSerie")],
        "reincidentesPorChave": reincidentes,
        "coberturaDaRubricaDeTemas": cobertura(plana),
        "registrosPorDocumento": {d["arquivo"]: d["registros"] for d in ok},
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("pasta", help="pasta com os PDFs de um órgão")
    ap.add_argument("--tribunal", default="tjmg")
    ap.add_argument("--saida")
    a = ap.parse_args()

    pacote = serie(a.pasta, a.tribunal)
    destino = a.saida or os.path.join(DADOS, "cnj-serie-%s.json" % a.tribunal)
    json.dump(pacote, io.open(destino, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    print("documentos: %d" % len(pacote["documentos"]))
    for d in pacote["documentos"]:
        if d["estado"] != "ok":
            print("  %-42s %s" % (d["arquivo"][41:83], d["estado"]))
            continue
        print("  %-42s %s %s  unid=%-4d itens=%-4d pend=%-3d cpf=%d%s"
              % (d["arquivo"][41:83], d["ano"], d["layout"],
                 d["unidadesComItem"], d["itensTotais"],
                 len(d["pendenciasDaUltimaInspecao"]), d["cpfsRedigidos"],
                 "" if d["itemVerificado"] else "  [item NAO verificavel]"))
    print()
    print("reincidentes por chave (indício):", len(pacote["reincidentesPorChave"]))
    print("cobertura da rubrica:", pacote["coberturaDaRubricaDeTemas"])
    print("gravado:", destino)
