# -*- coding: utf-8 -*-
"""Extrai o dado por estado do relatorio "Justica e Orcamento nos Estados 2026"
do JUSTA (justa.org.br).

═══ POR QUE PAREAR POR COORDENADA, E NAO POR ORDEM DE LEITURA ═══

O PDF foi feito no Canva (metadado: producer=Canva). Em arte de layout, a ordem
de leitura do texto NAO acompanha o desenho: na pagina 5, as siglas dos 23
estados saem numa sequencia, os 23 valores em bilhoes noutra, e os 23
percentuais numa terceira. Ler em ordem e casar por indice funciona ate' o
primeiro elemento fora de ordem -- e ai' o numero de um estado vai para outro,
em silencio, com aparencia perfeita.

A ligacao confiavel e' a POSICAO -- mas nao "a sigla mais proxima". Essa foi a
primeira tentativa e ela ERRA: num grafico de coluna, o percentual de um estado
fica mais perto da sigla do VIZINHO (que esta ao lado) do que da propria (que
esta bem acima). A regra certa e' por COLUNA: mesmo x, sigla imediatamente
acima. Ver `parear`.

⚠️ A TRAVA QUE PEGOU O ERRO: a pagina 7 do proprio relatorio renderiza o top-5
de cada eixo por conta propria. O script confere o pareamento contra ela ANTES
de gravar e PARA se divergir. Foi ela que denunciou a regra errada -- RJ casava
com 6,8% quando o certo e' 11,0%, e nada no dado denunciaria: 6,8% e' um
percentual perfeitamente plausivel para um estado.

Sem essa conferencia, o arquivo teria sido gravado com aparencia impecavel e
cinco estados trocados.

Fonte: https://www.justa.org.br/wp-content/uploads/2026/02/Relatorio-Justica-e-Orcamento_2026.pdf
Baixado em 2026-08-22. 20 paginas, 38 imagens, 10.490 caracteres de texto.
"""
import io
import json
import math
import os
import re
import subprocess
import tempfile

import fitz

URL = ("https://www.justa.org.br/wp-content/uploads/2026/02/"
       "Relatorio-Justica-e-Orcamento_2026.pdf")
AQUI = os.path.dirname(os.path.abspath(__file__))
# AQUI = etl/betim/etl/apis -> dois niveis acima e' etl/betim.
SAIDA = os.path.abspath(os.path.join(
    AQUI, "..", "..", "dados", "justa-orcamento-justica-2026.json"))
# O PDF NAO entra no repo -- 5,2 MB de obra de terceiro. Baixa sob demanda
# para fora da arvore versionada. Se sumir da origem, o JSON extraido
# continua valendo (tem url, data de publicacao e data de extracao).
CACHE = os.path.join(tempfile.gettempdir(), "relatorio-justa-2026.pdf")


def pdf():
    """Baixa o PDF com `curl`, como os coletores vizinhos.

    ⚠️ NAO usar `urllib`: nesta maquina o socket do Python e' barrado pelo
    sandbox (WinError 10013) e o erro nada tem a ver com a origem.
    ⚠️ NAO usar `capture_output`: trava em `_wait_for_tstate_lock` e o
    `timeout=` nao salva. Saida vai para ARQUIVO. Duas guardas de tempo:
    a do proprio curl (-m) e a do Python.
    """
    if os.path.exists(CACHE) and os.path.getsize(CACHE) > 1_000_000:
        return CACHE
    parcial = CACHE + ".parcial"
    subprocess.run(
        ["curl", "-sSL", "-m", "180",
         "-A", "controle-popular/1.0 (+https://github.com/FinweeJur)",
         "-o", parcial, URL],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=240)
    # Validar o CORPO, nunca o status: pagina de erro tambem chega com 200.
    cabeca = io.open(parcial, "rb").read(5) if os.path.exists(parcial) else b""
    if cabeca != b"%PDF-":
        raise SystemExit(
            "PARE: a origem nao devolveu PDF (comeca com %r)."
            " Baixe a mao de %s e salve em %s"
            % (cabeca, URL, CACHE))
    os.replace(parcial, CACHE)
    return CACHE


UFS = {
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
    "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
    "SE", "SP", "TO",
}
# Medido na pagina 5: as distancias sigla<->valor vao de 57 a 107 px, SEM
# intervalo limpo entre "certo" e "errado" -- num layout de arte nao existe
# limiar que separe sozinho. Por isso o limite e' folgado (120) e a garantia
# vem de FORA: a pagina 7 renderiza o top-5 por conta propria, e o script
# CONFERE o pareamento contra ela. Limiar apertado (60) casava so' 5 dos 23.
LIMITE_PX = 120
# Largura da coluna: sigla e valor do mesmo estado ficam com x quase igual
# (medido: 10 a 24 px de diferenca). O estado vizinho fica a >100 px.
LIMITE_COLUNA_PX = 40

# Gabarito independente, lido da pagina 7 do proprio relatorio. Se o
# pareamento por coordenada divergir daqui, o metodo esta errado e o script
# PARA -- em vez de gravar tabela plausivel e trocada.
GABARITO_BILHOES = {"SP": 18.6, "MG": 12.3, "RJ": 11.1, "PR": 6.0, "RS": 5.6}
GABARITO_PERCENT = {"RO": 12.8, "MG": 11.5, "RJ": 11.0, "PB": 10.5, "MT": 10.4}

RE_BILHOES = re.compile(r"^\d{1,2},\d$")      # "12,3"
RE_PERCENT = re.compile(r"^\d{1,2},\d%$")     # "11,5%"


def palavras(pagina):
    """(texto, centro_x, centro_y) de cada palavra, com posicao."""
    saida = []
    for x0, y0, x1, y1, t, *_ in pagina.get_text("words"):
        t = t.strip()
        if t:
            saida.append((t, (x0 + x1) / 2, (y0 + y1) / 2))
    return saida


def perto(a, b):
    return math.hypot(a[1] - b[1], a[2] - b[2])


def parear(pagina, casa_valor):
    """Casa cada valor com a sigla da MESMA COLUNA, logo acima dele.

    ⚠️ "Mais proximo" e' a regra ERRADA aqui, e a conferencia contra a pagina 7
    provou: RJ casava com 6,8% quando o valor certo e' 11,0%. Medida a
    geometria real, o grafico e' de COLUNA e a relacao e' vertical:

        MG  (959, 199)  <- sigla
        12,3 (969, 295) <- valor, ~100 px abaixo, mesmo x
        11,5% (949, 419) <- percentual, ~220 px abaixo, mesmo x

    O percentual de um estado fica mais PERTO da sigla do estado vizinho (que
    esta ao lado, na horizontal) do que da propria. Por isso o pareamento e'
    por coluna: mesmo x dentro de `LIMITE_COLUNA_PX`, e a sigla imediatamente
    ACIMA. Distancia euclidiana ignora que o layout tem direcao.
    """
    ps = palavras(pagina)
    siglas = [p for p in ps if p[0] in UFS or p[0].rstrip("*") in UFS]
    valores = [p for p in ps if casa_valor(p[0])]
    achados, orfaos = {}, 0
    for v in valores:
        # Mesma coluna E acima do valor.
        candidatas = [s for s in siglas
                      if abs(s[1] - v[1]) <= LIMITE_COLUNA_PX and s[2] < v[2]]
        if not candidatas:
            orfaos += 1
            continue
        # A sigla imediatamente acima: a de maior y entre as que estao acima.
        melhor = max(candidatas, key=lambda s: s[2])
        uf = melhor[0].rstrip("*")
        d = v[2] - melhor[2]
        anterior = achados.get(uf)
        if anterior is None or d < anterior[1]:
            achados[uf] = (v[0], d)
    return {uf: val for uf, (val, _) in achados.items()}, orfaos


def numero(s):
    return float(s.replace("%", "").replace(",", "."))


if __name__ == "__main__":
    doc = fitz.open(pdf())

    # Pagina 5 (indice 4): gasto total em R$ bi e % do orcamento estadual.
    p5 = doc[4]
    bilhoes, orf_b = parear(p5, lambda t: bool(RE_BILHOES.match(t)))
    percent, orf_p = parear(p5, lambda t: bool(RE_PERCENT.match(t)))

    estados = []
    for uf in sorted(set(bilhoes) | set(percent)):
        estados.append({
            "uf": uf,
            "gastoBilhoes": numero(bilhoes[uf]) if uf in bilhoes else None,
            "percentualDoOrcamentoEstadual": numero(percent[uf]) if uf in percent else None,
        })

    pacote = {
        "fonte": "JUSTA — Pesquisa Nacional Justiça e Orçamento nos Estados 2026",
        "url": "https://www.justa.org.br/wp-content/uploads/2026/02/Relatorio-Justica-e-Orcamento_2026.pdf",
        "anoDoDado": 2024,
        "publicadoEm": "2026-02-19",
        "extraidoEm": "2026-08-22",
        "metodo": "pareamento por coordenada na página 5 do PDF (layout Canva)",
        "avisoAutoria": (
            "O dado é do JUSTA, não deste portal. Republicar exige citar a fonte e "
            "apontar para o relatório original."
        ),
        "avisoCobertura": (
            "22 estados + DF. MA, MS, PI e RR não disponibilizaram informação; "
            "GO e SC não disponibilizaram de todas as instituições. No DF, TJ e MP "
            "são financiados pela União — só a Defensoria entra."
        ),
        "somaExtraida": round(sum(e["gastoBilhoes"] or 0 for e in estados), 1),
        "avisoSoma": (
            "A soma dos 21 estados extraídos dá R$ 87,7 bi. O resumo executivo do "
            "relatório (p. 3) cita R$ 93,2 bi. A diferença não foi investigada — pode "
            "ser GO e SC, que entram no total do relatório com dado parcial e não "
            "aparecem no gráfico por estado. NÃO citar um número como se fosse o outro."
        ),
        "estados": estados,
        "orfaos": {"valoresEmBilhoes": orf_b, "percentuais": orf_p},
    }

    # ─── conferencia contra o gabarito da pagina 7, ANTES de gravar ───────
    porUf = {e["uf"]: e for e in estados}
    divergencias = []
    for uf, esperado in GABARITO_BILHOES.items():
        obtido = (porUf.get(uf) or {}).get("gastoBilhoes")
        if obtido != esperado:
            divergencias.append("%s: pareado %s, pagina 7 diz %s" % (uf, obtido, esperado))
    for uf, esperado in GABARITO_PERCENT.items():
        obtido = (porUf.get(uf) or {}).get("percentualDoOrcamentoEstadual")
        if obtido != esperado:
            divergencias.append("%s%%: pareado %s, pagina 7 diz %s" % (uf, obtido, esperado))
    if divergencias:
        raise SystemExit(
            "PARE: o pareamento por coordenada nao bate com o ranking da pagina 7.\n  "
            + "\n  ".join(divergencias))
    pacote["conferidoContra"] = "ranking da pagina 7 do proprio relatorio (top-5 de cada eixo)"

    json.dump(pacote, io.open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print("estados pareados: %d" % len(estados))
    print("órfãos (fora do limite de %d px): %d valores, %d percentuais"
          % (LIMITE_PX, orf_b, orf_p))
    print()
    for e in sorted(estados, key=lambda x: -(x["gastoBilhoes"] or 0))[:6]:
        print("   %-3s R$ %5s bi  %5s%% do orçamento estadual"
              % (e["uf"], e["gastoBilhoes"], e["percentualDoOrcamentoEstadual"]))
    print()
    print("gravado:", SAIDA)
