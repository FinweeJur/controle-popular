"""etl.grupos — detect economic groups of suppliers that share partners.

Usage: python -m etl.grupos --id-municipio 3106705

Source spec: plan §3 row "/grupos-economicos" ("interactive graph of
suppliers sharing partners (QSA × contracts)") and §11 F4.3
("`etl.grupos`: connected components over shared partners → `grupos_economicos`").
Cron: weekly — plan §5.4 lists "recompute grupos_economicos (connected
components over shared socios among contracted CNPJs)" under the Monday
weekly post-processing steps.

Algorithm: build an undirected graph whose nodes are the CNPJs that have
actually won at least one contract in `contratos` (only those — a supplier
enriched in `fornecedores`/`socios` but never awarded a contract in this
municipality isn't a graph node) and whose edges connect two CNPJs that
share at least one `socios.nome_socio` (a self-join of `socios` by partner
name). Connected components with 2+ distinct CNPJs are "economic groups";
a single isolated CNPJ isn't a group. Implemented with a plain-Python
union-find (no `networkx` — this is small-scale per municipality and stdlib
is enough).

Full recompute every run: existing `grupos_economicos` rows for this
`id_municipio` are deleted and replaced, not incrementally upserted, since
group membership can both grow and shrink as new contracts/partners appear.

Zero contracts or zero shared-partner pairs is a valid, non-error outcome
(plan §11 F4 DoD: "groups detected (or verified empty)") — the run logs
"0 grupos detectados" and exits cleanly.
"""
import argparse
import datetime as dt
import sys

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

CHUNK_SIZE = 500


def _chunked(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def _find(parent: dict, x: str) -> str:
    while parent[x] != x:
        parent[x] = parent[parent[x]]  # path compression (grandparent hop)
        x = parent[x]
    return x


def _union(parent: dict, a: str, b: str) -> None:
    ra, rb = _find(parent, a), _find(parent, b)
    if ra != rb:
        parent[ra] = rb


def _pick_nome_grupo(cnpjs: list[str], fornecedores_by_cnpj: dict[str, dict]) -> str:
    """Naive group naming: "Grupo " + razão social of the member with the
    largest known `capital_social`, used as a rough proxy for the group's
    "lead" company. This is a simplification — a proper group name would
    come from CNAE/brand analysis or manual curation, which is out of scope
    here; capital_social is just the least-bad automatic signal available
    without an LLM call (that's F8, not wired into this codebase yet).
    Falls back to the alphabetically-first CNPJ's razão social (or the raw
    CNPJ if even that's missing) when no member has capital_social data.
    """
    best_cnpj = None
    best_capital = None
    for cnpj in cnpjs:
        capital = (fornecedores_by_cnpj.get(cnpj) or {}).get("capital_social")
        if capital is not None and (best_capital is None or capital > best_capital):
            best_capital = capital
            best_cnpj = cnpj
    if best_cnpj is None:
        best_cnpj = sorted(cnpjs)[0]
    razao = (fornecedores_by_cnpj.get(best_cnpj) or {}).get("razao_social")
    return f"Grupo {razao}" if razao else f"Grupo {best_cnpj}"


def _replace_grupos(client, id_municipio: str, rows: list[dict]) -> None:
    client.table("grupos_economicos").delete().eq("id_municipio", id_municipio).execute()
    if rows:
        client.table("grupos_economicos").insert(rows).execute()


def sync(id_municipio: str):
    client = get_supabase_client()

    contratos_resp = (
        client.table("contratos")
        .select("fornecedor_cnpj, valor_global")
        .eq("id_municipio", id_municipio)
        .execute()
    )
    contratos = [r for r in (contratos_resp.data or []) if r.get("fornecedor_cnpj")]
    if not contratos:
        print("[etl.grupos] 0 grupos detectados (sem contratos para este municipio)")
        _replace_grupos(client, id_municipio, [])
        return

    valor_por_cnpj: dict[str, float] = {}
    qtd_por_cnpj: dict[str, int] = {}
    for row in contratos:
        cnpj = row["fornecedor_cnpj"]
        valor_por_cnpj[cnpj] = valor_por_cnpj.get(cnpj, 0.0) + float(row.get("valor_global") or 0)
        qtd_por_cnpj[cnpj] = qtd_por_cnpj.get(cnpj, 0) + 1

    cnpjs = sorted(valor_por_cnpj)
    print(f"[etl.grupos] cnpjs_com_contrato={len(cnpjs)}")

    # Self-join `socios` by nome_socio, scoped to the contracted CNPJs only.
    socios_by_cnpj: dict[str, set[str]] = {c: set() for c in cnpjs}
    for chunk in _chunked(cnpjs, CHUNK_SIZE):
        resp = client.table("socios").select("cnpj, nome_socio").in_("cnpj", chunk).execute()
        for row in resp.data or []:
            cnpj = row.get("cnpj")
            nome = row.get("nome_socio")
            if cnpj in socios_by_cnpj and nome:
                socios_by_cnpj[cnpj].add(nome)

    socio_to_cnpjs: dict[str, set[str]] = {}
    for cnpj, nomes in socios_by_cnpj.items():
        for nome in nomes:
            socio_to_cnpjs.setdefault(nome, set()).add(cnpj)

    parent = {c: c for c in cnpjs}
    for nome, membros in socio_to_cnpjs.items():
        if len(membros) < 2:
            continue
        membros_lista = sorted(membros)
        primeiro = membros_lista[0]
        for outro in membros_lista[1:]:
            _union(parent, primeiro, outro)

    componentes: dict[str, list[str]] = {}
    for c in cnpjs:
        raiz = _find(parent, c)
        componentes.setdefault(raiz, []).append(c)

    grupos_membros = [membros for membros in componentes.values() if len(membros) >= 2]
    if not grupos_membros:
        print("[etl.grupos] 0 grupos detectados (nenhum socio compartilhado entre CNPJs contratados)")
        _replace_grupos(client, id_municipio, [])
        return

    todos_cnpjs_em_grupos = sorted({c for membros in grupos_membros for c in membros})
    fornecedores_by_cnpj: dict[str, dict] = {}
    for chunk in _chunked(todos_cnpjs_em_grupos, CHUNK_SIZE):
        resp = (
            client.table("fornecedores")
            .select("cnpj, razao_social, capital_social")
            .in_("cnpj", chunk)
            .execute()
        )
        for row in resp.data or []:
            fornecedores_by_cnpj[row["cnpj"]] = row

    hoje = dt.date.today().isoformat()
    rows_out = []
    for membros in grupos_membros:
        membros_set = set(membros)
        socios_comuns = sorted(
            nome for nome, cnpj_set in socio_to_cnpjs.items() if len(cnpj_set & membros_set) >= 2
        )
        rows_out.append(
            {
                "id_municipio": id_municipio,
                "nome_grupo": _pick_nome_grupo(membros, fornecedores_by_cnpj),
                "setor": None,  # would need CNAE classification — out of scope this round
                "cnpjs": sorted(membros),
                "socios_comuns": socios_comuns,
                "valor_total_contratos": round(sum(valor_por_cnpj[c] for c in membros), 2),
                "qtd_contratos": sum(qtd_por_cnpj[c] for c in membros),
                "detectado_em": hoje,
            }
        )

    _replace_grupos(client, id_municipio, rows_out)
    print(f"[etl.grupos] grupos_detectados={len(rows_out)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.grupos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
