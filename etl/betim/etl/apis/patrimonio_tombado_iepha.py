r"""etl.apis.patrimonio_tombado_iepha — patrimônio cultural tombado por
Minas Gerais (`patrimonio_tombado_iepha`, migration `0072`).

Pedido do dono (2026-08-13, Tarefa 2b da unificação de legislação): o portal
só cobria proteção AMBIENTAL — tombamento de patrimônio cultural é o mesmo
tipo de restrição territorial (uma serra tombada e uma serra com lavra
autorizada em cima é o mesmo conflito que unidade de conservação vs.
mineração já mapeia) e ficava de fora.

Fonte: `etl/betim/dados-seed/patrimonio-tombado-iepha.csv` — CSV curado
publicado pelo próprio IEPHA-MG no CKAN de dados abertos do estado
(https://dados.mg.gov.br/dataset/bens-tombados), licença CC-BY-4.0 declarada
no `datapackage.json` da fonte, espelho em
https://github.com/transparencia-mg/bens-tombados. Baixado ao vivo em
2026-08-13 (153 linhas) e commitado aqui — não é um coletor que bate na rede
a cada execução (mesmo padrão de `etl.apis.direito_critico_popular`: fonte
pequena, curada, resemeada manualmente quando o IEPHA publicar atualização,
não em todo `sync`).

Não é um coletor no sentido dos outros módulos de `etl.apis` (não pagina
API, não tem `--pausa`) — é um CSV pronto, delimitado por `;`, no schema
exato do `datapackage.json` da fonte (não inventado aqui, ver a migration
`0072` para a citação completa do schema oficial).

Uso:

    python -m etl.apis.patrimonio_tombado_iepha --sondar   # não grava
    python -m etl.apis.patrimonio_tombado_iepha             # grava
"""
import argparse
import csv
import sys
from collections import Counter
from pathlib import Path

from etl.common import get_supabase_client

LOG = "[etl.apis.patrimonio_tombado_iepha]"

RAIZ_BETIM = Path(__file__).resolve().parents[2]  # etl/betim/
CSV_SEMENTE = RAIZ_BETIM / "dados-seed" / "patrimonio-tombado-iepha.csv"

ORIGEM = "iepha-bens-tombados"
CATEGORIAS_VALIDAS = {"BI", "BM", "CH", "CP"}


def _vazio_para_none(v: str | None) -> str | None:
    v = (v or "").strip()
    return v or None


def coletar() -> list[dict]:
    if not CSV_SEMENTE.exists():
        raise RuntimeError(f"{LOG} CSV semente não encontrado em {CSV_SEMENTE}")
    linhas: list[dict] = []
    with open(CSV_SEMENTE, encoding="utf-8-sig", newline="") as f:
        leitor = csv.DictReader(f, delimiter=";")
        for row in leitor:
            categoria = (row.get("categoria") or "").strip()
            if categoria not in CATEGORIAS_VALIDAS:
                raise RuntimeError(
                    f"{LOG} categoria inesperada {categoria!r} em "
                    f"{row.get('processo_ano')!r} — fonte mudou de schema, "
                    "conferir antes de gravar (não force um valor)."
                )
            linhas.append(
                {
                    "origem": ORIGEM,
                    "processo_ano": row["processo_ano"].strip(),
                    "denominacao": row["denominacao"].strip(),
                    "denominacao_completa": row["denominacao_completa"].strip(),
                    "categoria": categoria,
                    "classe_subclasse": _vazio_para_none(row.get("classe_subclasse")),
                    "municipio": row["municipio"].strip(),
                    "distrito": _vazio_para_none(row.get("distrito")),
                    "ato_legal": _vazio_para_none(row.get("ato_legal")),
                    "livro_de_tombo": _vazio_para_none(row.get("livro_de_tombo")),
                }
            )
    return linhas


def sondar() -> None:
    linhas = coletar()
    print(f"{LOG} {len(linhas)} bem(ns) tombado(s) no CSV semente.")
    por_categoria: Counter[str] = Counter(l["categoria"] for l in linhas)
    print(f"{LOG} por categoria: " + ", ".join(f"{k}={v}" for k, v in sorted(por_categoria.items())))
    municipios = {l["municipio"] for l in linhas}
    print(f"{LOG} {len(municipios)} município(s) distinto(s) com bem tombado.")
    for l in linhas[:5]:
        print(f"       [{l['categoria']}] {l['denominacao']!r} — {l['municipio']} ({l['processo_ano']})")


def sync() -> None:
    client = get_supabase_client()
    linhas = coletar()
    print(f"{LOG} {len(linhas)} bem(ns) tombado(s) para gravar.")
    if not linhas:
        print(f"{LOG} nada no CSV semente — NÃO apago o que já existe.")
        return
    client.table("patrimonio_tombado_iepha").upsert(
        linhas, on_conflict="origem,processo_ano,denominacao"
    ).execute()
    print(f"{LOG} {len(linhas)} linha(s) gravada(s)/atualizada(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="lê e relata, NÃO grava, NÃO toca no banco")
    args = parser.parse_args()
    try:
        if args.sondar:
            sondar()
        else:
            sync()
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
