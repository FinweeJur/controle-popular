# -*- coding: utf-8 -*-
"""
Coletor do SISDEPEN (Levantamento Nacional de Informações Penitenciárias) —
população prisional, capacidade e perfil, agregados por UF.

Papel no portal
===============
Enriquece `/judiciario/presidios` (que hoje mostra a inspeção judicial pelo
CNIEP) com o outro lado da mesma realidade: quantas pessoas estão presas, quantas
cabem, e quem são — por UF e no Brasil. Superlotação e perfil são o contexto do
que o juiz encontra (ou deixa de encontrar) na inspeção.

Fonte oficial
=============
SENAPPEN — Bases de Dados do SISDEPEN (dado público, agregado), 19º ciclo
(2º semestre de 2025), arquivo CSV:
https://www.gov.br/senappen/pt-br/servicos/sisdepen/bases-de-dados

Cortesia e download
===================
O gov.br responde 403 a clientes HTTP de biblioteca (WAF por impressão digital
TLS): download por `curl`, com cache em disco. User-Agent honesto; um arquivo.

Dado pessoal
============
O SISDEPEN é CENSO agregado por estabelecimento — não há nome, CPF nem
prontuário individual. O acervo publicado é só agregado por UF (nada identificável).
"""

import csv
import json
import re
import subprocess
import sys
import time
from pathlib import Path

URL_FONTE = "https://www.gov.br/senappen/pt-br/servicos/sisdepen/bases-de-dados"
URL_ARQUIVO = (
    URL_FONTE + "/2025/19o-ciclo-base-de-dados-2025-2-semestre.csv"
)
USER_AGENT = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
ENTRADA = Path("etl/betim/entrada/sisdepen/sisdepen-19-ciclo-2025-2.csv")
SAIDA = Path("apps/web/data/judiciario/sisdepen-2025-2.json")

CICLO = "19º ciclo (jul–dez 2025)"
REFERENCIA = "2025-12-31"


def baixar(destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_size > 1_000_000:
        print(f"[sisdepen] CSV em disco ({destino.stat().st_size} bytes) — checkpoint usado")
        return destino
    print(f"[sisdepen] baixando (via curl) …")
    subprocess.run(
        ["curl.exe", "-s", "-L", "-o", str(destino), "-A", USER_AGENT, "-e", URL_FONTE, URL_ARQUIVO],
        check=True,
    )
    print(f"[sisdepen] ok ({destino.stat().st_size} bytes)")
    time.sleep(2)
    return destino


def n(v) -> int:
    """
    Inteiro do censo. O SISDEPEN grava os componentes com ponto DECIMAL (`190.0`)
    e os totais como inteiro — tratar o ponto como separador de milhar
    multiplicava tudo por 10 (medido). Vazio, 'NI' ou 'Não informado' = 0.
    """
    if v is None:
        return 0
    s = str(v).strip()
    if not re.match(r"^-?[\d.,]+$", s):
        return 0
    if "," in s and "." in s:  # 1.234,5 -> ponto é milhar
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", ".")
    try:
        return int(float(s))
    except ValueError:
        return 0


def main() -> int:
    caminho = baixar(ENTRADA)
    with open(caminho, encoding="utf-8", errors="replace", newline="") as f:
        leitor = csv.reader(f, delimiter=";")
        cab = next(leitor)
        idx = {
            "uf": cab.index("UF"),
            "nome": cab.index("Nome do Estabelecimento"),
            "capacidade_m": 40,
            "capacidade_f": 41,
            "pop_total": 438,
            "provisorios": 402,
            "fechado": 409,
            "semiaberto": 416,
            "aberto": 423,
            "faixa_18_24": 476,
            "raca_branca": 504,
            "raca_preta": 507,
            "raca_parda": 510,
            "raca_amarela": 513,
            "raca_indigena": 516,
        }

        por_uf: dict[str, dict] = {}
        br = {k: 0 for k in ("populacao", "capacidade", "provisorios", "fechado", "semiaberto", "aberto",
                             "faixa_18_24", "branca", "preta", "parda", "amarela", "indigena")}
        estabelecimentos = 0

        for col in leitor:
            uf = col[idx["uf"]].strip()
            if not uf or len(uf) != 2:
                continue
            estabelecimentos += 1
            cap = n(col[idx["capacidade_m"]]) + n(col[idx["capacidade_f"]])
            pop = n(col[idx["pop_total"]])
            prov = n(col[idx["provisorios"]])
            dados = {
                "populacao": pop,
                "capacidade": cap,
                "provisorios": prov,
                "fechado": n(col[idx["fechado"]]),
                "semiaberto": n(col[idx["semiaberto"]]),
                "aberto": n(col[idx["aberto"]]),
                "faixa_18_24": n(col[idx["faixa_18_24"]]),
                "branca": n(col[idx["raca_branca"]]),
                "preta": n(col[idx["raca_preta"]]),
                "parda": n(col[idx["raca_parda"]]),
                "amarela": n(col[idx["raca_amarela"]]),
                "indigena": n(col[idx["raca_indigena"]]),
            }
            a = por_uf.setdefault(uf, {k: 0 for k in br} | {"estabelecimentos": 0})
            a["estabelecimentos"] += 1
            for k, v in dados.items():
                a[k] += v
                br[k] += v

    def fechar(a: dict) -> dict:
        ocup = round(100 * a["populacao"] / a["capacidade"], 1) if a["capacidade"] else None
        prov_pct = round(100 * a["provisorios"] / a["populacao"], 1) if a["populacao"] else None
        negros = a["preta"] + a["parda"]
        negros_pct = round(100 * negros / a["populacao"], 1) if a["populacao"] else None
        return {**a, "taxa_ocupacao": ocup, "provisorios_pct": prov_pct, "pretos_pardos": negros, "pretos_pardos_pct": negros_pct}

    registros = sorted((fechar({"uf": uf, **a}) for uf, a in por_uf.items()), key=lambda r: -r["populacao"])
    brasil = fechar(br)

    acervo = {
        "fonte": "SENAPPEN — SISDEPEN (Levantamento Nacional de Informações Penitenciárias)",
        "url_fonte": URL_FONTE,
        "url_arquivo": URL_ARQUIVO,
        "ciclo": CICLO,
        "referencia": REFERENCIA,
        "atualizado_em": time.strftime("%Y-%m-%d"),
        "metodologia": (
            "Censo por estabelecimento penal reportado pelas administrações penitenciárias ao SISDEPEN e "
            "consolidado pela SENAPPEN (dado público e agregado). População = soma das categorias do bloco 4.1 "
            "(provisórios, regimes fechado/semiaberto/aberto, medidas de segurança). Taxa de ocupação = população "
            "/ capacidade declarada — acima de 100% é superlotação. Perfil (cor/raça e faixa etária) é "
            "autodeclarado e agregado. O portal publica só o agregado por UF; o SISDEPEN não traz dado individual."
        ),
        "total_estabelecimentos": estabelecimentos,
        "brasil": brasil,
        "registros": registros,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(acervo, ensure_ascii=False, indent=1), encoding="utf-8")
    print(
        f"ok: {len(registros)} UFs | {estabelecimentos} estabelecimentos | população {brasil['populacao']:,} | "
        f"ocupação {brasil['taxa_ocupacao']}% | provisórios {brasil['provisorios_pct']}% -> {SAIDA}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
