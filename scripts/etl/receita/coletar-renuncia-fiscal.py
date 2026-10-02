# -*- coding: utf-8 -*-
"""
Coletor da RENÚNCIA FISCAL (Gastos Tributários) — Receita Federal.

Papel no portal
===============
Alimenta `/estado-e-economia/renuncia-fiscal`: quanto o Governo Federal deixa de
arrecadar por gasto tributário (isenções, reduções, regimes especiais), por
FUNÇÃO ORÇAMENTÁRIA (setor) e por região. É o dinheiro que não entra — e que,
por isso, não aparece no orçamento.

Fonte oficial
=============
Receita Federal — "Gastos Tributários (Bases Efetivas)", Quadro I, planilha
`dgt-bases-efetivas-2023-serie-2021-a-2026-quadros.xlsx` (dados abertos):
https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/relatorios/renuncia/gastos-tributarios-bases-efetivas

Cortesia e download
===================
O gov.br responde 403 a clientes HTTP de biblioteca (WAF por impressão digital
TLS). O download é feito por `curl` (subprocesso), com cache em disco. User-Agent
honesto do portal; um arquivo por rodada.

Verificação
===========
O quadro traz a linha TOTAL. O coletor SOMA as funções e confere contra o TOTAL
e contra a linha ARRECADAÇÃO (2× verificação — número errado é dano, AGENTS §1).
Divergência acima de R$ 1,00 aborta.
"""

import json
import subprocess
import sys
import time
from pathlib import Path

import openpyxl

URL_PAGINA = (
    "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/relatorios/"
    "renuncia/gastos-tributarios-bases-efetivas"
)
URL_ARQUIVO = (
    URL_PAGINA
    + "/dgt-bases-efetivas-2023-serie-2021-a-2026-quadros.xlsx"
)
USER_AGENT = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
ENTRADA = Path("etl/betim/entrada/receita/dgt-bases-efetivas-2023-serie-2021-a-2026-quadros.xlsx")
SAIDA = Path("apps/web/data/estado/renuncia-fiscal-2023.json")

ABA = "Q I"
REGIOES = ["NORTE", "NORDESTE", "CENTRO-OESTE", "SUDESTE", "SUL"]


def baixar(destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_size > 100_000:
        print(f"[receita] XLSX em disco ({destino.stat().st_size} bytes) — checkpoint usado")
        return destino
    print(f"[receita] baixando {URL_ARQUIVO} (via curl) …")
    subprocess.run(
        ["curl.exe", "-s", "-L", "-o", str(destino), "-A", USER_AGENT, "-e", URL_PAGINA, URL_ARQUIVO],
        check=True,
    )
    print(f"[receita] ok ({destino.stat().st_size} bytes)")
    time.sleep(2)
    return destino


def num(v) -> float:
    if v is None or v == "":
        return 0.0
    return float(str(v).replace(",", "."))


def main() -> int:
    caminho = baixar(ENTRADA)
    wb = openpyxl.load_workbook(caminho, read_only=True, data_only=True)
    ws = wb[ABA]

    registros = []
    total_aba = None
    arrecadacao = None
    for row in ws.iter_rows(values_only=True):
        celulas = [c for c in row if c not in (None, "")]
        if not celulas:
            continue
        rotulo = str(celulas[0]).strip()
        if rotulo.upper().startswith("FUNÇÃO") or rotulo.upper().startswith("FUN��O"):
            continue
        if rotulo.upper() == "TOTAL":
            total_aba = [num(c) for c in celulas[1:7]]
            continue
        if rotulo.upper().startswith("ARRECADA"):
            arrecadacao = [num(c) for c in celulas[1:7]]
            continue
        if len(celulas) >= 7:  # função: nome + 5 regiões + total
            registros.append(
                {
                    "funcao": rotulo,
                    "norte": num(celulas[1]),
                    "nordeste": num(celulas[2]),
                    "centro_oeste": num(celulas[3]),
                    "sudeste": num(celulas[4]),
                    "sul": num(celulas[5]),
                    "total": num(celulas[6]),
                }
            )

    if not registros or total_aba is None:
        print("ABORTADO: quadro I não lido como esperado — o layout da fonte mudou")
        return 1

    # 2× verificação: soma das funções × linha TOTAL, coluna a coluna.
    soma = [sum(r["total"] if i == 5 else list(r.values())[i + 1] for r in registros) for i in range(6)]
    for i, (s, t) in enumerate(zip(soma, total_aba)):
        if abs(s - t) > 1.0:
            print(f"ABORTADO: divergência na coluna {i}: soma {s:.2f} != TOTAL {t:.2f}")
            return 1

    registros.sort(key=lambda r: -r["total"])
    acervo = {
        "fonte": "Receita Federal — Gastos Tributários (Bases Efetivas), Quadro I",
        "url_fonte": URL_PAGINA,
        "url_arquivo": URL_ARQUIVO,
        "ano_base": 2023,
        "serie": "2021 a 2026",
        "atualizado_em": time.strftime("%Y-%m-%d"),
        "metodologia": (
            "Estimativa de renúncia fiscal (gasto tributário) por função orçamentária e região, em valores "
            "nominais, no ano-base 2023. Gasto tributário é a desoneração que o governo concede fora do "
            "orçamento: isenção, redução de alíquota, regime especial. Não é irregularidade — é escolha de "
            "política pública que reduz a arrecadação; o dado permite perguntar quem se beneficia e a que "
            "custo. A linha TOTAL do quadro é conferida contra a soma das funções (2x verificação)."
        ),
        "total_renuncia": round(total_aba[5], 2),
        "total_arrecadacao": round(arrecadacao[5], 2) if arrecadacao else None,
        "renuncia_sobre_arrecadacao": (
            round(total_aba[5] / arrecadacao[5], 6) if arrecadacao and arrecadacao[5] else None
        ),
        "total_por_regiao": {
            "norte": round(total_aba[0], 2),
            "nordeste": round(total_aba[1], 2),
            "centro_oeste": round(total_aba[2], 2),
            "sudeste": round(total_aba[3], 2),
            "sul": round(total_aba[4], 2),
        },
        "total_funcoes": len(registros),
        "registros": registros,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(acervo, ensure_ascii=False, indent=1), encoding="utf-8")
    print(
        f"ok: {len(registros)} funções | renúncia R$ {total_aba[5]:,.2f} | "
        f"{acervo['renuncia_sobre_arrecadacao']:.2%} da arrecadação -> {SAIDA}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
