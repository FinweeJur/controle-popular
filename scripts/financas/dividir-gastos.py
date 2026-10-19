# -*- coding: utf-8 -*-
"""Divide gastos entre o dono e uma segunda pessoa, por criterio combinado.

Papel no projeto: parte do bot Financas (Trenzim). Le os lancamentos (do
extrato ou da planilha) e devolve quanto cada um paga e quem acerta com quem.
O criterio vem de um arquivo de configuracao local; o calculo e puro.

Fonte das regras: docs/planos/BOT-FINANCAS-TRENZIM.md.

Decisoes tecnicas nao triviais:
- Criterios suportados: "meio" (50/50), "renda" (proporcional a renda
  informada) e "itens" (cada lancamento tem dono definido na coluna pessoa).
- O criterio e a renda ficam em dividir.json, na pasta de financas: mudanca
  de combinado e edicao de arquivo, nao de codigo.
- O calculo usa centavos (inteiros) para nao acumular erro de ponto flutuante.
- Saida: quem deve quanto a quem, com o valor de acerto.

Uso:
    python scripts/financas/dividir-gastos.py planilha.csv
    python scripts/financas/dividir-gastos.py planilha.csv --json
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DIR = Path(__file__).resolve().parent
PASTA = Path(os.environ.get("USERPROFILE", ".")) / ".config" / "mausbot" / "financas"
CONFIG = PASTA / "dividir.json"

PADRAO = {
    "criterio": "meio",
    "pessoas": {"dono": "Artur", "outra": "Segunda pessoa"},
    "renda": {"dono": 1, "outra": 1},
    "ignorar_categorias": ["entradas"],
}


def carregar_config() -> dict:
    if CONFIG.exists():
        try:
            dados = json.loads(CONFIG.read_text(encoding="utf-8"))
            return {**PADRAO, **dados}
        except ValueError:
            pass
    PASTA.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps(PADRAO, ensure_ascii=False, indent=2), encoding="utf-8")
    return dict(PADRAO)


def centavos(bruto: str) -> int:
    texto = str(bruto or "").strip().replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        return int(round(float(texto) * 100))
    except ValueError:
        return 0


def ler_planilha(caminho: Path) -> list[dict]:
    texto = caminho.read_text(encoding="utf-8-sig", errors="replace")
    dialeto = ";" if texto.count(";") > texto.count(",") else ","
    linhas = list(csv.DictReader(texto.splitlines(), delimiter=dialeto))
    itens = []
    for linha in linhas:
        baixo = {k.strip().lower(): v for k, v in linha.items() if k}
        valor = centavos(baixo.get("valor", "0"))
        itens.append(
            {
                "descricao": baixo.get("descricao", ""),
                "valor": valor,
                "categoria": baixo.get("categoria", "outros"),
                "pessoa": baixo.get("pessoa", ""),
            }
        )
    return itens


def dividir(itens: list[dict], config: dict) -> dict:
    ignorar = {c.lower() for c in config.get("ignorar_categorias", [])}
    gastos = [i for i in itens if i["valor"] < 0 and i["categoria"].lower() not in ignorar]
    total = sum(-i["valor"] for i in gastos)
    criterio = config.get("criterio", "meio")

    if criterio == "renda":
        renda = config.get("renda", {})
        soma = max(1, int(renda.get("dono", 1)) + int(renda.get("outra", 1)))
        parte_dono = total * int(renda.get("dono", 1)) // soma
    elif criterio == "itens":
        parte_dono = sum(-i["valor"] for i in gastos if i["pessoa"].lower() in ("dono", "artur"))
    else:  # meio
        parte_dono = total // 2
    parte_outra = total - parte_dono

    nomes = config.get("pessoas", PADRAO["pessoas"])
    return {
        "criterio": criterio,
        "total": total,
        "dono": {"nome": nomes.get("dono", "dono"), "centavos": parte_dono},
        "outra": {"nome": nomes.get("outra", "outra"), "centavos": parte_outra},
        "acerto": {
            "quem_paga": nomes.get("outra", "outra") if parte_outra > parte_dono else nomes.get("dono", "dono"),
            "centavos": abs(parte_outra - parte_dono),
        },
        "lancamentos": len(gastos),
    }


def reais(cent: int) -> str:
    return f"R$ {cent / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main() -> int:
    parser = argparse.ArgumentParser(description="Divide gastos entre duas pessoas.")
    parser.add_argument("planilha", help="CSV com data, descricao, valor, categoria (e pessoa no criterio por itens)")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    caminho = Path(args.planilha)
    if not caminho.exists():
        print(f"planilha nao encontrada: {caminho}", file=sys.stderr)
        return 2
    config = carregar_config()
    resultado = dividir(ler_planilha(caminho), config)

    if args.json:
        print(json.dumps(resultado, ensure_ascii=False, indent=2))
    else:
        print(f"💰 DIVISAO DE GASTOS — criterio: {resultado['criterio']}")
        print(f"• Total gasto: {reais(resultado['total'])} em {resultado['lancamentos']} lancamentos")
        print(f"• {resultado['dono']['nome']}: {reais(resultado['dono']['centavos'])}")
        print(f"• {resultado['outra']['nome']}: {reais(resultado['outra']['centavos'])}")
        acerto = resultado["acerto"]
        if acerto["centavos"] == 0:
            print("• Está quitado: ninguém deve nada.")
        else:
            print(f"• Acerto: {acerto['quem_paga']} paga {reais(acerto['centavos'])}")
        print(f"\nConfig: {CONFIG}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
