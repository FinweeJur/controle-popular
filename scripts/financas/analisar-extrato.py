# -*- coding: utf-8 -*-
"""Analisa extrato bancario e monta resumo + planilha, tudo local.

Papel no projeto: e o cerebro do bot Financas (Trenzim). Le o extrato em CSV,
categoriza por regra, acha assinaturas e contas repetitivas, monta resumo por
categoria e grava planilha. Nao chama modelo nenhum: o dado sensivel nao sai
da maquina (AGENTS.md 5.15). O modelo, quando entra, so formata o resumo.

Fonte das regras: docs/planos/BOT-FINANCAS-TRENZIM.md.

Decisoes tecnicas nao triviais:
- Aceita o formato brasileiro: valor "1.234,56", data "DD/MM/AAAA".
- Descobre as colunas pelo cabecalho (data, descricao/historico, valor);
  extrato de banco muda de nome a cada banco.
- Categorizacao por regra em regras.json, do mais especifico ao mais generico;
  o que nao casa vira "outros" e entra na lista de revisao.
- Assinatura/repeticao: mesmo comerciante em meses diferentes com valor
  parecido (tolerancia de 15%) conta como recorrente.
- Saida: resumo em texto, JSON opcional e planilha CSV (abre no Excel BR).

Uso:
    python scripts/financas/analisar-extrato.py extrato.csv
    python scripts/financas/analisar-extrato.py extrato.csv --planilha saida.csv
    python scripts/financas/analisar-extrato.py extrato.csv --json
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DIR = Path(__file__).resolve().parent
REGRAS = DIR / "regras.json"

CABECALHOS_DATA = ("data", "date", "dt", "data lancamento", "data movimentacao")
CABECALHOS_TEXTO = ("descricao", "descrição", "historico", "histórico", "lancamento", "detalhe", "title")
CABECALHOS_VALOR = ("valor", "amount", "value", "montante")


def carregar_regras() -> list[dict]:
    if not REGRAS.exists():
        return []
    try:
        dados = json.loads(REGRAS.read_text(encoding="utf-8"))
    except ValueError:
        return []
    regras = dados.get("regras", [])
    regras.sort(key=lambda r: -len(r.get("contem", "")))
    return regras


def numero_br(bruto: str) -> float:
    """'1.234,56' e '-45,90' viram float. Aceita tambem o formato americano."""
    texto = str(bruto or "").strip().replace("R$", "").replace(" ", "")
    if not texto:
        return 0.0
    negativo = texto.startswith("-")
    texto = texto.lstrip("-")
    if "," in texto and "." in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif "," in texto:
        texto = texto.replace(",", ".")
    try:
        valor = float(texto)
    except ValueError:
        return 0.0
    return -valor if negativo else valor


def data_br(bruto: str) -> dt.date | None:
    """Aceita DD/MM/AAAA, AAAA-MM-DD e DD-MM-AAAA."""
    texto = str(bruto or "").strip()
    for formato in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y"):
        try:
            return dt.datetime.strptime(texto[:10], formato).date()
        except ValueError:
            continue
    return None


def achar_coluna(cabecalho: list[str], nomes: tuple[str, ...]) -> int | None:
    for i, col in enumerate(cabecalho):
        baixo = col.strip().lower()
        if any(nome in baixo for nome in nomes):
            return i
    return None


def ler_extrato(caminho: Path) -> list[dict]:
    texto = caminho.read_text(encoding="utf-8-sig", errors="replace")
    dialeto = ";" if texto.count(";") > texto.count(",") else ","
    linhas = list(csv.reader(texto.splitlines(), delimiter=dialeto))
    if not linhas:
        return []
    cabecalho = linhas[0]
    i_data = achar_coluna(cabecalho, CABECALHOS_DATA)
    i_texto = achar_coluna(cabecalho, CABECALHOS_TEXTO)
    i_valor = achar_coluna(cabecalho, CABECALHOS_VALOR)
    if i_data is None or i_valor is None:
        # Sem cabecalho reconhecivel: assume data, texto, valor.
        i_data, i_texto, i_valor = 0, 1, 2
        linhas = [["data", "descricao", "valor"]] + linhas
    itens = []
    for linha in linhas[1:]:
        if len(linha) <= max(i_data, i_valor):
            continue
        quando = data_br(linha[i_data])
        valor = numero_br(linha[i_valor])
        if quando is None or valor == 0:
            continue
        descricao = linha[i_texto] if i_texto is not None and len(linha) > i_texto else ""
        itens.append({"data": quando, "descricao": descricao.strip(), "valor": valor})
    return itens


def categorizar(descricao: str, regras: list[dict]) -> str:
    alvo = descricao.lower()
    for regra in regras:
        if regra.get("contem", "").lower() in alvo:
            return regra.get("categoria", "outros")
    return "outros"


def achar_recorrentes(itens: list[dict], tolerancia: float = 0.15) -> list[dict]:
    """Mesmo comerciante em 2+ meses com valor parecido = assinatura/recorrencia."""
    por_comerciante: dict[str, list[dict]] = {}
    for item in itens:
        if item["valor"] >= 0:
            continue
        chave = re.sub(r"\d+", "", item["descricao"].lower()).strip()[:28]
        por_comerciante.setdefault(chave, []).append(item)
    achados = []
    for chave, lista in por_comerciante.items():
        meses = {i["data"].strftime("%Y-%m") for i in lista}
        if len(meses) < 2:
            continue
        valores = sorted(-i["valor"] for i in lista)
        mediana = valores[len(valores) // 2]
        if mediana <= 0:
            continue
        perto = [v for v in valores if abs(v - mediana) / mediana <= tolerancia]
        if len(perto) >= 2:
            achados.append(
                {
                    "comerciante": lista[0]["descricao"],
                    "valor_tipico": round(mediana, 2),
                    "ocorrencias": len(lista),
                    "meses": len(meses),
                }
            )
    achados.sort(key=lambda a: -a["valor_tipico"])
    return achados


def montar(itens: list[dict], regras: list[dict]) -> dict:
    for item in itens:
        item["categoria"] = categorizar(item["descricao"], regras)
    saidas = [i for i in itens if i["valor"] < 0]
    entradas = [i for i in itens if i["valor"] > 0]
    por_categoria: dict[str, float] = {}
    for item in saidas:
        por_categoria[item["categoria"]] = por_categoria.get(item["categoria"], 0) + (-item["valor"])
    maiores = sorted(saidas, key=lambda i: i["valor"])[:10]
    return {
        "total_saidas": round(sum(-i["valor"] for i in saidas), 2),
        "total_entradas": round(sum(i["valor"] for i in entradas), 2),
        "por_categoria": {k: round(v, 2) for k, v in sorted(por_categoria.items(), key=lambda x: -x[1])},
        "recorrentes": achar_recorrentes(itens),
        "maiores_gastos": [
            {"data": i["data"].strftime("%d/%m"), "descricao": i["descricao"][:40], "valor": round(-i["valor"], 2)}
            for i in maiores
        ],
        "revisar": [i["descricao"][:40] for i in saidas if i["categoria"] == "outros"][:10],
        "itens": len(itens),
    }


def texto_resumo(resumo: dict, mes: str) -> list[str]:
    linhas = [f"📊 FINANCAS — {mes}"]
    linhas.append(f"• 💰 Saidas: R$ {resumo['total_saidas']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    linhas.append(f"• 📥 Entradas: R$ {resumo['total_entradas']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    linhas.append("")
    linhas.append("Por categoria:")
    for cat, valor in list(resumo["por_categoria"].items())[:8]:
        linhas.append(f"• {cat}: R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    if resumo["recorrentes"]:
        linhas.append("")
        linhas.append("🔁 Recorrentes/assinaturas:")
        for r in resumo["recorrentes"][:6]:
            linhas.append(f"• {r['comerciante'][:30]} · R$ {r['valor_tipico']:.2f} · {r['meses']} meses")
    if resumo["revisar"]:
        linhas.append("")
        linhas.append("⚠️ Para revisar (sem categoria):")
        for r in resumo["revisar"][:5]:
            linhas.append(f"• {r}")
    linhas.append("")
    linhas.append(f"Leitura: {len(resumo['maiores_gastos'])} maiores gastos listados · {resumo['itens']} lancamentos")
    return linhas


def gravar_planilha(itens: list[dict], caminho: Path) -> None:
    with caminho.open("w", encoding="utf-8-sig", newline="") as arq:
        escritor = csv.writer(arq, delimiter=";")
        escritor.writerow(["data", "descricao", "valor", "categoria"])
        for item in sorted(itens, key=lambda i: i["data"]):
            escritor.writerow(
                [item["data"].strftime("%d/%m/%Y"), item["descricao"], f"{item['valor']:.2f}".replace(".", ","), item["categoria"]]
            )


def main() -> int:
    parser = argparse.ArgumentParser(description="Analisa extrato bancario (local, sem LLM).")
    parser.add_argument("extrato", help="arquivo CSV do extrato")
    parser.add_argument("--planilha", default="", help="caminho da planilha CSV de saida")
    parser.add_argument("--json", action="store_true", help="saida maquina-legivel")
    args = parser.parse_args()

    caminho = Path(args.extrato)
    if not caminho.exists():
        print(f"extrato nao encontrado: {caminho}", file=sys.stderr)
        return 2
    itens = ler_extrato(caminho)
    if not itens:
        print("nenhum lancamento lido: confira o cabecalho (data, descricao, valor)", file=sys.stderr)
        return 2
    regras = carregar_regras()
    resumo = montar(itens, regras)
    # Rotulo do periodo: quando o extrato cobre mais de um mes, mostra a faixa.
    datas = sorted(i["data"] for i in itens)
    mes = datas[0].strftime("%m/%Y")
    if datas[0].strftime("%m/%Y") != datas[-1].strftime("%m/%Y"):
        mes = f"{datas[0].strftime('%m/%Y')} a {datas[-1].strftime('%m/%Y')}"

    if args.json:
        print(json.dumps(resumo, ensure_ascii=False, indent=2, default=str))
    else:
        for linha in texto_resumo(resumo, mes):
            print(linha)

    if args.planilha:
        gravar_planilha(itens, Path(args.planilha))
        print(f"\nplanilha gravada em {args.planilha}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
